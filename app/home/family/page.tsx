"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FamilyPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/home/family/default");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="loading loading-spinner loading-lg"></div>
    </div>
  );
}
