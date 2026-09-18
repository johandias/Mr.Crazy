import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";
import * as providerErrors from "../src/lib/realtime-provider-error.ts";
import * as realtimeModels from "../src/lib/realtime-models.ts";

const require = createRequire(import.meta.url);
const source = ts.transpileModule(readFileSync(new URL("../src/app/api/realtime/client-secret/route.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const requestId = "12345678-1234-1234-1234-123456789abc";

function setup(t, config = {}) {
  const attempts = [], logs = [];
  const previousKey = process.env.OPENAI_API_KEY;
  const previousModel = process.env.OPENAI_REALTIME_MODEL;
  if (config.noKey) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = "test-secret-key";
  process.env.OPENAI_REALTIME_MODEL = config.envModel ?? "gpt-realtime-2.1-min";
  t.after(() => {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.OPENAI_REALTIME_MODEL;
    else process.env.OPENAI_REALTIME_MODEL = previousModel;
  });
  t.mock.method(console, "error", (...args) => logs.push(args));
  t.mock.method(console, "warn", (...args) => logs.push(args));
  t.mock.method(globalThis, "fetch", async (url, init) => {
    attempts.push({url, init});
    return config.response ?? Response.json({value:"ephemeral-test-key",expires_at:999999});
  });
  const modules = {
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/server-auth": {
      getCurrentSession: async () => config.unauthorized ? null : { status: "approved", email: "test@example.test", role: config.role ?? "admin" },
      getCurrentUser: async () => ({ email: "test@example.test" })
    },
    "@/lib/rate-limiter": { checkRateLimit: async () => ({ allowed: true, limit: 100, remaining: 99 }) },
    "@/lib/realtime-session": { buildRealtimeSession: (_level, _mode, _user, model) => ({ type: "realtime", model }) },
    "@/lib/realtime-provider-error": providerErrors,
    "@/lib/realtime-models": realtimeModels
  };
  const module = { exports: {} };
  new Function("require", "exports", "module", source)(name => modules[name] ?? require(name), module.exports, module);
  return {
    attempts, logs,
    get: () => module.exports.GET(new Request("https://example.test/api/realtime/client-secret?level=basic&mode=free-conversation", {
      method: "GET", headers: { "x-voice-request-id": requestId }
    }))
  };
}

test("mints an ephemeral key with normalized realtime model and no standard API key in response", async t => {
  const p = setup(t);
  const response = await p.get();
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.value, "ephemeral-test-key");
  assert.equal(body.model, "gpt-realtime-2.1-mini");
  assert.equal(p.attempts.length, 1);
  const sent = JSON.parse(p.attempts[0].init.body);
  assert.equal(sent.session.model, "gpt-realtime-2.1-mini");
  assert.doesNotMatch(JSON.stringify(body), /test-secret-key/);
});

test("preserves provider diagnostics for admin when ephemeral key creation fails", async t => {
  const p = setup(t, { response: Response.json({error:{code:"model_not_found",message:"no access; test-secret-key"}},{status:404}) });
  const response = await p.get();
  const body = await response.json();
  assert.equal(response.status, 502);
  assert.equal(body.code, "client_secret_rejected");
  assert.equal(body.providerCode, "model_not_found");
  assert.doesNotMatch(JSON.stringify([body,p.logs]), /test-secret-key/);
});
