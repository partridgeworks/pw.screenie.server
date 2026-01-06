"use client";

import { useState, useEffect } from "react";

interface TimeOverrideDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newTime: string) => Promise<void>;
  currentTime: string | null;
  timeType: "wakeup" | "bedtime";
}

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export default function TimeOverrideDialog({
  isOpen,
  onClose,
  onSave,
  currentTime,
  timeType
}: TimeOverrideDialogProps) {
  const [newTime, setNewTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = timeType === "wakeup" ? "Change Wake-up Time" : "Change Bedtime";
  const label = timeType === "wakeup" ? "New wake-up time" : "New bedtime";

  // Reset when dialog opens
  useEffect(() => {
    if (isOpen) {
      setNewTime(currentTime || "");
      setError(null);
    }
  }, [isOpen, currentTime]);

  const handleSave = async () => {
    // Validate time format
    if (!TIME_REGEX.test(newTime)) {
      setError("Please enter a valid time in HH:MM format (e.g., 07:00 or 21:30)");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave(newTime);
      onClose();
    } catch (err) {
      setError("Failed to save. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">{title}</h3>

        <div className="space-y-4">
          {/* Current time display */}
          {currentTime && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-base-content/70">
                Current {timeType === "wakeup" ? "wake-up time" : "bedtime"}:
              </span>
              <span className="font-medium">{currentTime}</span>
            </div>
          )}

          {/* Time input */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">{label}</span>
            </label>
            <input
              type="time"
              className="input input-bordered w-full"
              value={newTime}
              onChange={(e) => {
                setNewTime(e.target.value);
                setError(null);
              }}
              disabled={isSubmitting}
            />
            <label className="label">
              <span className="label-text-alt text-base-content/70">
                Use 24-hour format (e.g., 07:00 for 7 AM, 21:00 for 9 PM)
              </span>
            </label>
          </div>

          {/* Error display */}
          {error && (
            <div className="alert alert-error text-sm">
              <span>{error}</span>
            </div>
          )}
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
            onClick={handleSave}
            disabled={!newTime || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Saving...
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
