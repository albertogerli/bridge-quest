// BridgeQuest Notification Service Worker
// Handles notification click events for PWA push notifications

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        // If a BridgeQuest window is already open, focus it
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url.includes(self.registration.scope) && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      })
  );
});

self.addEventListener("notificationclose", function (event) {
  // Notification was dismissed - no action needed
});
