import { randomBytes } from "crypto";
import PairingCodeModel, { pairingCode } from "@/lib/models/PairingCode";
import { getMongoose } from "@/lib/utils/mongo";
import {
  PairingStatus,
  PAIRING_CODE_LENGTH,
  PAIRING_CODE_EXPIRY_MINUTES,
  PAIRING_CODE_CHARS
} from "@/lib/constants/pairingConstants";
import logger from "@/lib/utils/serverLogger";

/**
 * Generate a cryptographically random pairing code
 * Uses A-Z (excluding O, I) and 1-9 (excluding 0) to avoid confusion
 */
function generateRandomCode(length: number = PAIRING_CODE_LENGTH): string {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += PAIRING_CODE_CHARS[bytes[i] % PAIRING_CODE_CHARS.length];
  }
  return code;
}

/**
 * Create a new pairing code for device authorization
 */
export async function createPairingCode(deviceName: string = "device"): Promise<pairingCode> {
  await getMongoose();

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + PAIRING_CODE_EXPIRY_MINUTES);

  // Generate unique code with retry logic
  let code: string;
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    code = generateRandomCode();
    try {
      const newPairingCode = await PairingCodeModel.create({
        code,
        deviceName: deviceName.slice(0, 100),
        status: "issued",
        expiresAt
      });

      const created = await PairingCodeModel.findById(newPairingCode._id).lean<pairingCode>();
      if (!created) {
        throw new Error("Failed to retrieve newly created pairing code");
      }

      logger.info("[Pairing]", `Created pairing code: ${code} for device: ${deviceName}`);
      return created;
    } catch (error) {
      const err = error as Error & { code?: number };
      // MongoDB duplicate key error
      if (err.code === 11000) {
        attempts++;
        logger.warn("[Pairing]", `Duplicate code generated, retrying (${attempts}/${maxAttempts})`);
        continue;
      }
      throw error;
    }
  }

  throw new Error("Failed to generate unique pairing code after maximum attempts");
}

/**
 * Find a pairing code by its code string
 */
export async function findPairingCodeByCode(code: string): Promise<pairingCode | null> {
  await getMongoose();
  const normalizedCode = code.toUpperCase().trim();
  const found = await PairingCodeModel.findOne({ code: normalizedCode }).lean<pairingCode>();
  return found;
}

/**
 * Find a valid (non-expired, issued) pairing code for linking
 */
export async function findValidPairingCodeForLinking(code: string): Promise<pairingCode | null> {
  await getMongoose();
  const normalizedCode = code.toUpperCase().trim();
  const now = new Date();

  const found = await PairingCodeModel.findOne({
    code: normalizedCode,
    status: "issued",
    expiresAt: { $gt: now }
  }).lean<pairingCode>();

  return found;
}

/**
 * Link a pairing code to a user
 */
export async function linkPairingCodeToUser(
  code: string,
  userId: string
): Promise<pairingCode | null> {
  await getMongoose();
  const normalizedCode = code.toUpperCase().trim();
  const now = new Date();

  const updated = await PairingCodeModel.findOneAndUpdate(
    {
      code: normalizedCode,
      status: "issued",
      expiresAt: { $gt: now }
    },
    {
      $set: {
        userId,
        status: "linked" as PairingStatus
      }
    },
    { new: true }
  ).lean<pairingCode>();

  if (updated) {
    logger.info("[Pairing]", `Linked pairing code ${code} to user ${userId}`);
  }

  return updated;
}

/**
 * Find a linked pairing code ready for device to claim
 */
export async function findLinkedPairingCode(code: string): Promise<pairingCode | null> {
  await getMongoose();
  const normalizedCode = code.toUpperCase().trim();
  const now = new Date();

  const found = await PairingCodeModel.findOne({
    code: normalizedCode,
    status: "linked",
    expiresAt: { $gt: now }
  }).lean<pairingCode>();

  return found;
}

/**
 * Mark a pairing code as paired (successfully claimed by device)
 */
export async function markPairingCodeAsPaired(code: string): Promise<pairingCode | null> {
  await getMongoose();
  const normalizedCode = code.toUpperCase().trim();

  const updated = await PairingCodeModel.findOneAndUpdate(
    {
      code: normalizedCode,
      status: "linked"
    },
    {
      $set: {
        status: "paired" as PairingStatus
      }
    },
    { new: true }
  ).lean<pairingCode>();

  if (updated) {
    logger.info("[Pairing]", `Pairing code ${code} marked as paired`);
  }

  return updated;
}

/**
 * Cleanup expired pairing codes
 * Call this periodically to prevent database bloat
 */
export async function cleanupExpiredPairingCodes(): Promise<number> {
  await getMongoose();
  const now = new Date();

  const result = await PairingCodeModel.updateMany(
    {
      status: "issued",
      expiresAt: { $lt: now }
    },
    {
      $set: {
        status: "expired" as PairingStatus
      }
    }
  );

  if (result.modifiedCount > 0) {
    logger.info("[Pairing]", `Expired ${result.modifiedCount} pairing codes`);
  }

  return result.modifiedCount;
}

/**
 * Get the current status of a pairing code (for device polling)
 */
export async function getPairingCodeStatus(code: string): Promise<{
  status: PairingStatus;
  expired: boolean;
} | null> {
  await getMongoose();
  const normalizedCode = code.toUpperCase().trim();

  const found = await PairingCodeModel.findOne({ code: normalizedCode })
    .select("status expiresAt")
    .lean<{ status: PairingStatus; expiresAt: Date }>();

  if (!found) {
    return null;
  }

  const expired = found.expiresAt < new Date();
  return {
    status: found.status,
    expired
  };
}
