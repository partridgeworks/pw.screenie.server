// Family member position constants
export const FAMILY_POSITIONS = ["parent", "child"] as const;
export type FamilyPosition = (typeof FAMILY_POSITIONS)[number];

// Family member status constants
export const FAMILY_MEMBER_STATUSES = ["active", "invited", "removed"] as const;
export type FamilyMemberStatus = (typeof FAMILY_MEMBER_STATUSES)[number];

// Days of the week for screen time allowance
export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];
