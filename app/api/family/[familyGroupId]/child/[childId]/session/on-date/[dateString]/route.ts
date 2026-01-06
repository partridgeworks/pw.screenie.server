import { NextRequest, NextResponse } from "next/server";
import { tryGetCurrentUserForAPI, requireReadPermission } from "@/lib/server/auth";
import { findUserById } from "@/lib/db/Users";
import { isUserParentInGroup, isUserChildInGroup } from "@/lib/db/FamilyGroups";
import { findSessionsByChildAndDate } from "@/lib/db/ScreenTimeSessions";
import { parseAndValidateDate } from "@/lib/utils/effectiveAllowance";
import logger from "@/lib/utils/serverLogger";

/**
 * GET /api/family/[familyGroupId]/child/[childId]/session/on-date/[dateString]
 * Get all screen time session records for a child on a specific date
 * 
 * dateString can be:
 * - "today" - uses current local date
 * - "YYYY-MM-DD" - specific date
 * 
 * Requires read permission
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ familyGroupId: string; childId: string; dateString: string }> }
) {
  const authResult = await tryGetCurrentUserForAPI(req);
  if (!authResult.success) {
    return authResult.response;
  }
  const { user: currentUser, permissions } = authResult;
  const { familyGroupId, childId, dateString } = await params;

  // Check read permission
  const permissionError = requireReadPermission(permissions);
  if (permissionError) {
    return permissionError;
  }

  try {
    // Validate and parse the date
    const normalizedDate = parseAndValidateDate(dateString);
    if (!normalizedDate) {
      return NextResponse.json(
        { message: "Invalid date format. Use 'today' or 'YYYY-MM-DD'" },
        { status: 400 }
      );
    }

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

    // Get all session records for this date
    const sessionRecords = await findSessionsByChildAndDate(
      familyGroupId,
      childId,
      normalizedDate
    );

    return NextResponse.json(sessionRecords);
  } catch (error) {
    const err = error as Error;
    logger.error(
      "[API/family/[familyGroupId]/child/[childId]/session/on-date]",
      `Failed to get session records: ${err.message}`
    );
    return NextResponse.json(
      { message: "Failed to get screen time session records" },
      { status: 500 }
    );
  }
}
