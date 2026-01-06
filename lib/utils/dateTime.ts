/**
 * Date and time formatting utilities
 */

/**
 * Get today's date in YYYY-MM-DD format (local time)
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse and validate date from query string
 * Returns YYYY-MM-DD format string
 */
export function parseDateFromQuery(dateQuery: string | null): string {
  if (!dateQuery || dateQuery === "today") {
    return getTodayDateString();
  }
  // Validate YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateQuery)) {
    return dateQuery;
  }
  // Fallback to today
  return getTodayDateString();
}

/**
 * Format minutes to human-readable display
 * Examples: "30 minutes", "1 hour", "2h 15m", "Unlimited"
 */
export function formatMinutesToDisplay(minutes: number | null): string {
  if (minutes === null) return "Unlimited";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} minute${mins !== 1 ? "s" : ""}`;
  if (mins === 0) return `${hours} hour${hours !== 1 ? "s" : ""}`;
  return `${hours}h ${mins}m`;
}

/**
 * Format minutes to compact display for cards/badges
 * Examples: "30mins", "1hr", "2hrs 15mins"
 */
export function formatMinutesToCompact(minutes: number | null): string {
  if (minutes === null) return "Unlimited";
  if (minutes < 60) return `${minutes}min${minutes !== 1 ? "s" : ""}`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}hr${hours !== 1 ? "s" : ""}`;
  return `${hours}hr${hours !== 1 ? "s" : ""} ${remainingMinutes}min${remainingMinutes !== 1 ? "s" : ""}`;
}

/**
 * Format remaining minutes for display, with special handling for zero/negative
 * Examples: "30 minutes", "None", "Unlimited"
 */
export function formatRemainingMinutes(remainingMinutes: number | null): string {
  if (remainingMinutes === null) return "Unlimited";
  if (remainingMinutes <= 0) return "None";
  return formatMinutesToDisplay(remainingMinutes);
}

/**
 * Format time string for display
 * Returns "Not set" for null/undefined values
 */
export function formatTimeForDisplay(time: string | null): string {
  if (!time) return "Not set";
  return time;
}
