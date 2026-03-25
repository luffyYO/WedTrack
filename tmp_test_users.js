import adminSupabase from '../backend/config/adminDb.js';

async function testListUsers() {
  try {
    const { data: { users }, error } = await adminSupabase.auth.admin.listUsers();
    if (error) throw error;
    console.log('Total users:', users.length);
    if (users.length > 0) {
      console.log('Sample user:', JSON.stringify({
        id: users[0].id,
        email: users[0].email,
        metadata: users[0].user_metadata
      }, null, 2));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testListUsers();
