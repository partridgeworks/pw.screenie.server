"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { fetcher } from "@/app/utils/fetcher";
import { familyGroup } from "@/lib/models/FamilyGroup";
import logger from "@/app/utils/clientLogger";

interface FamilyGroupsResponse {
  familyGroups: familyGroup[];
}

export default function AllFamilyPage() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<FamilyGroupsResponse>(
    "/api/family",
    fetcher
  );
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateFamilyGroup = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error("Failed to create family group");
      }

      const { familyGroup } = await response.json();
      
      // Refresh the list and navigate to the new family's manage page
      mutate();
      router.push(`/home/family/${familyGroup._id}/manage`);
    } catch (err) {
      logger.error("[FamilyPage]", "Failed to create family group", err);
    } finally {
      setIsCreating(false);
    }
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
        <div className="alert alert-error">
          <span>Failed to load family groups. Please try again.</span>
        </div>
      </div>
    );
  }

  const familyGroups = data?.familyGroups || [];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Your Family Groups</h1>

      {familyGroups.length === 0 ? (
        <div className="card bg-base-200 p-6 mb-6">
          <p className="text-base-content/70">
            You don&apos;t have any family groups yet. Create one to get started!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto mb-6">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Family Name</th>
                <th>Members</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {familyGroups.map((group) => (
                <tr key={group._id} className="hover cursor-pointer">
                  <td>
                    <Link
                      href={`/home/family/${group._id}`}
                      className="font-medium hover:text-primary"
                    >
                      {group.name}
                    </Link>
                  </td>
                  <td>{group.members.length}</td>
                  <td>
                    <Link
                      href={`/home/family/${group._id}`}
                      className="btn btn-sm btn-ghost"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleCreateFamilyGroup}
        disabled={isCreating}
      >
        {isCreating ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            Creating...
          </>
        ) : (
          "Create Family Group"
        )}
      </button>
    </div>
  );
}
