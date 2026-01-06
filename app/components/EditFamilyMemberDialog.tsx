"use client";

import { useState, useEffect } from "react";
import { FamilyMemberStatus, FamilyPosition } from "@/lib/constants/familyConstants";
import Avatar from "@/app/components/Avatar";
import AvatarChooser from "@/app/components/AvatarChooser";
import logger from "@/app/utils/clientLogger";

interface FamilyMemberWithInfo {
  userId: string;
  position: FamilyPosition;
  status: FamilyMemberStatus;
  addedAt: Date;
  name: string;
  email: string;
  userStatus: string;
  avatarName?: string;
}

interface EditFamilyMemberDialogProps {
  member: FamilyMemberWithInfo | null;
  familyGroupId: string;
  isOpen: boolean;
  onClose: () => void;
  onMemberUpdated: () => void;
  onMemberRemoved: () => void;
}

export default function EditFamilyMemberDialog({
  member,
  familyGroupId,
  isOpen,
  onClose,
  onMemberUpdated,
  onMemberRemoved
}: EditFamilyMemberDialogProps) {
  const [name, setName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [currentAvatarName, setCurrentAvatarName] = useState<string | undefined>(undefined);
  const [isAvatarChooserOpen, setIsAvatarChooserOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Reset state when member changes or dialog opens
  useEffect(() => {
    if (isOpen && member) {
      setName(member.name);
      setOriginalName(member.name);
      setCurrentAvatarName(member.avatarName);
      setErrorMessage("");
      setShowDeleteConfirm(false);
    }
  }, [isOpen, member]);

  const hasNameChanged = name.trim() !== originalName;

  const handleClose = () => {
    setErrorMessage("");
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleRevert = () => {
    setName(originalName);
    setErrorMessage("");
  };

  const handleRename = async () => {
    if (!member) return;
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("Please enter a name");
      return;
    }

    if (trimmedName === originalName) {
      return;
    }

    setIsRenaming(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/user/${member.userId}/name`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to rename member");
      }

      logger.info("[EditFamilyMemberDialog]", `Renamed member to "${trimmedName}"`);
      setOriginalName(trimmedName);
      onMemberUpdated();
    } catch (error) {
      const err = error as Error;
      logger.error("[EditFamilyMemberDialog]", "Failed to rename member", error);
      setErrorMessage(err.message);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleAvatarSave = async (avatarName: string | null) => {
    if (!member) return;

    try {
      const response = await fetch(`/api/user/${member.userId}/avatar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarName })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update avatar");
      }

      setCurrentAvatarName(avatarName ?? undefined);
      setIsAvatarChooserOpen(false);
      onMemberUpdated();
    } catch (error) {
      logger.error("[EditFamilyMemberDialog]", "Failed to update avatar", error);
    }
  };

  const handleDeleteMember = async () => {
    if (!member) return;

    setIsRemoving(true);
    try {
      const response = await fetch(
        `/api/family/${familyGroupId}/member/${member.userId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to remove member");
      }

      logger.info("[EditFamilyMemberDialog]", `Removed member ${member.userId}`);
      onMemberRemoved();
      handleClose();
    } catch (error) {
      const err = error as Error;
      logger.error("[EditFamilyMemberDialog]", "Failed to remove member", error);
      setErrorMessage(err.message);
    } finally {
      setIsRemoving(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen || !member) return null;

  return (
    <>
      <div className="modal modal-open">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">{originalName}</h3>

          {errorMessage && (
            <div className="alert alert-error mb-4">
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Member Name */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Member Name</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isRenaming || isRemoving}
            />
            <div className="flex gap-2 mt-2">
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleRevert}
                disabled={!hasNameChanged || isRenaming || isRemoving}
              >
                Revert
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleRename}
                disabled={!hasNameChanged || isRenaming || isRemoving}
              >
                {isRenaming ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Renaming...
                  </>
                ) : (
                  "Rename"
                )}
              </button>
            </div>
          </div>

          {/* Avatar */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Avatar</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAvatarChooserOpen(true)}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                disabled={isRemoving}
              >
                <Avatar name={member.name} avatarName={currentAvatarName} size="large" />
              </button>
              <span className="text-sm text-base-content/70">
                Click to change avatar
              </span>
            </div>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm ? (
            <div className="alert alert-warning mb-4">
              <div className="flex flex-col gap-2 w-full">
                <span>Are you sure you want to remove this member from the family?</span>
                <div className="flex gap-2 justify-end">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isRemoving}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-error btn-sm"
                    onClick={handleDeleteMember}
                    disabled={isRemoving}
                  >
                    {isRemoving ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Removing...
                      </>
                    ) : (
                      "Yes, Remove"
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="modal-action">
            <button
              className="btn btn-error btn-outline"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isRenaming || isRemoving || showDeleteConfirm}
            >
              Delete User
            </button>
            <button
              className="btn btn-primary"
              onClick={handleClose}
              disabled={isRenaming || isRemoving}
            >
              OK
            </button>
          </div>
        </div>
        <div className="modal-backdrop" onClick={handleClose}></div>
      </div>

      {/* Avatar Chooser Dialog */}
      <AvatarChooser
        isOpen={isAvatarChooserOpen}
        currentAvatar={currentAvatarName}
        onSave={handleAvatarSave}
        onCancel={() => setIsAvatarChooserOpen(false)}
      />
    </>
  );
}
