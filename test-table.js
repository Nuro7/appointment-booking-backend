require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

async function checkTable() {
    console.log('Using URL:', supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Checking for table "time_slots"...');
    const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error testing table:', error);
        if (error.code === 'PGRST205') {
            console.log('\n💡 SUGGESTION: The table definitely does not exist or schema cache needs refresh.');
        }
    } else {
        console.log('✅ Success! Table found and accessible.');
        console.log('Sample data:', data);
    }
}

checkTable();
