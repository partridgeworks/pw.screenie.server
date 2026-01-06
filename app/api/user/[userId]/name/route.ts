import { NextRequest, NextResponse } from "next/server";
import { tryGetCurrentUserForAPI, requireWritePermission } from "@/lib/server/auth";
import { updateUserProfile, findUserById } from "@/lib/db/Users";
import { isUserParentInGroup, findFamilyGroupsByUserIdAndPosition } from "@/lib/db/FamilyGroups";
import logger from "@/lib/utils/serverLogger";

/**
 * PATCH /api/user/[userId]/name
 * Update a user's name. Parents can update names for children in their family groups.
 * Requires write permission
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authResult = await tryGetCurrentUserForAPI(req);
  if (!authResult.success) {
    return authResult.response;
  }
  const { user: currentUser, permissions } = authResult;
  const { userId } = await params;

  // Check write permission
  const permissionError = requireWritePermission(permissions);
  if (permissionError) {
    return permissionError;
  }

  try {
    // Check authorization: users can update their own name, or parents can update names for family members
    let isAuthorized = currentUser._id.toString() === userId;

    if (!isAuthorized) {
      // Check if current user is a parent in any group that contains the target user
      const parentGroups = await findFamilyGroupsByUserIdAndPosition(currentUser._id.toString(), "parent");
      for (const group of parentGroups) {
        const isParent = await isUserParentInGroup(currentUser._id.toString(), group._id);
        if (isParent) {
          // Check if target user is in this group
          const targetInGroup = group.members.some((m) => m.userId === userId);
          if (targetInGroup) {
            isAuthorized = true;
            break;
          }
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { message: "You are not authorized to update this user's name" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name } = body;

    // Validate name
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { message: "Name is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return NextResponse.json(
        { message: "Name must be 100 characters or less" },
        { status: 400 }
      );
    }

    // Verify target user exists
    const targetUser = await findUserById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const updatedUser = await updateUserProfile(userId, { name: trimmedName });

    logger.info("[API/user/name]", `Updated name for user ${userId} to: ${trimmedName}`);

    return NextResponse.json({
      message: "Name updated successfully",
      name: updatedUser?.name ?? trimmedName
    });
  } catch (error) {
    const err = error as Error;
    logger.error("[API/user/name]", `Failed to update name: ${err.message}`);
    return NextResponse.json(
      { message: "Failed to update name" },
      { status: 500 }
    );
  }
}
