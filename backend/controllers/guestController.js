import supabase from '../config/db.js';
import { io } from '../server.js';

export const submitGuestForm = async (req, res) => {
  let { 
    weddingId, 
    firstName, 
    lastName, 
    fatherFirstName, 
    fatherLastName, 
    district, 
    village, 
    amount, 
    paymentType, 
    wishes,
    giftSide 
  } = req.body;

  // Trim and sanitize inputs
  firstName = firstName?.trim() || '';
  lastName = lastName?.trim() || '';
  fatherFirstName = fatherFirstName?.trim() || '';
  fatherLastName = fatherLastName?.trim() || '';
  district = district?.trim() || '';
  village = village?.trim() || '';
  wishes = wishes?.trim() || '';

  // Validation function: 2-50 chars, letters/spaces only, block gibberish patterns
  const isValidName = (name) => {
    if (!name) return true; // Optional fields are checked if provided
    if (name.length < 2 || name.length > 100) return false;
    // Allow more characters - sometimes names have hyphens or periods
    if (!/^[A-Za-z\s\.\-]+$/.test(name)) return false; 
    if (/(.)\1{4,}/i.test(name)) return false; // Relaxed repeated chars to 5
    // Relaxed consonants to 10 - many Indian place names/names have long clusters
    if (/[bcdfghjklmnpqrstvwxyz]{10,}/i.test(name)) return false; 
    return true;
  };

  // Required Field Checks
  if (!firstName || !isValidName(firstName)) {
    console.error('Validation failed: firstName invalid', { firstName });
    return res.status(400).json({ message: 'First Name is required and must contain only letters.' });
  }

  // Optional Field Checks
  if (lastName && !isValidName(lastName)) {
    console.log('Validation failed: lastName', { lastName });
    return res.status(400).json({ error: 'Invalid Last Name.' });
  }
  if (fatherFirstName && !isValidName(fatherFirstName)) {
    console.log('Validation failed: fatherFirstName', { fatherFirstName });
    return res.status(400).json({ error: 'Invalid Father\'s First Name.' });
  }
  if (fatherLastName && !isValidName(fatherLastName)) {
    console.log('Validation failed: fatherLastName', { fatherLastName });
    return res.status(400).json({ error: 'Invalid Father\'s Last Name.' });
  }
  if (district && !isValidName(district)) {
    console.log('Validation failed: district', { district });
    return res.status(400).json({ error: 'Invalid District.' });
  }
  if (village && !isValidName(village)) {
    console.log('Validation failed: village', { village });
    return res.status(400).json({ error: 'Invalid Village/City.' });
  }

  // Amount Validation
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    console.error('Validation failed: amount is NaN or <= 0', { amount });
    return res.status(400).json({ message: 'Amount must be a valid number greater than 0.' });
  }

  if (!weddingId) {
    console.error('Validation failed: weddingId is missing');
    return res.status(400).json({ message: 'Wedding ID is missing.' });
  }

  // Gift Side Validation
  if (!giftSide || (giftSide !== 'bride' && giftSide !== 'groom')) {
    return res.status(400).json({ error: 'Please select Bride or Groom side.' });
  }

  try {
    // 1. Validate QR status using both activation_time and expiry
    const { data: wedding, error: fetchError } = await supabase
      .from('weddings')
      .select('qr_activation_time, qr_expires_at')
      .eq('id', weddingId)
      .single();

    if (fetchError || !wedding) {
      return res.status(404).json({ error: 'Wedding track not found' });
    }

    const now = new Date();
    const activation = new Date(wedding.qr_activation_time);
    const expiry = new Date(wedding.qr_expires_at);

    if (now < activation) {
      return res.status(403).json({ error: 'QR Code Not Yet Active. This guest form will open on the event date.' });
    }
    if (now >= expiry) {
      return res.status(403).json({ error: 'QR Code Expired. This guest submission link is no longer active.' });
    }

    const { data, error } = await supabase
      .from('guests')
      .insert([
        {
          wedding_id: weddingId,
          first_name: firstName,
          last_name: lastName,
          father_first_name: fatherFirstName,
          father_last_name: fatherLastName,
          district: district,
          village: village,
          amount: numericAmount,
          payment_type: paymentType,
          wishes: wishes,
          gift_side: giftSide,
          is_paid: false // Host must manually verify payment
        }
      ])
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    // Emit real-time socket event if the guest included a wish
    if (wishes && wishes.trim()) {
      try {
        io.emit('new_wish', {
          id: data.id,
          wedding_id: weddingId,
          first_name: firstName,
          last_name: lastName,
          wishes: wishes.trim(),
          is_read: false,
          created_at: new Date().toISOString(),
        });
      } catch (socketErr) {
        console.warn('Socket emit failed (non-critical):', socketErr.message);
      }
    }

    res.status(201).json({
      message: 'Guest details submitted successfully',
      guestId: data.id
    });
  } catch (error) {
    console.error('Error submitting guest:', error);
    res.status(500).json({ error: 'Failed to submit guest details', details: error.message });
  }
};

