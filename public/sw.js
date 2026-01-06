// Service Worker for Screenie Push Notifications

const SW_VERSION = "1.0.1";

// Install event - cache essential resources if needed
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker version:", SW_VERSION);
  self.skipWaiting();
});

// Activate event - clean up old caches if any
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker version:", SW_VERSION);
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  console.log("[SW] Push event received");

  let data = {
    title: "Screenie",
    body: "You have a new notification",
    icon: "/screenie-logo@3x.png",
    badge: "/screenie-logo@3x.png",
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        data: payload.data || {}
      };
    } catch (e) {
      console.error("[SW] Error parsing push data:", e);
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: data.data,
    actions: [
      {
        action: "open",
        title: "Open"
      },
      {
        action: "dismiss",
        title: "Dismiss"
      }
    ],
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event - open the appropriate page
// iOS PWA fix: Must use preventDefault() and client.navigate() for proper navigation
// See: https://developer.apple.com/forums/thread/733604
self.addEventListener("notificationclick", (event) => {
  // Prevent default behavior - required for iOS PWA navigation to work
  event.preventDefault();
  
  console.log("[SW] Notification clicked:", event.action);
  
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  // Get the URL to open from the notification data
  const urlPath = event.notification.data?.url || "/home";
  // Build absolute URL
  const urlToOpen = new URL(urlPath, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If there's an existing window, navigate it to the URL and focus
      if (clientList.length > 0) {
        const client = clientList[0];
        // Use navigate() to change the URL - this is the iOS fix
        return client.navigate(urlToOpen).then((client) => {
          if (client) {
            return client.focus();
          }
        });
      }
      // If no existing window, open a new one
      return self.clients.openWindow(urlToOpen);
    })
  );
});

// Handle subscription change (browser refreshed subscription)
self.addEventListener("pushsubscriptionchange", (event) => {
  console.log("[SW] Push subscription changed");
  
  event.waitUntil(
    // Re-subscribe and update the server
    self.registration.pushManager.subscribe(event.oldSubscription.options).then((subscription) => {
      // Send the new subscription to the server
      return fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          resubscribe: true
        })
      });
    })
  );
});
