"use client";

import { useUser } from "@/app/contexts/UserContext";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (user.applicationRole !== "admin") {
    return (
      <div className="container mx-auto p-6">
        <div className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-bold">Access Denied</h3>
            <div className="text-sm">
              You do not have permission to access the admin area.
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Link href="/home" className="btn btn-primary">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