export const getGuestsByWedding = async (req, res) => {
  const { weddingId } = req.params;
  const { side } = req.query;

  try {
    // Security check: Ensure the wedding belongs to the user
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id')
      .eq('id', weddingId)
      .eq('user_id', req.user.id)
      .single();

    if (weddingError || !wedding) {
      return res.status(403).json({ error: 'Access denied', details: 'You do not own this wedding track' });
    }

    let query = supabase
      .from('guests')
      .select('*')
      .eq('wedding_id', weddingId);

    if (side && (side === 'bride' || side === 'groom')) {
      query = query.eq('gift_side', side.toLowerCase());
    }

    const { data: guests, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    res.status(200).json({ data: guests });
  } catch (error) {
    console.error('Error fetching guests:', error);
    res.status(500).json({ error: 'Failed to fetch guests', details: error.message });
  }
};

export const confirmGuestPayment = async (req, res) => {
  const { id } = req.params;

  try {
    // First, find the guest to get the wedding_id
    const { data: guestData, error: guestFetchError } = await supabase
      .from('guests')
      .select('wedding_id')
      .eq('id', id)
      .single();

    if (guestFetchError || !guestData) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    // Security check: Ensure the wedding belongs to the user
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id')
      .eq('id', guestData.wedding_id)
      .eq('user_id', req.user.id)
      .single();

    if (weddingError || !wedding) {
      return res.status(403).json({ error: 'Access denied', details: 'You do not own this wedding track' });
    }

    const { data, error } = await supabase
      .from('guests')
      .update({ is_paid: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    res.status(200).json({ message: 'Payment confirmed safely', data });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment', details: error.message });
  }
};

export const deleteGuest = async (req, res) => {
  const { id } = req.params;

  try {
    // First, find the guest to get the wedding_id
    const { data: guestData, error: guestFetchError } = await supabase
      .from('guests')
      .select('wedding_id')
      .eq('id', id)
      .single();

    if (guestFetchError || !guestData) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    // Security check: Ensure the wedding belongs to the user
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id')
      .eq('id', guestData.wedding_id)
      .eq('user_id', req.user.id)
      .single();

    if (weddingError || !wedding) {
      return res.status(403).json({ error: 'Access denied', details: 'You do not own this wedding track' });
    }

    const { error } = await supabase
      .from('guests')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);

    res.status(200).json({ message: 'Fraudulent entry removed safely' });
  } catch (error) {
    console.error('Error deleting guest:', error);
    res.status(500).json({ error: 'Failed to delete guest', details: error.message });
  }
};

// ── Wishes / Notifications ────────────────────────────────────────────────────

export const getWishes = async (req, res) => {
  try {
    // Fetch all weddings owned by this user
    const { data: weddings, error: wError } = await supabase
      .from('weddings')
      .select('id')
      .eq('user_id', req.user.id);

    if (wError) throw new Error(wError.message);
    if (!weddings || weddings.length === 0) {
      return res.status(200).json({ data: [] });
    }

    const weddingIds = weddings.map((w) => w.id);

    // Fetch guests who left a wish
    const { data: wishes, error } = await supabase
      .from('guests')
      .select('id, first_name, last_name, wishes, is_read, created_at, wedding_id')
      .in('wedding_id', weddingIds)
      .not('wishes', 'is', null)
      .neq('wishes', '')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    res.status(200).json({ data: wishes });
  } catch (error) {
    console.error('Error fetching wishes:', error);
    res.status(500).json({ error: 'Failed to fetch wishes', details: error.message });
  }
};

export const markWishesRead = async (req, res) => {
  try {
    // Fetch all weddings owned by this user
    const { data: weddings, error: wError } = await supabase
      .from('weddings')
      .select('id')
      .eq('user_id', req.user.id);

    if (wError) throw new Error(wError.message);
    if (!weddings || weddings.length === 0) {
      return res.status(200).json({ message: 'No weddings found' });
    }

    const weddingIds = weddings.map((w) => w.id);

    const { error } = await supabase
      .from('guests')
      .update({ is_read: true })
      .in('wedding_id', weddingIds)
      .not('wishes', 'is', null)
      .neq('wishes', '')
      .eq('is_read', false);

    if (error) throw new Error(error.message);

    res.status(200).json({ message: 'All wishes marked as read' });
  } catch (error) {
    console.error('Error marking wishes as read:', error);
    res.status(500).json({ error: 'Failed to mark wishes as read', details: error.message });
  }
};