"use client";

import { use, useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/app/utils/fetcher";
import { useFamily } from "@/app/contexts/FamilyContext";
import { DAYS_OF_WEEK, DayOfWeek } from "@/lib/constants/familyConstants";
import { screenTimeAllowance, screenTimeSchedule, dailyAllowance } from "@/lib/models/ScreenTimeAllowance";
import logger from "@/app/utils/clientLogger";
import ScreenTimeDayRow from "../components/ScreenTimeDayRow";

interface ChildUser {
  _id: string;
  name: string;
  email: string;
}

interface ScreenTimeResponse {
  childUser: ChildUser;
  allowance: screenTimeAllowance;
}

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function validateSchedule(schedule: screenTimeSchedule): string | null {
  for (const day of DAYS_OF_WEEK) {
    const daySchedule = schedule[day];
    if (daySchedule.wakeUpTime && !TIME_REGEX.test(daySchedule.wakeUpTime)) {
      return `Invalid wake-up time for ${day}. Please use HH:MM format (e.g., 07:00).`;
    }
    if (daySchedule.bedTime && !TIME_REGEX.test(daySchedule.bedTime)) {
      return `Invalid bedtime for ${day}. Please use HH:MM format (e.g., 21:00).`;
    }
  }
  return null;
}

export default function AllowancesPage({
  params
}: {
  params: Promise<{ childId: string }>;
}) {
  const resolvedParams = use(params);
  const { childId } = resolvedParams;
  
  // Use shared family context
  const { familyGroupId } = useFamily();

  const { data, error, isLoading, mutate } = useSWR<ScreenTimeResponse>(
    `/api/family/${familyGroupId}/child/${childId}/screentime/allowances`,
    fetcher
  );

  const [localSchedule, setLocalSchedule] = useState<screenTimeSchedule | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Initialize local schedule when data loads
  useEffect(() => {
    if (data?.allowance?.schedule) {
      setLocalSchedule({ ...data.allowance.schedule });
      setHasChanges(false);
    }
  }, [data]);

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleDayChange = (day: DayOfWeek, allowance: dailyAllowance) => {
    if (!localSchedule) return;

    setLocalSchedule((prev) => {
      if (!prev) return prev;
      return { ...prev, [day]: allowance };
    });
    setHasChanges(true);
    setValidationError(null);
  };

  const handleCopyTo = (sourceDay: DayOfWeek, targetDays: DayOfWeek[]) => {
    if (!localSchedule) return;

    const sourceAllowance = localSchedule[sourceDay];
    setLocalSchedule((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      for (const targetDay of targetDays) {
        updated[targetDay] = { ...sourceAllowance };
      }
      return updated;
    });
    setHasChanges(true);
    setValidationError(null);
  };

  const handleRevert = () => {
    if (data?.allowance?.schedule) {
      setLocalSchedule({ ...data.allowance.schedule });
      setHasChanges(false);
      setValidationError(null);
    }
  };

  const handleSave = async () => {
    if (!localSchedule) return;

    // Validate before saving
    const error = validateSchedule(localSchedule);
    if (error) {
      setValidationError(error);
      return;
    }

    setIsSaving(true);
    setValidationError(null);
    try {
      const response = await fetch(`/api/family/${familyGroupId}/child/${childId}/screentime/allowances`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule: localSchedule })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save");
      }

      mutate();
      setHasChanges(false);
    } catch (error) {
      logger.error("[ScreenTimePage]", "Failed to save screen time", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    const errorStatus = error.status;
    return (
      <div className="p-8">
        <div className="alert alert-error mb-4">
          <span>
            {errorStatus === 403
              ? "This child is not in your family group."
              : errorStatus === 404
                ? "Child user not found."
                : "Failed to load screen time settings."}
          </span>
        </div>
        <Link href={`/home/family/${familyGroupId}/child/${childId}/screentime/on-date`} className="btn btn-primary">
          ← Back
        </Link>
      </div>
    );
  }

  const childUser = data?.childUser;
  if (!childUser || !localSchedule) {
    return (
      <div className="p-8">
        <div className="alert alert-warning mb-4">
          <span>Unable to load screen time data.</span>
        </div>
        <Link href={`/home/family/${familyGroupId}/child/${childId}/screentime/on-date`} className="btn btn-primary">
          ← Back
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href={`/home/family/${familyGroupId}/child/${childId}/screentime/on-date`} className="btn btn-ghost btn-sm mb-4">
          ← Back to {childUser.name}
        </Link>
        <h1 className="text-3xl font-bold">
          {childUser.name}
        </h1>
        <h1 className="text-2xl font-bold">
          Screen Time Allowances
        </h1>
      </div>

      <div className="mb-6">
        {DAYS_OF_WEEK.map((day) => (
          <ScreenTimeDayRow
            key={day}
            day={day}
            allowance={localSchedule[day]}
            onChange={(newAllowance: dailyAllowance) => handleDayChange(day, newAllowance)}
            onCopyTo={(targetDays: DayOfWeek[]) => handleCopyTo(day, targetDays)}
            defaultExpanded={false}
          />
        ))}
      </div>

      {validationError && (
        <div className="alert alert-error mb-4">
          <span>{validationError}</span>
        </div>
      )}

      <div className="flex gap-4">
        <button
          className="btn btn-ghost"
          onClick={handleRevert}
          disabled={!hasChanges || isSaving}
        >
          Revert
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Saving...
            </>
          ) : (
            "Save"
          )}
        </button>
      </div>

      {hasChanges && (
        <div className="mt-4 text-sm text-warning">
          You have unsaved changes.
        </div>
      )}
    </div>
  );
}
