import "./register-typescript.mjs";
import assert from "node:assert/strict";
import { test } from "node:test";
const { connectRealtime } = await import("../src/lib/realtime-client.ts");
const { openMicrophone } = await import("../src/lib/voice/microphone.ts");

function setup(t, config = {}) {
  const sent = [], states = [], users = [], replies = [], errors = [], tracks = [], statuses = [], diagnostics = [], requests = [];
  t.mock.method(console, "info", () => {});
  class Track extends EventTarget {
    enabled = true;
    muted = false;
    readyState = "live";
    stop() { this.readyState = "ended"; }
  }
  class Stream {
    constructor() { this.track = new Track(); tracks.push(this.track); }
    getAudioTracks() { return [this.track]; }
    getTracks() { return [this.track]; }
  }
  class Channel extends EventTarget {
    readyState = "open";
    send(payload) { sent.push(JSON.parse(payload)); }
    close() { this.readyState = "closed"; }
  }
  const channel = new Channel();
  const emit = event => channel.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(event) }));
  let peer;
  class Peer extends EventTarget {
    connectionState = "connected";
    iceGatheringState = "complete";
    constructor() { super(); peer = this; }
    createDataChannel() { return channel; }
    addTrack(track) { this.track = track; }
    async createOffer() { return { type: "offer", sdp: "v=0\r\n" }; }
    async setLocalDescription(offer) { this.localDescription = offer; }
    async setRemoteDescription() {
      if (config.sessionReady !== false) emit({ type: "session.created" });
      this.dispatchEvent(Object.assign(new Event("track"), { streams: [new Stream()] }));
    }
    close() { this.connectionState = "closed"; }
  }
  const audio = Object.assign(new EventTarget(), { paused: false, srcObject: null, muted: false, style: {}, remove() { this.attached = false; }, setAttribute() {}, play: async () => {}, pause() { this.paused = true; } });
  const doc = Object.assign(new EventTarget(), { visibilityState: "visible", body: { appendChild(element) { element.attached = true; } }, createElement: () => audio });
  const win = new EventTarget();
  const originals = new Map();
  let controller;
  const lifetime = new AbortController();
  const fetchMock = async (url, init) => {
    requests.push({url,init});
    const href = String(url);
    if (config.throwFetch) throw config.throwFetch;
    if (href.includes("/api/realtime/client-secret")) {
      return config.tokenResponse ?? new Response(JSON.stringify({value:"ephemeral-test-key",model:"gpt-realtime-2.1-mini",diagnosticId:"server-id"}), {headers:{"Content-Type":"application/json"}});
    }
    if (href.includes("https://api.openai.com/v1/realtime/calls")) {
      if (config.throwDirect) throw config.throwDirect;
      return config.directResponse ?? config.response ?? new Response("v=0\r\n");
    }
    if (href.includes("/api/realtime/session")) {
      return config.proxyResponse ?? config.response ?? new Response("v=0\r\n");
    }
    return config.response ?? new Response("v=0\r\n");
  };
  for (const [key, value] of Object.entries({ window: win, document: doc, navigator: { mediaDevices: { getUserMedia: config.getUserMedia ?? (async () => new Stream()) } }, RTCPeerConnection: Peer, MediaStream: Stream, fetch: fetchMock })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  t.after(() => {
    controller?.disconnect(); lifetime.abort();
    for (const [key, desc] of originals) {
      if (desc) Object.defineProperty(globalThis, key, desc);
      else delete globalThis[key];
    }
  });
  return {
    connect: async () => controller = await connectRealtime({
      level: "basic", mode: "free-conversation", signal: lifetime.signal, onStatus: value => statuses.push(value),
      onVoiceState: value => states.push(value), onUserTranscript: (text, done) => users.push({text,done}),
      onAssistantTranscript: (text, done) => replies.push({text,done}), onError: value => errors.push(value), onDiagnostic: value => diagnostics.push(value)
    }),
    sent, states, users, replies, errors, tracks, statuses, diagnostics, requests, emit, doc, win, audio, channel, lifetime, Stream,
    get peer() { return peer; }, get microphone() { return tracks[0]; }
  };
}

test("uses one owned microphone track and confirms the provider session before connected", async t => {
  const p = setup(t); await p.connect();
  assert.equal(p.peer.track, p.microphone);
  assert.equal(p.statuses.at(-1), "connected");
  assert.equal(p.states.at(-1), "listening");
  assert.equal(p.requests[0].init.headers["X-Voice-Request-Id"], p.diagnostics[0].id);
  assert.match(String(p.requests[0].url), /client-secret/);
  assert.match(String(p.requests[1].url), /api\.openai\.com\/v1\/realtime\/calls/);
  assert.equal(p.audio.attached, true);
});

