// ─── API Response ─────────────────────────────────────────────────────────────

export interface QRData {
    weddingId: string;
    brideName: string;
    groomName: string;
    venue?: string;
    date?: string;
    /** URL or base64 data URI of the QR image */
    qrImageUrl: string;
    /** Public shareable link encoded in the QR */
    shareLink: string;
    /** Timestamp when the QR expires */
    qrExpiresAt?: string;
}

// ─── Fetch State (discriminated union) ───────────────────────────────────────

export type QRFetchState =
    | { status: 'loading' }
    | { status: 'success'; data: QRData }
    | { status: 'error'; message: string };
