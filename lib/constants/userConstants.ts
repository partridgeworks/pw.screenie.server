// User status constants
export const USER_STATUSES = ["pending", "approved", "suspended", "invited"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

// User application role constants
export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];
