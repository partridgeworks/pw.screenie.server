import { NextRequest, NextResponse } from "next/server";
import { tryGetCurrentUserForAPI, requireReadPermission } from "@/lib/server/auth";
import { findUserByEmail } from "@/lib/db/Users";
import logger from "@/lib/utils/serverLogger";

/**
 * GET /api/user/search/email?email=xxx
 * Search for a user by email address
 * Requires read permission
 */
export async function GET(req: NextRequest) {
  const authResult = await tryGetCurrentUserForAPI(req);
  if (!authResult.success) {
    return authResult.response;
  }

  const { permissions } = authResult;

  // Check read permission
  const permissionError = requireReadPermission(permissions);
  if (permissionError) {
    return permissionError;
  }

  try {
    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { message: "email query parameter is required" },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { found: false, message: "User not found" },
        { status: 200 }
      );
    }

    // Return minimal user info for privacy
    return NextResponse.json({
      found: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    const err = error as Error;
    logger.error("[API/user/search/email]", `Failed to search user: ${err.message}`);
    return NextResponse.json(
      { message: "Failed to search for user" },
      { status: 500 }
    );
  }
}
