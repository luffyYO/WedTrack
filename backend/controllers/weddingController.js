import supabase from '../config/db.js';
import { generateQrCode } from '../utils/qrGenerator.js';

export const createWedding = async (req, res) => {
  let { brideName, groomName, venue, date, upiId, village, extraCell } = req.body;

  // Trim and sanitize inputs
  brideName = brideName?.trim() || '';
  groomName = groomName?.trim() || '';
  venue = venue?.trim() || '';
  village = village?.trim() || '';
  upiId = upiId?.trim() || '';
  extraCell = extraCell?.trim() || '';

  // Validation function: 2-50 chars, letters/spaces only, block gibberish patterns
  const isValidName = (name) => {
    if (!name) return false; 
    if (name.length < 2 || name.length > 50) return false;
    if (!/^[A-Za-z\s]+$/.test(name)) return false; 
    if (/(.)\1{3,}/i.test(name)) return false; 
    // Relaxed to 6 consecutive consonants for safer validation of names like "Kshama" or locations
    if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(name)) return false; 
    return true;
  };

  const isValidFutureDate = (dateString) => {
    if (!dateString) return false;
    // Require YYYY-MM-DD or similar format with 4 digit year
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString) && !/^\d{4}\//.test(dateString)) {
       const yearMatch = dateString.match(/^\d{4}/);
       if (!yearMatch) return false;
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today;
  };

  // Verbose Validation
  if (!isValidName(brideName)) return res.status(400).json({ error: "Invalid Bride's Name. Use only letters." });
  if (!isValidName(groomName)) return res.status(400).json({ error: "Invalid Groom's Name. Use only letters." });
  if (!isValidName(venue)) return res.status(400).json({ error: "Invalid Venue name. Use only letters." });
  if (!isValidName(village)) return res.status(400).json({ error: "Invalid Village/Town name. Use only letters." });

  if (!isValidFutureDate(date)) {
    return res.status(400).json({ error: 'Wedding date cannot be in the past or invalid format.' });
  }

  const location = venue;
  const weddingDate = date;

  try {
    // 1. Insert a new record into the weddings table via Supabase API (Port 443)
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
          user_id: req.user.id, // Enforce ownership
          // TEST MODE: Set to 2 minutes instead of 24 hours
          // qr_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Default 24h expiry
          qr_expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString() // Test Mode: 2 minutes
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
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const qrLink = `${frontendUrl}/guest-form/${weddingId}`;

    // 3. Generate a QR code image for that link
    const qrImage = await generateQrCode(qrLink);

    // 4. Store the generated qrLink inside the weddings table
    const { error: updateError } = await supabase
      .from('weddings')
      .update({ qr_link: qrLink })
      .eq('id', weddingId)
      .eq('user_id', req.user.id); // Security check

    if (updateError) throw new Error(updateError.message);

    // 5. Return a JSON response with wedding details and QR information
    res.status(201).json({
      weddingId,
      qrLink,
      qrImage,
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
      .select('id, bride_name, groom_name, location, wedding_date, village, qr_link, qr_expires_at')
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
        qrExpiresAt: wedding.qr_expires_at
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
    // TEST MODE: Set to 2 minutes instead of 24 hours
    // const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const newExpiry = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // Test Mode: 2 minutes

    const { error: updateError } = await supabase
      .from('weddings')
      .update({ qr_expires_at: newExpiry })
      .eq('id', id);

    if (updateError) throw new Error(updateError.message);

    res.status(200).json({
      message: 'QR window extended for 2 minutes (TEST MODE)',
      qrExpiresAt: newExpiry
    });

  } catch (error) {
    console.error('Error extending QR:', error);
    res.status(500).json({ error: 'Failed to extend QR window', details: error.message });
  }
};
