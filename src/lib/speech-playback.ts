export type SpeechSegment = { text: string; lang: "pt-BR" | "en-US" };

type PlaybackOptions = {
  synth: SpeechSynthesis;
  segments: SpeechSegment[];
  createUtterance: (text: string) => SpeechSynthesisUtterance;
  getVoice: (lang: string) => SpeechSynthesisVoice | null;
  onState: (state: "preparing_speech" | "speaking") => void;
  onEnd: () => void;
  onError: (reason: string, remaining: SpeechSegment[]) => void;
};

// Only native playback events may activate the character's speaking animation.
export function playSpeech(options: PlaybackOptions) {
  const { synth, segments } = options;
  let active = true;
  let current: SpeechSynthesisUtterance | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const clearPending = () => {
    clearTimeout(timer);
    synth.removeEventListener("voiceschanged", voicesReady);
  };
  const cancel = () => {
    active = false;
    clearPending();
    current = null;
    synth.cancel();
  };
  const fail = (reason: string, index: number) => {
    if (!active) return;
    cancel();
    options.onError(reason, segments.slice(index));
  };
  const speakSegment = (index: number) => {
    if (!active) return;
    clearPending();
    if (index >= segments.length) {
      active = false;
      current = null;
      options.onEnd();
      return;
    }

    options.onState("preparing_speech");
    const segment = segments[index];
    const utterance = options.createUtterance(segment.text);
    current = utterance;
    const isCurrent = () => active && current === utterance;
    utterance.lang = segment.lang;
    utterance.voice = options.getVoice(segment.lang);
    utterance.rate = segment.lang === "pt-BR" ? 1.02 : 0.92;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => {
      if (!isCurrent()) return;
      clearTimeout(timer);
      options.onState("speaking");
    };
    utterance.onpause = () => {
      if (isCurrent()) options.onState("preparing_speech");
    };
    utterance.onresume = () => {
      if (isCurrent()) options.onState("speaking");
    };
    utterance.onend = () => {
      if (isCurrent()) speakSegment(index + 1);
    };
    utterance.onerror = (event) => {
      if (isCurrent()) fail(event.error, index);
    };
    // Some engines silently queue autoplay without dispatching an error.
    timer = setTimeout(() => fail("start-timeout", index), 8000);
    try {
      synth.speak(utterance);
    } catch {
      fail("unavailable", index);
    }
  };
  function voicesReady() {
    if (synth.getVoices().length) speakSegment(0);
  }

  synth.cancel();
  synth.resume();
  options.onState("preparing_speech");
  if (synth.getVoices().length) {
    speakSegment(0);
  } else {
    synth.addEventListener("voiceschanged", voicesReady);
    timer = setTimeout(() => speakSegment(0), 800);
  }
  return cancel;
}
