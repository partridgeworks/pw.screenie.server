import { NextRequest, NextResponse } from "next/server";
import { tryGetCurrentUserForAPI, requireWritePermission } from "@/lib/server/auth";
import {
  removeMemberFromFamilyGroup,
  isUserParentInGroup
} from "@/lib/db/FamilyGroups";
import logger from "@/lib/utils/serverLogger";

/**
 * DELETE /api/family/[familyGroupId]/member/[userId]
 * Remove a member from the family group
 * Requires write permission
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ familyGroupId: string; userId: string }> }
) {
  const authResult = await tryGetCurrentUserForAPI(req);
  if (!authResult.success) {
    return authResult.response;
  }
  const { user: currentUser, permissions } = authResult;
  const { familyGroupId, userId } = await params;

  // Check write permission
  const permissionError = requireWritePermission(permissions);
  if (permissionError) {
    return permissionError;
  }

  try {
    // Verify current user is a parent in this group
    const isParent = await isUserParentInGroup(currentUser._id, familyGroupId);
    if (!isParent) {
      return NextResponse.json(
        { message: "You are not a parent in this family group" },
        { status: 403 }
      );
    }

    // Prevent removing yourself if you're the only parent
    if (userId === currentUser._id) {
      return NextResponse.json(
        { message: "You cannot remove yourself from the family group" },
        { status: 400 }
      );
    }

    const updatedGroup = await removeMemberFromFamilyGroup(familyGroupId, userId);

    if (!updatedGroup) {
      return NextResponse.json(
        { message: "Failed to remove member (may not be in group)" },
        { status: 400 }
      );
    }

    logger.info("[API/family/member]", `Removed user ${userId} from group ${familyGroupId}`);

    return NextResponse.json({ familyGroup: updatedGroup });
  } catch (error) {
    const err = error as Error;
    logger.error("[API/family/member]", `Failed to remove member: ${err.message}`);
    return NextResponse.json(
      { message: "Failed to remove member" },
      { status: 500 }
    );
  }
}
