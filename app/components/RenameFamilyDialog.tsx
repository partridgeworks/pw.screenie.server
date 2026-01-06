"use client";

import { useState, useEffect } from "react";
import logger from "@/app/utils/clientLogger";

interface RenameFamilyDialogProps {
  familyGroupId: string;
  currentName: string;
  isOpen: boolean;
  onClose: () => void;
  onRenamed: () => void;
}

export default function RenameFamilyDialog({
  familyGroupId,
  currentName,
  isOpen,
  onClose,
  onRenamed
}: RenameFamilyDialogProps) {
  const [name, setName] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Reset name when dialog opens or currentName changes
  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setErrorMessage("");
    }
  }, [isOpen, currentName]);

  const handleClose = () => {
    setErrorMessage("");
    onClose();
  };

  const handleRename = async () => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setErrorMessage("Please enter a name for the family");
      return;
    }

    if (trimmedName === currentName) {
      handleClose();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/family/${familyGroupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to rename family");
      }

      logger.info("[RenameFamilyDialog]", `Family renamed to "${trimmedName}"`);
      onRenamed();
      handleClose();
    } catch (error) {
      const err = error as Error;
      logger.error("[RenameFamilyDialog]", "Failed to rename family", error);
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Rename Family</h3>

        {errorMessage && (
          <div className="alert alert-error mb-4">
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Enter a new name for the family:</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Family name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={25}
            disabled={isSubmitting}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isSubmitting) {
                handleRename();
              }
            }}
          />
          <label className="label">
            <span className="label-text-alt">{name.length}/25 characters</span>
          </label>
        </div>

        <div className="modal-action">
          <button
            className="btn btn-ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleRename}
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              "Rename"
            )}
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/50" onClick={handleClose}></div>
    </div>
  );
}
