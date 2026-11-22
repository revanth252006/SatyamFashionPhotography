import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load both root .env and local server/.env
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// Check SUPABASE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY
const supabaseKey = 
  process.env.SUPABASE_SECRET_KEY || 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id')) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
} else {
  console.warn(
    '[Supabase] Warning: SUPABASE_URL or API keys are missing/unset. Running in mock/development mode.'
  );
}

/**
 * Returns initialized Supabase client, or null with clear status if unconfigured.
 */
export function getSupabaseClient() {
  return supabase;
}

export { supabase };
export default supabase;
