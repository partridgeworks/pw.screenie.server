import { NextRequest, NextResponse } from "next/server";
import { createPairingCode, cleanupExpiredPairingCodes } from "@/lib/db/PairingCodes";
import logger from "@/lib/utils/serverLogger";

/**
 * GET /api/pairing/devicecode - Generate a new pairing code for device authorization
 *
 * NB: This endpoint does not require authentication as it is used by devices prior to being paired.
 * TODO: rate limiting should be applied at the edge to prevent abuse.
 *  
 * Query params:
 * - deviceName (optional): Name of the device requesting pairing
 * 
 * Returns:
 * - pairingCode: The code to display to the user
 * - expiresAt: When the code expires
 * - pollInterval: Recommended polling interval in seconds
 */
export async function GET(req: NextRequest) {
  try {
    // Cleanup expired codes on each request
    // TODO: do this via a scheduled job instead
    await cleanupExpiredPairingCodes();

    const { searchParams } = new URL(req.url);
    const deviceName = searchParams.get("deviceName") || "device";

    const pairingCode = await createPairingCode(deviceName);

    logger.info("[Pairing API]", `Generated pairing code for device: ${deviceName}`);

    return NextResponse.json({
      pairingCode: pairingCode.code,
      expiresAt: pairingCode.expiresAt,
      pollInterval: 5 // Recommended polling interval in seconds
    });
  } catch (error) {
    const err = error as Error;
    logger.error("[Pairing API]", `Failed to generate pairing code: ${err.message}`);
    return NextResponse.json(
      { message: "Failed to generate pairing code" },
      { status: 500 }
    );
  }
}
