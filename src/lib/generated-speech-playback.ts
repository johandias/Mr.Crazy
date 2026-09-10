type GeneratedSpeechPlaybackOptions = {
  text: string;
  fetchAudio: (signal: AbortSignal) => Promise<Blob>;
  createAudio: (url: string) => HTMLAudioElement;
  createObjectUrl: (blob: Blob) => string;
  revokeObjectUrl: (url: string) => void;
  onState: (state: "preparing_speech" | "speaking") => void;
  onEnd: () => void;
  onError: (reason: string) => void;
};

export function playGeneratedSpeech(options: GeneratedSpeechPlaybackOptions) {
  const controller = new AbortController();
  let active = true;
  let audio: HTMLAudioElement | null = null;
  let objectUrl = "";

  const cleanup = () => {
    if (audio) {
      audio.onplaying = null;
      audio.onwaiting = null;
      audio.onstalled = null;
      audio.onended = null;
      audio.onerror = null;
    }
    if (objectUrl) {
      options.revokeObjectUrl(objectUrl);
      objectUrl = "";
    }
  };

  const cancel = () => {
    if (!active) return;
    active = false;
    controller.abort();
    audio?.pause();
    cleanup();
  };

  const fail = (reason: string) => {
    if (!active) return;
    active = false;
    cleanup();
    options.onError(reason);
  };

  options.onState("preparing_speech");
  void options.fetchAudio(controller.signal)
    .then(async (blob) => {
      if (!active) return;
      objectUrl = options.createObjectUrl(blob);
      audio = options.createAudio(objectUrl);
      audio.preload = "auto";
      audio.onplaying = () => {
        if (active) options.onState("speaking");
      };
      audio.onwaiting = () => {
        if (active) options.onState("preparing_speech");
      };
      audio.onstalled = audio.onwaiting;
      audio.onended = () => {
        if (!active) return;
        active = false;
        cleanup();
        options.onEnd();
      };
      audio.onerror = () => fail("playback-failed");

      try {
        await audio.play();
      } catch (error) {
        if (!controller.signal.aborted) {
          fail(error instanceof Error && error.name === "NotAllowedError" ? "not-allowed" : "playback-failed");
        }
      }
    })
    .catch((error) => {
      if (!controller.signal.aborted) {
        fail(error instanceof Error ? error.message : "generation-failed");
      }
    });

  return cancel;
}
