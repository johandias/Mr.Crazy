import assert from "node:assert/strict";
import { test } from "node:test";
import { playGeneratedSpeech } from "../src/lib/generated-speech-playback.ts";

function setup(fetchAudio = async () => new Blob(["audio"])) {
  const states = [];
  const errors = [];
  const revoked = [];
  const audio = {
    preload: "",
    paused: false,
    play: async () => undefined,
    pause() { this.paused = true; }
  };
  let ended = 0;
  const cancel = playGeneratedSpeech({
    text: "Teste",
    fetchAudio,
    createAudio: () => audio,
    createObjectUrl: () => "blob:test",
    revokeObjectUrl: (url) => revoked.push(url),
    onState: (state) => states.push(state),
    onEnd: () => ended++,
    onError: (reason) => errors.push(reason)
  });
  return { audio, states, errors, revoked, cancel, ended: () => ended };
}

test("character only speaks after generated audio really starts", async () => {
  const p = setup();
  await new Promise(setImmediate);
  assert.deepEqual(p.states, ["preparing_speech"]);
  p.audio.onplaying();
  assert.equal(p.states.at(-1), "speaking");
  p.audio.onwaiting();
  assert.equal(p.states.at(-1), "preparing_speech");
  p.audio.onplaying();
  p.audio.onended();
  assert.equal(p.ended(), 1);
  assert.deepEqual(p.revoked, ["blob:test"]);
});

test("generation failure activates fallback without fake speaking", async () => {
  const p = setup(async () => { throw new Error("speech-502"); });
  await new Promise(setImmediate);
  assert.deepEqual(p.states, ["preparing_speech"]);
  assert.deepEqual(p.errors, ["speech-502"]);
});

test("cancel aborts preparation and ignores late audio", async () => {
  let resolveAudio;
  const p = setup(() => new Promise((resolve) => { resolveAudio = resolve; }));
  p.cancel();
  resolveAudio(new Blob(["late"]));
  await new Promise(setImmediate);
  assert.equal(p.audio.paused, false);
  assert.deepEqual(p.states, ["preparing_speech"]);
  assert.equal(p.ended(), 0);
});
