import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types';
import { supabase } from '@/config/supabaseClient';

console.log("ENV URL:", import.meta.env.VITE_SUPABASE_URL)
console.log("ENV KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY)

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const API_BASE_URL = `${SUPABASE_URL}/functions/v1`;

const client: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, 
    headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    },
});

// Avoid multiple simultaneous refresh calls
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
    refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
    refreshSubscribers.map((cb) => cb(token));
    refreshSubscribers = [];
};

/**
 * Polls for a session until it's found or a timeout is reached.
 * Useful for handling initial session recovery race conditions.
 */
async function waitForSession(timeoutMs = 1500): Promise<string | undefined> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) return session.access_token;
        await new Promise(r => setTimeout(r, 100));
    }
    return undefined;
}

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Attaches the Bearer token from Supabase Session to every outgoing request.

client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // 1. Mandatory base headers for Supabase Edge Functions
    config.headers['apikey'] = anonKey;
    config.headers['Content-Type'] = 'application/json';

    // 2. Identify Public Endpoints
    const publicEndpoints = ['get-wedding-details', 'submit-wish', 'fetch-wishes'];
    const isPublic = publicEndpoints.some(endpoint => config.url?.includes(endpoint));

    // 3. Attach User Token if available and NOT on a public endpoint
    let { data: { session } } = await supabase.auth.getSession();
    let userToken = session?.access_token;

    // 4. Session Recovery Resilience: 
    // If no session but not a public endpoint, wait up to 1s for session initialization
    if (!userToken && !isPublic) {
        userToken = await waitForSession(1000);
    }

    if (userToken && !isPublic) {
      config.headers['Authorization'] = `Bearer ${userToken}`;
    } else {
      // Fallback to Anon Key for public functions or if no session
      config.headers['Authorization'] = `Bearer ${anonKey}`;
    }

    // 5. Debug Logging
    if (import.meta.env.DEV || window.location.hostname !== 'localhost') {
        console.group(`🚀 API REQUEST: ${config.method?.toUpperCase()} ${config.url}`);
        console.log("PAYLOAD:", config.data);
        console.log("HEADERS:", { ...config.headers, Authorization: 'REDACTED' });
        console.groupEnd();
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Handles 401 by clearing auth state and redirecting to login.
// Normalises all errors into a consistent ApiError shape.

client.interceptors.response.use(
    (response) => {
        // Debug Logging for successful responses
        if (import.meta.env.DEV || window.location.hostname !== 'localhost') {
            console.group(`✅ API RESPONSE: ${response.config.method?.toUpperCase()} ${response.config.url}`);
            console.log("STATUS:", response.status);
            console.log("DATA:", response.data);
            console.groupEnd();
        }
        return response;
    },
    async (error: AxiosError<{ message?: string; code?: string; error?: string }>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // 1. Handle 401 Unauthorized with automatic retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Don't refresh on login or public routes
            const isLogin = window.location.pathname === '/login';
            const publicEndpoints = ['get-wedding-details', 'submit-wish', 'fetch-wishes'];
            const isPublic = publicEndpoints.some(endpoint => originalRequest.url?.includes(endpoint));

            if (!isLogin && !isPublic) {
                if (isRefreshing) {
                    return new Promise((resolve) => {
                        subscribeTokenRefresh((token: string) => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            resolve(client(originalRequest));
                        });
                    });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    console.warn('Unauthorized (401) - Attempting token refresh...');
                    const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
                    
                    if (refreshError || !session) {
                        throw new Error('Session refresh failed');
                    }

                    const newToken = session.access_token;
                    onTokenRefreshed(newToken);
                    isRefreshing = false;

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return client(originalRequest);
                } catch (refreshErr) {
                    isRefreshing = false;
                    console.error('Refresh failed. Redirecting to login.');
                    supabase.auth.signOut().finally(() => {
                        window.location.replace('/login');
                    });
                    return Promise.reject(refreshErr);
                }
            }
        }

        // 2. Normalize and Log other errors
        console.error(`❌ API ERROR:`, {
            status: error.response?.status,
            message: error.message,
            data: error.response?.data
        });

        const apiError: ApiError = {
            message: error.response?.data?.error ?? error.response?.data?.message ?? error.message ?? 'An unexpected error occurred',
            code: error.response?.data?.code,
            statusCode: error.response?.status ?? 0,
        };

        return Promise.reject(apiError);
    }
);

export default client;
