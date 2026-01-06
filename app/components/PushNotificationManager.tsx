"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { fetcher } from "@/app/utils/fetcher";
import clientLogger from "@/app/utils/clientLogger";
import { isStandaloneMode, isPushSupported, urlBase64ToUint8Array } from "@/app/utils/pwa";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

interface PushNotificationManagerProps {
  onPermissionChange?: (permission: PermissionState) => void;
}

/**
 * PushNotificationManager handles service worker registration and push subscription
 * Renders nothing visible - just manages push notification subscription lifecycle
 */
export default function PushNotificationManager({ onPermissionChange }: PushNotificationManagerProps) {
  const { isSignedIn, user } = useUser();
  const [permission, setPermission] = useState<PermissionState>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Update permission state
  const updatePermission = useCallback((newPermission: PermissionState) => {
    setPermission(newPermission);
    onPermissionChange?.(newPermission);
  }, [onPermissionChange]);

  // Register service worker
  useEffect(() => {
    if (!isPushSupported()) {
      updatePermission("unsupported");
      return;
    }

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        clientLogger.info("[PushNotificationManager]", "Service worker registered");
        setSwRegistration(registration);
        
        // Check current permission
        updatePermission(Notification.permission as PermissionState);
        
        // Check if already subscribed
        return registration.pushManager.getSubscription();
      })
      .then((subscription) => {
        if (subscription) {
          clientLogger.info("[PushNotificationManager]", "Already subscribed to push");
          setIsSubscribed(true);
        }
      })
      .catch((error) => {
        clientLogger.error("[PushNotificationManager]", `Service worker registration failed: ${error}`);
      });
  }, [updatePermission]);

  // Subscribe to push when user is signed in and in standalone mode
  const subscribeToPush = useCallback(async () => {
    if (!swRegistration || !isSignedIn || !user) {
      return;
    }

    // Only auto-subscribe in standalone mode
    if (!isStandaloneMode()) {
      clientLogger.info("[PushNotificationManager]", "Not in standalone mode, skipping auto-subscribe");
      return;
    }

    try {
      // Get VAPID public key from server
      const vapidResponse = await fetcher("/api/push/vapid-key") as { publicKey: string };
      if (!vapidResponse.publicKey) {
        clientLogger.warn("[PushNotificationManager]", "VAPID key not available");
        return;
      }

      // Check/request permission
      if (Notification.permission === "default") {
        const result = await Notification.requestPermission();
        updatePermission(result as PermissionState);
        if (result !== "granted") {
          clientLogger.info("[PushNotificationManager]", "Notification permission denied");
          return;
        }
      } else if (Notification.permission === "denied") {
        updatePermission("denied");
        return;
      }

      // Check if already subscribed
      let subscription = await swRegistration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        const applicationServerKey = urlBase64ToUint8Array(vapidResponse.publicKey);
        subscription = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });
        clientLogger.info("[PushNotificationManager]", "Created new push subscription");
      }

      // Send subscription to server
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
      clientLogger.info("[PushNotificationManager]", "Successfully subscribed to push notifications");
    } catch (error) {
      clientLogger.error("[PushNotificationManager]", `Failed to subscribe: ${error}`);
    }
  }, [swRegistration, isSignedIn, user, updatePermission]);

  // Unsubscribe from push
  const unsubscribeFromPush = useCallback(async () => {
    if (!swRegistration) return;

    try {
      const subscription = await swRegistration.pushManager.getSubscription();
      if (subscription) {
        // Unsubscribe locally
        await subscription.unsubscribe();
        
        // Remove from server
        await fetcher("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });

        setIsSubscribed(false);
        clientLogger.info("[PushNotificationManager]", "Unsubscribed from push notifications");
      }
    } catch (error) {
      clientLogger.error("[PushNotificationManager]", `Failed to unsubscribe: ${error}`);
    }
  }, [swRegistration]);

  // Auto-subscribe when conditions are met
  useEffect(() => {
    if (isSignedIn && swRegistration && permission === "default" && !isSubscribed) {
      subscribeToPush();
    }
  }, [isSignedIn, swRegistration, permission, isSubscribed, subscribeToPush]);

  // Cleanup on sign out
  useEffect(() => {
    if (!isSignedIn && isSubscribed) {
      unsubscribeFromPush();
    }
  }, [isSignedIn, isSubscribed, unsubscribeFromPush]);

  // This component renders nothing - it just manages the push subscription
  return null;
}
