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

test("teaching instructions use a concise adaptive lesson cycle", () => {
  const session = buildRealtimeSession("basic", "travel", null, "gpt-realtime-2.1-mini", "travel", 0);

  assert.match(session.instructions, /CICLO DE AULA INTELIGENTE/);
  assert.match(session.instructions, /uma decisão útil por turno/);
  assert.match(session.instructions, /no máximo duas novas tentativas/);
  assert.match(session.instructions, /transcrição estiver ambígua/i);
});

test("teacher persona keeps confrontation constructive and audio-aware", () => {
  const session = buildRealtimeSession("intermediate", "work-english", null, "gpt-realtime-2.1-mini");

  assert.match(session.instructions, /SOMENTE depois de erro repetido/i);
  assert.match(session.instructions, /sempre seguido da instrução útil/i);
  assert.match(session.instructions, /Pronúncia, tonicidade e ritmo dependem de áudio inteligível/);
  assert.match(session.instructions, /Não te ouvi com clareza/);
});
