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

export interface CreateWeddingTrackResponse {
    id: string;
    nanoid: string;
    qr_link: string;
}

// ─── Form validation ──────────────────────────────────────────────────────────

export type WeddingTrackFormErrors = Partial<Record<keyof WeddingTrackFormData, string>>;

export interface WeddingTrackFormState {
    data: WeddingTrackFormData;
    errors: WeddingTrackFormErrors;
    isSubmitting: boolean;
    submittedId: string | null;
}
