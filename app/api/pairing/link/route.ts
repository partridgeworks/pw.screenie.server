import { NextRequest, NextResponse } from "next/server";
import { tryGetCurrentUserForAPI, requireWritePermission } from "@/lib/server/auth";
import { findValidPairingCodeForLinking, linkPairingCodeToUser } from "@/lib/db/PairingCodes";
import logger from "@/lib/utils/serverLogger";

/**
 * POST /api/pairing/link - Link a pairing code to the authenticated user
 * 
 * Body:
 * - code: The pairing code to link
 * 
 * Requires authentication (Clerk session or API key) with write permission
 */
export async function POST(req: NextRequest) {
  // Authenticate user
  const authResult = await tryGetCurrentUserForAPI(req);
  if (!authResult.success) {
    return authResult.response;
  }

  const { user: currentUser, permissions } = authResult;

  // This endpoint requires write permission
  const permissionError = requireWritePermission(permissions);
  if (permissionError) {
    return permissionError;
  }

  // Check user is approved
  if (currentUser.status !== "approved") {
    return NextResponse.json(
      { message: "Your account is not yet approved" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { message: "Pairing code is required" },
        { status: 400 }
      );
    }

    // Check if the code is valid and available for linking
    const validCode = await findValidPairingCodeForLinking(code);

    if (!validCode) {
      return NextResponse.json(
        { message: "Invalid or expired pairing code. Please request a new code on your device." },
        { status: 400 }
      );
    }

    // Link the code to the user
    const linkedCode = await linkPairingCodeToUser(code, currentUser._id);

    if (!linkedCode) {
      return NextResponse.json(
        { message: "Failed to link pairing code. It may have already been used." },
        { status: 400 }
      );
    }

    logger.info("[Pairing API]", `User ${currentUser.email} linked pairing code ${code}`);

    return NextResponse.json({
      message: "Pairing code linked successfully",
      deviceName: linkedCode.deviceName
    });
  } catch (error) {
    const err = error as Error;
    logger.error("[Pairing API]", `Failed to link pairing code: ${err.message}`);
    return NextResponse.json(
      { message: "Failed to link pairing code" },
      { status: 500 }
    );
  }
}
