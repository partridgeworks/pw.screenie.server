import { NextRequest, NextResponse } from "next/server";
import { tryGetCurrentUserForAPI, requireReadPermission, requireWritePermission } from "@/lib/server/auth";
import {
  findFamilyGroupById,
  findFamilyGroupsByUserIdAndPosition,
  getMembersWithUserInfo,
  isUserParentInGroup,
  updateFamilyGroupName
} from "@/lib/db/FamilyGroups";
import logger from "@/lib/utils/serverLogger";

/**
 * GET /api/family/[familyGroupId]
 * Get a specific family group with member details.
 * If familyGroupId is "default", returns the first family group where the user is a parent.
 * Requires read permission
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ familyGroupId: string }> }
) {
  const authResult = await tryGetCurrentUserForAPI(req);
  if (!authResult.success) {
    return authResult.response;
  }
  const { user: currentUser, permissions } = authResult;
  let { familyGroupId } = await params;

  // Check read permission
  const permissionError = requireReadPermission(permissions);
  if (permissionError) {
    return permissionError;
  }

  try {
    // If "default", find the first family group where user is a parent
    if (familyGroupId === "default") {
      const parentGroups = await findFamilyGroupsByUserIdAndPosition(currentUser._id, "parent");
      if (parentGroups.length === 0) {
        return NextResponse.json(
          { message: "No family groups found" },
          { status: 404 }
        );
      }
      familyGroupId = parentGroups[0]._id;
    } else {
      // Verify user is a parent in this group
      const isParent = await isUserParentInGroup(currentUser._id, familyGroupId);
      if (!isParent) {
        return NextResponse.json(
          { message: "You are not a parent in this family group" },
          { status: 403 }
        );
      }
    }

    const familyGroup = await findFamilyGroupById(familyGroupId);
    if (!familyGroup) {
      return NextResponse.json(
        { message: "Family group not found" },
        { status: 404 }
      );
    }

    // Get members with populated user info
    const members = await getMembersWithUserInfo(familyGroupId);

    return NextResponse.json({ familyGroup, members });
  } catch (error) {
    const err = error as Error;
    logger.error("[API/family]", `Failed to get family group: ${err.message}`);
    return NextResponse.json(
      { message: "Failed to get family group" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/family/[familyGroupId]
 * Update family group details (name)
 * Requires write permission
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ familyGroupId: string }> }
) {
  const authResult = await tryGetCurrentUserForAPI(req);
  if (!authResult.success) {
    return authResult.response;
  }
  const { user: currentUser, permissions } = authResult;
  const { familyGroupId } = await params;

  // Check write permission
  const permissionError = requireWritePermission(permissions);
  if (permissionError) {
    return permissionError;
  }

  try {
    // Verify user is a parent in this group
    const isParent = await isUserParentInGroup(currentUser._id, familyGroupId);
    if (!isParent) {
      return NextResponse.json(
        { message: "You are not a parent in this family group" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    const updatedGroup = await updateFamilyGroupName(familyGroupId, name.trim());

    if (!updatedGroup) {
      return NextResponse.json(
        { message: "Failed to update family group" },
        { status: 500 }
      );
    }

    return NextResponse.json({ familyGroup: updatedGroup });
  } catch (error) {
    const err = error as Error;
    logger.error("[API/family]", `Failed to update family group: ${err.message}`);
    return NextResponse.json(
      { message: "Failed to update family group" },
      { status: 500 }
    );
  }
}
