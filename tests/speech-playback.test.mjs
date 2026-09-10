import assert from "node:assert/strict";
import { test } from "node:test";
import { playSpeech } from "../src/lib/speech-playback.ts";

function setup(voices = [{}]) {
  const synth = new EventTarget();
  const utterances = [];
  const states = [];
  const errors = [];
  let ended = 0;
  Object.assign(synth, {
    getVoices: () => voices,
    cancel() {},
    resume() {},
    speak: (utterance) => utterances.push(utterance)
  });
  const segments = [
    { text: "Vamos conversar.", lang: "pt-BR" },
    { text: "How are you?", lang: "en-US" }
  ];
  const cancel = playSpeech({
    synth, segments,
    createUtterance: (text) => ({ text }),
    getVoice: () => null,
    onState: (state) => states.push(state),
    onEnd: () => ended++,
    onError: (reason, remaining) => errors.push({ reason, remaining })
  });
  return { synth, utterances, states, errors, cancel, segments, ended: () => ended };
}

test("animation waits for audio and stops between Portuguese/English segments", () => {
  const p = setup();
  try {
    assert.equal(p.states.at(-1), "preparing_speech");
    assert.ok(!p.states.includes("speaking"));
    p.utterances[0].onstart();
    assert.equal(p.states.at(-1), "speaking");
    p.utterances[0].onend();
    assert.equal(p.states.at(-1), "preparing_speech");
    assert.equal(p.utterances[1].lang, "en-US");
    p.utterances[1].onstart();
    p.utterances[1].onpause();
    assert.equal(p.states.at(-1), "preparing_speech");
    p.utterances[1].onresume();
    assert.equal(p.states.at(-1), "speaking");
    p.utterances[1].onend();
    assert.equal(p.ended(), 1);
  } finally { p.cancel(); }
});

test("blocked autoplay offers the remaining speech without fake speaking", () => {
  const p = setup();
  p.utterances[0].onerror({ error: "not-allowed" });
  assert.equal(p.errors[0].reason, "not-allowed");
  assert.deepEqual(p.errors[0].remaining, p.segments);
  p.utterances[0].onstart();
  assert.ok(!p.states.includes("speaking"));
});

test("cancelled speech cannot update state or enqueue another segment", () => {
  const p = setup();
  p.cancel();
  const before = [...p.states];
  p.utterances[0].onstart();
  p.utterances[0].onend();
  p.utterances[0].onerror({ error: "canceled" });
  assert.deepEqual(p.states, before);
  assert.equal(p.utterances.length, 1);
  assert.equal(p.errors.length, 0);
});

test("silent startup timeout releases playback for a manual retry", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const p = setup();
  t.mock.timers.tick(8000);
  assert.equal(p.errors[0].reason, "start-timeout");
  assert.ok(!p.states.includes("speaking"));
});

test("waits for voices once and never restarts when voices change later", () => {
  const p = setup([]);
  try {
    assert.equal(p.utterances.length, 0);
    p.synth.getVoices = () => [{}];
    p.synth.dispatchEvent(new Event("voiceschanged"));
    p.synth.dispatchEvent(new Event("voiceschanged"));
    assert.equal(p.utterances.length, 1);
  } finally { p.cancel(); }
});

test("a failed English segment retries English without repeating the introduction", () => {
  const p = setup();
  p.utterances[0].onstart();
  p.utterances[0].onend();
  p.utterances[1].onerror({ error: "synthesis-failed" });
  assert.deepEqual(p.errors[0].remaining, [p.segments[1]]);
});
