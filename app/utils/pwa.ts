/**
 * Check if running as installed PWA (standalone mode)
 */
export function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;

  // Check for iOS standalone
  const isIOSStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  // Check for other browsers
  const isOtherStandalone = window.matchMedia("(display-mode: standalone)").matches;

  return isIOSStandalone || isOtherStandalone;
}

/**
 * Detect the mobile platform
 */
export function getMobilePlatform(): "ios" | "android" | "other" {
  if (typeof window === "undefined") return "other";

  const userAgent = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios";
  }

  if (/android/.test(userAgent)) {
    return "android";
  }

  return "other";
}

/**
 * Check if the device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod|android|mobile/.test(userAgent);
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Convert a base64 URL-safe string to an ArrayBuffer (for VAPID key)
 */
export function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}
