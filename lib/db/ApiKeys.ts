import ApiKeyModel, { apiKey } from "@/lib/models/ApiKey";
import { getMongoose } from "@/lib/utils/mongo";
import { Role, KeyType } from "@/lib/constants/roleConstants";
import logger from "@/lib/utils/serverLogger";

/**
 * Create a new API key for a user
 */
export async function createApiKey(
  userId: string,
  keyHash: string,
  keyPrefix: string,
  keyRole: Role,
  keyType: KeyType,
  name?: string,
  expiresOn?: Date
): Promise<apiKey> {
  await getMongoose();

  logger.info("[ApiKeys]", `Creating ${keyType} API key with ${keyRole} role for user: ${userId}`);

  const newApiKey = await ApiKeyModel.create({
    userId,
    keyHash,
    keyPrefix,
    keyRole,
    keyType,
    name,
    expiresOn,
    isDeleted: false
  });

  const createdKey = await ApiKeyModel.findById(newApiKey._id).lean<apiKey>();
  if (!createdKey) {
    throw new Error("Failed to retrieve newly created API key");
  }

  return createdKey;
}

/**
 * Find a valid (non-deleted, non-expired) API key by its hash
 */
export async function findValidApiKeyByHash(keyHash: string): Promise<apiKey | null> {
  await getMongoose();

  const now = new Date();
  const foundKey = await ApiKeyModel.findOne({
    keyHash,
    isDeleted: false,
    $or: [
      { expiresOn: { $exists: false } },
      { expiresOn: null },
      { expiresOn: { $gt: now } }
    ]
  }).lean<apiKey>();

  return foundKey;
}

/**
 * Find all active (non-deleted) API keys for a user
 */
export async function findApiKeysByUserId(
  userId: string,
  includeExpired = false
): Promise<apiKey[]> {
  await getMongoose();

  const now = new Date();
  const query: Record<string, unknown> = {
    userId,
    isDeleted: false
  };

  if (!includeExpired) {
    query.$or = [
      { expiresOn: { $exists: false } },
      { expiresOn: null },
      { expiresOn: { $gt: now } }
    ];
  }

  const keys = await ApiKeyModel.find(query)
    .sort({ CreationDate: -1 })
    .lean<apiKey[]>();

  return keys;
}

/**
 * Find all 'general' type API keys for a user (for UI display)
 */
export async function findGeneralApiKeysByUserId(userId: string): Promise<apiKey[]> {
  await getMongoose();

  const now = new Date();
  const keys = await ApiKeyModel.find({
    userId,
    keyType: "general",
    isDeleted: false,
    $or: [
      { expiresOn: { $exists: false } },
      { expiresOn: null },
      { expiresOn: { $gt: now } }
    ]
  })
    .sort({ CreationDate: -1 })
    .lean<apiKey[]>();

  return keys;
}

/**
 * Soft-delete an API key (revoke)
 */
export async function revokeApiKey(keyId: string): Promise<boolean> {
  await getMongoose();

  logger.info("[ApiKeys]", `Revoking API key: ${keyId}`);

  const result = await ApiKeyModel.findByIdAndUpdate(
    keyId,
    { $set: { isDeleted: true } },
    { new: true }
  );

  return result !== null;
}

/**
 * Revoke an API key by its ID, but only if it belongs to the specified user
 */
export async function revokeApiKeyForUser(keyId: string, userId: string): Promise<boolean> {
  await getMongoose();

  logger.info("[ApiKeys]", `User ${userId} revoking API key: ${keyId}`);

  const result = await ApiKeyModel.findOneAndUpdate(
    { _id: keyId, userId, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );

  return result !== null;
}

/**
 * Revoke all API keys for a user
 */
export async function revokeAllApiKeysForUser(userId: string): Promise<number> {
  await getMongoose();

  logger.info("[ApiKeys]", `Revoking all API keys for user: ${userId}`);

  const result = await ApiKeyModel.updateMany(
    { userId, isDeleted: false },
    { $set: { isDeleted: true } }
  );

  return result.modifiedCount;
}

/**
 * Get API key by ID
 */
export async function findApiKeyById(keyId: string): Promise<apiKey | null> {
  await getMongoose();

  const key = await ApiKeyModel.findOne({
    _id: keyId,
    isDeleted: false
  }).lean<apiKey>();

  return key;
}
