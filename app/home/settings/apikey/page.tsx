"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/app/contexts/UserContext";
import CreateApiKeyForm from "@/app/components/CreateApiKeyForm";
import ApiKeyRow from "@/app/components/ApiKeyRow";
import { Role } from "@/lib/constants/roleConstants";
import logger from "@/app/utils/clientLogger";

interface ApiKeyInfo {
  _id: string;
  keyPrefix: string;
  keyRole: Role;
  keyType: string;
  name?: string;
  expiresOn?: string;
  CreationDate: string;
}

export default function AdminApiKeyPage() {
  const { user } = useUser();
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchApiKeys = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/me/apikey");
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to fetch API keys");
      }

      const data = await response.json();
      setApiKeys(data.apiKeys);
      logger.info("[AdminApiKey]", `Fetched ${data.apiKeys.length} API keys`);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      logger.error("[AdminApiKey]", `Failed to fetch API keys: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleKeyCreated = (apiKey: string, _keyRole: Role, _name?: string) => {
    setNewlyCreatedKey(apiKey);
    setShowCreateForm(false);
    fetchApiKeys(); // Refresh the list
  };

  const handleKeyRevoked = (keyId: string) => {
    setApiKeys((prev) => prev.filter((key) => key._id !== keyId));
  };

  const handleCopyToClipboard = async () => {
    if (newlyCreatedKey) {
      await navigator.clipboard.writeText(newlyCreatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const dismissNewKey = () => {
    setNewlyCreatedKey(null);
    setCopied(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">API Key Management</h1>

      <p className="text-base-content/70 mb-6">
        Manage API keys for user <span className="font-semibold">{user.email}</span>.
        API keys allow programmatic access to your account.
      </p>

      {/* Newly Created Key Display */}
      {newlyCreatedKey && (
        <div className="card bg-warning/10 border border-warning shadow-xl mb-6">
          <div className="card-body">
            <div className="flex items-start gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-warning shrink-0 h-6 w-6 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-warning mb-2">
                  New API Key Created
                </h3>
                <p className="text-sm text-base-content/70 mb-3">
                  Store this API key securely. It will not be displayed again after you
                  dismiss this message.
                </p>
                <div className="join w-full mb-3">
                  <input
                    type="text"
                    value={newlyCreatedKey}
                    readOnly
                    className="input input-bordered join-item flex-1 font-mono text-sm"
                  />
                  <button
                    className="btn btn-secondary join-item"
                    onClick={handleCopyToClipboard}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="p-3 bg-base-300 rounded-lg mb-3">
                  <p className="text-sm text-base-content/70 mb-1">
                    Include this key in your API requests using the header:
                  </p>
                  <code className="block bg-base-100 p-2 rounded text-sm font-mono">
                    X-API-Key: {newlyCreatedKey}
                  </code>
                </div>
                <button className="btn btn-sm btn-ghost" onClick={dismissNewKey}>
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current API Keys List */}
      <div className="card bg-base-200 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title mb-4">Current API Keys</h2>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : error ? (
            <div className="alert alert-error">
              <span>{error}</span>
              <button className="btn btn-sm btn-ghost" onClick={fetchApiKeys}>
                Retry
              </button>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8 text-base-content/60">
              <p>No API keys found.</p>
              <p className="text-sm mt-1">Create one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <ApiKeyRow
                  key={key._id}
                  apiKey={key}
                  onRevoked={handleKeyRevoked}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create New Key Section */}
      {showCreateForm ? (
        <CreateApiKeyForm
          onCreated={handleKeyCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      ) : (
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          Add API Key
        </button>
      )}
    </div>
  );
}
