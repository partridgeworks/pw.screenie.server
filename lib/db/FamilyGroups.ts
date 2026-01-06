import FamilyGroupModel, { familyGroup, familyMember } from "@/lib/models/FamilyGroup";
import { getMongoose } from "@/lib/utils/mongo";
import { FamilyPosition, FamilyMemberStatus } from "@/lib/constants/familyConstants";
import { Role } from "@/lib/constants/roleConstants";
import { updateUserDataRole } from "@/lib/db/Users";
import logger from "@/lib/utils/serverLogger";
import mongoose from "mongoose";

/**
 * Convert MongoDB document to frontend-friendly type
 */
function toFamilyGroup(doc: mongoose.Document): familyGroup {
  const obj = doc.toObject();
  return {
    _id: obj._id.toString(),
    name: obj.name,
    members: obj.members.map((m: { userId: mongoose.Types.ObjectId; position: FamilyPosition; status: FamilyMemberStatus; addedAt: Date }) => ({
      userId: m.userId.toString(),
      position: m.position,
      status: m.status,
      addedAt: m.addedAt
    })),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    isDeleted: obj.isDeleted
  };
}

/**
 * Find all family groups where a user is a member with the specified position
 */
export async function findFamilyGroupsByUserIdAndPosition(
  userId: string,
  position: FamilyPosition
): Promise<familyGroup[]> {
  await getMongoose();

  const groups = await FamilyGroupModel.find({
    members: {
      $elemMatch: {
        userId: new mongoose.Types.ObjectId(userId),
        position: position,
        status: { $ne: "removed" }
      }
    },
    isDeleted: false
  });

  return groups.map(toFamilyGroup);
}

/**
 * Find a family group by ID
 */
export async function findFamilyGroupById(groupId: string): Promise<familyGroup | null> {
  await getMongoose();

  const group = await FamilyGroupModel.findOne({
    _id: groupId,
    isDeleted: false
  });

  return group ? toFamilyGroup(group) : null;
}

/**
 * Create a new family group with the creator as the first parent
 * Also sets the creator's userRole to readWrite since they are a parent
 */
export async function createFamilyGroup(
  name: string,
  creatorUserId: string
): Promise<familyGroup> {
  await getMongoose();

  logger.info("[FamilyGroups]", `Creating new family group: ${name} for user ${creatorUserId}`);

  const newGroup = await FamilyGroupModel.create({
    name,
    members: [
      {
        userId: new mongoose.Types.ObjectId(creatorUserId),
        position: "parent" as FamilyPosition,
        status: "active" as FamilyMemberStatus,
        addedAt: new Date()
      }
    ]
  });

  // Set creator's userRole to readWrite since they are a parent
  await updateUserDataRole(creatorUserId, "readWrite");
  logger.info("[FamilyGroups]", `Updated user ${creatorUserId} userRole to readWrite as family creator`);

  return toFamilyGroup(newGroup);
}

/**
 * Add a member to a family group
 * Also updates the user's userRole based on their position:
 * - parent -> readWrite
 * - child -> readOnly
 */
export async function addMemberToFamilyGroup(
  groupId: string,
  userId: string,
  position: FamilyPosition,
  status: FamilyMemberStatus = "active"
): Promise<familyGroup | null> {
  await getMongoose();

  logger.info("[FamilyGroups]", `Adding user ${userId} to group ${groupId} as ${position}`);

  const updatedGroup = await FamilyGroupModel.findOneAndUpdate(
    {
      _id: groupId,
      isDeleted: false,
      "members.userId": { $ne: new mongoose.Types.ObjectId(userId) }
    },
    {
      $push: {
        members: {
          userId: new mongoose.Types.ObjectId(userId),
          position,
          status,
          addedAt: new Date()
        }
      }
    },
    { new: true }
  );

  if (updatedGroup) {
    // Update user's userRole based on their position in the family
    const userRole: Role = position === "parent" ? "readWrite" : "readOnly";
    await updateUserDataRole(userId, userRole);
    logger.info("[FamilyGroups]", `Updated user ${userId} userRole to ${userRole} based on ${position} position`);
  }

  return updatedGroup ? toFamilyGroup(updatedGroup) : null;
}

