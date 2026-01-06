import { NextRequest, NextResponse } from "next/server";
import { tryGetCurrentUserForAPI, requireReadPermission, requireWritePermission } from "@/lib/server/auth";
import { isUserParentInGroup } from "@/lib/db/FamilyGroups";
import { findGrantById, updateGrantStatus } from "@/lib/db/ScreenTimeGrants";
import { notifyChildOfGrantDecision } from "@/lib/utils/notifications";
import logger from "@/lib/utils/serverLogger";

interface UpdateGrantStatusRequest {
  status: "granted" | "rejected";
}

/**
 * GET /api/grant/[grantId]
 * Fetch a specific grant by ID
 * 
 * Returns the grant if the current user is a parent in the grant's family group
 * Requires read permission
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ grantId: string }> }
) {
  const authResult = await tryGetCurrentUserForAPI(req);
  if (!authResult.success) {
    return authResult.response;
  }
  const { user: currentUser, permissions } = authResult;
  const { grantId } = await params;

  // Check read permission
  const permissionError = requireReadPermission(permissions);
  if (permissionError) {
    return permissionError;
  }

  try {
    // Find the grant first
    const grant = await findGrantById(grantId);
    if (!grant) {
      return NextResponse.json(
        { message: "Grant not found" },
        { status: 404 }
      );
    }

    // Verify current user is a parent in this family group
    const isParent = await isUserParentInGroup(currentUser._id, grant.familyGroupId);
    if (!isParent) {
      return NextResponse.json(
        { message: "You are not authorized to view this grant" },
        { status: 403 }
      );
    }

    return NextResponse.json({ grant }, { status: 200 });
  } catch (error) {
    const err = error as Error;
    logger.error(
      "[API/grant/[grantId]]",
      `Failed to fetch grant: ${err.message}`
    );
    return NextResponse.json(
      { message: "Failed to fetch grant" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/grant/[grantId]
 * Update the status of a grant (accept or reject a request)
 * 
 * Body:
 * - status: "granted" | "rejected"
 * 
 * Requires write permission
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ grantId: string }> }
) {
  const authResult = await tryGetCurrentUserForAPI(req);
  if (!authResult.success) {
    return authResult.response;
  }
  const { user: currentUser, permissions } = authResult;
  const { grantId } = await params;

  // Check write permission
  const permissionError = requireWritePermission(permissions);
  if (permissionError) {
    return permissionError;
  }

  try {
    // Find the grant first to get family group info
    const existingGrant = await findGrantById(grantId);
    if (!existingGrant) {
      return NextResponse.json(
        { message: "Grant not found" },
        { status: 404 }
      );
    }

    // Verify current user is a parent in this family group
    const isParent = await isUserParentInGroup(currentUser._id, existingGrant.familyGroupId);
    if (!isParent) {
      return NextResponse.json(
        { message: "Only parents can approve or reject grant requests" },
        { status: 403 }
      );
    }

    // Parse request body
    const body: UpdateGrantStatusRequest = await req.json();

    // Validate status
    if (!body.status || !["granted", "rejected"].includes(body.status)) {
      return NextResponse.json(
        { message: "status must be 'granted' or 'rejected'" },
        { status: 400 }
      );
    }

    // Can only update grants that are in "requested" status
    if (existingGrant.status !== "requested") {
      return NextResponse.json(
        { message: `Cannot update grant with status '${existingGrant.status}'. Only 'requested' grants can be updated.` },
        { status: 400 }
      );
    }

    // Update the grant status
    const updatedGrant = await updateGrantStatus(
      grantId,
      body.status,
      currentUser._id
    );

    if (!updatedGrant) {
      return NextResponse.json(
        { message: "Failed to update grant" },
        { status: 500 }
      );
    }

    logger.info(
      "[API/grant/[grantId]]",
      `Grant ${grantId} status updated to ${body.status} by parent ${currentUser._id}`
    );

    // Notify the child of the decision
    await notifyChildOfGrantDecision(
      existingGrant.childUserId,
      grantId,
      body.status,
      existingGrant.familyGroupId
    );

    return NextResponse.json({ grant: updatedGrant }, { status: 200 });
  } catch (error) {
    const err = error as Error;
    logger.error(
      "[API/grant/[grantId]]",
      `Failed to update grant status: ${err.message}`
    );
    return NextResponse.json(
      { message: "Failed to update grant status" },
      { status: 500 }
    );
  }
}
