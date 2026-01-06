"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { fetcher } from "@/app/utils/fetcher";
import clientLogger from "@/app/utils/clientLogger";
import { isStandaloneMode, isPushSupported, urlBase64ToUint8Array } from "@/app/utils/pwa";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

/**
 * NotificationSettings component for managing push notification preferences
 */
export default function NotificationSettings() {
  const { isSignedIn } = useUser();
  const [permission, setPermission] = useState<PermissionState>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check current state on mount
  useEffect(() => {
    if (!isPushSupported()) {
      setPermission("unsupported");
      return;
    }

    setIsStandalone(isStandaloneMode());
    setPermission(Notification.permission as PermissionState);

    // Get service worker registration
    navigator.serviceWorker.ready.then((registration) => {
      setSwRegistration(registration);
      
      // Check if already subscribed
      registration.pushManager.getSubscription().then((subscription) => {
        setIsSubscribed(!!subscription);
      });
    });

    // Listen for permission changes (some browsers support this)
    const checkPermission = () => {
      setPermission(Notification.permission as PermissionState);
    };
    
    // Poll for permission changes (since permissionchange event isn't widely supported)
    const intervalId = setInterval(checkPermission, 2000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Subscribe to push notifications
  const handleSubscribe = useCallback(async () => {
    if (!swRegistration || !isSignedIn) return;

    setIsLoading(true);
    try {
      // Get VAPID public key
      const vapidResponse = await fetcher("/api/push/vapid-key") as { publicKey: string };
      if (!vapidResponse.publicKey) {
        throw new Error("VAPID key not available");
      }

      // Request permission if not granted
      if (Notification.permission === "default") {
        const result = await Notification.requestPermission();
        setPermission(result as PermissionState);
        if (result !== "granted") {
          return;
        }
      } else if (Notification.permission === "denied") {
        setPermission("denied");
        return;
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

      setIsSubscribed(true);
      clientLogger.info("[NotificationSettings]", "Successfully subscribed to push notifications");
    } catch (error) {
      clientLogger.error("[NotificationSettings]", `Failed to subscribe: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [swRegistration, isSignedIn]);

  // Unsubscribe from push notifications
  const handleUnsubscribe = useCallback(async () => {
    if (!swRegistration) return;

    setIsLoading(true);
    try {
      const subscription = await swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        
        await fetcher("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });

        setIsSubscribed(false);
        clientLogger.info("[NotificationSettings]", "Unsubscribed from push notifications");
      }
    } catch (error) {
      clientLogger.error("[NotificationSettings]", `Failed to unsubscribe: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [swRegistration]);

  // Render status badge
  const renderStatusBadge = () => {
    if (permission === "unsupported") {
      return <span className="badge badge-error">Not Supported</span>;
    }
    if (permission === "denied") {
      return <span className="badge badge-warning">Blocked</span>;
    }
    if (isSubscribed) {
      return <span className="badge badge-success">Enabled</span>;
    }
    return <span className="badge badge-ghost">Disabled</span>;
  };

  // Render content based on state
  const renderContent = () => {
    if (permission === "unsupported") {
      return (
        <div className="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Push notifications are not supported on this device or browser.</span>
        </div>
      );
    }

    if (!isStandalone) {
      return (
        <div className="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <p className="font-semibold">Install the app for notifications</p>
            <p className="text-sm">Add Screenie to your home screen to receive push notifications when your child requests more screen time.</p>
          </div>
        </div>
      );
    }

    if (permission === "denied") {
      return (
        <div className="space-y-4">
          <div className="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Notifications are blocked. You&apos;ll need to enable them in your device settings.</span>
          </div>
          
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-base">How to re-enable notifications:</h3>
              <div className="space-y-2 text-sm">
                <p><strong>On iOS:</strong></p>
                <ol className="list-decimal list-inside ml-2 space-y-1">
                  <li>Open <strong>Settings</strong></li>
                  <li>Scroll down and tap <strong>Screenie</strong></li>
                  <li>Tap <strong>Notifications</strong></li>
                  <li>Toggle <strong>Allow Notifications</strong> on</li>
                </ol>
                <p className="mt-3"><strong>On Android:</strong></p>
                <ol className="list-decimal list-inside ml-2 space-y-1">
                  <li>Open <strong>Settings</strong> → <strong>Apps</strong></li>
                  <li>Find and tap <strong>Screenie</strong></li>
                  <li>Tap <strong>Notifications</strong></li>
                  <li>Toggle notifications on</li>
                </ol>
              </div>
              <div className="card-actions justify-end mt-4">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSubscribe}
                  disabled={isLoading}
                >
                  {isLoading ? <span className="loading loading-spinner loading-sm"></span> : "Try Again"}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isSubscribed) {
      return (
        <div className="space-y-4">
          <div className="alert alert-success">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>You&apos;ll receive notifications when a child requests more screen time.</span>
          </div>
          <button
            className="btn btn-outline btn-error btn-sm"
            onClick={handleUnsubscribe}
            disabled={isLoading}
          >
            {isLoading ? <span className="loading loading-spinner loading-sm"></span> : "Disable Notifications"}
          </button>
        </div>
      );
    }

    // Default: not subscribed, permission is "default" or "granted"
    return (
      <div className="space-y-4">
        <p className="text-base-content/70">
          Enable notifications to be alerted when your child requests more screen time.
        </p>
        <button
          className="btn btn-primary"
          onClick={handleSubscribe}
          disabled={isLoading}
        >
          {isLoading ? <span className="loading loading-spinner loading-sm"></span> : "Enable Notifications"}
        </button>
      </div>
    );
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Push Notifications
          </h2>
          {renderStatusBadge()}
        </div>
        {renderContent()}
      </div>
    </div>
  );
}
