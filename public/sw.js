// Service worker for Moni web push notifications.
// Receives push events from the server and displays OS-level notifications
// even when the browser tab is closed.

// Activate immediately without waiting for existing tabs to close
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  console.log('[sw] push event received', event.data?.text());
  let title = 'Budget reminder';
  let body  = "Don't forget to log your expenses!";

  if (event.data) {
    try {
      const data = event.data.json();
      if (data.title) title = data.title;
      if (data.body)  body  = data.body;
    } catch {
      const text = event.data.text();
      if (text) body = text;
    }
  }

  const options = {
    body,
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [0, 250, 100, 250],
    tag: 'moni_expense_reminder',
    renotify: true,
  };

  const isLocalhost = self.location.hostname === 'localhost'
    || self.location.hostname === '127.0.0.1';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clientList => {
      console.log('[sw] isLocalhost:', isLocalhost, 'open tabs:', clientList.length);
      if (isLocalhost && clientList.length > 0) {
        // localhost workaround: Chrome silently suppresses SW showNotification
        // over HTTP. Post to the first open tab which fires Notification directly.
        clientList[0].postMessage({ type: 'SHOW_NOTIFICATION', title, body });
        return;
      }
      // HTTPS (production) or no tab open: use SW showNotification.
      console.log('[sw] calling showNotification');
      return self.registration.showNotification(title, options);
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an existing app tab if one is open
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
