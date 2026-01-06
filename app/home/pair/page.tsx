"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PAIRING_CODE_LENGTH, PAIRING_CODE_CHARS } from "@/lib/constants/pairingConstants";

export default function PairPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const isValidLength = code.length === PAIRING_CODE_LENGTH;

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow valid pairing code characters, convert to uppercase
    const value = e.target.value.toUpperCase();
    const filtered = value
      .split("")
      .filter((char) => PAIRING_CODE_CHARS.includes(char))
      .join("")
      .slice(0, PAIRING_CODE_LENGTH);
    setCode(filtered);
  }, []);

  const handleSubmit = useCallback(() => {
    if (isValidLength) {
      router.push(`/home/pair/${code}`);
    }
  }, [code, isValidLength, router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && isValidLength) {
        handleSubmit();
      }
    },
    [isValidLength, handleSubmit]
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Pair Your Device</h1>
          <p className="text-base-content/70">
            Enter the pairing code shown on your device
          </p>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center">
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text text-lg">Pairing Code</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                onKeyDown={handleKeyDown}
                maxLength={PAIRING_CODE_LENGTH}
                placeholder="XXXXXXXX"
                className="input input-bordered input-lg w-full text-center text-3xl font-mono tracking-widest uppercase"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck="false"
              />
              <label className="label">
                <span className="label-text-alt">
                  {code.length} / {PAIRING_CODE_LENGTH} characters
                </span>
              </label>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!isValidLength}
              className="btn btn-lg btn-primary w-full max-w-xs mt-4"
            >
              Pair Now
            </button>
          </div>
        </div>

        <div className="text-center mt-8 text-base-content/60 text-sm">
          <p>
            The pairing code is displayed on your device when you select the option to pair.
          </p>
        </div>
      </div>
    </div>
  );
}
