// ─── API Response ─────────────────────────────────────────────────────────────

export interface QRData {
    weddingId: string;
    brideName: string;
    groomName: string;
    venue?: string;
    village?: string;
    date?: string;
    /** URL or base64 data URI of the QR image */
    qrImageUrl: string;
    /** Public shareable link encoded in the QR */
    shareLink: string;
    /** Timestamp when the QR expires */
    qrExpiresAt?: string;
    /** Timestamp when the QR activates */
    qrActivationTime?: string;
    /** Computed status from backend */
    qrStatus?: 'inactive' | 'active' | 'expired';
    /** Secure opaque QR token (12-char alphanumeric). Null if not yet generated. */
    qrToken?: string | null;
}


// ─── Fetch State (discriminated union) ───────────────────────────────────────

export type QRFetchState =
    | { status: 'loading' }
    | { status: 'success'; data: QRData }
    | { status: 'error'; message: string };
