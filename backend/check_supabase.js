import supabase from './config/db.js';
import fs from 'fs';

async function checkSupabaseSchema() {
  let output = "";
  try {
    output += "Fetching one wedding via Supabase...\n";
    const { data, error } = await supabase
      .from('weddings')
      .select('*')
      .limit(1);

    if (error) {
      output += `Supabase Error: ${JSON.stringify(error, null, 2)}\n`;
    } else {
      output += `Data sample: ${JSON.stringify(data, null, 2)}\n`;
      if (data && data.length > 0) {
        output += `Columns present in Supabase response: ${Object.keys(data[0]).join(', ')}\n`;
      } else {
        output += "No data found in weddings table.\n";
      }
    }
  } catch (err) {
    output += `Crash Error: ${err.message}\n`;
  }
  fs.writeFileSync('supabase_debug.txt', output);
  console.log("Debug info written to supabase_debug.txt");
}

checkSupabaseSchema();
