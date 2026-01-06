import { NextRequest, NextResponse } from "next/server";
import {
  findLinkedPairingCode,
  markPairingCodeAsPaired,
  getPairingCodeStatus
} from "@/lib/db/PairingCodes";
import { findUserById } from "@/lib/db/Users";
import { createAPIKeyForUser } from "@/lib/server/apiKeyAuth";
import logger from "@/lib/utils/serverLogger";

/**
 * POST /api/pairing/devicecode/[code] - Device polls this endpoint to check pairing status
 * 
 * NB: This endpoint does not require authentication as it is used by devices prior to being paired.
 * TODO: rate limiting should be applied at the edge to prevent abuse.
 *  
* Once a code is found with status 'linked' then the final pairing process begins, an API key
 * is issued, status is updated to 'paired', and the API key is returned to the device.
 * 
 * Returns:
 * - If still waiting for user: { status: "pending", pollInterval: 5 }
 * - If user has linked: { status: "paired", apiKey: "..." }
 * - If expired/invalid: { status: "error", message: "..." }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { status: "error", message: "Pairing code is required" },
        { status: 400 }
      );
    }

    // Check the current status of the pairing code
    const codeStatus = await getPairingCodeStatus(code);

    if (!codeStatus) {
      return NextResponse.json(
        { status: "error", message: "Invalid pairing code" },
        { status: 404 }
      );
    }

    if (codeStatus.expired) {
      return NextResponse.json(
        { status: "expired", message: "Pairing code has expired" },
        { status: 410 }
      );
    }

    // Handle different statuses
    switch (codeStatus.status) {
      case "issued":
        // Still waiting for user to link
        return NextResponse.json({
          status: "pending",
          message: "Waiting for user to confirm pairing",
          pollInterval: 5
        });

      case "linked": {
        // User has linked! Create an API key for this device
        const linkedCode = await findLinkedPairingCode(code);
        if (!linkedCode || !linkedCode.userId) {
          return NextResponse.json(
            { status: "error", message: "Pairing code not properly linked" },
            { status: 500 }
          );
        }

        // Get the user
        const user = await findUserById(linkedCode.userId);
        if (!user) {
          return NextResponse.json(
            { status: "error", message: "Linked user not found" },
            { status: 500 }
          );
        }

        // Check user is approved
        if (user.status !== "approved") {
          return NextResponse.json(
            { status: "error", message: "User account is not approved" },
            { status: 403 }
          );
        }

        // Create a new device API key with readOnly role
        // Multiple devices can have their own API keys
        const deviceName = linkedCode.deviceName || "device";
        const { rawKey } = await createAPIKeyForUser(
          user._id,
          "readOnly",  // Device keys are always readOnly
          "device",    // keyType = device
          `Device: ${deviceName}` // Use device name as the API key name
        );
        logger.info("[Pairing API]", `Created device API key for user ${user.email} (device: ${deviceName})`);

        // Mark as paired
        await markPairingCodeAsPaired(code);

        logger.info("[Pairing API]", `Device successfully paired for user: ${user.email}`);

        return NextResponse.json({
          status: "paired",
          apiKey: rawKey,
          userId: user._id,
          userName: user.name
        });
      }

      case "paired":
        // Already paired - code has been used
        return NextResponse.json(
          { status: "error", message: "Pairing code has already been used" },
          { status: 410 }
        );

      case "expired":
        return NextResponse.json(
          { status: "expired", message: "Pairing code has expired" },
          { status: 410 }
        );

      default:
        return NextResponse.json(
          { status: "error", message: "Invalid pairing code status" },
          { status: 500 }
        );
    }
  } catch (error) {
    const err = error as Error;
    logger.error("[Pairing API]", `Failed to check pairing status: ${err.message}`);
    return NextResponse.json(
      { status: "error", message: "Failed to check pairing status" },
      { status: 500 }
    );
  }
}
