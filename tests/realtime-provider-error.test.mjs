import assert from "node:assert/strict";
import { test } from "node:test";
import { parseRealtimeProviderError, describeRealtimeProviderError } from "../src/lib/realtime-provider-error.ts";

test("preserves structured provider errors and identifies invalid configuration", () => {
  const error = parseRealtimeProviderError(JSON.stringify({error:{code:"invalid_value",param:"session.audio.input.transcription.model",message:"Unsupported transcription model"}}));
  assert.equal(error.param, "session.audio.input.transcription.model");
  assert.equal(error.message, "Unsupported transcription model");
  assert.match(describeRealtimeProviderError(400,error), /configuração/);
});

test("plain text and string error responses no longer lose the provider explanation", () => {
  for (const body of ['{"error":"Model unavailable"}', '"Model unavailable"', '{"detail":"Model unavailable"}', 'Model unavailable']) {
    assert.equal(parseRealtimeProviderError(body).message, "Model unavailable");
  }
});

test("API key and bearer credentials never appear in parsed diagnostics", () => {
  const error = parseRealtimeProviderError('{"error":{"message":"Wrong key sk-proj-test123 and Bearer secret-token and configured-secret"}}', "configured-secret");
  assert.doesNotMatch(error.message, /sk-proj-test123|secret-token|configured-secret/);
  assert.match(error.message, /redacted/);
});

test("HTML gateway responses are omitted and plaintext messages are bounded", () => {
  assert.deepEqual(parseRealtimeProviderError('<html>Internal request details</html>'), {});
  assert.equal(parseRealtimeProviderError("x".repeat(2000)).message.length, 400);
});

test("credit exhaustion is distinct from temporary request limits", () => {
  assert.match(describeRealtimeProviderError(429, {code:"insufficient_quota"}), /crédito/);
  assert.match(describeRealtimeProviderError(429, {code:"rate_limit_exceeded"}), /limite de chamadas/);
});

test("authentication, permissions, unavailable models and provider downtime are distinct", () => {
  assert.match(describeRealtimeProviderError(401, {}), /OPENAI_API_KEY/);
  assert.match(describeRealtimeProviderError(403, {}), /permissão/);
  assert.match(describeRealtimeProviderError(404, {code:"model_not_found"}), /modelo/);
  assert.match(describeRealtimeProviderError(503, {}), /indisponível/);
});
