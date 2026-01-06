"use client";

import { useState, useEffect } from "react";
import { DayOfWeek } from "@/lib/constants/familyConstants";
import { dailyAllowance } from "@/lib/models/ScreenTimeAllowance";

interface ScreenTimeDayRowProps {
    day: DayOfWeek;
    allowance: dailyAllowance;
    onChange: (allowance: dailyAllowance) => void;
    onCopyTo: (targetDays: DayOfWeek[]) => void;
    defaultExpanded?: boolean;
}

const WEEKDAYS: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const WEEKEND_DAYS: DayOfWeek[] = ["saturday", "sunday"];
const ALL_DAYS: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function formatMinutesToHHMM(minutes: number | null): string {
    if (minutes === null) return "Unlimited";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

function formatMinutesForSummary(minutes: number | null): string {
    if (minutes === null) return "Unlimited";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
        return `${mins}m`;
    } else if (mins === 0) {
        return `${hours}hr`;
    } else {
        return `${hours}hr${mins}`;
    }
}

function capitalizeDay(day: DayOfWeek): string {
    return day.charAt(0).toUpperCase() + day.slice(1);
}

function formatSummary(allowance: dailyAllowance): string {
    const timeAllowed = formatMinutesForSummary(allowance.allowedMinutes);
    const hasWakeUp = allowance.wakeUpTime !== null;
    const hasBedTime = allowance.bedTime !== null;

    if (hasWakeUp && hasBedTime) {
        return `${timeAllowed} (from ${allowance.wakeUpTime} - ${allowance.bedTime})`;
    } else if (hasWakeUp) {
        return `${timeAllowed} (from ${allowance.wakeUpTime})`;
    } else if (hasBedTime) {
        return `${timeAllowed} (to ${allowance.bedTime})`;
    } else {
        return timeAllowed;
    }
}

function isWeekday(day: DayOfWeek): boolean {
    return WEEKDAYS.includes(day);
}

function isWeekend(day: DayOfWeek): boolean {
    return WEEKEND_DAYS.includes(day);
}

export default function ScreenTimeDayRow({
    day,
    allowance,
    onChange,
    onCopyTo,
    defaultExpanded = false
}: ScreenTimeDayRowProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    useEffect(() => {
        setIsExpanded(defaultExpanded);
    }, [defaultExpanded]);

    const handleIncrementTime = () => {
        const currentMinutes = allowance.allowedMinutes ?? 0;
        const newMinutes = Math.min(currentMinutes + 15, 1440);
        onChange({ ...allowance, allowedMinutes: newMinutes });
    };

    const handleDecrementTime = () => {
        if (allowance.allowedMinutes === null) {
            // If unlimited, set to 23:45 (1425 minutes)
            onChange({ ...allowance, allowedMinutes: 1425 });
            return;
        }
        const newMinutes = Math.max(allowance.allowedMinutes - 15, 0);
        onChange({ ...allowance, allowedMinutes: newMinutes });
    };

    const handleClearTime = () => {
        onChange({ ...allowance, allowedMinutes: null });
    };

    const handleWakeUpChange = (value: string) => {
        const sanitized = value.trim() || null;
        onChange({ ...allowance, wakeUpTime: sanitized });
    };

    const handleBedTimeChange = (value: string) => {
        const sanitized = value.trim() || null;
        onChange({ ...allowance, bedTime: sanitized });
    };

    const handleClearWakeUp = () => {
        onChange({ ...allowance, wakeUpTime: null });
    };

    const handleClearBedTime = () => {
        onChange({ ...allowance, bedTime: null });
    };

    const handleCopyTo = (targetDays: DayOfWeek[]) => {
        onCopyTo(targetDays);
        // Blur to close the DaisyUI dropdown
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    };

    return (
        <div className="border border-base-300 rounded-lg mb-3 bg-base-100">
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-base-200"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex flex-col items-start md:flex-row md:items-center md:gap-3 flex-1">
                    <h3 className="font-semibold text-lg">{capitalizeDay(day)}</h3>
                    {!isExpanded && (
                        <span className="text-base font-normal text-base-content/60">
                            {formatSummary(allowance)}
                        </span>
                    )}
                </div>
                <svg
                    className={`w-6 h-6 transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>

            {/* Body - Expandable */}
            {isExpanded && (
                <div className="p-4 pt-0">
                    <div className="flex flex-col md:flex-row md:gap-6 space-y-4 md:space-y-0">
                        {/* Time Allowed */}
                        <div className="flex-1">
                            <label className="text-sm font-medium text-base-content/70 mb-2 block">
                                Time Allowed
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    className="btn btn-sm btn-circle btn-outline"
                                    onClick={handleDecrementTime}
                                >
                                    −
                                </button>
                                <span className="w-24 text-center font-mono text-lg">
                                    {formatMinutesToHHMM(allowance.allowedMinutes)}
                                </span>
                                <button
                                    className="btn btn-sm btn-circle btn-outline"
                                    onClick={handleIncrementTime}
                                    disabled={allowance.allowedMinutes !== null && allowance.allowedMinutes >= 1440}
                                >
                                    +
                                </button>
                                <button
                                    className={`btn btn-sm btn-ghost ${allowance.allowedMinutes !== null ? "text-warning" : "invisible"}`}
                                    onClick={handleClearTime}
                                    title="Set to unlimited"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Wake-up Time */}
                        <div className="flex-1">
                            <label className="text-sm font-medium text-base-content/70 mb-2 block">
                                Wake Time
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    className="input input-bordered w-32 font-mono"
                                    placeholder="HH:MM"
                                    value={allowance.wakeUpTime || ""}
                                    onChange={(e) => handleWakeUpChange(e.target.value)}
                                />
                                <button
                                    className={`btn btn-sm btn-ghost ${allowance.wakeUpTime ? "text-warning" : "invisible"}`}
                                    onClick={handleClearWakeUp}
                                    title="Remove wake-up time"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Bedtime */}
                        <div className="flex-1">
                            <label className="text-sm font-medium text-base-content/70 mb-2 block">
                                Bedtime
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    className="input input-bordered w-32 font-mono"
                                    placeholder="HH:MM"
                                    value={allowance.bedTime || ""}
                                    onChange={(e) => handleBedTimeChange(e.target.value)}
                                />
                                <button
                                    className={`btn btn-sm btn-ghost ${allowance.bedTime ? "text-warning" : "invisible"}`}
                                    onClick={handleClearBedTime}
                                    title="Remove bedtime"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Copy to dropdown */}
                    <div className="pt-4">
                        <div className="dropdown dropdown-end">
                            <div tabIndex={0} role="button" className="btn btn-sm btn-ghost gap-1">
                                Copy to...
                                <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[100] w-40 p-2 shadow-lg border border-base-300">
                                {isWeekday(day) && (
                                    <li>
                                        <button onClick={() => handleCopyTo(WEEKDAYS)}>
                                            All weekdays
                                        </button>
                                    </li>
                                )}
                                {isWeekend(day) && (
                                    <li>
                                        <button onClick={() => handleCopyTo(WEEKEND_DAYS)}>
                                            Sat &amp; Sun
                                        </button>
                                    </li>
                                )}
                                <li>
                                    <button onClick={() => handleCopyTo(ALL_DAYS)}>
                                        All days
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
