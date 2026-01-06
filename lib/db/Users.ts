import UserModel, { user } from "@/lib/models/User";
import { getMongoose } from "@/lib/utils/mongo";
import { UserStatus, UserRole } from "@/lib/constants/userConstants";
import { Role } from "@/lib/constants/roleConstants";
import logger from "@/lib/utils/serverLogger";

/**
 * Find a user by their Clerk ID
 */
export async function findUserByClerkId(clerkId: string): Promise<user | null> {
  await getMongoose();
  const foundUser = await UserModel.findOne({ clerkId, IsDeleted: false }).lean<user>();
  return foundUser;
}

/**
 * Find a user by their MongoDB _id
 */
export async function findUserById(id: string): Promise<user | null> {
  await getMongoose();
  const foundUser = await UserModel.findOne({ _id: id, IsDeleted: false }).lean<user>();
  return foundUser;
}

/**
 * Find a user by their email address
 */
export async function findUserByEmail(email: string): Promise<user | null> {
  await getMongoose();
  const normalizedEmail = email.toLowerCase().trim();
  const foundUser = await UserModel.findOne({ email: normalizedEmail, IsDeleted: false }).lean<user>();
  return foundUser;
}

/**
 * Create a new user from Clerk authentication data
 */
export async function createUserFromClerk(
  clerkId: string,
  name: string,
  email: string
): Promise<user> {
  await getMongoose();

  const normalizedName = name.trim() || "User";
  const normalizedEmail = email.toLowerCase().trim();

  // Determine if this is the very first user in the database (make them admin)
  const existingCount = await UserModel.estimatedDocumentCount().exec();
  const isFirstUser = existingCount === 0;
  const applicationRole: UserRole = isFirstUser ? "admin" : "user";
  const status: UserStatus = isFirstUser ? "approved" : "pending";
  // First admin user gets readWrite role
  const userRole: Role = isFirstUser ? "readWrite" : "readOnly";

  logger.info("[Users]", `Creating new user: ${normalizedEmail} (role: ${applicationRole}, status: ${status}, userRole: ${userRole})`);

  const newUser = await UserModel.create({
    clerkId,
    name: normalizedName,
    email: normalizedEmail,
    status,
    applicationRole,
    userRole
  });

  // Return as lean user type
  const createdUser = await UserModel.findById(newUser._id).lean<user>();
  if (!createdUser) {
    throw new Error("Failed to retrieve newly created user");
  }

  return createdUser;
}

/**
 * Update a user's status
 */
export async function updateUserStatus(userId: string, status: UserStatus): Promise<user | null> {
  await getMongoose();

  logger.info("[Users]", `Updating user ${userId} status to: ${status}`);

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { $set: { status } },
    { new: true }
  ).lean<user>();

  return updatedUser;
}

/**
 * Update a user's application role
 */
export async function updateUserRole(userId: string, applicationRole: UserRole): Promise<user | null> {
  await getMongoose();

  logger.info("[Users]", `Updating user ${userId} role to: ${applicationRole}`);

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { $set: { applicationRole } },
    { new: true }
  ).lean<user>();

  return updatedUser;
}

/**
 * Update user profile fields
 */
export async function updateUserProfile(
  userId: string,
  updates: { name?: string; email?: string }
): Promise<user | null> {
  await getMongoose();

  const updateFields: Record<string, string> = {};
  if (updates.name) updateFields.name = updates.name.trim();
  if (updates.email) updateFields.email = updates.email.toLowerCase().trim();

  if (Object.keys(updateFields).length === 0) {
    return findUserById(userId);
  }

  logger.info("[Users]", `Updating user ${userId} profile:`, updateFields);

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { $set: updateFields },
    { new: true }
  ).lean<user>();

  return updatedUser;
}

/**
 * Soft delete a user
 */
export async function deleteUser(userId: string): Promise<boolean> {
  await getMongoose();

  logger.info("[Users]", `Soft deleting user: ${userId}`);

  const result = await UserModel.findByIdAndUpdate(
    userId,
    { $set: { IsDeleted: true } },
    { new: true }
  );

  return result !== null;
}

/**
 * Get all users (admin function)
 */
export async function getAllUsers(includeDeleted = false): Promise<user[]> {
  await getMongoose();

  const filter = includeDeleted ? {} : { IsDeleted: false };
  const users = await UserModel.find(filter).lean<user[]>();

  return users;
}

/**
 * Get users by status
 */
export async function getUsersByStatus(status: UserStatus): Promise<user[]> {
  await getMongoose();

  const users = await UserModel.find({ status, IsDeleted: false }).lean<user[]>();
  return users;
}

/**
 * Update a user's data role (readWrite or readOnly)
 * This is separate from applicationRole which is user/admin
 */
export async function updateUserDataRole(userId: string, userRole: Role): Promise<user | null> {
  await getMongoose();

  logger.info("[Users]", `Updating user ${userId} data role to: ${userRole}`);

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { $set: { userRole } },
    { new: true }
  ).lean<user>();

  return updatedUser;
}

/**
 * Create an invited user (no Clerk ID yet)
 * @param email - User's email address
 * @param name - User's display name
 * @param avatarName - Optional avatar name
 * @param position - Optional family position ('parent' or 'child') to determine userRole
 */
export async function createInvitedUser(
  email: string,
  name: string,
  avatarName?: string,
  position?: "parent" | "child"
): Promise<user> {
  await getMongoose();

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedName = name.trim() || "Invited User";
  // Parents get readWrite role, children (or unspecified) get readOnly
  const userRole: Role = position === "parent" ? "readWrite" : "readOnly";

  logger.info("[Users]", `Creating invited user: ${normalizedEmail} (position: ${position ?? "unspecified"}, userRole: ${userRole})`);

  const newUser = await UserModel.create({
    name: normalizedName,
    email: normalizedEmail,
    status: "invited" as UserStatus,
    applicationRole: "user" as UserRole,
    userRole,
    ...(avatarName && { avatarName })
  });

  const createdUser = await UserModel.findById(newUser._id).lean<user>();
  if (!createdUser) {
    throw new Error("Failed to retrieve newly created invited user");
  }

  return createdUser;
}

/**
 * Update a user's avatar name
 */
export async function updateUserAvatar(userId: string, avatarName: string | null): Promise<user | null> {
  await getMongoose();

  logger.info("[Users]", `Updating user ${userId} avatar to: ${avatarName ?? "(cleared)"}`);

  if (avatarName === null) {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $unset: { avatarName: 1 } },
      { new: true }
    ).lean<user>();
    return updatedUser;
  }

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { $set: { avatarName } },
    { new: true }
  ).lean<user>();

  return updatedUser;
}
