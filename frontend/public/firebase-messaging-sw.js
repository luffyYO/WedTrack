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

// Immediately activate and claim so that if this SW is somehow installed it
// hands off control as fast as possible.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  console.log('[firebase-messaging-sw.js] No-op stub activated — all push handling is in sw.js');
});
