"use client";

import { useState, useEffect } from "react";
import { FamilyPosition } from "@/lib/constants/familyConstants";
import { AVAILABLE_AVATARS } from "@/lib/constants/avatarConstants";
import logger from "@/app/utils/clientLogger";
import Avatar from "@/app/components/Avatar";
import AvatarChooser from "@/app/components/AvatarChooser";

/**
 * Get a random avatar from the available avatars
 */
function getRandomAvatar(): string {
  const randomIndex = Math.floor(Math.random() * AVAILABLE_AVATARS.length);
  return AVAILABLE_AVATARS[randomIndex];
}

interface AddMemberDialogProps {
  familyGroupId: string;
  position: FamilyPosition;
  onMemberAdded: () => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function AddMemberDialog({
  familyGroupId,
  position,
  onMemberAdded,
  onClose,
  isOpen
}: AddMemberDialogProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [avatarName, setAvatarName] = useState<string>(getRandomAvatar());
  const [isAvatarChooserOpen, setIsAvatarChooserOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isParent = position === "parent";
  const positionLabel = isParent ? "Parent" : "Child";

  // Reset dialog when it opens
  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setName("");
      setAvatarName(getRandomAvatar());
      setErrorMessage("");
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  // Check if the form is valid for submission
  const isFormValid = () => {
    if (!name.trim()) return false;
    if (isParent && !email.trim()) return false;
    return true;
  };

  const handleAddMember = async () => {
    if (!name.trim()) {
      setErrorMessage("Please enter a name");
      return;
    }

    if (isParent && !email.trim()) {
      setErrorMessage("Please enter an email address");
      return;
    }

    setIsAdding(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/family/${familyGroupId}/member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: isParent ? email.trim() : undefined,
          position,
          avatarName
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to add member");
      }

      onMemberAdded();
      handleClose();
    } catch (error) {
      const err = error as Error;
      logger.error("[AddMemberDialog]", "Failed to add member", error);
      setErrorMessage(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal modal-open">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Add {positionLabel}</h3>

          {/* Name field - first */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Name *</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder={`Enter ${positionLabel.toLowerCase()}'s name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isAdding}
            />
          </div>

          {/* Avatar selection - second */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Choose Avatar</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAvatarChooserOpen(true)}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                disabled={isAdding}
              >
                <Avatar name={name || "New Member"} avatarName={avatarName} size="large" />
              </button>
              <span className="text-sm text-base-content/70">
                Click to change avatar
              </span>
            </div>
          </div>

          {/* Email field - only for parents */}
          {isParent && (
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Email Address *</span>
              </label>
              <input
                type="email"
                className="input input-bordered w-full"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isAdding}
              />
            </div>
          )}

          {errorMessage && (
            <div className="alert alert-error mb-4">
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="modal-action">
            <button
              className="btn btn-ghost"
              onClick={handleClose}
              disabled={isAdding}
            >
              Cancel
            </button>

            <button
              className="btn btn-primary"
              onClick={handleAddMember}
              disabled={isAdding || !isFormValid()}
            >
              {isAdding ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Adding...
                </>
              ) : (
                `Add ${positionLabel}`
              )}
            </button>
          </div>
        </div>
        <div className="modal-backdrop" onClick={handleClose}></div>
      </div>

      {/* Avatar Chooser Dialog */}
      <AvatarChooser
        isOpen={isAvatarChooserOpen}
        currentAvatar={avatarName}
        onSave={(newAvatarName) => {
          if (newAvatarName) {
            setAvatarName(newAvatarName);
          }
          setIsAvatarChooserOpen(false);
        }}
        onCancel={() => setIsAvatarChooserOpen(false)}
      />
    </>
  );
}
