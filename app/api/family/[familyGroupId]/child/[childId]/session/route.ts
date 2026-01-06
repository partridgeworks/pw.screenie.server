import { NextRequest, NextResponse } from "next/server";
import { tryGetCurrentUserForAPI, requireWritePermission, requireReadPermission } from "@/lib/server/auth";
import { findUserById } from "@/lib/db/Users";
import { isUserParentInGroup, isUserChildInGroup } from "@/lib/db/FamilyGroups";
import { createScreenTimeSession } from "@/lib/db/ScreenTimeSessions";
import logger from "@/lib/utils/serverLogger";

/**
 * POST /api/family/[familyGroupId]/child/[childId]/session
 * Create a new screen time session record
 * 
 * Body:
 * - startedAt: string (ISO 8601 date-time format) - when the session started
 * - duration: number (minutes of the session)
 * 
 * Does NOT require write permission (used by child devices to log their sessions)
 */
export async function POST(
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
  const permissionError = requireReadPermission(permissions);
  if (permissionError) {
    return permissionError;
  }

  try {
    // Parse request body
    const body = await req.json();
    const { startedAt, duration } = body;

    // Validate startedAt
    if (!startedAt || typeof startedAt !== "string") {
      return NextResponse.json(
        { message: "startedAt is required and must be an ISO 8601 date-time string" },
        { status: 400 }
      );
    }

    const parsedStartedAt = new Date(startedAt);
    if (isNaN(parsedStartedAt.getTime())) {
      return NextResponse.json(
        { message: "startedAt must be a valid ISO 8601 date-time string" },
        { status: 400 }
      );
    }

    // Validate duration
    if (typeof duration !== "number" || !Number.isInteger(duration) || duration < 0 || duration > 1440) {
      return NextResponse.json(
        { message: "duration must be an integer between 0 and 1440" },
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

    // Create the session record
    const session = await createScreenTimeSession(
      familyGroupId,
      childId,
      parsedStartedAt,
      duration
    );

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    const err = error as Error;
    logger.error(
      "[API/family/[familyGroupId]/child/[childId]/session]",
      `Failed to create session record: ${err.message}`
    );
    return NextResponse.json(
      { message: "Failed to create screen time session record" },
      { status: 500 }
    );
  }
}
