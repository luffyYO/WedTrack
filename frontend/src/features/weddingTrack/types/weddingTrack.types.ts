// ─── Wedding Track Form Data ──────────────────────────────────────────────────

export interface WeddingTrackFormData {
    brideName: string;
    groomName: string;
    venue: string;
    date: string;
    village: string;
    extraCell?: string;
}

// ─── Database / API shapes ────────────────────────────────────────────────────

export interface WeddingTrack extends WeddingTrackFormData {
    id: string;
    nanoid: string;
    qrLink?: string;  
    gallery_images?: string[];
    createdAt: string;
}

export interface CreateWeddingTrackPayload {
    bride_name: string;
    groom_name: string;
    location: string;
    wedding_date: string;
    village: string;
    extra_cell?: string;
    gallery_images?: string[];
}

// Shape of the actual inner wedding record returned by create-wedding Edge Function
export interface CreateWeddingTrackResult {
    id: string;
    nanoid: string;
    qr_link: string;
}

// Edge Functions wrap responses as: { success: boolean, data: T }
export interface CreateWeddingTrackResponse {
    success: boolean;
    data: CreateWeddingTrackResult;
}

// ─── Form validation ──────────────────────────────────────────────────────────

export type WeddingTrackFormErrors = Partial<Record<keyof WeddingTrackFormData, string>>;

export interface WeddingTrackFormState {
    data: WeddingTrackFormData;
    errors: WeddingTrackFormErrors;
    isSubmitting: boolean;
    submittedId: string | null;
}
