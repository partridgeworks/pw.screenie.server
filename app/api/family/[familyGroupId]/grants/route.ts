import { NextRequest, NextResponse } from "next/server";
import { tryGetCurrentUserForAPI, requireReadPermission } from "@/lib/server/auth";
import { isUserParentInGroup } from "@/lib/db/FamilyGroups";
import { findGrantsByFamilyAndDate, findGrantsByFamilyAndDateRange } from "@/lib/db/ScreenTimeGrants";
import logger from "@/lib/utils/serverLogger";

/**
 * GET /api/family/[familyGroupId]/grants
 * Get all grants for a family group.
 * 
 * Query parameters:
 * - date: Optional. Get grants for a specific date (YYYY-MM-DD format). Defaults to today.
 * - startDate: Optional. Get grants starting from this date (YYYY-MM-DD format).
 * - endDate: Optional. Get grants up to this date (YYYY-MM-DD format).
 * - childId: Optional. Filter by specific child user ID.
 * - status: Optional. Filter by grant status (requested, granted, rejected).
 * 
 * If startDate and endDate are provided, they take precedence over date.
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
  const { familyGroupId } = await params;

  // Check read permission
  const permissionError = requireReadPermission(permissions);
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

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const childId = searchParams.get("childId");
    const status = searchParams.get("status");

    // Get today's date if no date specified
    const getTodayDateString = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, "0");
      const day = now.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    let grants;
    if (startDate && endDate) {
      // Date range query
      grants = await findGrantsByFamilyAndDateRange(familyGroupId, startDate, endDate);
    } else {
      // Single date query (default to today)
      const targetDate = date || getTodayDateString();
      grants = await findGrantsByFamilyAndDate(familyGroupId, targetDate);
    }

    // Apply optional filters
    if (childId) {
      grants = grants.filter(g => g.childUserId === childId);
    }
    if (status) {
      grants = grants.filter(g => g.status === status);
    }

    return NextResponse.json({ grants });
  } catch (error) {
    const err = error as Error;
    logger.error("[API/family/grants]", `Failed to get grants: ${err.message}`);
    return NextResponse.json(
      { message: "Failed to get grants" },
      { status: 500 }
    );
  }
}
