"use client";

import { use } from "react";
import { FamilyProvider, useFamily } from "@/app/contexts/FamilyContext";
import PendingGrants from "@/app/components/PendingGrants";

function FamilyGroupContent({ children }: { children: React.ReactNode }) {
  const { getPendingGrantRequests, grantsLoading } = useFamily();
  const pendingGrants = getPendingGrantRequests();

  return (
    <div className="flex flex-col w-full">
      {!grantsLoading && pendingGrants.length > 0 && (
        <div className="p-4 pb-0">
          <PendingGrants grants={pendingGrants} />
        </div>
      )}
      {children}
    </div>
  );
}

export default function FamilyGroupLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ familyGroupId: string }>;
}) {
  const resolvedParams = use(params);
  const { familyGroupId } = resolvedParams;

  return (
    <FamilyProvider familyGroupId={familyGroupId}>
      <FamilyGroupContent>{children}</FamilyGroupContent>
    </FamilyProvider>
  );
}
