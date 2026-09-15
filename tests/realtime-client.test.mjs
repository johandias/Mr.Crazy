import assert from "node:assert/strict";
import { test } from "node:test";
import { connectRealtime, releasePersistentMicrophoneStream } from "../src/lib/realtime-client.ts";

async function setup(t) {
  const sent = [], states = [], users = [], replies = [], errors = [], tracks = [], statuses = [];
  class Track extends EventTarget {
    enabled = true;
    readyState = "live";
    stop() { this.readyState = "ended"; }
  }
  class Stream {
    constructor() { this.track = new Track(); tracks.push(this.track); }
    getAudioTracks() { return [this.track]; }
    getTracks() { return [this.track]; }
    clone() { return new Stream(); }
  }
  class Channel extends EventTarget {
    readyState = "open";
    send(payload) { sent.push(JSON.parse(payload)); }
    close() { this.readyState = "closed"; }
  }
  const channel = new Channel();
  class Peer extends EventTarget {
    connectionState = "connected";
    iceGatheringState = "complete";
    createDataChannel() { return channel; }
    addTrack(track) { this.track = track; }
    async createOffer() { return { type: "offer", sdp: "v=0\r\n" }; }
    async setLocalDescription(offer) { this.localDescription = offer; }
    async setRemoteDescription() { this.ontrack?.({ streams: [new Stream()] }); }
    close() { this.connectionState = "closed"; }
  }
  const audio = { paused: false, srcObject: null, muted: false, style: {}, remove() { this.attached = false; }, setAttribute() {}, play: async () => {}, pause() { this.paused = true; } };
  const doc = Object.assign(new EventTarget(), { visibilityState: "visible", body: { appendChild(element) { element.attached = true; } }, createElement: () => audio });
  const win = Object.assign(new EventTarget(), { setTimeout, clearTimeout, localStorage: { setItem() {} } });
  const originals = new Map();
  for (const [key, value] of Object.entries({ window: win, document: doc, navigator: { mediaDevices: { getUserMedia: async () => new Stream() } }, RTCPeerConnection: Peer, MediaStream: Stream, fetch: async () => new Response("v=0\r\n") })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  releasePersistentMicrophoneStream(true);
  const controller = await connectRealtime({
    level: "basic", mode: "free-conversation", onStatus: status => statuses.push(status),
    onVoiceState: state => states.push(state),
    onUserTranscript: (text, done) => users.push({ text, done }),
    onAssistantTranscript: (text, done) => replies.push({ text, done }),
    onError: message => errors.push(message)
  });
  t.after(() => {
    controller.disconnect();
    releasePersistentMicrophoneStream(true);
    for (const [key, desc] of originals) {
      if (desc) Object.defineProperty(globalThis, key, desc);
      else delete globalThis[key];
    }
  });
  const emit = event => channel.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(event) }));
  return { controller, sent, states, users, replies, errors, emit, doc, win, audio, channel, statuses, source: tracks[0], microphone: tracks[1] };
}

test("late transcription does not discard Portuguese speech or create a duplicate response", async t => {
  const p = await setup(t);
  p.emit({ type: "input_audio_buffer.speech_started" });
  p.emit({ type: "input_audio_buffer.speech_stopped" });
  p.emit({ type: "response.created" });
  p.emit({ type: "output_audio_buffer.started" });
  const transcript = { type: "conversation.item.input_audio_transcription.completed", item_id: "u1", transcript: "Me ajuda a pedir água" };
  p.emit(transcript);
  p.emit(transcript);
  assert.equal(p.users.filter(x => x.done && x.text === transcript.transcript).length, 1);
  assert.equal(p.sent.filter(x => x.type === "response.create").length, 0);
  p.emit({ type: "response.output_audio_transcript.delta", delta: "Para pedir água, diga: " });
  p.emit({ type: "response.output_audio_transcript.done", transcript: "Para pedir água, diga: Can I have some water?" });
  assert.match(p.replies.at(-1).text, /some water/);
  assert.equal(p.replies.at(-1).done, true);
});

test("failed or text-only response restores microphone without waiting for audio stopped", async t => {
  const p = await setup(t);
  p.emit({ type: "response.created" });
  p.emit({ type: "response.done", response: { status: "failed", status_details: { error: { message: "quota exceeded" } } } });
  assert.equal(p.microphone.enabled, true);
  assert.equal(p.states.at(-1), "listening");
  assert.deepEqual(p.errors, ["quota exceeded"]);
});

test("audio completion returns to listening; mute survives background and foreground", async t => {
  const p = await setup(t);
  p.emit({ type: "response.created" });
  p.emit({ type: "output_audio_buffer.started" });
  assert.equal(p.microphone.enabled, false);
  p.emit({ type: "response.done", response: { status: "completed" } });
  assert.equal(p.microphone.enabled, false);
  p.emit({ type: "output_audio_buffer.stopped" });
  await new Promise(resolve => setTimeout(resolve, 220));
  assert.equal(p.microphone.enabled, true);
  p.controller.setMicrophoneEnabled(false);
  p.doc.visibilityState = "hidden";
  p.doc.dispatchEvent(new Event("visibilitychange"));
  p.doc.visibilityState = "visible";
  p.doc.dispatchEvent(new Event("visibilitychange"));
  assert.equal(p.microphone.enabled, false);
});

