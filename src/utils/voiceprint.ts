/**
 * Voiceprint extraction and acoustic analysis utilities
 * Provides:
 * 1. Whisper vs Normal voice acoustic classifier (Spectral flatness & RMS Energy)
 * 2. Voiceprint enrollment and verification (Fundamental frequency pitch & FFT spectral envelope)
 */

import { VoiceprintProfile } from '../types/audio';

/**
 * Analyze an audio buffer or stream analyser to extract acoustic characteristics
 */
export function analyzeAcousticFrame(analyser: AnalyserNode): {
  rmsEnergy: number;
  spectralFlatness: number;
  estimatedPitch: number;
} {
  const bufferLength = analyser.frequencyBinCount;
  const timeData = new Float32Array(bufferLength);
  const freqData = new Float32Array(bufferLength);

  analyser.getFloatTimeDomainData(timeData);
  analyser.getFloatFrequencyData(freqData);

  // 1. RMS Energy
  let sumSquares = 0;
  for (let i = 0; i < timeData.length; i++) {
    sumSquares += timeData[i] * timeData[i];
  }
  const rms = Math.sqrt(sumSquares / timeData.length);

  // 2. Spectral Flatness (Whisper sound has high spectral flatness / noise-like quality)
  // Geometric mean / Arithmetic mean of power spectrum
  let geometricSum = 0;
  let arithmeticSum = 0;
  const validBins = Math.min(freqData.length, 128);

  for (let i = 2; i < validBins; i++) {
    // Convert dB to linear magnitude
    const magnitude = Math.pow(10, freqData[i] / 20);
    const power = Math.max(1e-12, magnitude * magnitude);
    geometricSum += Math.log(power);
    arithmeticSum += power;
  }

  const count = validBins - 2;
  const geometricMean = Math.exp(geometricSum / count);
  const arithmeticMean = arithmeticSum / count;
  const spectralFlatness = arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;

  // 3. Approximate Pitch (Autocorrelation on time-domain)
  let bestR = 0;
  let bestLag = -1;
  const minLag = 16; // ~1378Hz
  const maxLag = 250; // ~88Hz

  for (let lag = minLag; lag < maxLag; lag++) {
    let r = 0;
    for (let i = 0; i < timeData.length - lag; i++) {
      r += timeData[i] * timeData[i + lag];
    }
    if (r > bestR) {
      bestR = r;
      bestLag = lag;
    }
  }

  const sampleRate = analyser.context.sampleRate || 44100;
  const estimatedPitch = bestLag > 0 ? sampleRate / bestLag : 0;

  return {
    rmsEnergy: rms,
    spectralFlatness: Math.min(1, spectralFlatness),
    estimatedPitch,
  };
}

/**
 * Classify if current frame is Whisper, Normal voice, or Silence
 */
export function classifyVoiceFrame(
  rms: number,
  flatness: number,
  silenceThreshold = 0.005,
  whisperMaxRms = 0.035
): 'silence' | 'whisper' | 'normal' {
  if (rms < silenceThreshold) {
    return 'silence';
  }

  // Whispering typically has:
  // - Low RMS amplitude (soft, quiet)
  // - Higher spectral flatness / lack of strong vocal cord harmonic pitch
  if (rms <= whisperMaxRms && flatness > 0.16) {
    return 'whisper';
  }

  return 'normal';
}

/**
 * Create a Voiceprint Profile from recorded media stream
 */
export async function enrollVoiceprint(
  stream: MediaStream,
  durationSeconds = 4,
  onProgress?: (percent: number) => void
): Promise<VoiceprintProfile> {
  return new Promise((resolve, reject) => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);

    const pitchSamples: number[] = [];
    const energySamples: number[] = [];
    const startTime = Date.now();
    const totalMs = durationSeconds * 1000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / totalMs) * 100));
      onProgress?.(pct);

      const metrics = analyzeAcousticFrame(analyser);
      if (metrics.rmsEnergy > 0.01) {
        if (metrics.estimatedPitch > 70 && metrics.estimatedPitch < 400) {
          pitchSamples.push(metrics.estimatedPitch);
        }
        energySamples.push(metrics.rmsEnergy);
      }

      if (elapsed >= totalMs) {
        clearInterval(interval);
        try {
          stream.getTracks().forEach((t) => {
            t.stop();
            t.enabled = false;
          });
          audioCtx.close().catch(() => {});
        } catch {
          // Ignore
        }

        const avgPitch =
          pitchSamples.length > 0
            ? pitchSamples.reduce((a, b) => a + b, 0) / pitchSamples.length
            : 165;

        // Extract simplified energy bands
        const freqData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freqData);
        const energyProfile = Array.from(freqData.slice(0, 32)).map((v) => v / 255);

        resolve({
          enrolledAt: Date.now(),
          sampleDuration: durationSeconds,
          averagePitch: Math.round(avgPitch),
          energyProfile,
          voiceSummary: `بصمة نبرة صوت (تردد متوسط: ${Math.round(avgPitch)}Hz)`,
        });
      }
    }, 100);
  });
}

/**
 * Check if the live voice frame matches the enrolled voiceprint
 */
export function verifyVoiceMatch(
  currentMetrics: { rmsEnergy: number; estimatedPitch: number },
  profile?: VoiceprintProfile
): boolean {
  if (!profile) return true; // If no profile, allow all
  if (currentMetrics.rmsEnergy < 0.01) return true; // Ambient silence

  // If detected pitch is valid, check tolerance (+- 45Hz)
  if (currentMetrics.estimatedPitch > 60 && currentMetrics.estimatedPitch < 500) {
    const diff = Math.abs(currentMetrics.estimatedPitch - profile.averagePitch);
    if (diff > 55) {
      return false; // Does not match user pitch
    }
  }

  return true;
}
