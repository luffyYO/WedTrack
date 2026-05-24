/**
 * WedTrack Unified Service Worker
 *
 * Handles ALL push notifications through a single SW to avoid scope conflicts:
 *   1. Native VAPID Web Push (from send-push-notification Edge Function)
 *      → new guest entry alerts sent to the dashboard owner
 *   2. Firebase Cloud Messaging background messages
 *      → forwarded here when firebaseConfig.ts passes this SW to getToken()
 *
 * Having two SWs (sw.js + firebase-messaging-sw.js) both registered with
 * scope "/" caused the browser to alternate between them. The active SW for
 * a given push event is whichever was registered last, making delivery
 * non-deterministic. This unified SW eliminates that race.
 */

const SW_VERSION = 'wedtrack-sw-v4-unified';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Broadcast a message to ALL open windows so it appears in browser DevTools console */
function broadcastToClients(msg) {
  self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
    clients.forEach((client) => client.postMessage({ source: 'sw.js', ...msg }));
  });
}

function showNotification(title, body, icon, tag, url) {
  const options = {
    body: body || 'A new guest has joined your wedding celebration.',
    icon: icon || '/logo.jpeg',
    badge: '/logo.jpeg',
    tag: tag || 'wedtrack-guest-notification',
    renotify: true,
    requireInteraction: false,
    silent: false,
    data: { url: url || '/dashboard', openDashboard: true },
    actions: [{ action: 'open-dashboard', title: '💍 View Dashboard' }],
  };
  console.log('[sw.js] showNotification — title:', title);
  return self.registration
    .showNotification(title, options)
    .then(() => {
      console.log('[sw.js] ✅ showNotification resolved');
      broadcastToClients({ type: 'notification_shown', title, timestamp: new Date().toISOString() });
    })
    .catch((err) => {
      console.error('[sw.js] ❌ showNotification FAILED:', err?.name, err?.message);
      broadcastToClients({
        type: 'notification_error',
        error: `${err?.name}: ${err?.message}`,
        timestamp: new Date().toISOString(),
      });
    });
}

// ── Install: activate immediately, skip waiting ───────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[sw.js] install — version:', SW_VERSION);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[sw.js] activate — version:', SW_VERSION);
  event.waitUntil(self.clients.claim());
});

// ── Push Event (Native VAPID Web Push) ───────────────────────────────────────
self.addEventListener('push', (event) => {
  const timestamp = new Date().toISOString();
  console.log('[sw.js] ✅ PUSH EVENT RECEIVED at', timestamp, '| data:', !!event.data);
  broadcastToClients({ type: 'push_received', timestamp, has_data: !!event.data });

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
    console.log('[sw.js] push payload:', JSON.stringify(data));
  } catch {
    console.warn('[sw.js] push payload not JSON — using defaults');
  }

  const title = data.title || 'New Guest Added 🎉';
  event.waitUntil(showNotification(title, data.body, data.icon, data.tag, data.url));
});

// ── Firebase Background Message (FCM format) ─────────────────────────────────
// Firebase SDK calls this when a message arrives while the app is in background.
// We handle it here so firebase-messaging-sw.js is never needed.
self.addEventListener('message', (event) => {
  // Firebase compat SDK sends { firebaseMessaging: { type: 'push-received', data: { notification, data } } }
  if (event.data && event.data.firebaseMessaging) {
    const { type, data: fbData } = event.data.firebaseMessaging;
    console.log('[sw.js] Firebase message type:', type, JSON.stringify(fbData));
    if (type === 'push-received' && fbData) {
      const n = fbData.notification || {};
      self.registration.showNotification(n.title || 'WedTrack', {
        body: n.body || '',
        icon: n.icon || '/logo.jpeg',
        tag: 'wedtrack-fcm-notification',
      }).catch(console.error);
    }
  }
});

// ── Notification Click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  console.log('[sw.js] notificationclick — action:', event.action);

  const targetUrl =
    event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : '/dashboard';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('/dashboard') && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
