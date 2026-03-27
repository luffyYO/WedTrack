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

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Handles 401 by clearing auth state and redirecting to login.
// Normalises all errors into a consistent ApiError shape.

client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ message?: string; code?: string }>) => {
        // ONLY redirect to login on 401 Unauthorized
        if (error.response && error.response.status === 401) {
            // Priority 1: Don't redirect if we are already on the login page
            if (window.location.pathname === '/login') {
                return Promise.reject(error);
            }

            // Priority 2: Don't redirect on public pages (guest form, etc.)
            const isPublicPage = ['/guest-form', '/wedding/'].some(path => 
                window.location.pathname.startsWith(path)
            );

            if (!isPublicPage) {
                // VERIFY if we actually have a session before redirecting
                // If a session EXISTS but we got a 401, it's likely a transient/token issue
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (!session) {
                        console.warn('Unauthorized access (401) confirmed. No session found. Redirecting...');
                        window.location.replace('/login');
                    } else {
                        console.warn('Unauthorized access (401) detected BUT session exists. Attempting refresh...');
                        // No immediate redirect, user code may retry or state will refresh
                    }
                });
            }
        } else {
            // Log other errors without redirecting
            console.error(`API Error (${error.response?.status || 'Network/CORS'}):`, error.message);
        }

        const apiError: ApiError = {
            message: error.response?.data?.message ?? error.message ?? 'An unexpected error occurred',
            code: error.response?.data?.code,
            statusCode: error.response?.status ?? 0,
        };

        return Promise.reject(apiError);
    }
);

export default client;
