import supabase from '../config/db.js';
import { io } from '../server.js';
import cache from '../utils/cache.js';
import { encryptId, decryptId } from '../utils/obfuscate.js';

export const submitGuestForm = async (req, res) => {
  try {
    // Guard: Prevent crashes from empty request bodies
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Empty request body" });
    }

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
      giftSide,
      email
    } = req.body;

    // Trim and sanitize inputs
    firstName = firstName?.trim() || '';
    lastName = lastName?.trim() || '';
    fatherFirstName = fatherFirstName?.trim() || '';
    fatherLastName = fatherLastName?.trim() || '';
    district = district?.trim() || '';
    village = village?.trim() || '';
    wishes = wishes?.trim() || '';
    email = email?.trim() || '';

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
      return res.status(400).json({ message: 'First Name is required and must contain only letters.' });
    }

    // Optional Field Checks
    if (lastName && !isValidName(lastName)) {
      return res.status(400).json({ error: 'Invalid Last Name.' });
    }
    if (fatherFirstName && !isValidName(fatherFirstName)) {
      return res.status(400).json({ error: 'Invalid Father\'s First Name.' });
    }
    if (fatherLastName && !isValidName(fatherLastName)) {
      return res.status(400).json({ error: 'Invalid Father\'s Last Name.' });
    }
    if (district && !isValidName(district)) {
      return res.status(400).json({ error: 'Invalid District.' });
    }
    if (village && !isValidName(village)) {
      return res.status(400).json({ error: 'Invalid Village/City.' });
    }

    // Amount Validation
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be a valid number greater than 0.' });
    }

    if (!weddingId) {
      return res.status(400).json({ message: 'Wedding ID is missing.' });
    }
    
    // Decrypt the obfuscated wedding ID
    weddingId = decryptId(weddingId);
    if (!weddingId) {
      return res.status(400).json({ message: 'Invalid or tampered Wedding ID.' });
    }

    // Gift Side Validation
    if (!giftSide || (giftSide !== 'bride' && giftSide !== 'groom')) {
      return res.status(400).json({ error: 'Please select Bride or Groom side.' });
    }

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
          last_name: lastName || null,
          father_first_name: fatherFirstName || null,
          father_last_name: fatherLastName || null,
          district: district || null,
          village: village || null,
          amount: numericAmount,
          payment_type: paymentType,
          wishes: wishes || null,
          gift_side: giftSide,
          email: email || null,
          is_paid: false // Host must manually verify payment
        }
      ]);

    if (error) {
      console.error('Supabase Insert Error:', error);
      return res.status(500).json({ error: 'Database error storing guest', details: error.message });
    }

    // 1. Invalidate weddings cache as a safety (though guest submission doesn't change wedding info)
    // 2. Invalidate wishes cache for all weddings in this guest's wedding scope (complex to target, so we clear user's wishes)
    // We don't have req.user here since it's a public route.
    // Instead, we just let it expire or if we had wedding_id, we could invalidate specific keys.
    cache.del(`wishes_${weddingId}`);

    // Emit real-time socket event if the guest included a wish
    if (wishes && wishes.trim()) {
      try {
        io.emit('new_wish', {
          id: Date.now().toString(), // Use timestamp as temporary unique key for React
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

    return res.status(201).json({
      message: 'Guest details submitted successfully'
    });
  } catch (error) {
    console.error('Unexpected Error submitting guest:', error);
    return res.status(500).json({ error: 'Failed to submit guest details', details: error.message });
  }
};

export const getGuestsByWedding = async (req, res) => {
  const weddingId = decryptId(req.params.weddingId);
  if (!weddingId) {
    return res.status(400).json({ error: 'Invalid or tampered Wedding ID' });
  }
  const { side } = req.query;

  try {
    // Security check: Ensure the wedding belongs to the user
    const { data: wedding, error: weddingError } = await req.supabase
      .from('weddings')
      .select('id')
      .eq('id', weddingId)
      .eq('user_id', req.user.id)
      .single();

    if (weddingError || !wedding) {
      return res.status(403).json({ error: 'Access denied', details: 'You do not own this wedding track' });
    }

    // The guests table RLS policies handle access control reliably natively now.
    let query = req.supabase
      .from('guests')
      .select('id, first_name, last_name, father_first_name, amount, payment_type, wishes, gift_side, is_paid, created_at, village, district')
      .eq('wedding_id', weddingId);

    if (side && (side === 'bride' || side === 'groom')) {
      query = query.eq('gift_side', side.toLowerCase());
    }

    const { data: guests, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const secureGuests = guests.map(g => ({
      ...g,
      id: encryptId(g.id),
      wedding_id: encryptId(g.wedding_id)
    }));

    res.status(200).json({ data: secureGuests });
  } catch (error) {
    console.error('Error fetching guests:', error);
    res.status(500).json({ error: 'Failed to fetch guests', details: error.message });
  }
};

export const confirmGuestPayment = async (req, res) => {
  const id = decryptId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid or tampered Guest ID' });
  }

  try {
    // First, find the guest to get the wedding_id
    const { data: guestData, error: guestFetchError } = await req.supabase
      .from('guests')
      .select('wedding_id')
      .eq('id', id)
      .single();

    if (guestFetchError || !guestData) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    // Security check: Ensure the wedding belongs to the user
    const { data: wedding, error: weddingError } = await req.supabase
      .from('weddings')
      .select('id')
      .eq('id', guestData.wedding_id)
      .eq('user_id', req.user.id)
      .single();

    if (weddingError || !wedding) {
      return res.status(403).json({ error: 'Access denied', details: 'You do not own this wedding track' });
    }

    const { data, error } = await req.supabase
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
  const id = decryptId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid or tampered Guest ID' });
  }

  try {
    // First, find the guest to get the wedding_id
    const { data: guestData, error: guestFetchError } = await req.supabase
      .from('guests')
      .select('wedding_id')
      .eq('id', id)
      .single();

    if (guestFetchError || !guestData) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    // Security check: Ensure the wedding belongs to the user
    const { data: wedding, error: weddingError } = await req.supabase
      .from('weddings')
      .select('id')
      .eq('id', guestData.wedding_id)
      .eq('user_id', req.user.id)
      .single();

    if (weddingError || !wedding) {
      return res.status(403).json({ error: 'Access denied', details: 'You do not own this wedding track' });
    }

    const { error } = await req.supabase
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
  const rawWeddingId = req.query.weddingId;
  const weddingId = rawWeddingId ? decryptId(rawWeddingId) : null;
  if (rawWeddingId && !weddingId) {
    return res.status(400).json({ error: 'Invalid or tampered Wedding ID' });
  }

  // ── Per-wedding filtered view (Bug 1 fix) ─────────────────────────────────
  if (weddingId) {
    const cacheKey = `wishes_${weddingId}`;
    const cachedWishes = cache.get(cacheKey);
    if (cachedWishes) {
      return res.status(200).json({ data: cachedWishes, cached: true });
    }

    try {
      // Ownership check: confirm this wedding belongs to the requesting user
      const { data: wedding, error: wError } = await req.supabase
        .from('weddings')
        .select('id')
        .eq('id', weddingId)
        .eq('user_id', req.user.id)
        .single();

      if (wError || !wedding) {
        return res.status(403).json({ error: 'Access denied', details: 'You do not own this wedding track' });
      }

      const { data: wishes, error } = await req.supabase
        .from('guests')
        .select('id, first_name, last_name, wishes, is_read, created_at, wedding_id')
        .eq('wedding_id', weddingId)
        .not('wishes', 'is', null)
        .neq('wishes', '')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      const secureWishes = wishes.map(w => ({
        ...w,
        id: encryptId(w.id),
        wedding_id: encryptId(w.wedding_id)
      }));

      cache.set(cacheKey, secureWishes, 60);
      return res.status(200).json({ data: secureWishes });
    } catch (error) {
      console.error('Error fetching wishes by weddingId:', error);
      return res.status(500).json({ error: 'Failed to fetch wishes', details: error.message });
    }
  }

  // ── Global view: all wishes across all user weddings (existing behaviour) ──
  const cacheKey = `wishes_user_${req.user.id}`;
  const cachedWishes = cache.get(cacheKey);
  if (cachedWishes) {
    return res.status(200).json({ data: cachedWishes, cached: true });
  }

  try {
    // Fetch all weddings owned by this user
    const { data: weddings, error: wError } = await req.supabase
      .from('weddings')
      .select('id')
      .eq('user_id', req.user.id);

    if (wError) throw new Error(wError.message);
    if (!weddings || weddings.length === 0) {
      return res.status(200).json({ data: [] });
    }

    const weddingIds = weddings.map((w) => w.id);

    // Fetch guests who left a wish
    const { data: wishes, error } = await req.supabase
      .from('guests')
      .select('id, first_name, last_name, wishes, is_read, created_at, wedding_id')
      .in('wedding_id', weddingIds)
      .not('wishes', 'is', null)
      .neq('wishes', '')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const secureWishes = wishes.map(w => ({
      ...w,
      id: encryptId(w.id),
      wedding_id: encryptId(w.wedding_id)
    }));

    cache.set(cacheKey, secureWishes, 60); // Cache wishes for 1 minute only (more dynamic)

    res.status(200).json({ data: secureWishes });
  } catch (error) {
    console.error('Error fetching wishes:', error);
    res.status(500).json({ error: 'Failed to fetch wishes', details: error.message });
  }
};

export const markWishesRead = async (req, res) => {
  try {
    // Fetch all weddings owned by this user
    const { data: weddings, error: wError } = await req.supabase
      .from('weddings')
      .select('id')
      .eq('user_id', req.user.id);

    if (wError) throw new Error(wError.message);
    if (!weddings || weddings.length === 0) {
      return res.status(200).json({ message: 'No weddings found' });
    }

    const weddingIds = weddings.map((w) => w.id);

    const { error } = await req.supabase
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