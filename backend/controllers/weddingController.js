import supabase from '../config/db.js';
import { generateQrCode } from '../utils/qrGenerator.js';

/**
 * Derives the QR status from the two stored timestamps.
 * @returns {'inactive'|'active'|'expired'}
 */
const computeQrStatus = (activationTime, expiryTime) => {
  const now = new Date();
  if (now < new Date(activationTime)) return 'inactive';
  if (now < new Date(expiryTime)) return 'active';
  return 'expired';
};

export const createWedding = async (req, res) => {
  let { brideName, groomName, venue, date, upiId, village, extraCell } = req.body;

  // Trim and sanitize inputs
  brideName = brideName?.trim() || '';
  groomName = groomName?.trim() || '';
  venue = venue?.trim() || '';
  village = village?.trim() || '';
  upiId = upiId?.trim() || '';
  extraCell = extraCell?.trim() || '';

  // Strict Name Validation: Alphabets and spaces only, 2-50 characters
  const nameRegex = /^[A-Za-z\s]{2,50}$/;
  const isValidName = (name) => nameRegex.test(name);

  const isValidFutureDate = (dateString) => {
    if (!dateString) return false;
    // Require YYYY-MM-DD format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;

    const d = new Date(dateString);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today;
  };

  // Verbose Validation
  if (!isValidName(brideName)) {
    return res.status(400).json({
      error: "Bride name must contain only alphabets and spaces (2–50 characters)."
    });
  }
  if (!isValidName(groomName)) {
    return res.status(400).json({
      error: "Groom name must contain only alphabets and spaces (2–50 characters)."
    });
  }
  // Venue and Village allow numbers/common punctuation for addresses
  const locationRegex = /^[A-Za-z0-9\s.,'()\-]{2,100}$/;
  if (!locationRegex.test(venue)) {
    return res.status(400).json({
      error: "Venue name must be between 2-100 characters and can include common symbols."
    });
  }
  if (!locationRegex.test(village)) {
    return res.status(400).json({
      error: "Village/Town name must be between 2-100 characters and can include common symbols."
    });
  }

  if (!isValidFutureDate(date)) {
    return res.status(400).json({ error: 'Wedding date cannot be in the past or invalid format (YYYY-MM-DD).' });
  }

  const weddingDate = date;

  try {
    const location = venue;
    const frontendUrl = process.env.FRONTEND_URL || 'https://wedtrackss.vercel.app';

    // Compute activation & expiry times based on whether the event is today or in the future.
    // Dates are compared in UTC (YYYY-MM-DD) to match Supabase storage.
    const todayUtc = new Date().toISOString().slice(0, 10);
    const isToday = weddingDate === todayUtc;
    const now = new Date();

    let qrActivationTime, qrExpiresAt;
    if (isToday) {
      // Event is today → QR is active immediately, expires 24 h from now
      qrActivationTime = now.toISOString();
      qrExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    } else {
      // Event is in the future → QR activates at 00:00 UTC on the wedding date,
      // expires exactly 24 h later (i.e., 00:00 UTC the following day)
      qrActivationTime = new Date(`${weddingDate}T00:00:00.000Z`).toISOString();
      qrExpiresAt = new Date(`${weddingDate}T00:00:00.000Z`).valueOf() + 24 * 60 * 60 * 1000;
      qrExpiresAt = new Date(qrExpiresAt).toISOString();
    }

    // 1. Insert a new record into the weddings table via Supabase API
    const { data: insertData, error: insertError } = await supabase
      .from('weddings')
      .insert([
        {
          bride_name: brideName,
          groom_name: groomName,
          location: location,
          wedding_date: weddingDate,
          upi_id: upiId,
          village: village,
          extra_cell: extraCell,
          user_id: req.user.id,
          qr_activation_time: qrActivationTime,
          qr_expires_at: qrExpiresAt
        }
      ])
      .select('id')
      .single();

    if (insertError) {
      if (insertError.message.includes('column "qr_expires_at" does not exist')) {
        return res.status(500).json({
          error: 'Database schema mismatch',
          details: 'The qr_expires_at column is missing. Please run the migration or add the column to the weddings table.'
        });
      }
      throw new Error(insertError.message);
    }
    const weddingId = insertData.id;

    // 2. Generate a guest form link using the created weddingId
    const qrLink = `${frontendUrl}/guest-form/${weddingId}`;

    // 3. Store the generated qrLink inside the weddings table
    const { error: updateError } = await supabase
      .from('weddings')
      .update({ qr_link: qrLink })
      .eq('id', weddingId)
      .eq('user_id', req.user.id); // Security check

    if (updateError) throw new Error(updateError.message);

    // 4. Return a JSON response with wedding details. (Frontend generates the QR image to save server CPU)
    res.status(201).json({
      weddingId,
      qrLink,
      message: 'Wedding created successfully',
    });
  } catch (error) {
    console.error('Error creating wedding:', error);
    res.status(500).json({ error: 'Failed to create wedding', details: error.message });
  }
};

export const getWeddingQR = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: wedding, error } = await supabase
      .from('weddings')
      .select('id, bride_name, groom_name, location, wedding_date, village, qr_link, qr_activation_time, qr_expires_at')
      .eq('id', id)
      .single();

    if (error || !wedding) {
      return res.status(404).json({ error: 'Wedding track not found', details: error?.message });
    }

    // Generate the QR Image Base64 on the fly since we only stored the link
    const qrImage = await generateQrCode(wedding.qr_link);

    res.status(200).json({
      data: {
        weddingId: wedding.id,
        brideName: wedding.bride_name,
        groomName: wedding.groom_name,
        venue: wedding.location,
        date: wedding.wedding_date,
        village: wedding.village,
        shareLink: wedding.qr_link,
        qrImageUrl: qrImage,
        qrActivationTime: wedding.qr_activation_time,
        qrExpiresAt: wedding.qr_expires_at,
        qrStatus: computeQrStatus(wedding.qr_activation_time, wedding.qr_expires_at)
      }
    });

  } catch (error) {
    console.error('Error fetching wedding QR:', error);
    res.status(500).json({ error: 'Failed to fetch wedding QR', details: error.message });
  }
};
export const getWeddings = async (req, res) => {
  try {
    const { data: weddings, error } = await supabase
      .from('weddings')
      .select('*')
      .eq('user_id', req.user.id) // Enforce ownership
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    res.status(200).json({ data: weddings });
  } catch (error) {
    console.error('Error fetching weddings:', error);
    res.status(500).json({ error: 'Failed to fetch weddings', details: error.message });
  }
};

export const extendWeddingQR = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Check ownership and current status
    const { data: wedding, error: fetchError } = await supabase
      .from('weddings')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !wedding) {
      return res.status(403).json({ error: 'Access denied', details: 'You do not own this wedding track' });
    }

    // 2. Extend expiration to now + 24 hours
    const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from('weddings')
      .update({ qr_expires_at: newExpiry })
      .eq('id', id);

    if (updateError) throw new Error(updateError.message);

    res.status(200).json({
      message: 'QR window extended by 24 hours',
      qrExpiresAt: newExpiry
    });

  } catch (error) {
    console.error('Error extending QR:', error);
    res.status(500).json({ error: 'Failed to extend QR window', details: error.message });
  }
};
