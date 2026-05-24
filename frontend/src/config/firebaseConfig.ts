import { initializeApp, getApp, getApps } from "firebase/app";
import type { Messaging } from "firebase/messaging";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Explicit debugging for production builds
const missingKeys: string[] = [];
if (!firebaseConfig.apiKey) missingKeys.push('VITE_FIREBASE_API_KEY');
if (!firebaseConfig.projectId) missingKeys.push('VITE_FIREBASE_PROJECT_ID');
if (!import.meta.env.VITE_FIREBASE_VAPID_KEY) missingKeys.push('VITE_FIREBASE_VAPID_KEY');

const isFirebaseEnabled = missingKeys.length === 0;

if (!isFirebaseEnabled) {
  console.error('[FCM] Firebase config is incomplete. Missing variables in build environment:', missingKeys.join(', '));
  console.warn('[FCM] Ensure these variables are added to your hosting provider (Vercel/Render) dashboard before running the build.');
}

let messaging: Messaging | null = null;
try {
  if (isFirebaseEnabled) {
    console.log('[FCM] Firebase config loaded successfully. Initializing app...');
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    messaging = getMessaging(app);
  }
} catch (error) {
  console.error("[FCM] Firebase init failed. Notifications disabled.", error);
}

export { messaging, isFirebaseEnabled, missingKeys };

/**
 * Requests notification permission, registers the service worker, and
 * returns an FCM token.  Returns null on any failure (permission denied,
 * SW unavailable, network error, etc.) so callers never need try/catch.
 */
export const requestForToken = async (): Promise<string | null> => {
  if (!isFirebaseEnabled || !messaging) {
    console.warn(`[FCM] Push notifications disabled. Missing config: ${missingKeys.join(', ')}`);
    return null;
  }

  // 1. Browser must support the Notification API
  if (!("Notification" in window)) {
    console.warn("[FCM] Notifications not supported in this browser.");
    return null;
  }

  // 2. Request permission if not already decided
  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    console.warn("[FCM] Notification permission not granted:", permission);
    return null;
  }

  // 3. Service Workers are required for background push
  if (!("serviceWorker" in navigator)) {
    console.warn("[FCM] Service Workers not supported in this browser.");
    return null;
  }

  try {
    // Register the UNIFIED service worker (sw.js) — not firebase-messaging-sw.js.
    // Having two SWs compete for scope "/" caused push events to land in whichever
    // SW was registered last, making native VAPID pushes silently disappear.
    // We pass sw.js here so Firebase uses the same SW as our VAPID push subscription.
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });
    // Wait until the SW is active before generating a token
    await navigator.serviceWorker.ready;

    // 4. Get FCM token — MUST pass serviceWorkerRegistration so Firebase
    //    doesn't try to install its own incompatible SW.
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log("[FCM] Token obtained:", token.slice(0, 20) + "...");
      return token;
    }

    console.warn("[FCM] getToken() returned empty. Check VAPID key.");
    return null;
  } catch (err: any) {
    console.error("[FCM] getToken() failed:", err?.message ?? err);
    return null;
  }
};
