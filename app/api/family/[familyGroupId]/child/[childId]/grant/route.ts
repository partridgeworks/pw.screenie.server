import { NextRequest, NextResponse } from "next/server";
import { tryGetCurrentUserForAPI, requireWritePermission, requireReadPermission } from "@/lib/server/auth";
import { findUserById } from "@/lib/db/Users";
import { isUserParentInGroup, isUserChildInGroup, getMembersWithUserInfo } from "@/lib/db/FamilyGroups";
import { createScreenTimeGrant } from "@/lib/db/ScreenTimeGrants";
import { parseAndValidateDate } from "@/lib/utils/effectiveAllowance";
import { GRANT_STATUSES, GrantStatus } from "@/lib/constants/grantConstants";
import { notifyParentsOfGrantRequest } from "@/lib/utils/notifications";
import logger from "@/lib/utils/serverLogger";

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

interface CreateGrantRequest {
  applicableDate: string;
  bonusMinutes?: number | null;
  overrideWakeUpTime?: string | null;
  overrideBedTime?: string | null;
  status?: GrantStatus;
  notes?: string | null;
}

/**
 * POST /api/family/[familyGroupId]/child/[childId]/grant
 * Create a new screen time grant for a child
 * 
 * Body:
 * - applicableDate: string (YYYY-MM-DD or 'today')
 * - bonusMinutes?: number | null (-180 to +180)
 * - overrideWakeUpTime?: string | null (HH:MM format)
 * - overrideBedTime?: string | null (HH:MM format)
 * - status?: "requested" | "granted" | "rejected" (defaults to "granted" for parent, must be "requested" for non-parent)
 * - notes?: string | null (optional notes, e.g. "via screenie device")
 * 
 * At least one of bonusMinutes, overrideWakeUpTime, or overrideBedTime must be provided
 * Requires write permission
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



  try {

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

    // Parse request body
    const body: CreateGrantRequest = await req.json();

    // anything that isn't a "requested" grant requires write permission
    const permissionError = (body.status && body.status !== "requested") ?
      requireWritePermission(permissions) : requireReadPermission(permissions);
    if (permissionError) {
      return permissionError;
    }

    // Determine status based on requester role
    let status: GrantStatus = "granted"; // Default for parents
    if (body.status !== undefined) {
      status = body.status;
    }

    // Validate applicableDate
    const normalizedDate = parseAndValidateDate(body.applicableDate);
    if (!normalizedDate) {
      return NextResponse.json(
        { message: "Invalid date format. Use 'today' or 'YYYY-MM-DD'" },
        { status: 400 }
      );
    }

    // Validate at least one grant field is provided
    const hasBonus = body.bonusMinutes !== undefined && body.bonusMinutes !== null;
    const hasWakeUp = body.overrideWakeUpTime !== undefined && body.overrideWakeUpTime !== null;
    const hasBedTime = body.overrideBedTime !== undefined && body.overrideBedTime !== null;

    if (!hasBonus && !hasWakeUp && !hasBedTime) {
      return NextResponse.json(
        { message: "At least one of bonusMinutes, overrideWakeUpTime, or overrideBedTime must be provided" },
        { status: 400 }
      );
    }

    // Validate bonusMinutes if provided
    if (hasBonus) {
      const bonus = body.bonusMinutes as number;
      if (!Number.isInteger(bonus) || bonus < -180 || bonus > 180) {
        return NextResponse.json(
          { message: "bonusMinutes must be an integer between -180 and 180" },
          { status: 400 }
        );
      }
    }

    // Validate overrideWakeUpTime if provided
    if (hasWakeUp) {
      const wakeUp = body.overrideWakeUpTime as string;
      if (!TIME_REGEX.test(wakeUp)) {
        return NextResponse.json(
          { message: "overrideWakeUpTime must be in HH:MM 24-hour format" },
          { status: 400 }
        );
      }
    }

    // Validate overrideBedTime if provided
    if (hasBedTime) {
      const bedTime = body.overrideBedTime as string;
      if (!TIME_REGEX.test(bedTime)) {
        return NextResponse.json(
          { message: "overrideBedTime must be in HH:MM 24-hour format" },
          { status: 400 }
        );
      }
    }

    // Create the grant
    const grant = await createScreenTimeGrant(
      familyGroupId,
      childId,
      currentUser._id,
      normalizedDate,
      hasBonus ? (body.bonusMinutes as number) : null,
      hasWakeUp ? (body.overrideWakeUpTime as string) : null,
      hasBedTime ? (body.overrideBedTime as string) : null,
      status,
      body.notes ?? null
    );

    logger.info(
      "[API/family/[familyGroupId]/child/[childId]/grant]",
      `Created grant ${grant._id} for child ${childId} by ${currentUser._id} with status ${status}`
    );

    // If this is a request from a child device, notify parent(s)
    if (status === "requested") {
      // Get parents in this family group
      const members = await getMembersWithUserInfo(familyGroupId);
      const parents = members.filter(m => m.position === "parent");
      const parentUserIds = parents.map(p => p.userId);

      if (parentUserIds.length > 0) {
        await notifyParentsOfGrantRequest(
          parentUserIds,
          childUser.name,
          {
            familyGroupId,
            childId,
            applicableDate: normalizedDate,
            bonusMinutes: grant.bonusMinutes,
            overrideWakeUpTime: grant.overrideWakeUpTime,
            overrideBedTime: grant.overrideBedTime,
            notes: grant.notes
          }
        );
      }
    }

    return NextResponse.json({ grant, id: grant._id }, { status: 201 });
  } catch (error) {
    const err = error as Error;
    logger.error(
      "[API/family/[familyGroupId]/child/[childId]/grant]",
      `Failed to create grant: ${err.message}`
    );
    return NextResponse.json(
      { message: "Failed to create screen time grant" },
      { status: 500 }
    );
  }
}
