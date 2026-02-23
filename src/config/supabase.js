const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const isConfigured =
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl !== 'your_supabase_project_url_here' &&
    supabaseKey !== 'your_supabase_anon_key_here' &&
    supabaseKey !== 'your_supabase_service_role_key_here';

let supabase = null;

if (!isConfigured) {
    console.warn('\n⚠️  ─────────────────────────────────────────────────────────────');
    console.warn('   Supabase credentials NOT configured.');
    console.warn('   Please open backend/.env and add your SUPABASE_URL and SUPABASE_ANON_KEY.');
    console.warn('   Get them from: https://app.supabase.com → Project Settings → API');
    console.warn('   The server will start but all DB operations will fail until configured.');
    console.warn('─────────────────────────────────────────────────────────────\n');
} else {
    try {
        supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
        console.log('✅ Supabase client initialized');
    } catch (err) {
        console.error('❌ Failed to initialize Supabase client:', err.message);
    }
}

module.exports = supabase;
