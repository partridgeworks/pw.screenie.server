import webPush from "web-push";
import logger from "@/lib/utils/serverLogger";
import {
  findPushSubscriptionsByUserIds,
  markSubscriptionExpired,
  deletePushSubscriptionByEndpoint
} from "@/lib/db/PushSubscriptions";

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@screenie.app";

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

/**
 * Send a push notification to a specific subscription
 */
async function sendPushNotification(
  endpoint: string,
  keys: { p256dh: string; auth: string },
  payload: PushPayload
): Promise<boolean> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    logger.warn("[Notifications]", "VAPID keys not configured, skipping push notification");
    return false;
  }

  const subscription = {
    endpoint,
    keys
  };

  try {
    await webPush.sendNotification(subscription, JSON.stringify(payload));
    logger.info("[Notifications]", `Push notification sent successfully to ${endpoint.substring(0, 50)}...`);
    return true;
  } catch (error) {
    const err = error as { statusCode?: number; message: string };
    
    // Handle expired/invalid subscriptions
    if (err.statusCode === 404 || err.statusCode === 410) {
      logger.info("[Notifications]", `Subscription expired/invalid (${err.statusCode}), removing: ${endpoint.substring(0, 50)}...`);
      await deletePushSubscriptionByEndpoint(endpoint);
      return false;
    }

    // Handle other errors - mark as expired for later cleanup
    if (err.statusCode === 401 || err.statusCode === 403) {
      logger.warn("[Notifications]", `Auth error (${err.statusCode}) for subscription, marking expired`);
      await markSubscriptionExpired(endpoint);
      return false;
    }

    logger.error("[Notifications]", `Failed to send push notification: ${err.message}`);
    return false;
  }
}

/**
 * Send push notifications to all subscribed devices for given user IDs
 */
async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  const subscriptions = await findPushSubscriptionsByUserIds(userIds);
  
  if (subscriptions.length === 0) {
    logger.info("[Notifications]", `No push subscriptions found for users: ${userIds.join(", ")}`);
    return { sent: 0, failed: 0 };
  }

  logger.info("[Notifications]", `Sending push to ${subscriptions.length} subscriptions for ${userIds.length} users`);

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    const success = await sendPushNotification(sub.endpoint, sub.keys, payload);
    if (success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Notify parent(s) about a new grant request from a child device
 */
export async function notifyParentOfGrantRequest(
  parentUserId: string,
  childName: string,
  requestDetails: {
    familyGroupId: string;
    childId: string;
    applicableDate: string;
    bonusMinutes: number | null;
    overrideWakeUpTime: string | null;
    overrideBedTime: string | null;
    notes: string | null;
  }
): Promise<void> {
  // Build notification body
  let body = `${childName} requested more screen time`;
  
  if (requestDetails.bonusMinutes) {
    body += ` (+${requestDetails.bonusMinutes} minutes)`;
  }
  if (requestDetails.overrideBedTime) {
    body += `, bedtime ${requestDetails.overrideBedTime}`;
  }
  if (requestDetails.overrideWakeUpTime) {
    body += `, wake-up ${requestDetails.overrideWakeUpTime}`;
  }

  const payload: PushPayload = {
    title: "Screen Time Request",
    body,
    icon: "/screenie-logo@3x.png",
    badge: "/screenie-logo@3x.png",
    data: {
      type: "grant_request",
      url: `/home/family/${requestDetails.familyGroupId}/child/${requestDetails.childId}/screentime/on-date?date=${requestDetails.applicableDate}`,
      childName,
      ...requestDetails
    }
  };

  const result = await sendPushToUsers([parentUserId], payload);
  
  logger.info(
    "[Notifications]",
    `Grant request notification for ${childName}: sent=${result.sent}, failed=${result.failed}`
  );
}

/**
 * Notify all parents in a family about a grant request
 */
export async function notifyParentsOfGrantRequest(
  parentUserIds: string[],
  childName: string,
  requestDetails: {
    familyGroupId: string;
    childId: string;
    applicableDate: string;
    bonusMinutes: number | null;
    overrideWakeUpTime: string | null;
    overrideBedTime: string | null;
    notes: string | null;
  }
): Promise<void> {
  // Build notification body
  let body = `${childName} requested more screen time`;
  
  if (requestDetails.bonusMinutes) {
    body += ` (+${requestDetails.bonusMinutes} minutes)`;
  }
  if (requestDetails.overrideBedTime) {
    body += `, bedtime ${requestDetails.overrideBedTime}`;
  }
  if (requestDetails.overrideWakeUpTime) {
    body += `, wake-up ${requestDetails.overrideWakeUpTime}`;
  }

  const payload: PushPayload = {
    title: "Screen Time Request",
    body,
    icon: "/screenie-logo@3x.png",
    badge: "/screenie-logo@3x.png",
    data: {
      type: "grant_request",
      url: `/home/family/${requestDetails.familyGroupId}/child/${requestDetails.childId}/screentime/on-date?date=${requestDetails.applicableDate}`,
      childName,
      ...requestDetails
    }
  };

  const result = await sendPushToUsers(parentUserIds, payload);
  
  logger.info(
    "[Notifications]",
    `Grant request notifications for ${childName}: sent=${result.sent}, failed=${result.failed}`
  );
}

/**
 * Notify child that their grant request was accepted or rejected
 */
export async function notifyChildOfGrantDecision(
  childUserId: string,
  grantId: string,
  status: "granted" | "rejected",
  familyGroupId: string
): Promise<void> {
  const payload: PushPayload = {
    title: status === "granted" ? "Request Approved! 🎉" : "Request Denied",
    body: status === "granted" 
      ? "Your screen time request was approved!"
      : "Your screen time request was denied.",
    icon: "/screenie-logo@3x.png",
    badge: "/screenie-logo@3x.png",
    data: {
      type: "grant_decision",
      url: `/home/family/${familyGroupId}`,
      grantId,
      status
    }
  };

  const result = await sendPushToUsers([childUserId], payload);
  
  logger.info(
    "[Notifications]",
    `Grant decision notification for child ${childUserId}: status=${status}, sent=${result.sent}, failed=${result.failed}`
  );
}
