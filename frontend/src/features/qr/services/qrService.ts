import { supabase } from '@/config/supabaseClient';
import client from '@/api/client';
import type { QRData } from '../types/qr.types';

const FRONTEND_URL = (import.meta.env.VITE_APP_BASE_URL || window.location.origin).trim();

/**
 * Map a raw wedding DB row (or edge function response) to QRData.
 * Prefers the secure /q/{token} URL if a token is available,
 * falls back to the legacy /g/{nanoid} URL.
 */
function mapToQRData(wedding: any, token?: string): QRData {
  const nanoid = wedding.nanoid || wedding.id;
  const shareLink = token
    ? `${FRONTEND_URL}/q/${token}`
    : `${FRONTEND_URL}/g/${nanoid}`;

  return {
    weddingId: nanoid,
    brideName: wedding.bride_name,
    groomName: wedding.groom_name,
    venue: wedding.location,
    village: wedding.village,
    date: wedding.wedding_date,
    qrImageUrl: shareLink,
    shareLink,
    qrExpiresAt: wedding.qr_expires_at,
    qrActivationTime: wedding.qr_activation_time ?? wedding.wedding_date ?? null,
    qrStatus: wedding.qr_status,
    qrToken: token ?? null,
  };
}

export const qrService = {
  /**
   * Fetch QR and wedding details for the authenticated QR page.
   * Fast path: direct Supabase query using nanoid column (authenticated user only).
   * Also loads the active QR token (if one exists) to use the secure /q/{token} URL.
   * Fallback: Edge Function get-wedding-details (handles all edge cases).
   */
  getByTrackId: async (trackId: string): Promise<{ data: QRData }> => {
    // Fast path — direct Supabase query using authenticated session
    const { data: wedding, error } = await supabase
      .from('weddings')
      .select('*')
      .eq('nanoid', trackId)
      .maybeSingle();

    if (!error && wedding) {
      // Also fetch active QR token for this wedding
      const { data: tokenRow } = await supabase
        .from('qr_tokens')
        .select('token')
        .eq('wedding_id', wedding.id)
        .eq('revoked', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return { data: mapToQRData(wedding, tokenRow?.token) };
    }

    // Fallback — Edge Function (handles unauthed state, complex queries)
    const response = await client.get(`get-wedding-details?wedding_nanoid=${trackId}`);
    const raw = response.data?.data ?? response.data;
    return { data: mapToQRData(raw) };
  },

  /**
   * Get or create the secure QR token for a wedding.
   * Idempotent — returns existing token if one already exists.
   * Set rotate=true to invalidate the old QR and generate a new one.
   */
  getOrCreateToken: async (
    weddingNanoid: string,
    opts: { rotate?: boolean } = {}
  ): Promise<{ token: string; qr_url: string; is_new: boolean }> => {
    const response = await client.post<{ data: { token: string; qr_url: string; is_new: boolean } }>(
      'generate-qr-token',
      { wedding_nanoid: weddingNanoid, rotate: opts.rotate ?? false }
    );
    return response.data.data;
  },

  /**
   * Build the secure QR URL for a given token.
   * Used to generate the QR code image on the QR page.
   */
  getQRUrl: (token: string): string => `${FRONTEND_URL}/q/${token}`,

  /**
   * Extend the QR expiration by 24 hours.
   * Kept as Edge Function — has business logic for time calculation.
   */
  extend: (trackId: string) =>
    client.post<{ message: string; qr_expires_at: string }>('extend-wedding', {
      wedding_nanoid: trackId
    }),
};
