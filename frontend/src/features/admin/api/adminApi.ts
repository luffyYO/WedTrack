import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

/**
 * adminApi — Dedicated HTTP client for all admin panel API calls.
 *
 * ── Why a separate client? ──────────────────────────────────────────────────
 * The main `apiClient` pulls its Authorization header from the *regular*
 * Supabase Auth session (via supabase.auth.getSession()). Admin logins go
 * through the `admin-auth` Edge Function, which returns a Supabase JWT that
 * is stored independently in `localStorage.adminToken`.
 *
 * If we reused the main apiClient, the Authorization header would come from
 * whichever regular user is logged in — NOT the admin. This client ensures
 * every admin API call sends the correct admin-scoped JWT.
 *
 * ── Security notes ──────────────────────────────────────────────────────────
 * • Only the Supabase anon key and the admin's own access_token are sent.
 * • The service role key is NEVER included — it lives only in Edge Functions.
 * • Token refresh is handled by calling `admin-auth { action: "refresh" }`.
 */

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
const API_BASE_URL = `${SUPABASE_URL}/functions/v1`;

const adminClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
  },
});

// ── Request Interceptor ─────────────────────────────────────────────────────
// Injects the admin JWT from localStorage on every outgoing request.
adminClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const adminToken = localStorage.getItem('adminToken');

    if (adminToken) {
      config.headers.set('Authorization', `Bearer ${adminToken}`);
    } else {
      // No admin session — send anon key so the server can return a clean 401
      config.headers.set('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor ────────────────────────────────────────────────────
// On 401: attempt one token refresh, then retry. If refresh fails → logout.
adminClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('adminRefreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(
            `${API_BASE_URL}/admin-auth`,
            { action: 'refresh', refresh_token: refreshToken },
            {
              headers: {
                'Content-Type': 'application/json',
                apikey: SUPABASE_ANON_KEY,
              },
            },
          );

          const { token, refresh_token, expires_at, role } = res.data?.data ?? {};
          if (token) {
            localStorage.setItem('adminToken', token);
            if (refresh_token) localStorage.setItem('adminRefreshToken', refresh_token);
            if (expires_at) localStorage.setItem('adminExpiresAt', String(expires_at));
            if (role) localStorage.setItem('adminRole', role);

            originalRequest.headers.set('Authorization', `Bearer ${token}`);
            return adminClient(originalRequest);
          }
        } catch {
          // Refresh failed — fall through to redirect
        }
      }

      // Clear admin session and redirect to login
      ['adminToken', 'adminRefreshToken', 'adminExpiresAt', 'adminRole',
       'adminUsername', 'adminEmail'].forEach((k) => localStorage.removeItem(k));
      window.location.replace('/admin/login');
      return Promise.reject(error);
    }

    // Normalize error shape for callers
    const apiError = {
      message:
        error.response?.data?.message ??
        error.response?.data?.error ??
        error.message ??
        'An unexpected error occurred',
      statusCode: error.response?.status ?? 0,
    };

    return Promise.reject(apiError);
  },
);

// ── Public API ───────────────────────────────────────────────────────────────
// Thin wrappers that normalise paths (strip leading slash).

const adminApi = {
  get: <T = any>(url: string, config?: any) => {
    const path = url.startsWith('/') ? url.substring(1) : url;
    return adminClient.get<T>(path, config);
  },
  post: <T = any>(url: string, data?: any, config?: any) => {
    const path = url.startsWith('/') ? url.substring(1) : url;
    return adminClient.post<T>(path, data, config);
  },
  put: <T = any>(url: string, data?: any, config?: any) => {
    const path = url.startsWith('/') ? url.substring(1) : url;
    return adminClient.put<T>(path, data, config);
  },
  patch: <T = any>(url: string, data?: any, config?: any) => {
    const path = url.startsWith('/') ? url.substring(1) : url;
    return adminClient.patch<T>(path, data, config);
  },
  delete: <T = any>(url: string, config?: any) => {
    const path = url.startsWith('/') ? url.substring(1) : url;
    return adminClient.delete<T>(path, config);
  },
};

export default adminApi;
