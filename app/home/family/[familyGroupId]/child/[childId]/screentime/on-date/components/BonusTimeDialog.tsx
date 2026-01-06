"use client";

import { useState, useEffect } from "react";

interface BonusTimeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (bonusMinutes: number) => Promise<void>;
  currentTotalMinutes: number | null;
  wakeUpTime: string | null;
  bedTime: string | null;
}

/**
 * Calculate max available minutes based on wake-up and bedtime
 */
function calculateMaxAvailableMinutes(wakeUpTime: string | null, bedTime: string | null): number {
  const wakeUpMinutes = wakeUpTime ? timeToMinutes(wakeUpTime) : 0;
  const bedTimeMinutes = bedTime ? timeToMinutes(bedTime) : 1440;
  
  if (bedTimeMinutes > wakeUpMinutes) {
    return bedTimeMinutes - wakeUpMinutes;
  }
  return (1440 - wakeUpMinutes) + bedTimeMinutes;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatMinutesToHHMM(minutes: number): string {
  const isNegative = minutes < 0;
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  const timeStr = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  return isNegative ? `-${timeStr}` : `+${timeStr}`;
}

function formatMinutesToDisplay(minutes: number | null): string {
  if (minutes === null) return "Unlimited";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export default function BonusTimeDialog({
  isOpen,
  onClose,
  onAdd,
  currentTotalMinutes,
  wakeUpTime,
  bedTime
}: BonusTimeDialogProps) {
  const [bonusMinutes, setBonusMinutes] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset bonus when dialog opens
  useEffect(() => {
    if (isOpen) {
      setBonusMinutes(0);
    }
  }, [isOpen]);

  const maxAvailable = calculateMaxAvailableMinutes(wakeUpTime, bedTime);
  
  // Calculate the maximum bonus allowed
  // Max is 180 minutes (3 hours) OR whatever gets total to max available
  let maxBonus = 180;
  if (currentTotalMinutes !== null) {
    const maxUntilFull = maxAvailable - currentTotalMinutes;
    maxBonus = Math.min(180, maxUntilFull);
  }

  // Min bonus (can subtract up to 180 or down to 0 total)
  let minBonus = -180;
  if (currentTotalMinutes !== null) {
    minBonus = Math.max(-180, -currentTotalMinutes);
  }

  const handleIncrement = () => {
    setBonusMinutes((prev) => Math.min(maxBonus, prev + 15));
  };

  const handleDecrement = () => {
    setBonusMinutes((prev) => Math.max(minBonus, prev - 15));
  };

  const newTotal = currentTotalMinutes !== null 
    ? Math.max(0, currentTotalMinutes + bonusMinutes)
    : null;

  const handleAdd = async () => {
    if (bonusMinutes === 0) return;
    
    setIsSubmitting(true);
    try {
      await onAdd(bonusMinutes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Add Bonus Time</h3>

        <div className="space-y-4">
          {/* Current total display */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-base-content/70">Current screen time:</span>
            <span className="font-medium">{formatMinutesToDisplay(currentTotalMinutes)}</span>
          </div>

          {/* Bonus time selector */}
          <div className="flex items-center justify-center gap-4 py-4">
            <button
              className="btn btn-circle btn-lg"
              onClick={handleDecrement}
              disabled={bonusMinutes <= minBonus || isSubmitting}
            >
              −
            </button>
            
            <div className="text-center min-w-24">
              <div className={`text-3xl font-bold ${bonusMinutes > 0 ? "text-success" : bonusMinutes < 0 ? "text-error" : ""}`}>
                {formatMinutesToHHMM(bonusMinutes)}
              </div>
              <div className="text-sm text-base-content/70">to add</div>
            </div>

            <button
              className="btn btn-circle btn-lg"
              onClick={handleIncrement}
              disabled={bonusMinutes >= maxBonus || isSubmitting}
            >
              +
            </button>
          </div>

          {/* New total display */}
          <div className="bg-base-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-base-content/70">New total screen time:</span>
              <span className="text-xl font-bold text-primary">
                {formatMinutesToDisplay(newTotal)}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-action">
          <button 
            className="btn" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAdd}
            disabled={bonusMinutes === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Adding...
              </>
            ) : (
              "Add"
            )}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
