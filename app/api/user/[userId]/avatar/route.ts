import { NextRequest, NextResponse } from "next/server";
import { tryGetCurrentUserForAPI, requireWritePermission } from "@/lib/server/auth";
import { updateUserAvatar, findUserById } from "@/lib/db/Users";
import { isUserParentInGroup, findFamilyGroupsByUserIdAndPosition } from "@/lib/db/FamilyGroups";
import { AVAILABLE_AVATARS } from "@/lib/constants/avatarConstants";
import logger from "@/lib/utils/serverLogger";

/**
 * PATCH /api/user/[userId]/avatar
 * Update a user's avatar. Parents can update avatars for children in their family groups.
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
    // Check authorization: users can update their own avatar, or parents can update avatars for family members
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
        { message: "You are not authorized to update this user's avatar" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { avatarName } = body;

    // Validate avatarName - must be null or a valid avatar name
    if (avatarName !== null && !AVAILABLE_AVATARS.includes(avatarName)) {
      return NextResponse.json(
        { message: "Invalid avatar name" },
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

    const updatedUser = await updateUserAvatar(userId, avatarName);

    logger.info("[API/user/avatar]", `Updated avatar for user ${userId} to: ${avatarName ?? "(cleared)"}`);

    return NextResponse.json({
      message: "Avatar updated successfully",
      avatarName: updatedUser?.avatarName ?? null
    });
  } catch (error) {
    const err = error as Error;
    logger.error("[API/user/avatar]", `Failed to update avatar: ${err.message}`);
    return NextResponse.json(
      { message: "Failed to update avatar" },
      { status: 500 }
    );
  }
}
