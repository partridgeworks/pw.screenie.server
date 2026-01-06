"use client";

import { useState } from "react";
import { Role, ROLES } from "@/lib/constants/roleConstants";
import logger from "@/app/utils/clientLogger";

interface CreateApiKeyFormProps {
  onCreated: (apiKey: string, keyRole: Role, name?: string) => void;
  onCancel: () => void;
}

export default function CreateApiKeyForm({ onCreated, onCancel }: CreateApiKeyFormProps) {
  const [keyRole, setKeyRole] = useState<Role>("readOnly");
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/me/apikey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          keyRole,
          name: name.trim() || undefined
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create API key");
      }

      const data = await response.json();
      logger.info("[CreateApiKeyForm]", `Created API key with role: ${keyRole}`);
      onCreated(data.apiKey, keyRole, name.trim() || undefined);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      logger.error("[CreateApiKeyForm]", `Failed to create API key: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Create New API Key</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Permission Level</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={keyRole}
              onChange={(e) => setKeyRole(e.target.value as Role)}
              disabled={isCreating}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role === "readWrite" ? "Read & Write" : "Read Only"}
                </option>
              ))}
            </select>
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                {keyRole === "readWrite"
                  ? "Can read and modify data"
                  : "Can only read data, cannot make changes"}
              </span>
            </label>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Notes (optional)</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="e.g., Key for John"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isCreating}
              maxLength={100}
            />
          </div>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <div className="card-actions justify-end pt-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onCancel}
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
