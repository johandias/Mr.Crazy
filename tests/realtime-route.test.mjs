import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";
import * as providerErrors from "../src/lib/realtime-provider-error.ts";
import * as realtimeModels from "../src/lib/realtime-models.ts";

const require = createRequire(import.meta.url);
const source = ts.transpileModule(readFileSync(new URL("../src/app/api/realtime/session/route.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const requestId = "12345678-1234-1234-1234-123456789abc";

function setup(t, config = {}) {
  const logs = [], attempts = [], models = [];
  const previousKey = process.env.OPENAI_API_KEY;
  const previousModel = process.env.OPENAI_REALTIME_MODEL;
  if (config.noKey) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = "test-secret-key";
  if ("envModel" in config) process.env.OPENAI_REALTIME_MODEL = config.envModel;
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
    if (config.throwFetch) throw config.throwFetch;
    return config.response ?? new Response("v=0\r\n");
  });
  const modules = {
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/server-auth": {
      getCurrentSession: async () => {
        if (config.throwAuth) throw new Error("auth storage unavailable");
        return config.unauthorized ? null : { status: "approved", email: "test@example.test", role: config.role ?? "admin" };
      },
      getCurrentUser: async () => ({ email: "test@example.test" })
    },
    "@/lib/rate-limiter": { checkRateLimit: async () => ({ allowed: true, limit: 100, remaining: 99 }) },
    "@/lib/realtime-session": { buildRealtimeSession: (_level, _mode, _user, model) => {
      models.push(model);
      return { type: "realtime", model };
    } },
    "@/lib/realtime-provider-error": providerErrors,
    "@/lib/realtime-models": realtimeModels
  };
  const module = { exports: {} };
  new Function("require", "exports", "module", source)(name => modules[name] ?? require(name), module.exports, module);
  return {
    logs, attempts, models,
    post: () => module.exports.POST(new Request("https://example.test/api/realtime/session", {
      method: "POST", headers: { "content-type": "application/sdp", "x-voice-request-id": requestId }, body: "v=0\r\n"
    }))
  };
}

test("unauthenticated session has a correlated actionable error without opening provider", async t => {
  const p = setup(t, { unauthorized: true }); const response = await p.post(); const body = await response.json();
  assert.equal(response.status, 401); assert.equal(body.code, "authentication_required");
  assert.equal(body.stage, "authentication"); assert.equal(body.diagnosticId, requestId);
  assert.equal(response.headers.get("X-Voice-Request-Id"), requestId); assert.equal(p.attempts.length, 0);
});

test("missing API configuration and unexpected auth errors are returned as JSON diagnostics", async t => {
  const p = setup(t, { noKey: true }); const response = await p.post(); const body = await response.json();
  assert.equal(response.status, 503); assert.equal(body.code, "realtime_not_configured");
  assert.equal(p.attempts.length, 0);
});

test("auth database failure no longer escapes the route error handler", async t => {
  const p = setup(t, { throwAuth: true }); const response = await p.post(); const body = await response.json();
  assert.equal(response.status, 500); assert.equal(body.failureStage, "authentication");
  assert.equal(body.diagnosticId, requestId);
});

test("provider transcription error is preserved for admin, redacted, and not retried with other conversation models", async t => {
  const p = setup(t, { response: Response.json({ error: { code: "model_not_found", param: "session.audio.input.transcription.model", message: "Model does not exist; test-secret-key" } }, {status:400}) });
  const response = await p.post(); const body = await response.json();
  assert.equal(response.status, 502); assert.equal(body.providerStatus, 400);
  assert.equal(body.providerCode, "model_not_found"); assert.match(body.providerParam, /transcription/);
  assert.equal(body.stage, "openai_session"); assert.equal(p.attempts.length, 1);
  assert.doesNotMatch(JSON.stringify([body,p.logs]), /test-secret-key/);
});

test("non-admin sees quota explanation but not private provider diagnostics", async t => {
  const p = setup(t, { role: "student", response: Response.json({ error: { code:"insufficient_quota", message:"Billing data" } }, {status:429}) });
  const body = await (await p.post()).json();
  assert.equal(body.providerStatus,429); assert.match(body.error,/crédito/);
  assert.equal(body.providerMessage,undefined); assert.equal(body.testedModel,undefined);
});

test("provider timeout names the failed stage and keeps the request identifier", async t => {
  const p = setup(t, { throwFetch: new DOMException("expired","TimeoutError") });
  const response = await p.post(); const body = await response.json();
  assert.equal(response.status,504); assert.equal(body.code,"provider_timeout");
  assert.equal(body.failureStage,"openai_session"); assert.equal(body.diagnosticId,requestId);
});

test("successful SDP response carries the same diagnostic identifier", async t => {
  const p = setup(t); const response = await p.post();
  assert.equal(response.status,200); assert.equal(response.headers.get("X-Voice-Request-Id"),requestId);
  assert.equal(await response.text(),"v=0\r\n"); assert.equal(p.logs.length,0);
});

test("normalizes the common realtime mini model typo from configuration", async t => {
  const p = setup(t, { envModel: "gpt-realtime-2.1-min" });
  const response = await p.post();
  assert.equal(response.status, 200);
  assert.equal(p.models[0], "gpt-realtime-2.1-mini");
  assert.equal(response.headers.get("X-Realtime-Model"), "gpt-realtime-2.1-mini");
  assert.equal(p.attempts.length, 1);
});
