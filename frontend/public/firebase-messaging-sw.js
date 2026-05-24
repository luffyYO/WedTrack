/**
 * firebase-messaging-sw.js — NO-OP STUB
 *
 * This file exists to prevent a 404 when the Firebase SDK attempts to
 * register it. All actual push handling has been moved to sw.js (the
 * unified service worker) to avoid scope conflicts with the VAPID push
 * subscription.
 *
 * firebaseConfig.ts now passes sw.js as the serviceWorkerRegistration to
 * Firebase getToken(), so this file is never the active SW.
 */

<<<<<<< HEAD
// Immediately activate and claim so that if this SW is somehow installed it
// hands off control as fast as possible.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  console.log('[firebase-messaging-sw.js] No-op stub activated — all push handling is in sw.js');
=======
// Extract config from url query parameters to avoid hardcoding secrets
const urlParams = new URL(location.href).searchParams;

const firebaseConfig = {
  apiKey: urlParams.get('apiKey'),
  authDomain: urlParams.get('authDomain'),
  projectId: urlParams.get('projectId'),
  storageBucket: urlParams.get('storageBucket'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId: urlParams.get('appId')
};


try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log("[firebase-messaging-sw.js] Received background message ", payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: "/logo.jpeg",
      data: payload.data // Pass FCM data to the notification object
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (error) {
  console.error("Firebase Service Worker initialization failed", error);
}

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] On notification click: ', event.notification.tag);
  event.notification.close();

  // Extract the URL from the notification data, fallback to root
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // If so, just focus it.
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, then open the target URL in a new window/tab.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
>>>>>>> 8e90a238047516f4d703270f741d56a2c05685d1
});
