/**
 * usePushNotifications
 *
 * Manages the Web Push (VAPID) subscription lifecycle for browser notifications.
 *
 * SCOPE: Browser push notifications are ONLY for new guest entries.
 *        Do NOT use this hook to trigger wish/message/gift notifications —
 *        those are handled by the in-app bell system (wishStore.ts).
 *
 * Usage:
 *   const { isSubscribed, isSupported, requestPermission } = usePushNotifications(weddingId);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/config/supabaseClient';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert a VAPID public key (base64url) to a Uint8Array */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/** Serialize a PushSubscription to a plain object for storage */
function serializeSubscription(sub: PushSubscription): Record<string, unknown> {
  const json = sub.toJSON();
  return {
    endpoint: sub.endpoint,
    expirationTime: sub.expirationTime,
    keys: json.keys ?? {},
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export interface UsePushNotificationsReturn {
  /** Whether the browser supports Web Push */
  isSupported: boolean;
  /** Whether there is an active subscription for this wedding */
  isSubscribed: boolean;
  /** Current notification permission state */
  permissionState: PushPermissionState;
  /** Whether the subscription process is in progress */
  isLoading: boolean;
  /** Request permission and subscribe — call this from a user gesture */
  requestPermission: () => Promise<void>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePushNotifications(weddingId: string | null | undefined): UsePushNotificationsReturn {
  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

  const [permissionState, setPermissionState] = useState<PushPermissionState>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission as PushPermissionState;
    }
    return 'default';
  });

  const [isSubscribed, setIsSubscribed] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Optimistically treat as subscribed if permission is already granted.
      // The reconcile effect will correct this if the subscription is stale.
      return Notification.permission === 'granted';
    }
    return false;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Whether the browser environment supports Web Push at all
  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    !!vapidPublicKey;

  // Ref to avoid stale closure issues in async callbacks
  const weddingIdRef = useRef(weddingId);
  useEffect(() => { weddingIdRef.current = weddingId; }, [weddingId]);

  // Helper to persist subscription details in the backend database
  const saveSubscriptionToDb = useCallback(async (sub: PushSubscription, targetWeddingId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const supabaseUrl  = (import.meta.env.VITE_SUPABASE_URL      || '').trim();
      const supabaseAnon = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
      const { data: { session } } = await supabase.auth.getSession();

      console.log(`[usePushNotifications] Syncing subscription in DB for event ${targetWeddingId}...`);
      const response = await fetch(`${supabaseUrl}/functions/v1/save-push-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnon,
          ...(session?.access_token
            ? { 'Authorization': `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          event_id: targetWeddingId,
          subscription: serializeSubscription(sub),
          endpoint: sub.endpoint,
        }),
      });
      if (response.ok) {
        console.log(`[usePushNotifications] Successfully synced subscription in DB for event ${targetWeddingId}`);
      } else {
        console.warn(`[usePushNotifications] Failed to sync subscription in DB: HTTP ${response.status}`);
      }
    } catch (err: any) {
      console.warn('[usePushNotifications] Failed to save subscription to DB:', err?.message);
    }
  }, []);

  // ── Reconcile subscription state on mount / weddingId change ─────────────
  // IMPORTANT: Do NOT call pushManager.subscribe() here.
  // Brave (and Chrome) block subscribe() without a user gesture, throwing:
  //   AbortError: Registration failed - push service error
  // New subscriptions are only created via requestPermission() (user gesture).
  useEffect(() => {
    if (!isSupported || !weddingId) return;

    const currentPermission = Notification.permission as PushPermissionState;
    setPermissionState(currentPermission);

    if (currentPermission === 'denied') {
      setIsSubscribed(false);
      return;
    }

    let cancelled = false;

    const reconcile = async () => {
      try {
        // Always register sw.js (idempotent) so the push event handler is ready
        // even before the user creates a new subscription.
        await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        const reg = await navigator.serviceWorker.getRegistration('/');
        if (!reg) {
          if (!cancelled) setIsSubscribed(false);
          return;
        }

        const existing = await reg.pushManager.getSubscription();
        if (!existing) {
          if (!cancelled) setIsSubscribed(false);
          console.log('[usePushNotifications] No existing push subscription — user gesture required.');
          return;
        }

        // Validate that the existing subscription was created with our current VAPID key.
        // If keys mismatch (e.g., old Firebase VAPID subscription), the server sends with
        // the native VAPID key → FCM accepts (201) but the push event never fires in the SW
        // because the ECDH decryption fails silently on the browser side.
        const trimmedKey = (vapidPublicKey || '').replace(/[\s\uFEFF\xA0]+/g, '');
        const expectedKeyBytes = urlBase64ToUint8Array(trimmedKey);

        let keyMatches = false;
        try {
          const existingKeyBuf = existing.options?.applicationServerKey;
          if (existingKeyBuf instanceof ArrayBuffer) {
            const existingArr = new Uint8Array(existingKeyBuf);
            keyMatches =
              existingArr.length === expectedKeyBytes.length &&
              existingArr.every((b, i) => b === expectedKeyBytes[i]);
          }
        } catch {
          keyMatches = false;
        }

        if (!cancelled) {
          if (keyMatches) {
            console.log('[usePushNotifications] Subscription VAPID key matches ✅ — re-saving to DB');
            setIsSubscribed(true);
            saveSubscriptionToDb(existing, weddingId);
          } else {
            console.warn('[usePushNotifications] Subscription VAPID key MISMATCH ⚠️ — unsubscribing stale subscription (re-subscribe via Enable button)');
            await existing.unsubscribe();
            setIsSubscribed(false);
          }
        }
      } catch (err) {
        console.warn('[usePushNotifications] Reconcile error (non-fatal):', err);
        if (!cancelled) setIsSubscribed(false);
      }
    };

    reconcile();
    return () => { cancelled = true; };
  }, [isSupported, weddingId, vapidPublicKey, saveSubscriptionToDb]);

  // ── SW diagnostic message relay ───────────────────────────────────────────
  // The service worker posts messages back to all open windows so we can see
  // whether the push event fires and whether showNotification() succeeds/fails.
  useEffect(() => {
    if (!isSupported) return;

    const handleSwMessage = (event: MessageEvent) => {
      if (!event.data || event.data.source !== 'sw.js') return;
      const { type, timestamp, error, title } = event.data;
      switch (type) {
        case 'push_received':
          console.log(`[SW→window] ✅ push event received by SW at ${timestamp} (has_data=${event.data.has_data})`);
          break;
        case 'notification_shown':
          console.log(`[SW→window] ✅ showNotification() succeeded — title: "${title}" at ${timestamp}`);
          break;
        case 'notification_error':
          console.error(`[SW→window] ❌ showNotification() FAILED at ${timestamp}: ${error}`);
          break;
        default:
          console.log('[SW→window] message:', event.data);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSwMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleSwMessage);
  }, [isSupported]);

  // ── Subscribe ──────────────────────────────────────────────────────────────
  const requestPermission = useCallback(async () => {
    if (!isSupported) return;
    if (isLoading) return;

    const currentWeddingId = weddingIdRef.current;
    if (!currentWeddingId) return;

    setIsLoading(true);

    try {
      // 1. Request notification permission (requires user gesture)
      const permission = await Notification.requestPermission();
      setPermissionState(permission as PushPermissionState);

      if (permission !== 'granted') {
        // User denied — silently exit, do not break anything
        return;
      }

      // 2. Register service worker (idempotent if already registered)
      console.log('[usePushNotifications] Registering Service Worker...');
      await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      // Wait until the service worker is active
      console.log('[usePushNotifications] Waiting for Service Worker to be ready...');
      const readyReg = await navigator.serviceWorker.ready;
      console.log('[usePushNotifications] Service Worker is ready!');

      // 3. Unsubscribe any old subscription (ensures fresh VAPID key binding)
      const existing = await readyReg.pushManager.getSubscription();
      if (existing) {
        console.log('[usePushNotifications] Found existing subscription, unsubscribing...');
        await existing.unsubscribe();
      } else {
        console.log('[usePushNotifications] No existing subscription found.');
      }

      // 4. Subscribe with VAPID public key
      console.log('[usePushNotifications] Preparing to subscribe to push manager...');

      const rawKey = vapidPublicKey || '';
      console.log(`[usePushNotifications] Raw env key length: ${rawKey.length}`);

      // Strip ALL whitespace and invisible characters
      const trimmedKey = rawKey.replace(/[\s\uFEFF\xA0]+/g, '');
      console.log(`[usePushNotifications] Trimmed key length: ${trimmedKey.length}`);

      const applicationServerKey = urlBase64ToUint8Array(trimmedKey);
      console.log(`[usePushNotifications] Decoded Uint8Array length: ${applicationServerKey.length} (Expected: 65 for P-256)`);

      if (applicationServerKey.length !== 65) {
        console.error('[usePushNotifications] FATAL: Decoded VAPID key length is not 65 bytes. The key is invalid.');
      }

      console.log('[usePushNotifications] Calling PushManager.subscribe()...');
      const subscription = await readyReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      console.log('[usePushNotifications] Subscription successful!', subscription.endpoint);
      setIsSubscribed(true);

      // 5. Persist subscription via edge function
      await saveSubscriptionToDb(subscription, currentWeddingId);

    } catch (err: any) {
      console.error('[usePushNotifications] Subscribe error:', err?.message || err);

      // Brave-specific check
      const isBrave = (navigator as any).brave && await (navigator as any).brave.isBrave();
      if (isBrave && err?.message?.includes('push service error')) {
        console.error(
          '[usePushNotifications] BRAVE BROWSER DETECTED: This "push service error" usually occurs when ' +
          '"Use Google Services for Push Messaging" is disabled in Brave settings. ' +
          'Please navigate to brave://settings/privacy and enable it, then try again.'
        );
      }

      // Reset state on hard failure (e.g., SW registration blocked)
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, isLoading, vapidPublicKey, saveSubscriptionToDb]);

  return {
    isSupported,
    isSubscribed,
    permissionState,
    isLoading,
    requestPermission,
  };
}