test("interrupt clears remote audio without permanently muting playback", async t => {
  const p = await setup(t);
  p.emit({ type: "response.created" });
  p.emit({ type: "output_audio_buffer.started" });
  p.controller.interrupt();
  assert.ok(p.sent.some(x => x.type === "output_audio_buffer.clear"));
  assert.equal(p.audio.muted, false);
  assert.equal(p.microphone.enabled, true);
  assert.equal(p.controller.sendText("Como peço água?"), true);
  assert.equal(p.controller.sendText("segunda mensagem"), false);
});

test("disconnect stops capture and ignores late response events", async t => {
  const p = await setup(t);
  p.controller.disconnect();
  const count = p.states.length;
  p.emit({ type: "response.created" });
  assert.equal(p.microphone.readyState, "ended");
  assert.equal(p.states.length, count);
});

test("missing response events time out and release capture instead of freezing", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const p = await setup(t);
  p.emit({ type: "input_audio_buffer.speech_stopped" });
  p.emit({ type: "response.created" });
  t.mock.timers.tick(30_000);
  assert.equal(p.microphone.enabled, true);
  assert.equal(p.states.at(-1), "listening");
  assert.equal(p.errors.length, 1);
  assert.ok(p.sent.some(x => x.type === "response.cancel"));
});

test("committed audio recovers a missing VAD response without waiting for transcription", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const p = await setup(t);
  p.emit({ type: "input_audio_buffer.speech_started" });
  p.emit({ type: "input_audio_buffer.speech_stopped" });
  p.emit({ type: "input_audio_buffer.committed", item_id: "u1" });
  p.emit({ type: "conversation.item.input_audio_transcription.completed", item_id: "u1", transcript: "Quero pedir agua" });
  t.mock.timers.tick(1500);
  assert.equal(p.sent.filter(x => x.type === "response.create").length, 1);
  p.emit({ type: "response.created" });
  p.emit({ type: "response.output_audio_transcript.done", transcript: "Diga: Can I have some water?" });
  p.emit({ type: "response.done", response: { status: "completed" } });
  t.mock.timers.tick(5000);
  assert.equal(p.sent.filter(x => x.type === "response.create").length, 1);
  assert.match(p.replies.at(-1).text, /some water/);
  assert.equal(p.microphone.enabled, true);
});

test("normal automatic response cancels recovery even with delayed transcription", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const p = await setup(t);
  p.emit({ type: "input_audio_buffer.speech_stopped" });
  p.emit({ type: "input_audio_buffer.committed", item_id: "u1" });
  p.emit({ type: "response.created" });
  p.emit({ type: "output_audio_buffer.started" });
  p.emit({ type: "conversation.item.input_audio_transcription.delta", delta: "hello" });
  assert.notEqual(p.states.at(-1), "listening");
  t.mock.timers.tick(2000);
  assert.equal(p.sent.filter(x => x.type === "response.create").length, 0);
});

test("recovery waits while the user continues speaking and never replies to uncommitted silence", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const p = await setup(t);
  p.emit({ type: "input_audio_buffer.speech_stopped" });
  t.mock.timers.tick(2000);
  assert.equal(p.sent.filter(x => x.type === "response.create").length, 0);
  p.emit({ type: "input_audio_buffer.committed", item_id: "u1" });
  p.emit({ type: "input_audio_buffer.speech_started" });
  t.mock.timers.tick(2000);
  assert.equal(p.sent.filter(x => x.type === "response.create").length, 0);
  p.emit({ type: "input_audio_buffer.speech_stopped" });
  p.emit({ type: "input_audio_buffer.committed", item_id: "u2" });
  t.mock.timers.tick(1500);
  assert.equal(p.sent.filter(x => x.type === "response.create").length, 1);
});

test("audio is attached to the page and playback does not shut down the capture source", async t => {
  const p = await setup(t);
  assert.equal(p.audio.attached, true);
  p.emit({ type: "output_audio_buffer.started" });
  p.doc.dispatchEvent(new Event("visibilitychange"));
  assert.equal(p.source.enabled, true);
  assert.equal(p.microphone.enabled, false);
  p.controller.setMicrophoneEnabled(false);
  assert.equal(p.source.enabled, false);
  p.win.dispatchEvent(new Event("pageshow"));
  assert.equal(p.microphone.enabled, false);
  p.controller.disconnect();
  assert.equal(p.audio.attached, false);
});

test("closed transport is reported as failed and stops capture", async t => {
  const p = await setup(t);
  p.channel.dispatchEvent(new Event("close"));
  assert.equal(p.statuses.at(-1), "failed");
  assert.equal(p.microphone.readyState, "ended");
  assert.equal(p.states.at(-1), "idle");
});

test("invalid session settings are surfaced instead of silently ignored", async t => {
  const p = await setup(t);
  p.emit({ type: "error", error: { message: "Invalid session.update field: session.type" } });
  assert.equal(p.errors.length, 1);
});
