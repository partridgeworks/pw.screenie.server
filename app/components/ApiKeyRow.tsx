"use client";

import { useState } from "react";
import { Role } from "@/lib/constants/roleConstants";
import logger from "@/app/utils/clientLogger";

interface ApiKeyInfo {
  _id: string;
  keyPrefix: string;
  keyRole: Role;
  name?: string;
  expiresOn?: string;
  CreationDate: string;
}

interface ApiKeyRowProps {
  apiKey: ApiKeyInfo;
  onRevoked: (keyId: string) => void;
}

export default function ApiKeyRow({ apiKey, onRevoked }: ApiKeyRowProps) {
  const [isRevoking, setIsRevoking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRevoke = async () => {
    setIsRevoking(true);

    try {
      const response = await fetch("/api/me/apikey", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ keyId: apiKey._id })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to revoke API key");
      }

      logger.info("[ApiKeyRow]", `Revoked API key: ${apiKey._id}`);
      onRevoked(apiKey._id);
    } catch (err) {
      const error = err as Error;
      logger.error("[ApiKeyRow]", `Failed to revoke API key: ${error.message}`);
      alert(`Failed to revoke API key: ${error.message}`);
    } finally {
      setIsRevoking(false);
      setShowConfirm(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getRoleBadgeClass = (role: Role) => {
    return role === "readWrite" ? "badge-primary" : "badge-secondary";
  };

  return (
    <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <code className="font-mono text-sm">{apiKey.keyPrefix}...</code>
          <span className={`badge badge-sm ${getRoleBadgeClass(apiKey.keyRole)}`}>
            {apiKey.keyRole === "readWrite" ? "Read & Write" : "Read Only"}
          </span>
        </div>
        <div className="text-sm text-base-content/60">
          {apiKey.name && <span className="mr-3">{apiKey.name}</span>}
          <span>Created: {formatDate(apiKey.CreationDate)}</span>
          {apiKey.expiresOn && (
            <span className="ml-3">Expires: {formatDate(apiKey.expiresOn)}</span>
          )}
        </div>
      </div>

      <div className="shrink-0 ml-4">
        {showConfirm ? (
          <div className="flex gap-2">
            <button
              className="btn btn-sm btn-error"
              onClick={handleRevoke}
              disabled={isRevoking}
            >
              {isRevoking ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                "Confirm"
              )}
            </button>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setShowConfirm(false)}
              disabled={isRevoking}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="btn btn-sm btn-outline btn-error"
            onClick={() => setShowConfirm(true)}
          >
            Revoke
          </button>
        )}
      </div>
    </div>
  );
}
