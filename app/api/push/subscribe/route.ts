import { NextRequest, NextResponse } from "next/server";
import { tryGetCurrentUserForAPI, requireWritePermission } from "@/lib/server/auth";
import {
  upsertPushSubscription,
  deletePushSubscriptionByEndpoint,
  deletePushSubscriptionsByUserId
} from "@/lib/db/PushSubscriptions";
import logger from "@/lib/utils/serverLogger";

interface SubscribeRequest {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  deviceInfo?: string;
  resubscribe?: boolean;
}

interface UnsubscribeRequest {
  endpoint?: string;
  all?: boolean;
}

/**
 * POST /api/push/subscribe
 * Subscribe to push notifications
 * Requires write permission
 */
export async function POST(req: NextRequest) {
  const authResult = await tryGetCurrentUserForAPI(req);
  if (!authResult.success) {
    return authResult.response;
  }
  const { user: currentUser, permissions } = authResult;

  // Check write permission
  const permissionError = requireWritePermission(permissions);
  if (permissionError) {
    return permissionError;
  }

  try {
    const body: SubscribeRequest = await req.json();

    if (!body.subscription?.endpoint || !body.subscription?.keys?.p256dh || !body.subscription?.keys?.auth) {
      return NextResponse.json(
        { message: "Invalid subscription: endpoint and keys (p256dh, auth) are required" },
        { status: 400 }
      );
    }

    const subscription = await upsertPushSubscription(
      currentUser._id,
      body.subscription.endpoint,
      body.subscription.keys,
      body.deviceInfo
    );

    logger.info(
      "[API/push/subscribe]",
      `User ${currentUser._id} subscribed to push notifications (resubscribe: ${body.resubscribe ?? false})`
    );

    return NextResponse.json({ success: true, subscriptionId: subscription._id }, { status: 201 });
  } catch (error) {
    const err = error as Error;
    logger.error("[API/push/subscribe]", `Failed to subscribe: ${err.message}`);
    return NextResponse.json(
      { message: "Failed to subscribe to push notifications" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/push/subscribe
 * Unsubscribe from push notifications
 * 
 * Body:
 * - endpoint?: string - Specific endpoint to unsubscribe
 * - all?: boolean - If true, unsubscribe all devices for this user
 * 
 * Requires write permission
 */
export async function DELETE(req: NextRequest) {
  const authResult = await tryGetCurrentUserForAPI(req);
  if (!authResult.success) {
    return authResult.response;
  }
  const { user: currentUser, permissions } = authResult;

  // Check write permission
  const permissionError = requireWritePermission(permissions);
  if (permissionError) {
    return permissionError;
  }

  try {
    const body: UnsubscribeRequest = await req.json();

    if (body.all) {
      // Unsubscribe all devices for this user
      const count = await deletePushSubscriptionsByUserId(currentUser._id);
      logger.info("[API/push/subscribe]", `User ${currentUser._id} unsubscribed all ${count} devices`);
      return NextResponse.json({ success: true, deletedCount: count });
    }

    if (!body.endpoint) {
      return NextResponse.json(
        { message: "Either 'endpoint' or 'all: true' is required" },
        { status: 400 }
      );
    }

    const deleted = await deletePushSubscriptionByEndpoint(body.endpoint);
    
    if (!deleted) {
      return NextResponse.json(
        { message: "Subscription not found" },
        { status: 404 }
      );
    }

    logger.info("[API/push/subscribe]", `User ${currentUser._id} unsubscribed from push notifications`);
    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    logger.error("[API/push/subscribe]", `Failed to unsubscribe: ${err.message}`);
    return NextResponse.json(
      { message: "Failed to unsubscribe from push notifications" },
      { status: 500 }
    );
  }
}
