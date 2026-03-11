export type UserRole = 'Bride' | 'Groom' | 'Planner' | 'Family Member' | 'Guest' | string;

export interface UserProfile {
    id: string;
    // Required Signup Fields
    fullName: string;
    email: string;
    phone: string;
    role: UserRole;

    // Wedding Information (Connected to Track)
    brideName: string;
    groomName: string;
    weddingDate: string;
    venue: string;
    village: string;
    country: string;

    // Optional Additional Details
    alternatePhone?: string;
    familyContactPerson?: string;
    guestCapacityEstimate?: number;
    preferredLanguage?: string;
    specialNotes?: string;
}

export type UpdateProfilePayload = Partial<Omit<UserProfile, 'id' | 'email'>>;

export interface ProfileFormState {
    data: UserProfile;
    errors: Partial<Record<keyof UserProfile, string>>;
    isSubmitting: boolean;
    isDirty: boolean; // Tracks if unsaved changes exist
}
