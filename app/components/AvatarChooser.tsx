"use client";

import { useState } from "react";
import Image from "next/image";
import { AVAILABLE_AVATARS } from "@/lib/constants/avatarConstants";

interface AvatarChooserProps {
  currentAvatar?: string;
  onSave: (avatarName: string | null) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export default function AvatarChooser({
  currentAvatar,
  onSave,
  onCancel,
  isOpen
}: AvatarChooserProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatar ?? null);

  const handleSave = () => {
    onSave(selectedAvatar);
  };

  const handleCancel = () => {
    setSelectedAvatar(currentAvatar ?? null);
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-lg">
        <h3 className="font-bold text-lg mb-4">Choose an Avatar</h3>

        <div className="grid grid-cols-5 gap-3">
          {AVAILABLE_AVATARS.map((avatar) => (
            <button
              key={avatar}
              type="button"
              onClick={() => setSelectedAvatar(avatar)}
              className={`avatar cursor-pointer transition-all ${
                selectedAvatar === avatar
                  ? "ring-4 ring-primary ring-offset-2 ring-offset-base-100 rounded-full"
                  : "hover:ring-2 hover:ring-base-300 rounded-full"
              }`}
            >
              <div className="w-12 h-12 rounded-full">
                <Image
                  src={`/avatars/${avatar}`}
                  alt={avatar}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              </div>
            </button>
          ))}

          {/* Clear selection option */}
          <button
            type="button"
            onClick={() => setSelectedAvatar(null)}
            className={`avatar cursor-pointer transition-all ${
              selectedAvatar === null
                ? "ring-4 ring-primary ring-offset-2 ring-offset-base-100 rounded-full"
                : "hover:ring-2 hover:ring-base-300 rounded-full"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </button>
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={handleCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={handleCancel}>
          close
        </button>
      </form>
    </dialog>
  );
}
