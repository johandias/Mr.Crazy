import "./register-typescript.mjs";
import assert from "node:assert/strict";
import { test } from "node:test";

const { buildRealtimeSession } = await import("../src/lib/realtime-session.ts");

test("gpt realtime transcription config omits unsupported prompt field", () => {
  const session = buildRealtimeSession("basic", "free-conversation", null, "gpt-realtime-2.1-mini");
  assert.equal(session.audio.input.transcription.model, "gpt-realtime-whisper");
  assert.equal("prompt" in session.audio.input.transcription, false);
});

test("non realtime transcription config can keep contextual prompt", () => {
  const session = buildRealtimeSession("basic", "free-conversation", null, "gpt-4o-mini-realtime-preview");
  assert.equal(session.audio.input.transcription.model, "whisper-1");
  assert.equal(typeof session.audio.input.transcription.prompt, "string");
});
