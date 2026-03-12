import supabase from '../config/db.js';
import { generateQrCode } from '../utils/qrGenerator.js';

import supabase from '../config/db.js';
import { generateQrCode } from '../utils/qrGenerator.js';

export const createWedding = async (req, res) => {
  const { brideName, groomName, venue, date, upiId, village, extraCell } = req.body;
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
          user_id: req.user.id // Enforce ownership
        }
      ])
      .select('id')
      .single();

    if (insertError) throw new Error(insertError.message);
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
      .select('id, bride_name, groom_name, location, wedding_date, village, qr_link')
      .eq('id', id)
      .eq('user_id', req.user.id) // Enforce ownership
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
        qrImageUrl: qrImage
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
