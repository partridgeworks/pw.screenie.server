"use client";

import { FamilyMemberStatus, FamilyPosition } from "@/lib/constants/familyConstants";
import FamilyCard from "./FamilyCard";

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

interface FamilyCardsProps {
  members: FamilyMemberWithInfo[];
  familyGroupId: string;
}

export default function FamilyCards({
  members,
  familyGroupId
}: FamilyCardsProps) {
  if (members.length === 0) {
    return (
      <div className="card bg-base-200 p-6">
        <p className="text-base-content/70">No family members yet.</p>
      </div>
    );
  }

  // Group members by position
  const children = members
    .filter((m) => m.position === "child")
    .sort((a, b) => a.name.localeCompare(b.name));
  
  const parents = members
    .filter((m) => m.position === "parent")
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-6">
      {children.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">Children</h2>
          {children.map((member) => (
            <FamilyCard
              key={member.userId}
              member={member}
              familyGroupId={familyGroupId}
            />
          ))}
        </div>
      )}
      
      {parents.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">Parents</h2>
          {parents.map((member) => (
            <FamilyCard
              key={member.userId}
              member={member}
              familyGroupId={familyGroupId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
