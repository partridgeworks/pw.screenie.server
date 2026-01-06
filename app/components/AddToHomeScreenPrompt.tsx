"use client";

import { useState, useEffect } from "react";
import { isStandaloneMode, getMobilePlatform, isMobileDevice } from "@/app/utils/pwa";
import { setCookie, getCookie } from "@/app/utils/cookieStorage";

const DISMISS_COOKIE_NAME = "pwa-prompt-dismissed";
const DISMISS_DURATION_DAYS = 14;

interface AddToHomeScreenPromptProps {
  onDismiss?: () => void;
}

/**
 * Check if the prompt should be shown
 */
export function shouldShowAddToHomeScreenPrompt(): boolean {
  // Don't show if already installed as PWA
  if (isStandaloneMode()) return false;

  // Don't show on non-mobile devices
  if (!isMobileDevice()) return false;

  // Don't show if dismissed within the last N days
  const dismissed = getCookie(DISMISS_COOKIE_NAME);
  if (dismissed) return false;

  return true;
}

/**
 * AddToHomeScreenPrompt - A prompt encouraging users to install the PWA
 */
export default function AddToHomeScreenPrompt({ onDismiss }: AddToHomeScreenPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    setPlatform(getMobilePlatform());
    setIsVisible(shouldShowAddToHomeScreenPrompt());
  }, []);

  const handleDismiss = () => {
    setCookie(DISMISS_COOKIE_NAME, "true", DISMISS_DURATION_DAYS);
    setIsVisible(false);
    onDismiss?.();
  };

  const handleShowInstructions = () => {
    setShowInstructions(true);
  };

  const handleCloseInstructions = () => {
    setShowInstructions(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Main Prompt Card */}
      <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 w-full">
        <div className="card-body flex flex-col items-center text-center">
          {/* Icon */}
          <div className="mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-12 h-12 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-primary mb-2">Install Screenie</h3>

          {/* Description */}
          <p className="text-sm text-base-content/70 mb-4 max-w-xs">
            Add Screenie to your home screen to receive instant notifications when your child
            requests more screen time.
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button className="btn btn-ghost btn-sm" onClick={handleDismiss}>
              Not now
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleShowInstructions}>
              Show me how
            </button>
          </div>
        </div>
      </div>

      {/* Instructions Dialog */}
      {showInstructions && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Add to Home Screen</h3>

            {platform === "ios" && (
              <div className="space-y-4">
                <p className="text-base-content/70">To install Screenie on your iPhone or iPad:</p>
                <ol className="list-decimal list-inside space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="font-medium">1.</span>
                    <span>
                      Tap the{" "}
                      <strong className="inline-flex items-center gap-1">
                        Share
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4 inline"
                          viewBox="0 -960 960 960"
                          fill="currentColor"
                        >
                          <path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h120v80H240v400h480v-400H600v-80h120q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm200-240v-447l-64 64-56-57 160-160 160 160-56 57-64-64v447h-80Z" />
                        </svg>
                      </strong>{" "}
                      button at the bottom of Safari
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">2.</span>
                    <span>
                      Scroll down and tap{" "}
                      <strong>&quot;Add to Home Screen&quot;</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">3.</span>
                    <span>
                      Tap <strong>&quot;Add&quot;</strong> in the top right corner
                    </span>
                  </li>
                </ol>
                <div className="alert alert-info mt-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current shrink-0 w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span className="text-sm">
                    Make sure you&apos;re using Safari. Other browsers on iOS don&apos;t support
                    installing web apps.
                  </span>
                </div>
              </div>
            )}

            {platform === "android" && (
              <div className="space-y-4">
                <p className="text-base-content/70">To install Screenie on your Android device:</p>
                <ol className="list-decimal list-inside space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="font-medium">1.</span>
                    <span>
                      Tap the{" "}
                      <strong className="inline-flex items-center gap-1">
                        menu
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4 inline"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </strong>{" "}
                      button (three dots) in Chrome
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">2.</span>
                    <span>
                      Tap <strong>&quot;Add to Home screen&quot;</strong> or{" "}
                      <strong>&quot;Install app&quot;</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">3.</span>
                    <span>
                      Tap <strong>&quot;Add&quot;</strong> or <strong>&quot;Install&quot;</strong>
                    </span>
                  </li>
                </ol>
              </div>
            )}

            {platform === "other" && (
              <div className="space-y-4">
                <p className="text-base-content/70">
                  To install Screenie, look for an &quot;Install&quot; or &quot;Add to Home
                  Screen&quot; option in your browser&apos;s menu.
                </p>
                <p className="text-sm text-base-content/50">
                  This feature works best on mobile devices using Safari (iOS) or Chrome (Android).
                </p>
              </div>
            )}

            <div className="modal-action">
              <button className="btn btn-primary" onClick={handleCloseInstructions}>
                Got it
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={handleCloseInstructions}>close</button>
          </form>
        </dialog>
      )}
    </>
  );
}
