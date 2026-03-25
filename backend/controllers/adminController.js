import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import supabase from '../config/db.js';
import adminSupabase from '../config/adminDb.js';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_admin_jwt_key_wedtrack';
const JWT_EXPIRES_IN = '12h';

// ─── Helper: log an admin action ─────────────────────────────────────────────
const logAction = async (actionType, description, entityId = null, actorId = null) => {
  try {
    await adminSupabase.from('activity_logs').insert([{
      action_type: actionType,
      description,
      entity_id: entityId,
      actor_id: actorId
    }]);
  } catch (e) {
    // Non-fatal, just skip
  }
};

// ─── POST /admin/login ───────────────────────────────────────────────────────
export const adminLogin = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, username, password_hash, is_2fa_enabled')
      .eq('username', username.toLowerCase().trim())
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (admin.is_2fa_enabled) {
      // Step 1 successful, require Step 2 (TOTP)
      // Issue a short-lived temporary token just for 2FA verification
      const tempToken = jwt.sign(
        { id: admin.id, username: admin.username, pending2FA: true },
        JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.status(200).json({ requires2FA: true, tempToken, username: admin.username });
    }

    // 2FA not enabled, proceed with full login
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await logAction('admin_login', `Admin "${admin.username}" logged in`, null, admin.id);

    return res.status(200).json({ token, username: admin.username });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Server error during login' });
  }
};

