/**
 * Executa SQL no Supabase usando o endpoint de admin database.
 * Compatível com a API de gestão do Supabase que aceita JWT de projeto.
 * 
 * Uso: node scripts/exec-sql.mjs "SELECT 1"
 *   ou: node scripts/exec-sql.mjs --file path/to/migration.sql
 */
import { readFileSync } from "fs";

function loadEnv() {
  const content = readFileSync(".env.local", "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    env[key] = val;
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = (env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const SERVICE_KEY = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const PROJECT_REF = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "");

const args = process.argv.slice(2);
let sql = "";
if (args[0] === "--file") {
  sql = readFileSync(args[1], "utf-8");
} else {
  sql = args.join(" ");
}

if (!sql.trim()) {
  console.error("❌ Nenhum SQL fornecido. Use: node scripts/exec-sql.mjs 'SELECT 1'");
  process.exit(1);
}

// Tenta vários endpoints do Supabase até um funcionar
const ENDPOINTS = [
  // Management API v2 (aceita service_role como token para projetos próprios)
  {
    url: `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVICE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  },
  // Supabase REST via rpc (se existir a função exec_sql)
  {
    url: `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`
    },
    body: JSON.stringify({ sql_query: sql })
  }
];

async function run() {
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: endpoint.headers,
        body: endpoint.body
      });
      const text = await res.text();
      if (res.ok) {
        console.log("✅ SQL executado com sucesso!");
        try {
          console.log(JSON.parse(text));
        } catch {
          console.log(text || "(sem retorno)");
        }
        return;
      }
      console.warn(`⚠️  ${endpoint.url} → HTTP ${res.status}: ${text.slice(0, 300)}`);
    } catch (err) {
      console.warn(`⚠️  ${endpoint.url} → ${err.message}`);
    }
  }

  console.log("\n❌ Não foi possível executar SQL automaticamente.");
  console.log("\n📋 Execute no Supabase SQL Editor:");
  console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
  console.log("\n--- SQL ---");
  console.log(sql);
  console.log("--- FIM ---\n");
}

run();
