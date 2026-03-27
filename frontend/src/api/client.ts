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
    
    // 1. Mandatory base headers for Supabase Edge Functions
    config.headers['apikey'] = anonKey;
    config.headers['Content-Type'] = 'application/json';

    // 2. Identify Public Endpoints
    const publicEndpoints = ['get-wedding-details', 'submit-wish', 'fetch-wishes'];
    const isPublic = publicEndpoints.some(endpoint => config.url?.includes(endpoint));

    // 3. Attach User Token if available and NOT on a public endpoint
    const { data: { session } } = await supabase.auth.getSession();
    const userToken = session?.access_token;

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
                console.warn('Unauthorized access (401) detected. Clearing session and redirecting...');
                // Clear the invalid session from Supabase and local storage
                supabase.auth.signOut().catch(console.error).finally(() => {
                    localStorage.removeItem('supabase.auth.token');
                    // Use replace to avoid back-button loops
                    window.location.replace('/login');
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
