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
    timeout: 30000, // Increased timeout for Edge Functions
    headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Attaches the Bearer token from Supabase Session to every outgoing request.

client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // Always enforce the requested anonKey headers to prevent 401s from Edge Functions
    if (anonKey) {
      config.headers['apikey'] = anonKey;
      config.headers['Authorization'] = `Bearer ${anonKey}`;
    }

    // Still attempt to attach user token if the user is authenticated 
    // AND the endpoint is not explicitly meant for guests
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const isPublicEndpoint = config.url?.includes('get-wedding-details') || 
                             config.url?.includes('submit-wish') ||
                             config.url?.includes('fetch-wishes');
    
    if (token && !isPublicEndpoint) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (config.method?.toLowerCase() === 'post') {
      config.headers['Content-Type'] = 'application/json';
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
        if (error.response?.status === 401) {
            // Don't redirect on public pages (guest form, QR view)
            const isPublicPage = window.location.pathname.startsWith('/guest-form');
            if (!isPublicPage) {
                // Clear the invalid session from Supabase to stop the redirect loop
                supabase.auth.signOut().catch(console.error).finally(() => {
                    localStorage.removeItem('wedtrack_token');
                    window.location.href = '/login';
                });
            }
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
