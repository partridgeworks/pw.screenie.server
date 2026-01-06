"use client";

import { useState } from "react";
import { useFamily } from "@/app/contexts/FamilyContext";
import { screenTimeGrant } from "@/lib/models/ScreenTimeGrant";
import logger from "@/app/utils/clientLogger";

interface PendingGrantsProps {
  grants: screenTimeGrant[];
}

function formatBonusMinutes(minutes: number): string {
  if (minutes === 0) return "0 minutes";
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  
  let formatted: string;
  if (hours === 0) {
    formatted = `${mins} minute${mins !== 1 ? "s" : ""}`;
  } else if (mins === 0) {
    formatted = `${hours} hour${hours !== 1 ? "s" : ""}`;
  } else {
    formatted = `${hours}h ${mins}m`;
  }
  
  return formatted;
}

export default function PendingGrants({ grants }: PendingGrantsProps) {
  const { getMemberById, respondToGrant, refreshGrants } = useFamily();
  const [optimisticallyHidden, setOptimisticallyHidden] = useState<Set<string>>(new Set());
  const [processingGrants, setProcessingGrants] = useState<Set<string>>(new Set());

  const visibleGrants = grants.filter(g => !optimisticallyHidden.has(g._id));

  const handleResponse = async (grantId: string, status: "granted" | "rejected") => {
    // Mark as processing
    setProcessingGrants(prev => new Set(prev).add(grantId));

    // Optimistically hide the grant
    setOptimisticallyHidden(prev => new Set(prev).add(grantId));

    try {
      await respondToGrant(grantId, status);
      // Refresh grants will update the list from server
      refreshGrants();
      logger.info("[PendingGrants]", `Grant ${grantId} ${status}`);
    } catch (err) {
      // On error, show the grant again
      setOptimisticallyHidden(prev => {
        const next = new Set(prev);
        next.delete(grantId);
        return next;
      });
      logger.error("[PendingGrants]", `Failed to ${status} grant ${grantId}`, err);
    } finally {
      setProcessingGrants(prev => {
        const next = new Set(prev);
        next.delete(grantId);
        return next;
      });
    }
  };

  if (visibleGrants.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-2 mb-4">
      {visibleGrants.map((grant) => {
        const child = getMemberById(grant.childUserId);
        const childName = child?.name || "Child";
        const isProcessing = processingGrants.has(grant._id);

        // Build the request description
        let requestDescription = "";
        if (grant.bonusMinutes !== null && grant.bonusMinutes !== 0) {
          requestDescription = `${formatBonusMinutes(grant.bonusMinutes)} more screen time`;
        } else if (grant.overrideWakeUpTime) {
          requestDescription = `wake-up time change to ${grant.overrideWakeUpTime}`;
        } else if (grant.overrideBedTime) {
          requestDescription = `bedtime change to ${grant.overrideBedTime}`;
        } else {
          requestDescription = "a screen time change";
        }

        return (
          <div
            key={grant._id}
            className="alert alert-info shadow-md border border-info/30 w-full"
          >
            <div className="flex flex-col md:flex-row w-full items-start md:items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="font-semibold">Screentime Request</span>
                <span>{childName} requested {requestDescription}</span>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => handleResponse(grant._id, "granted")}
                  disabled={isProcessing}
                  title="Accept"
                >
                  {isProcessing ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    "✓"
                  )}
                </button>
                <button
                  className="btn btn-sm btn-error"
                  onClick={() => handleResponse(grant._id, "rejected")}
                  disabled={isProcessing}
                  title="Reject"
                >
                  {isProcessing ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    "✕"
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