test("late Portuguese transcript is preserved without duplicate responses", async t => {
  const p = setup(t); await p.connect();
  p.emit({type:"input_audio_buffer.speech_stopped"});
  p.emit({type:"input_audio_buffer.committed"});
  p.emit({type:"response.created"});
  p.emit({type:"output_audio_buffer.started"});
  const event = {type:"conversation.item.input_audio_transcription.completed",item_id:"u1",transcript:"Me ajuda a pedir água"};
  p.emit(event); p.emit(event);
  assert.equal(p.users.filter(x=>x.done).length,1);
  assert.equal(p.states.at(-1),"speaking");
  assert.equal(p.sent.filter(x=>x.type==="response.create").length,0);
  assert.doesNotMatch(JSON.stringify(p.diagnostics),/pedir água/);
});

test("recovers committed unanswered audio; never depends on transcription", async t => {
  t.mock.timers.enable({apis:["setTimeout"]});
  const p=setup(t);await p.connect();
  p.emit({type:"input_audio_buffer.speech_stopped"});
  p.emit({type:"input_audio_buffer.committed"});
  t.mock.timers.tick(1500);
  assert.equal(p.sent.filter(x=>x.type==="response.create").length,1);
  p.emit({type:"response.created"});
  p.emit({type:"response.output_audio_transcript.done",transcript:"Can I have water?"});
  p.emit({type:"response.done",response:{status:"completed"}});
  t.mock.timers.tick(2000);
  assert.equal(p.sent.filter(x=>x.type==="response.create").length,1);
  assert.equal(p.replies.at(-1).text,"Can I have water?");
});

test("new speech cancels recovery, silence alone does not create a response", async t => {
  t.mock.timers.enable({apis:["setTimeout"]});
  const p=setup(t);await p.connect();
  p.emit({type:"input_audio_buffer.speech_stopped"});t.mock.timers.tick(2000);
  assert.equal(p.sent.length,0);
  p.emit({type:"input_audio_buffer.committed"});p.emit({type:"input_audio_buffer.speech_started"});t.mock.timers.tick(2000);
  assert.equal(p.sent.length,0);
});

test("playback completion resumes listening; mute survives visibility and pageshow", async t => {
  t.mock.timers.enable({apis:["setTimeout"]});
  const p=setup(t);const c=await p.connect();
  p.emit({type:"response.created"});p.emit({type:"output_audio_buffer.started"});
  assert.equal(p.microphone.enabled,false);
  p.emit({type:"response.done",response:{status:"completed"}});
  assert.equal(p.microphone.enabled,false);
  p.emit({type:"output_audio_buffer.stopped"});t.mock.timers.tick(200);
  assert.equal(p.microphone.enabled,true);
  c.setMicrophoneEnabled(false);
  p.doc.visibilityState="hidden";p.doc.dispatchEvent(new Event("visibilitychange"));
  p.doc.visibilityState="visible";p.win.dispatchEvent(new Event("pageshow"));
  assert.equal(p.microphone.enabled,false);
  c.setMicrophoneEnabled(true);assert.equal(p.microphone.enabled,true);
});

test("disconnect releases hardware, audio element and late events", async t => {
  const p=setup(t);const c=await p.connect();c.disconnect();
  const count=p.states.length;p.emit({type:"response.created"});
  assert.equal(p.microphone.readyState,"ended");assert.equal(p.audio.attached,false);assert.equal(p.states.length,count);
});

test("response timeout releases listening and reports a precise error", async t => {
  t.mock.timers.enable({apis:["setTimeout"]});
  const p=setup(t);await p.connect();
  p.emit({type:"response.created"});p.emit({type:"output_audio_buffer.started"});
  t.mock.timers.tick(30_000);
  assert.equal(p.microphone.enabled,true);assert.equal(p.states.at(-1),"listening");
  assert.equal(p.diagnostics.at(-1).code,"response_timeout");
  assert.equal(p.sent.filter(x=>x.type==="response.cancel").length,1);
});

test("background hardware suspension is not treated as a fatal capture failure", async t => {
  t.mock.timers.enable({apis:["setTimeout"]});
  const p=setup(t);await p.connect();
  p.doc.visibilityState="hidden";p.doc.dispatchEvent(new Event("visibilitychange"));
  p.microphone.dispatchEvent(new Event("mute"));t.mock.timers.tick(6000);
  assert.equal(p.statuses.at(-1),"connected");
  p.doc.visibilityState="visible";p.doc.dispatchEvent(new Event("visibilitychange"));
  p.microphone.dispatchEvent(new Event("unmute"));
  assert.equal(p.microphone.enabled,true);
});

