"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { fetcher } from "@/app/utils/fetcher";
import clientLogger from "@/app/utils/clientLogger";
import { isStandaloneMode, isPushSupported, urlBase64ToUint8Array } from "@/app/utils/pwa";
import { setCookie, getCookie } from "@/app/utils/cookieStorage";

const PROMPT_DISMISSED_COOKIE = "notification-prompt-dismissed";
const DISMISS_DURATION_DAYS = 30;

interface EnableNotificationsPromptProps {
  onEnabled?: () => void;
  onDismissed?: () => void;
}

/**
 * EnableNotificationsPrompt - A prompt asking users to enable push notifications
 * This must be user-initiated (button tap) for iOS to show the permission dialog
 */
export default function EnableNotificationsPrompt({
  onEnabled,
  onDismissed
}: EnableNotificationsPromptProps) {
  const { isSignedIn } = useUser();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check if we should show the prompt
  useEffect(() => {
    // Don't show if not supported
    if (!isPushSupported()) {
      clientLogger.info("[EnableNotificationsPrompt]", "Push not supported");
      return;
    }

    // Don't show if not in standalone mode
    if (!isStandaloneMode()) {
      clientLogger.info("[EnableNotificationsPrompt]", "Not in standalone mode");
      return;
    }

    // Don't show if not signed in
    if (!isSignedIn) {
      clientLogger.info("[EnableNotificationsPrompt]", "Not signed in");
      return;
    }

    // Don't show if permission already granted or denied
    if (Notification.permission !== "default") {
      clientLogger.info("[EnableNotificationsPrompt]", `Permission already ${Notification.permission}`);
      return;
    }

    // Don't show if dismissed recently
    if (getCookie(PROMPT_DISMISSED_COOKIE)) {
      clientLogger.info("[EnableNotificationsPrompt]", "Prompt was dismissed recently");
      return;
    }

    // Get service worker registration
    navigator.serviceWorker.ready.then((registration) => {
      setSwRegistration(registration);
      
      // Check if already subscribed
      registration.pushManager.getSubscription().then((subscription) => {
        if (subscription) {
          clientLogger.info("[EnableNotificationsPrompt]", "Already subscribed");
          return;
        }
        
        // Show the prompt
        clientLogger.info("[EnableNotificationsPrompt]", "Showing notification prompt");
        setIsVisible(true);
      });
    });
  }, [isSignedIn]);

  // Handle enable button click - this is a user gesture so iOS will show the permission dialog
  const handleEnable = useCallback(async () => {
    if (!swRegistration) return;

    setIsLoading(true);
    try {
      // Request permission - this MUST be in response to a user gesture on iOS
      const permissionResult = await Notification.requestPermission();
      clientLogger.info("[EnableNotificationsPrompt]", `Permission result: ${permissionResult}`);

      if (permissionResult !== "granted") {
        // User denied, hide prompt and set cookie
        setCookie(PROMPT_DISMISSED_COOKIE, "denied", DISMISS_DURATION_DAYS);
        setIsVisible(false);
        onDismissed?.();
        return;
      }

      // Get VAPID public key
      const vapidResponse = await fetcher("/api/push/vapid-key") as { publicKey: string };
      if (!vapidResponse.publicKey) {
        throw new Error("VAPID key not available");
      }

      // Create subscription
      const applicationServerKey = urlBase64ToUint8Array(vapidResponse.publicKey);
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      // Send to server
      const subscriptionJson = subscription.toJSON();
      await fetcher("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: {
            endpoint: subscriptionJson.endpoint,
            keys: subscriptionJson.keys
          },
          deviceInfo: navigator.userAgent
        })
      });

      clientLogger.info("[EnableNotificationsPrompt]", "Successfully subscribed to push notifications");
      setIsVisible(false);
      onEnabled?.();
    } catch (error) {
      clientLogger.error("[EnableNotificationsPrompt]", `Failed to enable notifications: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [swRegistration, onEnabled, onDismissed]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setCookie(PROMPT_DISMISSED_COOKIE, "dismissed", DISMISS_DURATION_DAYS);
    setIsVisible(false);
    onDismissed?.();
  }, [onDismissed]);

  if (!isVisible) return null;

  return (
    <div className="card bg-gradient-to-br from-info/10 to-primary/10 border border-info/20 w-full">
      <div className="card-body p-4">
        <div className="flex items-start gap-4">
          {/* Bell Icon */}
          <div className="flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10 text-info"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="font-bold text-base mb-1">Enable Notifications</h3>
            <p className="text-sm text-base-content/70 mb-3">
              Get notified instantly when your child requests more screen time.
            </p>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleDismiss}
                disabled={isLoading}
              >
                Not now
              </button>
              <button
                className="btn btn-info btn-sm"
                onClick={handleEnable}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Enable"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
