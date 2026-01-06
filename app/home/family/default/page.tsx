"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/app/utils/fetcher";
import { familyGroup } from "@/lib/models/FamilyGroup";

interface FamilyGroupsResponse {
  familyGroups: familyGroup[];
}

export default function DefaultFamilyPage() {
  const router = useRouter();
  const { data, error, isLoading } = useSWR<FamilyGroupsResponse>(
    "/api/family",
    fetcher
  );

  useEffect(() => {
    if (!isLoading && data) {
      if (data.familyGroups && data.familyGroups.length > 0) {
        // Navigate to the first family group
        router.push(`/home/family/${data.familyGroups[0]._id}`);
      } else {
        // Navigate to the all families page
        router.push("/home/family/all");
      }
    }
  }, [data, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-error">Error loading family groups</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="loading loading-spinner loading-lg"></div>
    </div>
  );
}
