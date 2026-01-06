"use client";

import { FamilyMemberStatus, FamilyPosition } from "@/lib/constants/familyConstants";
import Avatar from "@/app/components/Avatar";

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

interface FamilyMemberRowProps {
  member: FamilyMemberWithInfo;
  onClick: () => void;
}

function getUserStatusBadgeClass(status: string): string {
  switch (status) {
    case "approved":
      return "badge-success";
    case "pending":
      return "badge-warning";
    case "invited":
      return "badge-info";
    case "suspended":
      return "badge-error";
    default:
      return "badge-ghost";
  }
}

export default function FamilyMemberRow({
  member,
  onClick
}: FamilyMemberRowProps) {
  return (
    <tr 
      className="hover cursor-pointer"
      onClick={onClick}
    >
      <td className="font-medium w-full">
        <div className="flex flex-row gap-3 items-center flex-wrap max-w-full">
          <div className="shrink-0">
            <Avatar name={member.name} avatarName={member.avatarName} size="medium" />
          </div>

          <span className="text-lg min-w-0 shrink">
            {member.name}
          </span>

          {member.userStatus !== "approved" && (
            <span className={`badge badge-sm badge-outline ${getUserStatusBadgeClass(member.userStatus)} shrink-0`}>
              {member.userStatus}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
