import client from './client';
import type { LoginCredentials, SignupData, AuthResponse, User } from '@/types';

export const authService = {
    /**
     * Authenticate a user with email and password.
     */
    login: (credentials: LoginCredentials) =>
        client.post<AuthResponse>('/auth/login', credentials),

    /**
     * Register a new user account.
     */
    signup: (data: SignupData) => client.post<AuthResponse>('/auth/register', data),

    /**
     * Invalidate the current session server-side.
     */
    logout: () => client.post('/auth/logout'),

    /**
     * Fetch the currently authenticated user's profile.
     */
    getMe: () => client.get<User>('/auth/me'),

    /**
     * Refresh the access token using a stored refresh token.
     */
    refreshToken: () => client.post<{ token: string }>('/auth/refresh'),
};
