import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiError } from '@/types';
import { supabase } from '@/config/supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const API_BASE_URL = `${SUPABASE_URL}/functions/v1`;

// ─── Cached Auth Token ─────────────────────────────────────────────────────
// Populated asynchronously at module init, and kept current via onAuthStateChange.
// The `_initPromise` ensures we never send a request before the first getSession()
// resolves — eliminating the race-condition that caused 401 "Invalid JWT" errors.
let _cachedToken: string | null = null;
let _initResolved = false;

const _initPromise = supabase.auth.getSession().then(({ data: { session } }) => {
  _cachedToken = session?.access_token ?? null;
  _initResolved = true;
  if (import.meta.env.DEV) {
    console.log('[API] Session bootstrapped. Token present:', !!_cachedToken);
  }
});

// Keep the cache live after bootstrap
supabase.auth.onAuthStateChange((_event, session) => {
  _cachedToken = session?.access_token ?? null;
  if (import.meta.env.DEV) {
    console.log('[API] Auth state changed. Token present:', !!_cachedToken);
  }
});

// ─────────────────────────────────────────────────────────────────────────────

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
  },
});

// Public endpoints that don't require a user JWT
const PUBLIC_ENDPOINTS = ['get-wedding-details', 'submit-wish', 'fetch-wishes', 'verify-payment'];

// ─── Request Interceptor ────────────────────────────────────────────────────

client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Always set base headers
    config.headers.set('apikey', anonKey);
    config.headers.set('Content-Type', 'application/json');

    const isPublic = PUBLIC_ENDPOINTS.some((ep) => config.url?.includes(ep));

    if (isPublic) {
      // Public endpoints use anon key as bearer — no user JWT needed
      config.headers.set('Authorization', `Bearer ${anonKey}`);
      return config;
    }

    // ── Protected endpoint: MUST send a real user JWT ──────────────────────
    // 1. Wait for the bootstrap getSession() to resolve (handles page-refresh race)
    if (!_initResolved) {
      await _initPromise;
    }

    let tokenToUse = _cachedToken;

    // 2. If still null after init, try a fresh getSession() call
    if (!tokenToUse) {
      const { data: { session } } = await supabase.auth.getSession();
      tokenToUse = session?.access_token ?? null;
      if (tokenToUse) _cachedToken = tokenToUse;
    }

    if (!tokenToUse) {
      // No session at all — redirect to login rather than sending a bad request
      if (import.meta.env.DEV) {
        console.error('[API] No user session found for protected endpoint:', config.url);
      }
      // Let the request proceed without a token — the server will 401 and
      // the response interceptor will handle sign-out cleanly.
      config.headers.set('Authorization', `Bearer ${anonKey}`);
      return config;
    }

    config.headers.set('Authorization', `Bearer ${tokenToUse}`);
    if (import.meta.env.DEV) {
      console.log(`[API] → ${config.url} | Token: ${tokenToUse.slice(0, 20)}...`);
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ─── Response Interceptor ──────────────────────────────────────────────────
// On 401: attempt ONE token refresh then retry. If refresh fails → sign out.

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; code?: string; error?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      const isPublic = PUBLIC_ENDPOINTS.some((ep) => originalRequest.url?.includes(ep));

      if (!isPublic) {
        originalRequest._retry = true;

        try {
          const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

          if (refreshError || !session) throw new Error('Session refresh failed');

          _cachedToken = session.access_token;
          originalRequest.headers.set('Authorization', `Bearer ${session.access_token}`);

          if (import.meta.env.DEV) {
            console.log('[API] Token refreshed. Retrying request:', originalRequest.url);
          }

          return client(originalRequest);
        } catch {
          if (import.meta.env.DEV) {
            console.error('[API] Token refresh failed. Signing out.');
          }
          _cachedToken = null;
          await supabase.auth.signOut();
          window.location.replace('/login');
          return Promise.reject(error);
        }
      }
    }

    if (import.meta.env.DEV) {
      console.error(`❌ API ERROR ${error.response?.status}:`, error.response?.data ?? error.message);
    }

    const apiError: ApiError = {
      message:
        error.response?.data?.error ??
        error.response?.data?.message ??
        error.message ??
        'An unexpected error occurred',
      code: error.response?.data?.code,
      statusCode: error.response?.status ?? 0,
    };

    return Promise.reject(apiError);
  }
);

export default client;
