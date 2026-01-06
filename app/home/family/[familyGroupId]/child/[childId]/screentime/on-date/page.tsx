"use client";

import { use, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useFamily, useScreenTimeStats } from "@/app/contexts/FamilyContext";
import logger from "@/app/utils/clientLogger";
import BonusTimeDialog from "./components/BonusTimeDialog";
import TimeOverrideDialog from "./components/TimeOverrideDialog";
import {
  formatMinutesToDisplay,
  formatRemainingMinutes,
  formatTimeForDisplay,
  parseDateFromQuery
} from "@/lib/utils/dateTime";
import ChevronDownIcon from "@/app/assets/icons/chevron-down.svg";
import { screenTimeGrant } from "@/lib/models/ScreenTimeGrant";

interface ExpandableRowProps {
  label: string;
  value: React.ReactNode;
  rightContent?: React.ReactNode;
  expandedContent?: React.ReactNode;
  hasExpansion?: boolean;
  className?: string;
}

function ExpandableRow({
  label,
  value,
  rightContent,
  expandedContent,
  hasExpansion = true,
  className = ""
}: ExpandableRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <tr
        className={`cursor-pointer hover:bg-base-300/50 transition-colors ${className}`}
        onClick={() => hasExpansion && setIsExpanded(!isExpanded)}
      >
        <td className="font-medium w-24">{label}</td>
        <td className="text-lg font-bold whitespace-nowrap">{value}</td>
        <td className="text-right">
          <div className="flex items-center justify-end gap-2">
            {rightContent}
            {hasExpansion && (
              <ChevronDownIcon
                className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? "rotate-0" : "-rotate-90"}`}
              />
            )}
          </div>
        </td>
      </tr>
      {hasExpansion && isExpanded && expandedContent && (
        <tr>
          <td colSpan={3} className="bg-base-300/30 px-4 py-3">
            {expandedContent}
          </td>
        </tr>
      )}
    </>
  );
}

// Expanded content for the Allowance row
function AllowanceExpanded({
  baseAllowedMinutes,
  bonusGrants,
  totalMinutes
}: {
  baseAllowedMinutes: number | null;
  bonusGrants: screenTimeGrant[];
  totalMinutes: number | null;
}) {
  return (
    <div className="space-y-1 text-sm">
      <div className="flex justify-between">
        <span>Basic</span>
        <span>{formatMinutesToDisplay(baseAllowedMinutes)}</span>
      </div>
      {bonusGrants.map((grant) => (
        <div key={grant._id} className="flex justify-between text-info">
          <span>Bonus</span>
          <span>
            {grant.bonusMinutes !== null && grant.bonusMinutes > 0 ? "+" : ""}
            {grant.bonusMinutes}min (at {new Date(grant.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
          </span>
        </div>
      ))}
      <div className="flex justify-between font-semibold border-t border-base-300 pt-1 mt-1">
        <span>Total</span>
        <span>{formatMinutesToDisplay(totalMinutes)}</span>
      </div>
    </div>
  );
}

// Expanded content for the Remaining row
function RemainingExpanded({
  totalConsumedMinutes,
  remainingMinutes,
  familyGroupId,
  childId,
  dateString
}: {
  totalConsumedMinutes: number;
  remainingMinutes: number | null;
  familyGroupId: string;
  childId: string;
  dateString: string;
}) {
  return (
    <div className="space-y-1 text-sm">
      <div className="flex justify-between items-center">
        <span>Used:</span>
        <span>{formatMinutesToDisplay(totalConsumedMinutes)}</span>
      </div>
      <div className="flex justify-end">
        <Link
          href={`/home/family/${familyGroupId}/child/${childId}/sessions/on-date?date=${dateString}`}
          className="btn btn-ghost btn-primary btn-xs"
        >
          Show breakdown
        </Link>
      </div>
      <div className="flex justify-between">
        <span>Remaining:</span>
        <span>{formatRemainingMinutes(remainingMinutes)}</span>
      </div>
    </div>
  );
}

// Table for displaying time override grants
function TimeGrantsTable({
  grants,
  type
}: {
  grants: screenTimeGrant[];
  type: "wakeup" | "bedtime";
}) {
  return (
    <table className="table table-xs w-full">
      <thead>
        <tr>
          <th>Time</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        {grants.map((grant) => (
          <tr key={grant._id}>
            <td className="text-base-content/70">
              {new Date(grant.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </td>
            <td>
              {type === "wakeup"
                ? `Wake-up changed to ${grant.overrideWakeUpTime}`
                : `Bedtime changed to ${grant.overrideBedTime}`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function BonusPage({
  params
}: {
  params: Promise<{ familyGroupId: string; childId: string }>;
}) {
  const resolvedParams = use(params);
  const { childId } = resolvedParams;
  const searchParams = useSearchParams();
  const dateQuery = searchParams.get("date");
  const dateString = parseDateFromQuery(dateQuery);

  // Use shared family context for grant operations
  const { familyGroupId, createGrant } = useFamily();

  // Use centralized screen time stats hook
  const {
    childUser,
    dateDisplay,
    effectiveAllowance,
    sessionRecords,
    totalConsumedMinutes,
    remainingMinutes,
    isLoading,
    error,
    mutate
  } = useScreenTimeStats(childId, dateString, true);

  // Filter grants for wake-up and bedtime overrides
  const wakeupGrants = (effectiveAllowance?.allGrants ?? []).filter(
    (g): g is screenTimeGrant => g.status === "granted" && g.overrideWakeUpTime !== null
  );
  const bedtimeGrants = (effectiveAllowance?.allGrants ?? []).filter(
    (g): g is screenTimeGrant => g.status === "granted" && g.overrideBedTime !== null
  );

  const [bonusDialogOpen, setBonusDialogOpen] = useState(false);
  const [wakeupDialogOpen, setWakeupDialogOpen] = useState(false);
  const [bedtimeDialogOpen, setBedtimeDialogOpen] = useState(false);

  const handleAddBonusTime = async (bonusMinutes: number) => {
    try {
      await createGrant({
        childId,
        applicableDate: dateString,
        bonusMinutes
      });
      // Refresh local screen time data
      mutate();
    } catch (err) {
      logger.error("[BonusPage]", "Failed to add bonus time", err);
      throw err;
    }
  };

  const handleOverrideWakeup = async (newTime: string) => {
    try {
      await createGrant({
        childId,
        applicableDate: dateString,
        overrideWakeUpTime: newTime
      });
      mutate();
    } catch (err) {
      logger.error("[BonusPage]", "Failed to override wake-up time", err);
      throw err;
    }
  };

  const handleOverrideBedtime = async (newTime: string) => {
    try {
      await createGrant({
        childId,
        applicableDate: dateString,
        overrideBedTime: newTime
      });
      mutate();
    } catch (err) {
      logger.error("[BonusPage]", "Failed to override bedtime", err);
      throw err;
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
    const errorStatus = (error as { status?: number }).status;
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
        <Link href={`/home/family/${familyGroupId}`} className="btn btn-primary">
          ← Back to Family Group
        </Link>
      </div>
    );
  }

  if (!childUser.name || !effectiveAllowance) {
    return (
      <div className="p-8">
        <div className="alert alert-warning mb-4">
          <span>Unable to load screen time data.</span>
        </div>
        <Link href={`/home/family/${familyGroupId}`} className="btn btn-primary">
          ← Back to Family Group
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href={`/home/family/${familyGroupId}`}
          className="btn btn-ghost btn-sm mb-4"
        >
          ← Back to Family
        </Link>
        <h1 className="text-3xl font-bold">
          {childUser.name}
        </h1>
        <h1 className="text-2xl font-bold">
          Today's Screen Time
        </h1>
        <p className="text-lg text-base-content/70 mt-1">{dateDisplay}</p>
      </div>

      {/* Screen Time Card */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body p-4 md:p-8">
          <table className="table [&_td]:py-2 [&_td]:px-2 md:[&_td]:py-4 md:[&_td]:px-4">
            <tbody>
              {/* Allowance Row (moved to top, renamed from Total) */}
              <ExpandableRow
                label="Allowance"
                value={formatMinutesToDisplay(effectiveAllowance.effectiveAllowedMinutes)}
                rightContent={
                  <button
                    className="btn btn-xs btn-outline btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBonusDialogOpen(true);
                    }}
                  >
                    Bonus
                  </button>
                }
                expandedContent={
                  <AllowanceExpanded
                    baseAllowedMinutes={effectiveAllowance.baseAllowance.allowedMinutes}
                    bonusGrants={effectiveAllowance.allGrants?.filter(
                      (g): g is screenTimeGrant => g.status === "granted" && g.bonusMinutes !== null
                    ) ?? []}
                    totalMinutes={effectiveAllowance.effectiveAllowedMinutes}
                  />
                }
              />

              {/* Remaining Screen Time Row */}
              <ExpandableRow
                label="Remaining"
                value={formatRemainingMinutes(remainingMinutes)}
                className={remainingMinutes !== null && remainingMinutes <= 0 ? "text-error" : ""}
                expandedContent={
                  <RemainingExpanded
                    totalConsumedMinutes={totalConsumedMinutes}
                    remainingMinutes={remainingMinutes}
                    familyGroupId={familyGroupId}
                    childId={childId}
                    dateString={dateString}
                  />
                }
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* Downtime Section */}
      <div className="card bg-base-200 shadow-lg mt-6">
        <div className="card-body p-4 md:p-8">
          <h2 className="text-lg font-semibold mb-2">Downtime</h2>
          <table className="table [&_td]:py-2 [&_td]:px-2 md:[&_td]:py-4 md:[&_td]:px-4">
            <tbody>
              {/* Wake-up Time Row */}
              <ExpandableRow
                label="Wake-up"
                value={formatTimeForDisplay(effectiveAllowance.effectiveWakeUpTime)}
                hasExpansion={wakeupGrants.length > 0}
                rightContent={
                  <button
                    className="btn btn-xs btn-outline btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setWakeupDialogOpen(true);
                    }}
                  >
                    Change
                  </button>
                }
                expandedContent={
                  wakeupGrants.length > 0 ? (
                    <TimeGrantsTable grants={wakeupGrants} type="wakeup" />
                  ) : undefined
                }
              />

              {/* Bedtime Row */}
              <ExpandableRow
                label="Bedtime"
                value={formatTimeForDisplay(effectiveAllowance.effectiveBedTime)}
                hasExpansion={bedtimeGrants.length > 0}
                rightContent={
                  <button
                    className="btn btn-xs btn-outline btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBedtimeDialogOpen(true);
                    }}
                  >
                    Change
                  </button>
                }
                expandedContent={
                  bedtimeGrants.length > 0 ? (
                    <TimeGrantsTable grants={bedtimeGrants} type="bedtime" />
                  ) : undefined
                }
              />
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-2 mb-4 w-full flex flex-row justify-end">
        <Link href={`/home/family/${familyGroupId}/child/${childId}/screentime/allowances`} className="btn btn-ghost btn-secondary">
          Manage allowances
        </Link>
      </div>

      {/* Dialogs */}
      <BonusTimeDialog
        isOpen={bonusDialogOpen}
        onClose={() => setBonusDialogOpen(false)}
        onAdd={handleAddBonusTime}
        currentTotalMinutes={effectiveAllowance.effectiveAllowedMinutes}
        wakeUpTime={effectiveAllowance.effectiveWakeUpTime}
        bedTime={effectiveAllowance.effectiveBedTime}
      />

      <TimeOverrideDialog
        isOpen={wakeupDialogOpen}
        onClose={() => setWakeupDialogOpen(false)}
        onSave={handleOverrideWakeup}
        currentTime={effectiveAllowance.effectiveWakeUpTime}
        timeType="wakeup"
      />

      <TimeOverrideDialog
        isOpen={bedtimeDialogOpen}
        onClose={() => setBedtimeDialogOpen(false)}
        onSave={handleOverrideBedtime}
        currentTime={effectiveAllowance.effectiveBedTime}
        timeType="bedtime"
      />
    </div>
  );
}