/**
 * Remove a member from a family group (soft removal - marks as removed)
 */
export async function removeMemberFromFamilyGroup(
  groupId: string,
  userId: string
): Promise<familyGroup | null> {
  await getMongoose();

  logger.info("[FamilyGroups]", `Removing user ${userId} from group ${groupId}`);

  const updatedGroup = await FamilyGroupModel.findOneAndUpdate(
    {
      _id: groupId,
      isDeleted: false,
      "members.userId": new mongoose.Types.ObjectId(userId)
    },
    {
      $pull: {
        members: { userId: new mongoose.Types.ObjectId(userId) }
      }
    },
    { new: true }
  );

  return updatedGroup ? toFamilyGroup(updatedGroup) : null;
}

/**
 * Check if a user is a parent in a specific family group
 */
export async function isUserParentInGroup(userId: string, groupId: string): Promise<boolean> {
  await getMongoose();

  const group = await FamilyGroupModel.findOne({
    _id: groupId,
    isDeleted: false,
    members: {
      $elemMatch: {
        userId: new mongoose.Types.ObjectId(userId),
        position: "parent",
        status: { $ne: "removed" }
      }
    }
  });

  return !!group;
}

/**
 * Check if a user is a child in a specific family group
 */
export async function isUserChildInGroup(userId: string, groupId: string): Promise<boolean> {
  await getMongoose();

  const group = await FamilyGroupModel.findOne({
    _id: groupId,
    isDeleted: false,
    members: {
      $elemMatch: {
        userId: new mongoose.Types.ObjectId(userId),
        position: "child",
        status: { $ne: "removed" }
      }
    }
  });

  return !!group;
}

/**
 * Check if a user is a child in any family group that a parent belongs to
 */
export async function isChildInParentsFamilyGroups(
  childUserId: string,
  parentUserId: string
): Promise<boolean> {
  await getMongoose();

  // Find groups where parent is a parent member
  const parentGroups = await findFamilyGroupsByUserIdAndPosition(parentUserId, "parent");

  // Check if child is in any of those groups
  for (const group of parentGroups) {
    const childMember = group.members.find(
      (m) => m.userId === childUserId && m.position === "child" && m.status !== "removed"
    );
    if (childMember) {
      return true;
    }
  }

  return false;
}

/**
 * Get member details including user info for a family group
 */
export async function getMembersWithUserInfo(
  groupId: string
): Promise<{ userId: string; position: FamilyPosition; status: FamilyMemberStatus; addedAt: Date; name: string; email: string; userStatus: string; avatarName?: string }[]> {
  await getMongoose();

  const group = await FamilyGroupModel.findOne({
    _id: groupId,
    isDeleted: false
  }).populate("members.userId", "name email status avatarName");

  if (!group) {
    return [];
  }

  const members = group.members
    .filter((m) => m.status !== "removed")
    .map((m) => {
      const user = m.userId as unknown as { _id: mongoose.Types.ObjectId; name: string; email: string; status: string; avatarName?: string };
      return {
        userId: user._id.toString(),
        position: m.position,
        status: m.status,
        addedAt: m.addedAt,
        name: user.name || "Unknown",
        email: user.email || "Unknown",
        userStatus: user.status || "unknown",
        ...(user.avatarName && { avatarName: user.avatarName })
      };
    });

  return members;
}

/**
 * Update family group name
 */
export async function updateFamilyGroupName(
  groupId: string,
  name: string
): Promise<familyGroup | null> {
  await getMongoose();

  logger.info("[FamilyGroups]", `Updating group ${groupId} name to: ${name}`);

  const updatedGroup = await FamilyGroupModel.findOneAndUpdate(
    { _id: groupId, isDeleted: false },
    { name },
    { new: true }
  );

  return updatedGroup ? toFamilyGroup(updatedGroup) : null;
}

/**
 * Soft delete a family group
 */
export async function deleteFamilyGroup(groupId: string): Promise<boolean> {
  await getMongoose();

  logger.info("[FamilyGroups]", `Deleting group ${groupId}`);

  const result = await FamilyGroupModel.findByIdAndUpdate(groupId, { isDeleted: true });

  return !!result;
}
