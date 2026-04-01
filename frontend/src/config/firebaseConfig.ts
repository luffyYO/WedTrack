import { initializeApp, getApp, getApps } from "firebase/app";
import { getMessaging, getToken, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isFirebaseEnabled =
  !!firebaseConfig.projectId && !!import.meta.env.VITE_FIREBASE_VAPID_KEY;

let messaging: Messaging | null = null;
try {
  if (isFirebaseEnabled) {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    messaging = getMessaging(app);
  }
} catch (error) {
  console.warn("[FCM] Firebase init failed. Notifications disabled.", error);
}

export { messaging };

/**
 * Requests notification permission, registers the service worker, and
 * returns an FCM token.  Returns null on any failure (permission denied,
 * SW unavailable, network error, etc.) so callers never need try/catch.
 */
export const requestForToken = async (): Promise<string | null> => {
  if (!isFirebaseEnabled || !messaging) {
    console.warn("[FCM] Firebase not configured. Push notifications disabled.");
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
    // Register (or retrieve the existing active) service worker
    const swUrl = new URL("/firebase-messaging-sw.js", window.location.origin);
    swUrl.searchParams.set("apiKey", firebaseConfig.apiKey || "");
    swUrl.searchParams.set("authDomain", firebaseConfig.authDomain || "");
    swUrl.searchParams.set("projectId", firebaseConfig.projectId || "");
    swUrl.searchParams.set("storageBucket", firebaseConfig.storageBucket || "");
    swUrl.searchParams.set("messagingSenderId", firebaseConfig.messagingSenderId || "");
    swUrl.searchParams.set("appId", firebaseConfig.appId || "");

    const registration = await navigator.serviceWorker.register(
      swUrl.toString(),
      { scope: "/" }
    );
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
