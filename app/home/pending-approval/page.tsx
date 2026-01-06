"use client";

import { useUser } from "@/app/contexts/UserContext";

export default function PendingApprovalPage() {
  const { user } = useUser();

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="card-title text-2xl">Account Pending Approval</h2>
          <p className="text-base-content/70 mt-2">
            Hi <span className="font-semibold">{user.name}</span>,
          </p>
          <p className="text-base-content/70">
            Your account has been created successfully, but it is currently awaiting approval from an administrator.
          </p>
          <p className="text-base-content/70 mt-4">
            You will be notified once your account has been approved and you can access the full application.
          </p>
          <div className="divider"></div>
          <p className="text-sm text-base-content/50">
            Signed in as: {user.email}
          </p>
        </div>
      </div>
    </div>
  );
}
