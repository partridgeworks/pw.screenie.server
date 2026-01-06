"use client";

import { useState } from "react";

interface ApiExampleProps {
  title: string;
  description?: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  curlCode: string;
  nodeCode: string;
}

/**
 * An API call example component with DaisyUI radio-style tabs 
 * to switch between curl and Node.js code examples.
 */
export default function ApiExample({
  title,
  description,
  endpoint,
  method,
  curlCode,
  nodeCode,
}: ApiExampleProps) {
  const [activeTab, setActiveTab] = useState<"curl" | "node">("curl");

  const methodColors: Record<string, string> = {
    GET: "badge-success",
    POST: "badge-info",
    PUT: "badge-warning",
    PATCH: "badge-warning",
    DELETE: "badge-error",
  };

  return (
    <div className="card bg-base-100 shadow-md mb-6">
      <div className="card-body">
        <div className="flex flex-col gap-2 mb-3">
          <h4 className="card-title text-lg">{title}</h4>
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className={`badge ${methodColors[method]} badge-sm`}>
              {method}
            </span>
            <code className="text-base-content/80">{endpoint}</code>
          </div>
          {description && (
            <p className="text-base-content/70 text-sm">{description}</p>
          )}
        </div>

        {/* Radio-style tabs */}
        <div role="tablist" className="tabs tabs-boxed mb-4 w-fit">
          <button
            role="tab"
            className={`tab ${activeTab === "curl" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("curl")}
          >
            curl
          </button>
          <button
            role="tab"
            className={`tab ${activeTab === "node" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("node")}
          >
            Node.js
          </button>
        </div>

        {/* Code display */}
        <div className="relative">
          <div className="absolute top-0 right-0 px-3 py-1 text-xs text-neutral-content/60 bg-neutral-focus rounded-bl-lg rounded-tr-lg">
            {activeTab === "curl" ? "bash" : "javascript"}
          </div>
          <pre className="bg-neutral text-neutral-content p-4 rounded-lg overflow-x-auto font-mono text-sm leading-relaxed">
            <code>{activeTab === "curl" ? curlCode : nodeCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
