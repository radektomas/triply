import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Count all rows
const { count, error: countErr } = await supabase
  .from('trip_cache')
  .select('*', { count: 'exact', head: true });

console.log('Total rows in trip_cache:', count);
if (countErr) console.log('Count error:', countErr);

// Try insert test row to verify write permissions
console.log('\nTesting insert permission...');
const { error: insertErr } = await supabase
  .from('trip_cache')
  .insert({
    cache_key: 'test_debug_' + Date.now(),
    input: { test: true },
    result: { test: true }
  });

if (insertErr) {
  console.log('INSERT BLOCKED:');
  console.log(JSON.stringify(insertErr, null, 2));
} else {
  console.log('INSERT WORKS ✅ (write access OK)');
}
