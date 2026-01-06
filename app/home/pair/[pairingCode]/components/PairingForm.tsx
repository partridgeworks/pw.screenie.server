"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetcher } from "@/app/utils/fetcher";
import logger from "@/app/utils/clientLogger";

interface PairingFormProps {
  pairingCode: string;
  deviceName: string;
}

export default function PairingForm({ pairingCode, deviceName }: PairingFormProps) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const searchParams = useSearchParams();

  // Get device name from query params, fallback to prop, then fallback to "device"
  const displayDeviceName = searchParams.get("deviceName") || deviceName || "device";

  const linkPairingCode = useCallback(async () => {
    try {
      const response = await fetcher("/api/pairing/link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code: pairingCode })
      });

      if (response.message === "Pairing code linked successfully") {
        setStatus("success");
        logger.info("[Pairing]", `Successfully linked pairing code: ${pairingCode}`);
      } else {
        throw new Error(response.message || "Failed to link pairing code");
      }
    } catch (error) {
      const err = error as Error;
      logger.error("[Pairing]", `Failed to link pairing code: ${err.message}`);
      setStatus("error");
      setErrorMessage(err.message || "Failed to link pairing code. Please try again.");
    }
  }, [pairingCode]);

  useEffect(() => {
    linkPairingCode();
  }, [linkPairingCode]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="loading loading-spinner loading-lg mb-4"></div>
        <p className="text-lg">Linking your device...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] max-w-md mx-auto">
        <div className="text-6xl mb-6">❌</div>
        <h1 className="text-2xl font-bold mb-4 text-error">Pairing Failed</h1>
        <p className="text-center mb-6">{errorMessage}</p>
        <div className="flex gap-4">
          <button onClick={() => { setStatus("loading"); linkPairingCode(); }} className="btn btn-primary">
            Try Again
          </button>
          <Link href="/home" className="btn btn-ghost">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] max-w-md mx-auto">
      <div className="text-6xl mb-6">✅</div>
      <h1 className="text-3xl font-bold mb-4">All Done!</h1>
      <p className="text-center text-lg mb-2">
        Your <span className="font-semibold">{displayDeviceName}</span> is now paired with your account.
      </p>
      <p className="text-center text-base-content/70 mb-8">
        You can return to your device and refresh if necessary. The device should automatically detect the pairing.
      </p>
      <Link href="/home" className="btn btn-primary">
        Go to Home
      </Link>
    </div>
  );
}
