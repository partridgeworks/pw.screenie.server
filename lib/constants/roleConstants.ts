// Shared role constants for users and API keys
// These roles are used for both userRole on User model and keyRole on ApiKey model
export const ROLES = ["readWrite", "readOnly"] as const;
export type Role = (typeof ROLES)[number];

// API key type constants
export const KEY_TYPES = ["general", "device"] as const;
export type KeyType = (typeof KEY_TYPES)[number];

// Permission definitions derived from roles
export interface Permissions {
  canRead: boolean;
  canWrite: boolean;
}

// Permission map - hardcoded mapping from role to permissions
export const ROLE_PERMISSIONS: Record<Role, Permissions> = {
  readWrite: { canRead: true, canWrite: true },
  readOnly: { canRead: true, canWrite: false }
};

/**
 * Get permissions for a given role
 */
export function getPermissionsForRole(role: Role): Permissions {
  return ROLE_PERMISSIONS[role];
}
