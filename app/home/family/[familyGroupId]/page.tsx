"use client";

import Link from "next/link";
import { useFamily } from "@/app/contexts/FamilyContext";
import FamilyCards from "@/app/components/FamilyCards";


export default function FamilyGroupPage() {
  const { familyGroup, members, isLoading, error, familyGroupId } = useFamily();

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
      <div className="mb-6 w-full flex flex-row justify-between items-center">
        <h1 className="text-3xl font-bold">{familyGroup.name}</h1>
        <Link href={`/home/family/${familyGroupId}/manage`} 
        className="btn btn-sm btn-outline btn-primary">
          Manage
        </Link>
      </div>

      <FamilyCards members={members} familyGroupId={familyGroupId} />
    </div>
  );
}
