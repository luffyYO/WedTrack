import express from 'express';
import supabase from '../config/db.js';
import { decryptId, encryptId } from '../utils/obfuscate.js';
import { verifyQrToken } from '../utils/qrSigner.js';
import { generateQrCode } from '../utils/qrGenerator.js';
import config from '../config/env.js';

const router = express.Router();

/**
 * GET /api/public/weddings/:id?token=...
 *
 * Public QR endpoint — requires a valid HMAC token in the query string.
 * The :id param must be the encrypted weddingId (never the raw HMAC token).
 *
 * Called by GuestFormPage when ?token= is present in the URL.
 *
 * Fallback: if decryptId fails (e.g. APP_SECRET mismatch between environments),
 * but the HMAC token signature is valid, we look up the wedding by its stored
 * qr_link (which contains the encrypted ID). This handles the case where a QR
 * was generated with a different APP_SECRET than the current server.
 */
router.get('/weddings/:id', async (req, res) => {
  const rawId = req.params.id;
  const token = req.query.token;

  // ── Token required ─────────────────────────────────────────────────────────
  if (!token) {
    return res.status(401).json({ error: 'Missing token. QR token is required.' });
  }

  // ── Reject 2-part HMAC tokens in the :id position ─────────────────────────
  // A valid encrypted ID has 3 dot-separated segments (iv.authTag.enc).
  // An HMAC token has 2 segments (payload.sig) — wrong field entirely.
  const dotParts = rawId ? rawId.split('.') : [];
  if (dotParts.length === 2) {
    console.warn(`[publicRoute] HMAC token mistakenly used as :id param.`);
    return res.status(400).json({
      error: 'Invalid ID format',
      hint: 'Regenerate the QR code from your dashboard.',
    });
  }

  // ── Verify HMAC token signature ────────────────────────────────────────────
  const { valid, reason } = verifyQrToken(rawId, token);
  if (!valid) {
    console.warn(`[publicRoute] QR token rejected: ${reason}`);
    return res.status(403).json({ error: `Invalid or expired QR code: ${reason}` });
  }

  // ── Decrypt the wedding ID ─────────────────────────────────────────────────
  // Primary path: AES-256-GCM decrypt with current APP_SECRET
  let id = decryptId(rawId);

  // ── Fallback: look up by qr_link when APP_SECRET has changed ──────────────
  // The HMAC is already verified above, so this lookup is safe.
  // The qr_link column stores the full URL which includes the encrypted ID.
  if (!id) {
    console.warn(`[publicRoute] decryptId failed for rawId (APP_SECRET mismatch?). Trying qr_link fallback.`);
    try {
      const { data: matched, error: matchErr } = await supabase
        .from('weddings')
        .select('id')
        .like('qr_link', `%${rawId}%`)
        .maybeSingle();

      if (matchErr) {
        console.error('[publicRoute] qr_link fallback query error:', matchErr);
      } else if (matched) {
        id = matched.id;
        console.log(`[publicRoute] qr_link fallback resolved: ${id}`);
      }
    } catch (fallbackErr) {
      console.error('[publicRoute] qr_link fallback threw:', fallbackErr);
    }
  }

  if (!id) {
    return res.status(400).json({
      error: 'Invalid or expired QR code.',
      hint: 'The QR code could not be decoded. Please regenerate it from your dashboard.',
    });
  }

  try {
    const { data: wedding, error } = await supabase
      .from('weddings')
      .select('id, bride_name, groom_name, person_name, event_type, location, wedding_date, village, qr_link, qr_activation_time, qr_expires_at, gallery_images')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[publicRoute] DB error:', error);
      return res.status(500).json({ error: 'Failed to fetch event details.' });
    }

    if (!wedding) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const now = new Date();
    const activationTime = new Date(wedding.qr_activation_time);
    const expiresAt = new Date(wedding.qr_expires_at);

    let qrStatus;
    if (now < activationTime) qrStatus = 'inactive';
    else if (now < expiresAt) qrStatus = 'active';
    else qrStatus = 'expired';

    const actualEncryptedId = encryptId(wedding.id);
    let qrUrl = wedding.qr_link;
    if (!qrUrl || qrUrl.includes(wedding.id)) {
      qrUrl = `${config.FRONTEND_URL}/guest-form/${actualEncryptedId}`;
    }

    let qrImage;
    try {
      qrImage = await generateQrCode(qrUrl);
    } catch (qrError) {
      console.error('[publicRoute] QR image error:', qrError);
      return res.status(500).json({ error: 'Failed to generate QR image.' });
    }

    res.status(200).json({
      data: {
        weddingId: actualEncryptedId,
        event_type: wedding.event_type || 'wedding',
        brideName: wedding.bride_name,
        groomName: wedding.groom_name,
        personName: wedding.person_name,
        venue: wedding.location,
        date: wedding.wedding_date,
        village: wedding.village,
        shareLink: qrUrl,
        qrImageUrl: qrImage,
        qrActivationTime: wedding.qr_activation_time,
        qrExpiresAt: wedding.qr_expires_at,
        qrStatus,
        galleryImages: wedding.gallery_images || [],
      },
    });
  } catch (err) {
    console.error('[publicRoute] Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
