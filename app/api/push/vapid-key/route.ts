import { NextResponse } from "next/server";

/**
 * GET /api/push/vapid-key
 * Get the public VAPID key for push subscription
 * This endpoint is public (no auth required) as clients need it to subscribe
 */
export async function GET() {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    return NextResponse.json(
      { message: "Push notifications are not configured" },
      { status: 503 }
    );
  }

  return NextResponse.json({ publicKey: vapidPublicKey });
}
