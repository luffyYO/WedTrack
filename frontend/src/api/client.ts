import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types';
import { supabase } from '@/config/supabaseClient';

import API_BASE_URL_CONFIG from '@/config/api';

const API_BASE_URL = `${API_BASE_URL_CONFIG}/api`;

const client: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Attaches the Bearer token from Supabase Session to every outgoing request.

client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
                localStorage.removeItem('wedtrack_token');
                window.location.href = '/';
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
