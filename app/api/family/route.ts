import { NextRequest, NextResponse } from "next/server";
import { tryGetCurrentUserForAPI, requireReadPermission, requireWritePermission } from "@/lib/server/auth";
import {
  findFamilyGroupsByUserIdAndPosition,
  createFamilyGroup
} from "@/lib/db/FamilyGroups";
import logger from "@/lib/utils/serverLogger";

/**
 * GET /api/family
 * Get all family groups where the current user is a parent
 * Requires read permission
 */
export async function GET(req: NextRequest) {
  const authResult = await tryGetCurrentUserForAPI(req);
  if (!authResult.success) {
    return authResult.response;
  }
  const { user: currentUser, permissions } = authResult;

  // Check read permission
  const permissionError = requireReadPermission(permissions);
  if (permissionError) {
    return permissionError;
  }

  try {
    const familyGroups = await findFamilyGroupsByUserIdAndPosition(
      currentUser._id,
      "parent"
    );

    return NextResponse.json({ familyGroups });
  } catch (error) {
    const err = error as Error;
    logger.error("[API/family]", `Failed to get family groups: ${err.message}`);
    return NextResponse.json(
      { message: "Failed to get family groups" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/family
 * Create a new family group with the current user as the first parent
 * Requires write permission
 */
export async function POST(req: NextRequest) {
  const authResult = await tryGetCurrentUserForAPI(req);
  if (!authResult.success) {
    return authResult.response;
  }
  const { user: currentUser, permissions } = authResult;

  // Check write permission
  const permissionError = requireWritePermission(permissions);
  if (permissionError) {
    return permissionError;
  }

  try {
    const body = await req.json();
    const name = body.name || `${currentUser.name}'s Family`;

    const familyGroup = await createFamilyGroup(name, currentUser._id);

    logger.info("[API/family]", `Created family group ${familyGroup._id} for user ${currentUser._id}`);

    return NextResponse.json({ familyGroup }, { status: 201 });
  } catch (error) {
    const err = error as Error;
    logger.error("[API/family]", `Failed to create family group: ${err.message}`);
    return NextResponse.json(
      { message: "Failed to create family group" },
      { status: 500 }
    );
  }
}
