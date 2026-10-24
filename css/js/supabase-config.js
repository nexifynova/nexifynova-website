const SUPABASE_URL = 'https://wsflwxtmuuauqmsfhnux.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Y7IodREs-0HHi2BIevgLBQ_WqO63O5I';

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase connected!');
