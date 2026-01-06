"use client";

import { useState } from "react";
import { useFamily } from "@/app/contexts/FamilyContext";
import FamilyList from "@/app/components/FamilyList";
import AddMemberDialog from "@/app/components/AddMemberDialog";
import RenameFamilyDialog from "@/app/components/RenameFamilyDialog";
import Link from "next/link";
import { FamilyPosition } from "@/lib/constants/familyConstants";


export default function FamilyGroupManagePage() {
  const { familyGroup, members, isLoading, error, familyGroupId, refreshFamily } = useFamily();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogPosition, setAddDialogPosition] = useState<FamilyPosition>("child");
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);

  const handleOpenAddDialog = (position: FamilyPosition) => {
    setAddDialogPosition(position);
    setAddDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="alert alert-error mb-4">
          <span>Failed to load family group. You may not have access.</span>
        </div>
      </div>
    );
  }

  if (!familyGroup) {
    return (
      <div className="p-8">
        <div className="alert alert-warning mb-4">
          <span>Family group not found.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link href={`/home/family/${familyGroupId}`} className="btn btn-ghost btn-sm mb-4">
        ← Back to family
      </Link>
      <h1 className="text-3xl font-bold mb-6">Edit family</h1>
      <div className="mb-6 flex items-center gap-2">
        <h2 className="text-2xl font-semibold">{familyGroup.name}</h2>
        <button
          className="btn btn-ghost btn-primary btn-sm"
          onClick={() => setRenameDialogOpen(true)}
        >
          Rename
        </button>
      </div>

      <FamilyList
        members={members}
        familyGroupId={familyGroupId}
        onMemberRemoved={() => refreshFamily()}
        onAvatarChanged={() => refreshFamily()}
      />

      <div className="mt-6 flex flex-col sm:flex-row gap-2">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <button
            className="btn btn-primary flex-1 sm:flex-none sm:w-1/2"
            onClick={() => handleOpenAddDialog("parent")}
          >
            Add Parent
          </button>
          <button
            className="btn btn-primary flex-1 sm:flex-none sm:w-1/2"
            onClick={() => handleOpenAddDialog("child")}
          >
            Add Child
          </button>
        </div>
        <Link href="/home/family/all" className="btn btn-primary btn-ghost">
          Add another family
        </Link>
      </div>

      {/* Add Member Dialog */}
      <AddMemberDialog
        familyGroupId={familyGroupId}
        position={addDialogPosition}
        isOpen={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onMemberAdded={() => refreshFamily()}
      />

      {/* Rename Family Dialog */}
      <RenameFamilyDialog
        familyGroupId={familyGroupId}
        currentName={familyGroup.name}
        isOpen={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
        onRenamed={() => refreshFamily()}
      />
    </div>
  );
}
