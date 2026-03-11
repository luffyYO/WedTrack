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
    qrCode?: string;  // Base64 data URI of the QR image
    qrLink?: string;  // Public URL encoded in the QR
    createdAt: string;
    updatedAt: string;
}

export type CreateWeddingTrackPayload = WeddingTrackFormData;

export interface CreateWeddingTrackResponse {
    weddingId: string;
    qrLink: string;
    qrCode: string; // Base64 PNG data URI
}

// ─── Form validation ──────────────────────────────────────────────────────────

export type WeddingTrackFormErrors = Partial<Record<keyof WeddingTrackFormData, string>>;

export interface WeddingTrackFormState {
    data: WeddingTrackFormData;
    errors: WeddingTrackFormErrors;
    isSubmitting: boolean;
    submittedId: string | null;
}