test("input meter reads signal independently of provider VAD and stops on mute", async t => {
  t.mock.timers.enable({apis:["setInterval"]});
  const p=setup(t);const levels=[];let closed=0;
  p.win.AudioContext=class {
    state="running";
    createMediaStreamSource() {return {connect(){},disconnect(){}};}
    createAnalyser() {return {fftSize:512,getFloatTimeDomainData(samples){samples.fill(0.05);}};}
    async resume() {} async close() {closed++;}
  };
  const c=await openMicrophone({signal:p.lifetime.signal,onLevel:n=>levels.push(n)});
  t.mock.timers.tick(150);assert.ok(levels.at(-1)>0);
  c.setEnabled(false);t.mock.timers.tick(150);assert.equal(levels.at(-1),0);
  c.stop();assert.equal(closed,1);assert.equal(c.track.readyState,"ended");
});

test("direct HTTP failure falls back to proxy and releases mic when proxy also fails", async t => {
  const p=setup(t,{
    directResponse: Response.json({error:"gateway unavailable"},{status:502}),
    proxyResponse: new Response("<html>gateway unavailable</html>",{status:502})
  });
  await assert.rejects(p.connect());
  assert.equal(p.diagnostics.at(-1).stage,"api");assert.equal(p.diagnostics.at(-1).httpStatus,502);
  assert.equal(p.microphone.readyState,"ended");assert.equal(p.statuses.at(-1),"failed");
  assert.doesNotMatch(JSON.stringify(p.diagnostics),/<html>/);
});

test("permission denial never reaches the API", async t => {
  const p=setup(t,{getUserMedia:async()=>{throw new DOMException("denied","NotAllowedError");}});
  await assert.rejects(p.connect());
  assert.equal(p.requests.length,0);assert.equal(p.diagnostics.at(-1).stage,"microphone");assert.match(p.errors[0],/Permita/);
});

test("aborted permission prompt stops a stream granted after cancellation", async t => {
  let grant;const p=setup(t,{getUserMedia:()=>new Promise(resolve=>{grant=resolve;})});
  const attempt=p.connect();p.lifetime.abort();await assert.rejects(attempt,{name:"AbortError"});
  const stream=new p.Stream();grant(stream);await new Promise(resolve=>setImmediate(resolve));
  assert.equal(stream.track.readyState,"ended");assert.equal(p.requests.length,0);
});

test("open data channel without session acknowledgement times out instead of reporting connected", async t => {
  t.mock.timers.enable({apis:["setTimeout"]});
  const p=setup(t,{sessionReady:false});const attempt=p.connect();
  await new Promise(resolve=>setImmediate(resolve));
  const rejection=assert.rejects(attempt);t.mock.timers.tick(12000);await rejection;
  assert.equal(p.statuses.includes("connected"),false);assert.equal(p.diagnostics.at(-1).code,"transport_timeout");
  assert.equal(p.microphone.readyState,"ended");
});

test("brief network disconnection recovers, terminal failures release microphone", async t => {
  t.mock.timers.enable({apis:["setTimeout"]});
  const p=setup(t);await p.connect();
  p.peer.connectionState="disconnected";p.peer.dispatchEvent(new Event("connectionstatechange"));
  t.mock.timers.tick(2000);p.peer.connectionState="connected";p.peer.dispatchEvent(new Event("connectionstatechange"));
  t.mock.timers.tick(6000);assert.equal(p.microphone.readyState,"live");
  p.channel.dispatchEvent(new Event("close"));assert.equal(p.microphone.readyState,"ended");assert.equal(p.statuses.at(-1),"failed");
});

test("text response is single-flight and repeats of the same answer are not lost", async t => {
  const p=setup(t);const c=await p.connect();
  assert.equal(c.sendText("hello"),true);assert.equal(c.sendText("again"),false);
  for(let i=0;i<2;i++) {p.emit({type:"response.created"});p.emit({type:"response.output_audio_transcript.done",transcript:"Hello!"});p.emit({type:"response.done",response:{status:"completed"}});}
  assert.equal(p.replies.filter(x=>x.done).length,2);
});

test("a selected unavailable device is not silently replaced", async t => {
  let calls=0;setup(t,{getUserMedia:async()=>{calls++;throw new DOMException("device missing","OverconstrainedError");}});
  await assert.rejects(openMicrophone({signal:new AbortController().signal,deviceId:"chosen-device"}));assert.equal(calls,1);
});

test("constraints fallback only retries unsupported constraints", async t => {
  let calls=0;const p=setup(t,{getUserMedia:async()=>{if(++calls===1)throw new DOMException("constraints","OverconstrainedError");return new p.Stream();}});
  const capture=await openMicrophone({signal:new AbortController().signal});assert.equal(calls,2);capture.stop();assert.equal(capture.track.readyState,"ended");
});
