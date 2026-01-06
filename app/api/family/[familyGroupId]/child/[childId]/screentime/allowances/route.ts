import { NextRequest, NextResponse } from "next/server";
import { tryGetCurrentUserForAPI, requireReadPermission, requireWritePermission } from "@/lib/server/auth";
import { findUserById } from "@/lib/db/Users";
import { isUserParentInGroup, isUserChildInGroup } from "@/lib/db/FamilyGroups";
import {
  getOrCreateScreenTimeAllowance,
  updateScreenTimeAllowance
} from "@/lib/db/ScreenTimeAllowances";
import { screenTimeSchedule } from "@/lib/models/ScreenTimeAllowance";
import logger from "@/lib/utils/serverLogger";

/**
 * GET /api/family/[familyGroupId]/child/[childId]/screentime/allowances
 * Get screen time allowance for a child in a specific family group
 * Requires read permission
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ familyGroupId: string; childId: string }> }
) {
  const authResult = await tryGetCurrentUserForAPI(req);
  if (!authResult.success) {
    return authResult.response;
  }
  const { user: currentUser, permissions } = authResult;
  const { familyGroupId, childId } = await params;

  // Check read permission
  const permissionError = requireReadPermission(permissions);
  if (permissionError) {
    return permissionError;
  }

  try {
    // Verify current user is a parent in this family group
    const isParent = await isUserParentInGroup(currentUser._id, familyGroupId);
    if (!isParent) {
      return NextResponse.json(
        { message: "You are not a parent in this family group" },
        { status: 403 }
      );
    }

    // Verify the child user exists
    const childUser = await findUserById(childId);
    if (!childUser) {
      return NextResponse.json(
        { message: "Child user not found" },
        { status: 404 }
      );
    }

    // Verify the child is in this family group
    const isChildInGroup = await isUserChildInGroup(childId, familyGroupId);
    if (!isChildInGroup) {
      return NextResponse.json(
        { message: "This child is not in this family group" },
        { status: 403 }
      );
    }

    // Get or create screen time allowance for this child in this family group
    const allowance = await getOrCreateScreenTimeAllowance(childId, familyGroupId);

    return NextResponse.json({
      childUser: {
        _id: childUser._id,
        name: childUser.name,
        email: childUser.email
      },
      allowance
    });
  } catch (error) {
    const err = error as Error;
    logger.error("[API/family/[familyGroupId]/child/screentime/allowances]", `Failed to get screen time: ${err.message}`);
    return NextResponse.json(
      { message: "Failed to get screen time allowance" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/family/[familyGroupId]/child/[childId]/screentime/allowances
 * Update screen time allowance for a child in a specific family group
 * Requires write permission
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ familyGroupId: string; childId: string }> }
) {
  const authResult = await tryGetCurrentUserForAPI(req);
  if (!authResult.success) {
    return authResult.response;
  }
  const { user: currentUser, permissions } = authResult;
  const { familyGroupId, childId } = await params;

  // Check write permission
  const permissionError = requireWritePermission(permissions);
  if (permissionError) {
    return permissionError;
  }

  try {
    // Verify current user is a parent in this family group
    const isParent = await isUserParentInGroup(currentUser._id, familyGroupId);
    if (!isParent) {
      return NextResponse.json(
        { message: "You are not a parent in this family group" },
        { status: 403 }
      );
    }

    // Verify the child user exists
    const childUser = await findUserById(childId);
    if (!childUser) {
      return NextResponse.json(
        { message: "Child user not found" },
        { status: 404 }
      );
    }

    // Verify the child is in this family group
    const isChildInGroup = await isUserChildInGroup(childId, familyGroupId);
    if (!isChildInGroup) {
      return NextResponse.json(
        { message: "This child is not in this family group" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { schedule } = body as { schedule: screenTimeSchedule };

    if (!schedule) {
      return NextResponse.json(
        { message: "schedule is required" },
        { status: 400 }
      );
    }

    // Update screen time allowance for this child in this family group
    const updatedAllowance = await updateScreenTimeAllowance(childId, familyGroupId, schedule);

    if (!updatedAllowance) {
      return NextResponse.json(
        { message: "Failed to update screen time allowance" },
        { status: 500 }
      );
    }

    logger.info("[API/family/[familyGroupId]/child/screentime/allowances]", `Updated screen time for child ${childId} in family group ${familyGroupId}`);

    return NextResponse.json({ allowance: updatedAllowance });
  } catch (error) {
    const err = error as Error;
    logger.error("[API/family/[familyGroupId]/child/screentime/allowances]", `Failed to update screen time: ${err.message}`);
    return NextResponse.json(
      { message: err.message || "Failed to update screen time allowance" },
      { status: 500 }
    );
  }
}
