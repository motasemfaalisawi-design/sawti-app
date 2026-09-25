/**
 * Global audio hardware manager to guarantee 100% microphone release
 * and prevent Chrome's recording indicator from persisting.
 */

// Track all active streams across the app
const activeStreams = new Set<MediaStream>();
const activeAudioContexts = new Set<AudioContext>();
let activeRecognitionInstance: any = null;

export function registerActiveStream(stream: MediaStream) {
  activeStreams.add(stream);
  stream.getTracks().forEach((track) => {
    track.addEventListener('ended', () => {
      // Clean up when track ends
      if (stream.getTracks().every((t) => t.readyState === 'ended')) {
        activeStreams.delete(stream);
      }
    });
  });
}

export function unregisterActiveStream(stream: MediaStream) {
  try {
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
        track.enabled = false;
      } catch {
        // Ignore
      }
    });
  } catch {
    // Ignore
  }
  activeStreams.delete(stream);
}

export function registerActiveAudioContext(ctx: AudioContext) {
  activeAudioContexts.add(ctx);
}

export function registerActiveRecognition(rec: any) {
  if (activeRecognitionInstance && activeRecognitionInstance !== rec) {
    try {
      activeRecognitionInstance.onend = null;
      activeRecognitionInstance.onerror = null;
      activeRecognitionInstance.abort();
    } catch {
      // Ignore
    }
  }
  activeRecognitionInstance = rec;
}

export function unregisterActiveRecognition(rec: any) {
  if (activeRecognitionInstance === rec) {
    activeRecognitionInstance = null;
  }
}

/**
 * Hard-stops all microphone hardware, Web Speech API instances,
 * and AudioContexts throughout the entire application.
 */
export function stopAllAudioHardware() {
  // 1. Abort and detach any active SpeechRecognition
  if (activeRecognitionInstance) {
    try {
      const rec = activeRecognitionInstance;
      activeRecognitionInstance = null;
      rec.onstart = null;
      rec.onspeechstart = null;
      rec.onspeechend = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.abort();
    } catch {
      // Ignore
    }
  }

  // 2. Stop every single track on all open MediaStreams
  activeStreams.forEach((stream) => {
    try {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch {
          // Ignore
        }
      });
    } catch {
      // Ignore
    }
  });
  activeStreams.clear();

  // 3. Close all open AudioContext instances
  activeAudioContexts.forEach((ctx) => {
    try {
      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    } catch {
      // Ignore
    }
  });
  activeAudioContexts.clear();
}
