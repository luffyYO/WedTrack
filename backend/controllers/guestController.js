import supabase from '../config/db.js';

export const submitGuestForm = async (req, res) => {
  const { 
    weddingId, 
    firstName, 
    lastName, 
    fatherFirstName, 
    fatherLastName, 
    district, 
    village, 
    amount, 
    paymentType, 
    wishes 
  } = req.body;

  try {
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
          amount: parseFloat(amount) || 0,
          payment_type: paymentType,
          wishes: wishes,
          is_paid: false // Host must manually verify payment
        }
      ])
      .select('id')
      .single();

    if (error) throw new Error(error.message);

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

    const { data: guests, error } = await supabase
      .from('guests')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false });

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