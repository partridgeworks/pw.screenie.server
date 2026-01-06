import { dailyAllowance } from "@/lib/models/ScreenTimeAllowance";
import { screenTimeGrant } from "@/lib/models/ScreenTimeGrant";
import { screenTimeSession } from "@/lib/models/ScreenTimeSession";

/**
 * Effective daily allowance for a specific date, after applying grants
 * This is the response format from the screentime/on-date API endpoint
 */
export interface EffectiveDailyAllowance {
  baseAllowance: dailyAllowance;
  effectiveAllowedMinutes: number | null;
  effectiveWakeUpTime: string | null;
  effectiveBedTime: string | null;
  totalBonusMinutes: number;
  /** Grants with status 'granted' - used for effective calculations. Only included when ?includegrants=true */
  grants?: screenTimeGrant[];
  /** All grants including requested/rejected - used for display. Only included when ?includegrants=true */
  allGrants?: screenTimeGrant[];
}

/**
 * Basic child user info returned by screentime APIs
 */
export interface ChildUser {
  _id: string;
  name: string;
  email: string;
}

/**
 * Comprehensive screen time statistics for a child on a specific date
 * Includes allowance, consumption, grants, and calculated remaining time
 */
export interface ScreenTimeStats {
  /** The child user info */
  childUser: ChildUser;
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Human-readable date display (e.g., "Monday, January 1, 2024") */
  dateDisplay: string;
  /** Day of week (e.g., "Monday") */
  dayOfWeek: string;
  /** Effective allowance including grants */
  effectiveAllowance: EffectiveDailyAllowance;
  /** Session records for the date */
  sessionRecords: screenTimeSession[];
  /** Total minutes consumed across all sessions */
  totalConsumedMinutes: number;
  /** Remaining minutes (null = unlimited, can be negative if overused) */
  remainingMinutes: number | null;
  /** Whether the child has overused their allowance */
  isOverused: boolean;
  /** Whether data is still loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | undefined;
  /** Function to refresh the data */
  mutate: () => void;
}
