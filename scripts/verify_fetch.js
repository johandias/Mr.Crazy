const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const vars = Object.fromEntries(env.split('\n').map(l => l.split('=')).filter(p => p.length >= 2).map(([k, ...v]) => [k.trim(), v.join('=').trim()]));

const url = vars.NEXT_PUBLIC_SUPABASE_URL;
const key = vars.SUPABASE_SERVICE_ROLE_KEY;

async function check() {
  const tables = ['mrcrazy_users', 'mrcrazy_module_progress', 'mrcrazy_module_evaluations', 'mrcrazy_user_usage', 'mrcrazy_practice_sessions'];
  for (const table of tables) {
    const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    if (res.ok) {
      console.log('Table ' + table + ' exists.');
    } else {
      const text = await res.text();
      console.log('Table ' + table + ' error: ' + res.status + ' ' + text);
    }
  }
}
check();
