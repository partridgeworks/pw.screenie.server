import { DayOfWeek, DAYS_OF_WEEK } from "@/lib/constants/familyConstants";
import { getOrCreateScreenTimeAllowance } from "@/lib/db/ScreenTimeAllowances";
import { findGrantsByChildAndDate, findAllGrantsByChildAndDate } from "@/lib/db/ScreenTimeGrants";
import logger from "@/lib/utils/serverLogger";
import { EffectiveDailyAllowance } from "@/lib/types/screentime";

// Re-export the type for convenience
export type { EffectiveDailyAllowance };

/**
 * Get the day of week from a date string in YYYY-MM-DD format
 */
export function getDayOfWeekFromDate(dateString: string): DayOfWeek {
  const date = new Date(dateString + "T12:00:00"); // Use noon to avoid timezone issues
  const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  // Convert to our DAYS_OF_WEEK array (monday = 0, sunday = 6)
  const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
  return DAYS_OF_WEEK[adjustedIndex];
}

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
export function timeToMinutes(time: string | null): number | null {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to HH:MM format
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Calculate the maximum available screen time based on wake-up and bedtime
 * Returns the number of minutes between wake-up and bedtime
 */
export function calculateMaxAvailableMinutes(
  wakeUpTime: string | null,
  bedTime: string | null
): number {
  const wakeUp = timeToMinutes(wakeUpTime) ?? 0; // Default to midnight (00:00)
  const bed = timeToMinutes(bedTime) ?? 1440; // Default to midnight (24:00)
  
  // If bedtime is after wakeup (normal case)
  if (bed > wakeUp) {
    return bed - wakeUp;
  }
  // If bedtime is before wakeup (crosses midnight - unusual but handle it)
  return (1440 - wakeUp) + bed;
}

/**
 * Get the effective daily allowance for a child on a specific date
 * This takes the default allowance for that day of the week and applies any grants
 * 
 * Logic:
 * 1. Fetch the default allowance for that child in that family, get the rules for the day of week
 * 2. Fetch all grants for that child on that date, ordered chronologically
 * 3. Total screen time = base allowance + sum of all bonus minutes grants
 * 4. Wake-up time = most recent override grant, or base if none
 * 5. Bedtime = most recent override grant, or base if none
 */
export async function getEffectiveDailyAllowance(
  childUserId: string,
  familyGroupId: string,
  dateString: string
): Promise<EffectiveDailyAllowance> {
  // Get the day of week for this date
  const dayOfWeek = getDayOfWeekFromDate(dateString);
  
  logger.info(
    "[EffectiveAllowance]",
    `Calculating effective allowance for child ${childUserId} on ${dateString} (${dayOfWeek})`
  );

  // Fetch the default allowance
  const allowance = await getOrCreateScreenTimeAllowance(childUserId, familyGroupId);
  const baseAllowance = allowance.schedule[dayOfWeek];

  // Fetch GRANTED grants for this child on this date (for effective calculations)
  const grants = await findGrantsByChildAndDate(familyGroupId, childUserId, dateString);
  
  // Fetch ALL grants including requested/rejected (for display purposes)
  const allGrants = await findAllGrantsByChildAndDate(familyGroupId, childUserId, dateString);

  // Calculate total bonus minutes (sum of all GRANTED bonus grants)
  let totalBonusMinutes = 0;
  for (const grant of grants) {
    if (grant.bonusMinutes !== null) {
      totalBonusMinutes += grant.bonusMinutes;
    }
  }

  // Calculate effective allowed minutes
  let effectiveAllowedMinutes: number | null = null;
  if (baseAllowance.allowedMinutes !== null) {
    effectiveAllowedMinutes = Math.max(0, baseAllowance.allowedMinutes + totalBonusMinutes);
  } else if (totalBonusMinutes !== 0) {
    // If base is unlimited but there's bonus time, it stays unlimited
    effectiveAllowedMinutes = null;
  }

  // Find the most recent wake-up time override (from GRANTED grants only)
  let effectiveWakeUpTime = baseAllowance.wakeUpTime;
  for (const grant of grants) {
    if (grant.overrideWakeUpTime !== null) {
      effectiveWakeUpTime = grant.overrideWakeUpTime;
    }
  }

  // Find the most recent bedtime override (from GRANTED grants only)
  let effectiveBedTime = baseAllowance.bedTime;
  for (const grant of grants) {
    if (grant.overrideBedTime !== null) {
      effectiveBedTime = grant.overrideBedTime;
    }
  }

  return {
    baseAllowance,
    effectiveAllowedMinutes,
    effectiveWakeUpTime,
    effectiveBedTime,
    totalBonusMinutes,
    grants,
    allGrants
  };
}

/**
 * Validate a date string in YYYY-MM-DD format or 'today'
 * Returns the normalized YYYY-MM-DD date string or null if invalid
 */
export function parseAndValidateDate(dateInput: string): string | null {
  if (dateInput === "today") {
    const now = new Date();
    return formatDateToYYYYMMDD(now);
  }

  // Validate YYYY-MM-DD format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return null;
  }

  // Validate it's a real date
  const date = new Date(dateInput + "T12:00:00");
  if (isNaN(date.getTime())) {
    return null;
  }

  return dateInput;
}

/**
 * Format a Date object to YYYY-MM-DD string in local time
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format a date string (YYYY-MM-DD) to a human-readable format
 */
export function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}
