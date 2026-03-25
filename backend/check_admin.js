import supabase from './config/db.js';

async function checkAdmin() {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*');
  
  if (error) {
    console.error("Error fetching admin users:", error);
    return;
  }
  
  console.log("Admin Users in project2:");
  console.log(JSON.stringify(data, null, 2));
}

checkAdmin();
