// import apiClient from '@/api/client'; // Uncomment when using actual API call
import type { UserProfile, UpdateProfilePayload } from '../types/profile.types';

/**
 * Stub implementation of the Profile API service.
 * In a real app, this connects to GET /api/user/profile and PATCH /api/user/profile.
 */

// Mock data to simulate prefilled backend data
const MOCK_PROFILE: UserProfile = {
    id: 'usr_12345',
    fullName: 'Ravi Teja',
    email: 'ravi.teja@example.com',
    phone: '+91 98765 43210',
    role: 'Planner',
    brideName: 'Priya Sharma',
    groomName: 'Arjun Mehta',
    weddingDate: '2026-11-20',
    venue: 'Royal Orchid Resort',
    village: 'Coimbatore',
    country: 'India',
    guestCapacityEstimate: 500,
    preferredLanguage: 'English',
};

export const profileService = {
    getProfile: async (): Promise<{ data: UserProfile }> => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Uncomment for actual API call
        // return apiClient.get('/api/user/profile');

        return { data: MOCK_PROFILE };
    },

    updateProfile: async (payload: UpdateProfilePayload): Promise<{ data: UserProfile }> => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Uncomment for actual API call
        // return apiClient.patch('/api/user/profile', payload);

        return {
            data: { ...MOCK_PROFILE, ...payload }
        };
    },
};
