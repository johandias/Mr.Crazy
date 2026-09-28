
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const vars = Object.fromEntries(env.split('\n').map(l => l.split('=')).filter(p => p.length >= 2).map(([k, ...v]) => [k.trim(), v.join('=').trim()]));

const supabase = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const tables = ['mrcrazy_users', 'mrcrazy_module_progress', 'mrcrazy_module_evaluations', 'mrcrazy_user_usage', 'mrcrazy_practice_sessions'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });
    if (error) {
      console.log(Table  error:, error.message);
    } else {
      console.log(Table  exists, count:, data);
    }
  }
}
check();

