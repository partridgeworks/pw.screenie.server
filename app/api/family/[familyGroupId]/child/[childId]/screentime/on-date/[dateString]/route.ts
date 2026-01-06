import { NextRequest, NextResponse } from "next/server";
import { tryGetCurrentUserForAPI, requireReadPermission } from "@/lib/server/auth";
import { findUserById } from "@/lib/db/Users";
import { isUserParentInGroup, isUserChildInGroup } from "@/lib/db/FamilyGroups";
import {
  getEffectiveDailyAllowance,
  parseAndValidateDate,
  formatDateForDisplay,
  getDayOfWeekFromDate
} from "@/lib/utils/effectiveAllowance";
import logger from "@/lib/utils/serverLogger";

/**
 * GET /api/family/[familyGroupId]/child/[childId]/screentime/on-date/[dateString]
 * Get effective screen time allowance for a child on a specific date
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

  // Check if grants should be included in the response (default: false)
  const includeGrants = req.nextUrl.searchParams.get("includegrants") === "true";

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

    // Get effective allowance for this date
    const effectiveAllowance = await getEffectiveDailyAllowance(childId, familyGroupId, normalizedDate);

    // Build response, optionally excluding grants
    const responseAllowance = includeGrants
      ? effectiveAllowance
      : {
          baseAllowance: effectiveAllowance.baseAllowance,
          effectiveAllowedMinutes: effectiveAllowance.effectiveAllowedMinutes,
          effectiveWakeUpTime: effectiveAllowance.effectiveWakeUpTime,
          effectiveBedTime: effectiveAllowance.effectiveBedTime,
          totalBonusMinutes: effectiveAllowance.totalBonusMinutes
        };

    return NextResponse.json({
      childUser: {
        _id: childUser._id,
        name: childUser.name,
        email: childUser.email
      },
      date: normalizedDate,
      dateDisplay: formatDateForDisplay(normalizedDate),
      dayOfWeek: getDayOfWeekFromDate(normalizedDate),
      effectiveAllowance: responseAllowance
    });
  } catch (error) {
    const err = error as Error;
    logger.error(
      "[API/family/[familyGroupId]/child/[childId]/screentime/on-date]",
      `Failed to get screen time: ${err.message}`
    );
    return NextResponse.json(
      { message: "Failed to get screen time allowance" },
      { status: 500 }
    );
  }
}
