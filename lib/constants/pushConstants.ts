// Push subscription status constants
export const PUSH_SUBSCRIPTION_STATUSES = ["active", "expired", "unsubscribed"] as const;
export type PushSubscriptionStatus = (typeof PUSH_SUBSCRIPTION_STATUSES)[number];
