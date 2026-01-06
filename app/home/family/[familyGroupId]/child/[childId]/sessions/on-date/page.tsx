"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useFamily, useScreenTimeStats } from "@/app/contexts/FamilyContext";
import {
  formatMinutesToDisplay,
  parseDateFromQuery
} from "@/lib/utils/dateTime";
import { screenTimeSession } from "@/lib/models/ScreenTimeSession";

/**
 * Convert a Date to a fractional hour of the day (0-24)
 */
function getHourOfDay(date: Date): number {
  return date.getHours() + date.getMinutes() / 60;
}

/**
 * Parse a time string (HH:MM) to fractional hour of day
 */
function parseTimeToHour(timeStr: string | null): number | null {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours + minutes / 60;
}

/**
 * Calculate the left position (%) and width (%) for a session bar
 */
function getSessionBarStyles(session: screenTimeSession): { left: string; width: string } {
  const startDate = new Date(session.startedAt);
  const startHour = getHourOfDay(startDate);
  const durationHours = session.duration / 60;

  // Calculate percentage of 24 hours
  const leftPercent = (startHour / 24) * 100;
  const widthPercent = (durationHours / 24) * 100;

  return {
    left: `${leftPercent}%`,
    width: `${Math.max(widthPercent, 0.5)}%` // Minimum width for visibility
  };
}

export default function SessionsPage({
  params
}: {
  params: Promise<{ familyGroupId: string; childId: string }>;
}) {
  const resolvedParams = use(params);
  const { childId } = resolvedParams;
  const searchParams = useSearchParams();
  const dateQuery = searchParams.get("date");
  const dateString = parseDateFromQuery(dateQuery);

  // Use shared family context
  const { familyGroupId } = useFamily();

  // Use centralized screen time stats hook
  const {
    childUser,
    dateDisplay,
    effectiveAllowance,
    sessionRecords,
    totalConsumedMinutes,
    isLoading,
    error
  } = useScreenTimeStats(childId, dateString);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    const errorStatus = (error as { status?: number }).status;
    return (
      <div className="p-8">
        <div className="alert alert-error mb-4">
          <span>
            {errorStatus === 403
              ? "This child is not in your family group."
              : errorStatus === 404
                ? "Child user not found."
                : "Failed to load session data."}
          </span>
        </div>
        <Link href={`/home/family/${familyGroupId}`} className="btn btn-primary">
          ← Back to Family Group
        </Link>
      </div>
    );
  }

  // Generate hour labels 0-24
  const hourLabels = Array.from({ length: 25 }, (_, i) => i);

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href={`/home/family/${familyGroupId}/child/${childId}/screentime/on-date?date=${dateString}`}
          className="btn btn-ghost btn-sm mb-4"
        >
          ← Back to Screen Time
        </Link>
        <h1 className="text-3xl font-bold">{childUser.name}</h1>
        <h2 className="text-2xl font-semibold mt-2">Screen time sessions</h2>
        <p className="text-lg text-base-content/70 mt-1">{dateDisplay}</p>
      </div>

      <div className="card bg-base-200 shadow-lg">
        <div className="card-body p-4 md:p-8">

          {/* Hourly Breakdown */}
          {sessionRecords.length > 0 && (
            <div className="mb-8">

              <div className="p-0">
                {/* Hour labels row */}
                <div className="relative w-full h-6 mb-2">
                  {hourLabels.filter((_, i) => i % 3 === 0).map((hour) => (
                    <div
                      key={hour}
                      className="absolute text-xs text-base-content/60"
                      style={{
                        left: `${(hour / 24) * 100}%`,
                        transform: "translateX(-50%)"
                      }}
                    >
                      {hour.toString().padStart(2, "0")}
                    </div>
                  ))}
                </div>

                {/* Timeline container */}
                <div className="relative w-full h-10 bg-base-300 rounded-lg overflow-hidden">
                  {/* Restricted time zone: midnight to wake time */}
                  {effectiveAllowance.effectiveWakeUpTime && (() => {
                    const wakeHour = parseTimeToHour(effectiveAllowance.effectiveWakeUpTime);
                    if (wakeHour !== null && wakeHour > 0) {
                      const widthPercent = (wakeHour / 24) * 100;
                      return (
                        <div
                          className="absolute top-0 bottom-0 bg-base-content/10"
                          style={{ left: "0%", width: `${widthPercent}%` }}
                          title={`Restricted: before ${effectiveAllowance.effectiveWakeUpTime}`}
                        />
                      );
                    }
                    return null;
                  })()}

                  {/* Restricted time zone: bedtime to midnight */}
                  {effectiveAllowance.effectiveBedTime && (() => {
                    const bedHour = parseTimeToHour(effectiveAllowance.effectiveBedTime);
                    if (bedHour !== null && bedHour < 24) {
                      const leftPercent = (bedHour / 24) * 100;
                      const widthPercent = ((24 - bedHour) / 24) * 100;
                      return (
                        <div
                          className="absolute top-0 bottom-0 bg-base-content/10"
                          style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                          title={`Restricted: after ${effectiveAllowance.effectiveBedTime}`}
                        />
                      );
                    }
                    return null;
                  })()}

                  {/* Hour grid lines */}
                  {hourLabels.filter((_, i) => i % 3 === 0).map((hour) => (
                    <div
                      key={hour}
                      className="absolute top-0 bottom-0 w-px bg-base-content/10"
                      style={{ left: `${(hour / 24) * 100}%` }}
                    />
                  ))}

                  {/* Session bars */}
                  {sessionRecords.map((session, index) => {
                    const styles = getSessionBarStyles(session);
                    // Use different colors for different sessions
                    const colors = [
                      "bg-primary",
                      "bg-secondary",
                      "bg-accent",
                      "bg-info",
                      "bg-success"
                    ];
                    const colorClass = colors[index % colors.length];

                    return (
                      <div
                        key={session._id}
                        className={`absolute top-1 bottom-1 ${colorClass} rounded opacity-80 hover:opacity-100 transition-opacity`}
                        style={{
                          left: styles.left,
                          width: styles.width
                        }}
                        title={`${new Date(session.startedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })} - ${formatMinutesToDisplay(session.duration)}`}
                      />
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* Sessions Table */}
          
            <div className="p-0">
              {sessionRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionRecords.map((record) => (
                        <tr key={record._id}>
                          <td className="text-base-content/70">
                            {new Date(record.startedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>
                          <td>{formatMinutesToDisplay(record.duration)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-base-300">
                        <td className="font-semibold">Total screen time</td>
                        <td className="font-bold text-lg">
                          {formatMinutesToDisplay(totalConsumedMinutes)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-base-content/50">
                  No sessions recorded for this date.
                </div>
              )}
            </div>
          

        </div>
      </div>


    </div>
  );
}
