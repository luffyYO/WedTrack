-- WedTrack: Add RPC to update guest FCM token securely from the frontend
-- This acts as a capability token, allowing guests to update their token if they know their ID.

CREATE OR REPLACE FUNCTION update_guest_fcm_token(p_guest_id UUID, p_fcm_token TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE guests
    SET fcm_token = p_fcm_token
    WHERE id = p_guest_id;
END;
$$;
