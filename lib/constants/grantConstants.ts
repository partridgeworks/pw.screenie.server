// Screen time grant status constants
export const GRANT_STATUSES = ["requested", "granted", "rejected"] as const;
export type GrantStatus = (typeof GRANT_STATUSES)[number];
