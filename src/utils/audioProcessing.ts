import { audioBufferToWav } from './wavEncoder';

let sharedAudioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioContext = new AudioCtx();
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume();
  }
  return sharedAudioContext;
}

export async function decodeAudioBlob(blob: Blob): Promise<AudioBuffer> {
  const audioCtx = getAudioContext();
  const arrayBuffer = await blob.arrayBuffer();
  // decodeAudioData consumes arrayBuffer, so we slice or pass directly
  return await audioCtx.decodeAudioData(arrayBuffer);
}

/**
 * Extracts a normalized array of peak amplitudes (0 to 1) for waveform rendering
 */
export function extractPeaks(audioBuffer: AudioBuffer, peakCount = 120): number[] {
  const channelData = audioBuffer.getChannelData(0);
  const totalSamples = channelData.length;
  const blockSize = Math.floor(totalSamples / peakCount);
  const peaks: number[] = [];

  for (let i = 0; i < peakCount; i++) {
    const start = i * blockSize;
    let sum = 0;
    let max = 0;

    for (let j = 0; j < blockSize; j++) {
      const val = Math.abs(channelData[start + j] || 0);
      if (val > max) max = val;
      sum += val;
    }

    const avg = sum / blockSize;
    // Mix max and avg for visually aesthetic waveform
    const combined = max * 0.7 + avg * 0.3;
    peaks.push(Math.min(1, Math.max(0.04, combined)));
  }

  // Normalize peaks so maximum reaches ~0.95
  const globalMax = Math.max(...peaks, 0.05);
  return peaks.map((p) => Math.min(1, p / globalMax));
}

/**
 * Trims an AudioBuffer from startSec to endSec and returns a new AudioBuffer + WAV blob
 */
export function trimAudioBuffer(
  buffer: AudioBuffer,
  startSec: number,
  endSec: number
): { buffer: AudioBuffer; wavBlob: Blob } {
  const audioCtx = getAudioContext();
  const sampleRate = buffer.sampleRate;
  const channels = buffer.numberOfChannels;

  const startSample = Math.max(0, Math.floor(startSec * sampleRate));
  const endSample = Math.min(buffer.length, Math.floor(endSec * sampleRate));
  const frameCount = Math.max(1, endSample - startSample);

  const trimmedBuffer = audioCtx.createBuffer(channels, frameCount, sampleRate);

  for (let i = 0; i < channels; i++) {
    const srcData = buffer.getChannelData(i);
    const destData = trimmedBuffer.getChannelData(i);
    const slice = srcData.subarray(startSample, endSample);
    destData.set(slice);
  }

  const wavBlob = audioBufferToWav(trimmedBuffer);
  return { buffer: trimmedBuffer, wavBlob };
}

/**
 * Formats time in seconds to mm:ss or mm:ss.d
 */
export function formatTime(seconds: number, includeMs = false): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (includeMs) {
    return `${pad(mins)}:${pad(secs)}.${ms}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Formats bytes to KB or MB
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Calculates current RMS decibels from AnalyserNode byte frequency or time-domain data
 */
export function calculateDecibels(timeDomainData: Uint8Array): { db: number; isClipping: boolean } {
  let sum = 0;
  let max = 0;
  for (let i = 0; i < timeDomainData.length; i++) {
    // Uint8Array ranges 0 to 255 with 128 as silence
    const sample = (timeDomainData[i] - 128) / 128;
    sum += sample * sample;
    const abs = Math.abs(sample);
    if (abs > max) max = abs;
  }
  const rms = Math.sqrt(sum / timeDomainData.length);
  // Convert to dB (-60dB to 0dB)
  let db = 20 * Math.log10(rms || 0.0001);
  if (db < -60) db = -60;
  if (db > 0) db = 0;

  return {
    db: Math.round(db),
    isClipping: max >= 0.98,
  };
}
