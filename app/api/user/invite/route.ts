import { NextRequest, NextResponse } from "next/server";
import { tryGetCurrentUserForAPI, requireWritePermission } from "@/lib/server/auth";
import { findUserByEmail, createInvitedUser } from "@/lib/db/Users";
import { AVAILABLE_AVATARS } from "@/lib/constants/avatarConstants";
import logger from "@/lib/utils/serverLogger";

/**
 * Get a random avatar from the available avatars
 */
function getRandomAvatar(): string {
  const randomIndex = Math.floor(Math.random() * AVAILABLE_AVATARS.length);
  return AVAILABLE_AVATARS[randomIndex];
}

/**
 * POST /api/user/invite
 * Create a new user with 'invited' status
 * Requires write permission
 */
export async function POST(req: NextRequest) {
  const authResult = await tryGetCurrentUserForAPI(req);
  if (!authResult.success) {
    return authResult.response;
  }

  const { permissions } = authResult;

  // Check write permission
  const permissionError = requireWritePermission(permissions);
  if (permissionError) {
    return permissionError;
  }

  try {
    const body = await req.json();
    const { email, name, avatarName, position } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "email is required" },
        { status: 400 }
      );
    }

    // Validate position if provided
    if (position && !["parent", "child"].includes(position)) {
      return NextResponse.json(
        { message: "position must be 'parent' or 'child'" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists", user: existingUser },
        { status: 409 }
      );
    }

    // Use provided avatar or select a random one
    const finalAvatarName = avatarName || getRandomAvatar();

    // Create the invited user (with optional position for role assignment)
    const newUser = await createInvitedUser(
      email.trim().toLowerCase(),
      name?.trim() || "Invited User",
      finalAvatarName,
      position
    );

    logger.info("[API/user/invite]", `Created invited user: ${newUser.email}`);

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    const err = error as Error;
    logger.error("[API/user/invite]", `Failed to create invited user: ${err.message}`);
    return NextResponse.json(
      { message: "Failed to create invited user" },
      { status: 500 }
    );
  }
}
