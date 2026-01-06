"use client";

import { useState } from "react";
import { FamilyMemberStatus, FamilyPosition } from "@/lib/constants/familyConstants";
import FamilyMemberRow from "@/app/components/FamilyMemberRow";
import EditFamilyMemberDialog from "@/app/components/EditFamilyMemberDialog";

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

interface FamilyListProps {
  members: FamilyMemberWithInfo[];
  familyGroupId: string;
  onMemberRemoved: () => void;
  onAvatarChanged?: () => void;
}

export default function FamilyList({
  members,
  familyGroupId,
  onMemberRemoved,
  onAvatarChanged
}: FamilyListProps) {
  const [selectedMember, setSelectedMember] = useState<FamilyMemberWithInfo | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleMemberClick = (member: FamilyMemberWithInfo) => {
    setSelectedMember(member);
    setIsEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setSelectedMember(null);
  };

  const handleMemberUpdated = () => {
    onAvatarChanged?.();
  };

  const handleMemberRemoved = () => {
    onMemberRemoved();
  };

  if (members.length === 0) {
    return (
      <div className="card bg-base-200 p-6">
        <p className="text-base-content/70">No family members yet.</p>
      </div>
    );
  }

  // Group members by position
  const parents = members.filter(m => m.position === "parent").sort((a, b) => a.name.localeCompare(b.name));
  const children = members.filter(m => m.position === "child").sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <div className="w-full max-w-full">
        {parents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Parents</h2>
            <div className="w-full">
              <table className="table w-full">
                <tbody>
                  {parents.map((member) => (
                    <FamilyMemberRow
                      key={member.userId}
                      member={member}
                      onClick={() => handleMemberClick(member)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {children.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Children</h2>
            <div className="w-full">
              <table className="table w-full">
                <tbody>
                  {children.map((member) => (
                    <FamilyMemberRow
                      key={member.userId}
                      member={member}
                      onClick={() => handleMemberClick(member)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Family Member Dialog */}
      <EditFamilyMemberDialog
        member={selectedMember}
        familyGroupId={familyGroupId}
        isOpen={isEditDialogOpen}
        onClose={handleEditDialogClose}
        onMemberUpdated={handleMemberUpdated}
        onMemberRemoved={handleMemberRemoved}
      />
    </>
  );
}
