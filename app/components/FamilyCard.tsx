"use client";

import Link from "next/link";
import { FamilyMemberStatus, FamilyPosition } from "@/lib/constants/familyConstants";
import { useScreenTimeStats } from "@/app/contexts/FamilyContext";
import { formatRemainingMinutes } from "@/lib/utils/dateTime";
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

interface FamilyCardProps {
  member: FamilyMemberWithInfo;
  familyGroupId: string;
}

function getPositionBadgeClass(position: FamilyPosition): string {
  return position === "parent" ? "badge-primary" : "badge-secondary";
}

function ChildScreenTimeDisplay({
  childId
}: {
  childId: string;
}) {
  const { remainingMinutes, isLoading, error } = useScreenTimeStats(childId);

  if (isLoading) {
    return <div className="skeleton h-6 w-32"></div>;
  }

  if (error) {
    return <span className="text-base-content/50">—</span>;
  }

  const displayText = formatRemainingMinutes(remainingMinutes);
  const isNone = remainingMinutes !== null && remainingMinutes <= 0;

  return (
    <div className={isNone ? "text-error" : "text-base-content/70"}>
      {displayText} remaining
    </div>
  );
}

export default function FamilyCard({
  member,
  familyGroupId
}: FamilyCardProps) {
  const isChild = member.position === "child";
  const cardContent = (
    <div className={`card bg-base-200 shadow-md transition-colors ${isChild ? "hover:bg-base-300" : ""}`}>
      <div className="card-body p-6">
        <div className="w-full flex gap-4 justify-between items-center">
          {/* Avatar */}
          <Avatar name={member.name} avatarName={member.avatarName} size="large" />

          {/* Content */}
          <div className="flex flex-col flex-1 gap-1">
            {/* Name and badge */}
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-semibold">{member.name}</h3>
              {/* <span className={`badge badge-outline ${getPositionBadgeClass(member.position)}`}>
                {member.position}
              </span> */}
            </div>

            {/* Today's screentime */}
            {member.position === "child" ? (
              <ChildScreenTimeDisplay
                childId={member.userId}
              />
            ) : (
              <div className="text-base-content/50">—</div>
            )}
          </div>

          {/* Chevron indicator */}
          {member.position === "child" && (
            <div className="ml-auto btn btn-primary btn-ghost pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (member.position === "child") {
    return (
      <Link href={`/home/family/${familyGroupId}/child/${member.userId}/screentime/on-date`}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
