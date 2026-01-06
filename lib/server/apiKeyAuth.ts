import { createHash, randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { user } from "@/lib/models/User";
import { apiKey } from "@/lib/models/ApiKey";
import { findUserById } from "@/lib/db/Users";
import { createApiKey, findValidApiKeyByHash, revokeApiKeyForUser, findGeneralApiKeysByUserId, revokeAllApiKeysForUser } from "@/lib/db/ApiKeys";
import { getMongoose } from "@/lib/utils/mongo";
import { Role, KeyType } from "@/lib/constants/roleConstants";
import logger from "@/lib/utils/serverLogger";

const API_KEY_PREFIX = "pst_";
const API_KEY_HEADER = "X-API-Key";

/**
 * Result type for API key authentication
 */
export interface ApiKeyAuthResult {
  user: user;
  apiKey: apiKey;
  keyRole: Role;
}

/**
 * Generates a new API key with format: pst_<32 hex chars>
 * Returns the raw key (only shown once) and its hash for storage
 */
export function generateAPIKey(): { rawKey: string; keyHash: string; keyPrefix: string } {
  const randomPart = randomBytes(16).toString("hex"); // 32 hex chars
  const rawKey = `${API_KEY_PREFIX}${randomPart}`;
  const keyHash = hashAPIKey(rawKey);
  const keyPrefix = rawKey.substring(0, 8); // e.g., "pst_a1b2"

  return { rawKey, keyHash, keyPrefix };
}

/**
 * Creates a SHA-256 hash of an API key for secure storage
 */
export function hashAPIKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Validates the format of an API key
 */
export function isValidAPIKeyFormat(key: string): boolean {
  // Should be pst_ followed by exactly 32 hex characters
  const regex = new RegExp(`^${API_KEY_PREFIX}[a-f0-9]{32}$`);
  return regex.test(key);
}

/**
 * Extracts the API key from the request header
 */
export function getAPIKeyFromRequest(req: NextRequest): string | null {
  return req.headers.get(API_KEY_HEADER);
}

/**
 * Attempts to authenticate a request using an API key.
 * Returns the user, API key details, and keyRole if valid, or null otherwise.
 */
export async function getAuthFromAPIKey(req: NextRequest): Promise<ApiKeyAuthResult | null> {
  const rawKey = getAPIKeyFromRequest(req);

  if (!rawKey) {
    return null;
  }

  if (!isValidAPIKeyFormat(rawKey)) {
    logger.warn("[APIKeyAuth]", `Invalid API key format: ${rawKey.substring(0, 8)}...`);
    return null;
  }

  await getMongoose();

  const keyHash = hashAPIKey(rawKey);

  // Find the API key record
  const apiKeyRecord = await findValidApiKeyByHash(keyHash);

  if (!apiKeyRecord) {
    logger.warn("[APIKeyAuth]", `No valid API key found: ${rawKey.substring(0, 8)}...`);
    return null;
  }

  // Find the associated user
  const userDoc = await findUserById(apiKeyRecord.userId);

  if (!userDoc) {
    logger.warn("[APIKeyAuth]", `No user found for API key: ${rawKey.substring(0, 8)}...`);
    return null;
  }

  // Check if user is active/approved
  if (userDoc.status !== "approved") {
    logger.warn("[APIKeyAuth]", `API key user is not approved: ${userDoc.email}`);
    return null;
  }

  logger.info("[APIKeyAuth]", `User authenticated via API key: ${userDoc.email} (role: ${apiKeyRecord.keyRole})`);
  
  return {
    user: userDoc,
    apiKey: apiKeyRecord,
    keyRole: apiKeyRecord.keyRole
  };
}

/**
 * Legacy function - Returns just the user for backwards compatibility
 * Use getAuthFromAPIKey for full details including role
 */
export async function getUserFromAPIKey(req: NextRequest): Promise<user | null> {
  const result = await getAuthFromAPIKey(req);
  return result?.user ?? null;
}

/**
 * Creates and stores an API key for a user in the ApiKeys collection.
 * Returns the raw key (only shown once to the user).
 */
export async function createAPIKeyForUser(
  userId: string,
  keyRole: Role = "readOnly",
  keyType: KeyType = "general",
  name?: string,
  expiresOn?: Date
): Promise<{ rawKey: string; keyPrefix: string; keyId: string }> {
  await getMongoose();

  const { rawKey, keyHash, keyPrefix } = generateAPIKey();

  const apiKeyRecord = await createApiKey(userId, keyHash, keyPrefix, keyRole, keyType, name, expiresOn);

  logger.info("[APIKeyAuth]", `Created new ${keyType} API key (${keyRole}) for user: ${userId}`);

  return { rawKey, keyPrefix, keyId: apiKeyRecord._id };
}

/**
 * Revokes a specific API key for a user.
 */
export async function revokeAPIKey(keyId: string, userId: string): Promise<boolean> {
  await getMongoose();

  const result = await revokeApiKeyForUser(keyId, userId);

  if (result) {
    logger.info("[APIKeyAuth]", `Revoked API key ${keyId} for user: ${userId}`);
  }

  return result;
}

/**
 * Gets all general (non-device) API keys for a user.
 */
export async function getGeneralAPIKeysForUser(userId: string): Promise<apiKey[]> {
  await getMongoose();
  return findGeneralApiKeysByUserId(userId);
}

/**
 * Revokes all API keys for a user.
 */
export async function revokeAllAPIKeysForUser(userId: string): Promise<number> {
  await getMongoose();

  const count = await revokeAllApiKeysForUser(userId);

  logger.info("[APIKeyAuth]", `Revoked ${count} API keys for user: ${userId}`);

  return count;
}

export { API_KEY_HEADER };
