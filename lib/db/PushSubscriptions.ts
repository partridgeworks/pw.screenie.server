import PushSubscriptionModel, { pushSubscription } from "@/lib/models/PushSubscription";
import { getMongoose } from "@/lib/utils/mongo";
import mongoose from "mongoose";
import logger from "@/lib/utils/serverLogger";

/**
 * Convert MongoDB document to frontend-friendly type
 */
function toPushSubscription(doc: mongoose.Document): pushSubscription {
  const obj = doc.toObject();
  return {
    _id: obj._id.toString(),
    userId: obj.userId,
    endpoint: obj.endpoint,
    keys: obj.keys,
    deviceInfo: obj.deviceInfo,
    status: obj.status,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
}

/**
 * Create or update a push subscription for a user
 */
export async function upsertPushSubscription(
  userId: string,
  endpoint: string,
  keys: { p256dh: string; auth: string },
  deviceInfo?: string
): Promise<pushSubscription> {
  await getMongoose();

  logger.info("[PushSubscriptions]", `Upserting subscription for user ${userId}`);

  const result = await PushSubscriptionModel.findOneAndUpdate(
    { endpoint },
    {
      userId: new mongoose.Types.ObjectId(userId),
      endpoint,
      keys,
      deviceInfo,
      status: "active"
    },
    { upsert: true, new: true }
  );

  return toPushSubscription(result);
}

/**
 * Find all active push subscriptions for a user
 */
export async function findPushSubscriptionsByUserId(
  userId: string
): Promise<pushSubscription[]> {
  await getMongoose();

  const subscriptions = await PushSubscriptionModel.find({
    userId: new mongoose.Types.ObjectId(userId),
    status: "active"
  });

  return subscriptions.map(toPushSubscription);
}

/**
 * Find all active push subscriptions for multiple users
 */
export async function findPushSubscriptionsByUserIds(
  userIds: string[]
): Promise<pushSubscription[]> {
  await getMongoose();

  const objectIds = userIds.map((id) => new mongoose.Types.ObjectId(id));

  const subscriptions = await PushSubscriptionModel.find({
    userId: { $in: objectIds },
    status: "active"
  });

  return subscriptions.map(toPushSubscription);
}

/**
 * Delete a push subscription by endpoint
 */
export async function deletePushSubscriptionByEndpoint(
  endpoint: string
): Promise<boolean> {
  await getMongoose();

  logger.info("[PushSubscriptions]", `Deleting subscription with endpoint: ${endpoint.substring(0, 50)}...`);

  const result = await PushSubscriptionModel.deleteOne({ endpoint });
  return result.deletedCount > 0;
}

/**
 * Delete all push subscriptions for a user
 */
export async function deletePushSubscriptionsByUserId(
  userId: string
): Promise<number> {
  await getMongoose();

  logger.info("[PushSubscriptions]", `Deleting all subscriptions for user ${userId}`);

  const result = await PushSubscriptionModel.deleteMany({
    userId: new mongoose.Types.ObjectId(userId)
  });

  return result.deletedCount;
}

/**
 * Mark a subscription as expired (for cleanup on push failure)
 */
export async function markSubscriptionExpired(endpoint: string): Promise<void> {
  await getMongoose();

  logger.info("[PushSubscriptions]", `Marking subscription as expired: ${endpoint.substring(0, 50)}...`);

  await PushSubscriptionModel.updateOne(
    { endpoint },
    { status: "expired" }
  );
}

/**
 * Delete expired subscriptions older than the specified days
 */
export async function cleanupExpiredSubscriptions(olderThanDays: number = 7): Promise<number> {
  await getMongoose();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await PushSubscriptionModel.deleteMany({
    status: "expired",
    updatedAt: { $lt: cutoffDate }
  });

  if (result.deletedCount > 0) {
    logger.info("[PushSubscriptions]", `Cleaned up ${result.deletedCount} expired subscriptions`);
  }

  return result.deletedCount;
}
