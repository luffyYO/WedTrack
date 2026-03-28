import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types';
import { supabase } from '@/config/supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const API_BASE_URL = `${SUPABASE_URL}/functions/v1`;

// ─── Cached Auth Token ────────────────────────────────────────────────────────
// Store the current access token in module scope so the request interceptor
// can read it SYNCHRONOUSLY without awaiting getSession() on every call.
// This is the primary auth latency fix (~100-300ms saved per API call).
let _cachedToken: string | null = null;

supabase.auth.onAuthStateChange((_event, session) => {
  _cachedToken = session?.access_token ?? null;
});

// Bootstrap: populate token on module load (handles page refresh case)
supabase.auth.getSession().then(({ data: { session } }) => {
  _cachedToken = session?.access_token ?? null;
});

// ─────────────────────────────────────────────────────────────────────────────

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY
  },
});

// Public endpoints that don't require a user JWT
const PUBLIC_ENDPOINTS = ['get-wedding-details', 'submit-wish', 'fetch-wishes', 'parse-voice'];

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Uses cached token — NO async getSession() call per request.

client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // 1. Mandatory base headers for Supabase Edge Functions
    config.headers.set('apikey', anonKey);
    config.headers.set('Content-Type', 'application/json');

    // 2. Identify Public vs. Protected Endpoints
    const isPublic = PUBLIC_ENDPOINTS.some(endpoint => config.url?.includes(endpoint));

    // 3. Attach token — SYNCHRONOUS, no await
    if (!isPublic && _cachedToken) {
      config.headers.set('Authorization', `Bearer ${_cachedToken}`);
    } else {
      config.headers.set('Authorization', `Bearer ${anonKey}`);
    }



    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// On 401: attempt ONE token refresh then retry. If refresh fails → sign out.

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; code?: string; error?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 1. Handle 401 — attempt one token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      const isPublic = PUBLIC_ENDPOINTS.some(endpoint => originalRequest.url?.includes(endpoint));

      if (!isPublic) {
        originalRequest._retry = true;

        try {
          const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

          if (refreshError || !session) {
            throw new Error('Session refresh failed');
          }

          // Update cached token
          _cachedToken = session.access_token;

          // Retry the original request with the fresh token
          originalRequest.headers.set('Authorization', `Bearer ${session.access_token}`);
          return client(originalRequest);
        } catch {
          if (import.meta.env.DEV) {
            console.error('[API] Token refresh failed. Signing out.');
          }
          await supabase.auth.signOut();
          window.location.replace('/login');
          return Promise.reject(error);
        }
      }
    }

    // 2. Normalize errors
    if (import.meta.env.DEV) {
      console.error(`❌ API ERROR ${error.response?.status}:`, error.response?.data ?? error.message);
    }

    const apiError: ApiError = {
      message: error.response?.data?.error ?? error.response?.data?.message ?? error.message ?? 'An unexpected error occurred',
      code: error.response?.data?.code,
      statusCode: error.response?.status ?? 0,
    };

    return Promise.reject(apiError);
  }
);

export default client;