// ─── GET /admin/stats ────────────────────────────────────────────────────────
export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date().toISOString();

    const [
      { count: totalWeddings },
      { count: totalGuests },
      { count: totalWishes },
      { count: activeQrs },
      { count: expiredQrs },
      { data: userRows },
    ] = await Promise.all([
      adminSupabase.from('weddings').select('*', { count: 'exact', head: true }),
      adminSupabase.from('guests').select('*', { count: 'exact', head: true }),
      adminSupabase.from('guests').select('*', { count: 'exact', head: true }).not('wishes', 'is', null).neq('wishes', ''),
      adminSupabase.from('weddings').select('*', { count: 'exact', head: true }).lte('qr_activation_time', now).gt('qr_expires_at', now),
      adminSupabase.from('weddings').select('*', { count: 'exact', head: true }).lte('qr_expires_at', now),
      adminSupabase.from('weddings').select('user_id'),
    ]);

    const totalUsers = new Set((userRows || []).map(w => w.user_id)).size;

    return res.status(200).json({
      totalUsers,
      totalWeddings: totalWeddings ?? 0,
      totalGuests: totalGuests ?? 0,
      totalWishes: totalWishes ?? 0,
      activeQrs: activeQrs ?? 0,
      expiredQrs: expiredQrs ?? 0,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// ─── GET /admin/profile ──────────────────────────────────────────────────────
export const getAdminProfile = async (req, res) => {
  try {
    const { data: admin, error } = await adminSupabase
      .from('admin_users')
      .select('username, is_2fa_enabled')
      .eq('id', req.admin.id)
      .single();

    if (error || !admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    return res.status(200).json({
      username: admin.username,
      is2faEnabled: admin.is_2fa_enabled
    });
  } catch (err) {
    console.error('Profile error:', err);
    return res.status(500).json({ error: 'Failed to fetch admin profile' });
  }
};

// ─── GET /admin/users ────────────────────────────────────────────────────────
export const getUsersList = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const from = (page - 1) * limit;

  try {
    // 1. Fetch all weddings to aggregate stats (service role bypasses RLS)
    const { data: weddingRows, error: weddingErr } = await adminSupabase
      .from('weddings')
      .select('user_id, created_at')
      .order('created_at', { ascending: false });

    if (weddingErr) throw new Error(weddingErr.message);

    // 2. Fetch all Auth users to get emails and names (service role required)
    const { data: { users: authUsers }, error: authErr } = await adminSupabase.auth.admin.listUsers();
    
    if (authErr) throw new Error(authErr.message);

    // Create a map for quick lookup
    const userMap = {};
    (authUsers || []).forEach(u => {
      userMap[u.id] = {
        email: u.email,
        full_name: u.user_metadata?.full_name || 'No Name',
      };
    });

    // 3. Aggregate by distinct user_id
    const statsMap = {};
    (weddingRows || []).forEach(row => {
      if (!row.user_id) return; // Skip if user_id is missing or null
      if (!statsMap[row.user_id]) {
        statsMap[row.user_id] = { 
          user_id: row.user_id, 
          email: userMap[row.user_id]?.email || 'N/A',
          full_name: userMap[row.user_id]?.full_name || 'N/A',
          first_wedding: row.created_at, 
          wedding_count: 1 
        };
      } else {
        statsMap[row.user_id].wedding_count++;
      }
    });

    const allUsers = Object.values(statsMap).sort((a, b) => new Date(b.first_wedding) - new Date(a.first_wedding));
    const paged = allUsers.slice(from, from + limit);

    return res.status(200).json({ data: paged, total: allUsers.length, page, limit });
  } catch (err) {
    console.error('Admin users error:', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
};



// ─── GET /admin/weddings ─────────────────────────────────────────────────────
export const getWeddingsList = async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 15;
  const search = req.query.search || '';
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let q = supabase
      .from('weddings')
      .select('id, bride_name, groom_name, location, wedding_date, user_id, qr_activation_time, qr_expires_at, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      q = q.or(`bride_name.ilike.%${search}%,groom_name.ilike.%${search}%,location.ilike.%${search}%`);
    }

    const { data, count, error } = await q;
    if (error) throw new Error(error.message);

    const now = new Date().toISOString();
    const enriched = (data || []).map(w => ({
      ...w,
      qr_status: (!w.qr_activation_time || !w.qr_expires_at)
        ? 'inactive'
        : new Date() < new Date(w.qr_activation_time)
          ? 'inactive'
          : new Date() < new Date(w.qr_expires_at)
            ? 'active'
            : 'expired'
    }));

    return res.status(200).json({ data: enriched, total: count ?? 0, page, limit });
  } catch (err) {
    console.error('Admin weddings error:', err);
    return res.status(500).json({ error: 'Failed to fetch weddings' });
  }
};

// ─── GET /admin/qrs ──────────────────────────────────────────────────────────
export const getQrAnalytics = async (req, res) => {
  const filter = req.query.filter || 'all'; // all | active | expired
  const now = new Date().toISOString();

  try {
    let q = supabase
      .from('weddings')
      .select('id, bride_name, groom_name, qr_link, qr_activation_time, qr_expires_at, created_at')
      .order('created_at', { ascending: false });

    if (filter === 'active') {
      q = q.lte('qr_activation_time', now).gt('qr_expires_at', now);
    } else if (filter === 'expired') {
      q = q.lte('qr_expires_at', now);
    }

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    const enriched = (data || []).map(w => ({
      id: w.id,
      name: `${w.bride_name} & ${w.groom_name}`,
      qr_link: w.qr_link,
      activation: w.qr_activation_time,
      expires: w.qr_expires_at,
      status: (!w.qr_activation_time || !w.qr_expires_at)
        ? 'inactive'
        : new Date() < new Date(w.qr_activation_time)
          ? 'inactive'
          : new Date() < new Date(w.qr_expires_at)
            ? 'active'
            : 'expired'
    }));

    return res.status(200).json({ data: enriched });
  } catch (err) {
    console.error('Admin QRs error:', err);
    return res.status(500).json({ error: 'Failed to fetch QR data' });
  }
};

// ─── GET /admin/logs ─────────────────────────────────────────────────────────
export const getActivityLogs = async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const { data, count, error } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);
    return res.status(200).json({ data: data || [], total: count ?? 0, page, limit });
  } catch (err) {
    console.error('Admin logs error:', err);
    return res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

// ─── PUT /admin/settings ─────────────────────────────────────────────────────
export const updateSettings = async (req, res) => {
  const { newUsername, newPassword } = req.body;
  const adminId = req.admin?.id;

  if (!newUsername && !newPassword) {
    return res.status(400).json({ error: 'Provide newUsername or newPassword to update' });
  }

  try {
    const updates = {};
    if (newUsername) updates.username = newUsername.toLowerCase().trim();
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      updates.password_hash = await bcrypt.hash(newPassword, 12);
    }

    const { error } = await supabase
      .from('admin_users')
      .update(updates)
      .eq('id', adminId);

    if (error) throw new Error(error.message);

    await logAction('admin_settings_update', `Admin updated credentials`, null, adminId);

    return res.status(200).json({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error('Admin settings error:', err);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
};

// ─── DELETE /admin/weddings/:id ─────────────────────────────────────────────
export const deleteWedding = async (req, res) => {
  const { id } = req.params;
  const adminId = req.admin?.id;

  try {
    // Check if wedding exists
    const { data: wedding, error: fetchErr } = await supabase
      .from('weddings')
      .select('bride_name, groom_name')
      .eq('id', id)
      .single();

    if (fetchErr || !wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }

    const { error: delErr } = await supabase
      .from('weddings')
      .delete()
      .eq('id', id);

    if (delErr) throw new Error(delErr.message);

    await logAction('delete_wedding', `Deleted wedding of ${wedding.bride_name} & ${wedding.groom_name}`, id, adminId);

    return res.status(200).json({ message: 'Wedding deleted successfully' });
  } catch (err) {
    console.error('Delete wedding error:', err);
    return res.status(500).json({ error: 'Failed to delete wedding' });
  }
};

// ─── DELETE /admin/users/:id ────────────────────────────────────────────────
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  const adminId = req.admin?.id;

  try {
    // 1. Find all weddings for this user (service role bypasses RLS)
    const { data: userWeddings, error: fetchErr } = await adminSupabase
      .from('weddings')
      .select('id')
      .eq('user_id', id);

    if (fetchErr) throw new Error(fetchErr.message);

    if (userWeddings && userWeddings.length > 0) {
      const weddingIds = userWeddings.map(w => w.id);

      // 2. Delete all guests for those weddings
      const { error: guestErr } = await adminSupabase
        .from('guests')
        .delete()
        .in('wedding_id', weddingIds);

      if (guestErr) throw new Error(guestErr.message);

      // 3. Delete the weddings
      const { error: weddingErr } = await adminSupabase
        .from('weddings')
        .delete()
        .eq('user_id', id);

      if (weddingErr) throw new Error(weddingErr.message);
    }

    // 4. Finally, delete the Auth User itself
    const { error: authDelErr } = await adminSupabase.auth.admin.deleteUser(id);
    if (authDelErr) {
      console.warn(`Auth user ${id} not found or couldn't be deleted:`, authDelErr.message);
    }

    await logAction('delete_user_data', `Deleted all wedding data and auth account for user ${id}`, id, adminId);

    return res.status(200).json({ message: 'User and all associated data deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ error: 'Failed to delete user data' });
  }
};

// ─── POST /admin/verify-2fa ──────────────────────────────────────────────────
export const verify2FA = async (req, res) => {
  const { tempToken, code } = req.body;

  if (!tempToken || !code) {
    return res.status(400).json({ error: 'Token and code are required' });
  }

  try {
    // Verify the temporary token
    const decoded = jwt.verify(tempToken, JWT_SECRET);
    if (!decoded.pending2FA) {
      return res.status(400).json({ error: 'Invalid token type' });
    }

    const { id, username } = decoded;

    // Fetch the admin's secret from the db
    const { data: admin, error } = await adminSupabase
      .from('admin_users')
      .select('totp_secret, is_2fa_enabled')
      .eq('id', id)
      .single();

    if (error || !admin || !admin.is_2fa_enabled || !admin.totp_secret) {
      return res.status(400).json({ error: '2FA is not properly configured for this user' });
    }

    // Verify the TOTP code
    const isValid = speakeasy.totp.verify({
      secret: admin.totp_secret,
      encoding: 'base32',
      token: String(code),
      window: 1
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Code is valid, issue the final auth token
    const token = jwt.sign(
      { id, username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await logAction('admin_login', `Admin "${username}" logged in with 2FA`, null, id);

    return res.status(200).json({ token, username });
  } catch (err) {
    console.error('2FA verification error:', err);
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
};

// ─── POST /admin/2fa/generate ────────────────────────────────────────────────
export const generate2FASecret = async (req, res) => {
  try {
    const adminId = req.admin.id;
    const username = req.admin.username;

    // Check if already enabled
    const { data: admin } = await adminSupabase
      .from('admin_users')
      .select('is_2fa_enabled')
      .eq('id', adminId)
      .single();

    if (admin?.is_2fa_enabled) {
      return res.status(400).json({ error: '2FA is already enabled. Disable it first to regenerate.' });
    }

    const secretObj = speakeasy.generateSecret({ length: 20, name: `WedTrack Admin (${username})` });
    const secret = secretObj.base32;
    const otpauthUrl = secretObj.otpauth_url;
    
    // Generate QR code image url (data URL)
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    // Temporarily save the secret to the DB, but don't enable it yet.
    // We update 'totp_secret' but keep 'is_2fa_enabled' false until verified.
    const { error } = await adminSupabase
      .from('admin_users')
      .update({ totp_secret: secret })
      .eq('id', adminId);

    if (error) throw new Error(error.message);

    res.status(200).json({
      secret,
      qrCodeUrl
    });
  } catch (err) {
    console.error('Generate 2FA error:', err);
    res.status(500).json({ error: 'Failed to generate 2FA secret' });
  }
};

// ─── POST /admin/2fa/enable ──────────────────────────────────────────────────
export const enable2FA = async (req, res) => {
  const { code } = req.body;
  const adminId = req.admin.id;

  if (!code) {
    return res.status(400).json({ error: 'Verification code is required' });
  }

  try {
    const { data: admin, error } = await adminSupabase
      .from('admin_users')
      .select('totp_secret')
      .eq('id', adminId)
      .single();

    if (error || !admin || !admin.totp_secret) {
      return res.status(400).json({ error: 'No 2FA setup in progress' });
    }

    const isValid = speakeasy.totp.verify({
      secret: admin.totp_secret,
      encoding: 'base32',
      token: String(code),
      window: 1
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Enable 2FA
    const { error: updateError } = await adminSupabase
      .from('admin_users')
      .update({ is_2fa_enabled: true })
      .eq('id', adminId);

    if (updateError) throw new Error(updateError.message);

    await logAction('security_update', 'Admin enabled 2FA', null, adminId);

    res.status(200).json({ message: '2FA successfully enabled' });
  } catch (err) {
    console.error('Enable 2FA error:', err);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
};

// ─── POST /admin/2fa/disable ─────────────────────────────────────────────────
export const disable2FA = async (req, res) => {
  // Require password to disable 2FA for security
  const { password } = req.body;
  const adminId = req.admin.id;

  if (!password) {
    return res.status(400).json({ error: 'Password is required to disable 2FA' });
  }

  try {
    const { data: admin, error } = await adminSupabase
      .from('admin_users')
      .select('password_hash')
      .eq('id', adminId)
      .single();

    if (error || !admin) {
      return res.status(400).json({ error: 'Admin not found' });
    }

    const isValidHeader = await bcrypt.compare(password, admin.password_hash);
    if (!isValidHeader) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const { error: updateError } = await adminSupabase
      .from('admin_users')
      .update({ is_2fa_enabled: false, totp_secret: null })
      .eq('id', adminId);

    if (updateError) throw new Error(updateError.message);

    await logAction('security_update', 'Admin disabled 2FA', null, adminId);

    res.status(200).json({ message: '2FA successfully disabled' });
  } catch (err) {
    console.error('Disable 2FA error:', err);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
};

