import { useState, useRef, useEffect, useCallback } from 'react';
import { AudioEffectType, RecordingItem } from '../types/audio';
import { getAudioContext } from '../utils/audioProcessing';

export interface UseAudioPlayerReturn {
  currentRecording: RecordingItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
  audioEffect: AudioEffectType;
  trimRange: [number, number] | null;
  loadRecording: (item: RecordingItem, autoPlay?: boolean) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setSpeed: (rate: number) => void;
  setVol: (vol: number) => void;
  toggleMute: () => void;
  toggleLoop: () => void;
  setEffect: (effect: AudioEffectType) => void;
  setTrim: (range: [number, number] | null) => void;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [currentRecording, setCurrentRecording] = useState<RecordingItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [audioEffect, setAudioEffect] = useState<AudioEffectType>('normal');
  const [trimRange, setTrimRange] = useState<[number, number] | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const vocalFilterRef = useRef<BiquadFilterNode | null>(null);
  const highpassFilterRef = useRef<BiquadFilterNode | null>(null);

  // Initialize Web Audio Nodes for effects
  const setupAudioGraph = useCallback((audioEl: HTMLAudioElement) => {
    try {
      const audioCtx = getAudioContext();
      if (!sourceNodeRef.current) {
        const source = audioCtx.createMediaElementSource(audioEl);
        sourceNodeRef.current = source;

        const gainNode = audioCtx.createGain();
        gainNodeRef.current = gainNode;

        const bassFilter = audioCtx.createBiquadFilter();
        bassFilter.type = 'lowshelf';
        bassFilter.frequency.value = 200;
        bassFilter.gain.value = 0;
        bassFilterRef.current = bassFilter;

        const vocalFilter = audioCtx.createBiquadFilter();
        vocalFilter.type = 'peaking';
        vocalFilter.frequency.value = 2500;
        vocalFilter.Q.value = 1.0;
        vocalFilter.gain.value = 0;
        vocalFilterRef.current = vocalFilter;

        const highpassFilter = audioCtx.createBiquadFilter();
        highpassFilter.type = 'highpass';
        highpassFilter.frequency.value = 20; // default off
        highpassFilterRef.current = highpassFilter;

        // Connect chain: source -> highpass -> bass -> vocal -> gain -> destination
        source.connect(highpassFilter);
        highpassFilter.connect(bassFilter);
        bassFilter.connect(vocalFilter);
        vocalFilter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
      }
    } catch (e) {
      console.warn('Web Audio Graph error:', e);
    }
  }, []);

  // Apply effect changes to Web Audio filters
  useEffect(() => {
    if (!bassFilterRef.current || !vocalFilterRef.current || !highpassFilterRef.current) return;

    if (audioEffect === 'normal') {
      bassFilterRef.current.gain.value = 0;
      vocalFilterRef.current.gain.value = 0;
      highpassFilterRef.current.frequency.value = 20;
    } else if (audioEffect === 'vocal_enhance') {
      bassFilterRef.current.gain.value = -3;
      vocalFilterRef.current.gain.value = 6;
      highpassFilterRef.current.frequency.value = 120;
    } else if (audioEffect === 'bass_boost') {
      bassFilterRef.current.gain.value = 7;
      vocalFilterRef.current.gain.value = 0;
      highpassFilterRef.current.frequency.value = 20;
    } else if (audioEffect === 'clean_voice') {
      bassFilterRef.current.gain.value = -6;
      vocalFilterRef.current.gain.value = 3;
      highpassFilterRef.current.frequency.value = 220; // Cuts low rumble
    }
  }, [audioEffect]);

  // Load recording
  const loadRecording = useCallback(
    (item: RecordingItem, autoPlay = false) => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      if (!audioRef.current) {
        const audio = new Audio();
        audioRef.current = audio;
        setupAudioGraph(audio);
      }

      const audio = audioRef.current;
      const url = URL.createObjectURL(item.blob);
      objectUrlRef.current = url;

      audio.src = url;
      audio.playbackRate = playbackRate;
      audio.volume = isMuted ? 0 : volume;
      audio.loop = isLooping;

      setCurrentRecording(item);
      setCurrentTime(0);
      setDuration(item.duration || 0);
      setTrimRange(null);

      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          setDuration(audio.duration);
        }
      };

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);

        // Check trim boundary if trimming is active
        if (trimRange) {
          const [start, end] = trimRange;
          if (audio.currentTime >= end) {
            if (isLooping) {
              audio.currentTime = start;
            } else {
              audio.pause();
              setIsPlaying(false);
              audio.currentTime = start;
            }
          }
        }
      };

      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => {
        if (!audio.loop) {
          setIsPlaying(false);
          setCurrentTime(0);
        }
      };

      if (autoPlay) {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume();
        audio.play().catch(() => {});
      }
    },
    [playbackRate, isMuted, volume, isLooping, setupAudioGraph, trimRange]
  );

  const play = useCallback(() => {
    if (audioRef.current) {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume();

      // If trim is active and playhead is outside trim range, jump to start
      if (trimRange) {
        if (audioRef.current.currentTime < trimRange[0] || audioRef.current.currentTime >= trimRange[1]) {
          audioRef.current.currentTime = trimRange[0];
        }
      }

      audioRef.current.play().catch((err) => console.warn('Play error:', err));
    }
  }, [trimRange]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  const seek = useCallback(
    (seconds: number) => {
      if (audioRef.current) {
        let target = Math.max(0, Math.min(duration, seconds));
        if (trimRange) {
          target = Math.max(trimRange[0], Math.min(trimRange[1], target));
        }
        audioRef.current.currentTime = target;
        setCurrentTime(target);
      }
    },
    [duration, trimRange]
  );

  const setSpeed = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  const setVol = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolume(clamped);
    setIsMuted(clamped === 0);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volume || 1;
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  }, [isMuted, volume]);

  const toggleLoop = useCallback(() => {
    setIsLooping((prev) => {
      const next = !prev;
      if (audioRef.current) audioRef.current.loop = next;
      return next;
    });
  }, []);

  const setTrim = useCallback((range: [number, number] | null) => {
    setTrimRange(range);
    if (range && audioRef.current) {
      audioRef.current.currentTime = range[0];
      setCurrentTime(range[0]);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  return {
    currentRecording,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    isMuted,
    isLooping,
    audioEffect,
    trimRange,
    loadRecording,
    play,
    pause,
    togglePlay,
    seek,
    setSpeed,
    setVol,
    toggleMute,
    toggleLoop,
    setEffect: setAudioEffect,
    setTrim,
  };
}
