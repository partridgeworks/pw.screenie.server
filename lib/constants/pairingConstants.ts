/**
 * Pairing code statuses
 * - issued: Code has been generated but not yet linked to a user
 * - linked: User has confirmed the pairing via the web page
 * - paired: Device has retrieved the API key successfully
 * - expired: Code has expired without being used
 */
export const PAIRING_STATUSES = ["issued", "linked", "paired", "expired"] as const;
export type PairingStatus = (typeof PAIRING_STATUSES)[number];

/**
 * Pairing code configuration
 */
export const PAIRING_CODE_LENGTH = 8;
export const PAIRING_CODE_EXPIRY_MINUTES = 60;
export const PAIRING_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789"; // No 0, O, I to avoid confusion
