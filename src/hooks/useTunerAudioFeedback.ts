import { useCallback, useEffect, useRef } from 'react';
import { safeLocalGet } from '@/utils/safeStorage';

const FM_MIN = 87.5;
const FM_MAX = 108.0;
const MUSIC_VOLUME_KEY = 'music-volume';
const MUSIC_MUTED_KEY = 'music-muted';
const SWEEP_ATTACK_TC = 0.25;
const STATIC_ATTACK_TC = 0.22;
const SWEEP_RELEASE_TC = 0.04;
const STATIC_RELEASE_TC = 0.04;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const mapFmToTone = (fmFrequency: number): number => {
  const normalized = clamp((fmFrequency - FM_MIN) / (FM_MAX - FM_MIN), 0, 1);
  return 130 + normalized * 420;
};

const readPreferredVolume = (): number => {
  const muted = safeLocalGet(MUSIC_MUTED_KEY);
  if (muted === 'true') return 0;

  const parsed = Number.parseFloat(safeLocalGet(MUSIC_VOLUME_KEY) ?? '');
  const safeVolume = Number.isFinite(parsed) ? clamp(parsed, 0, 1) : 0.7;
  // Keep tuner feedback intentionally subtle versus background music.
  return safeVolume * 0.04;
};

const createRadioStaticBuffer = (context: AudioContext): AudioBuffer => {
  const seconds = 2.4;
  const frameCount = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const channelData = buffer.getChannelData(0);

  for (let i = 0; i < channelData.length; i++) {
    const white = (Math.random() * 2 - 1) * 0.18;
    const crackleBurst = Math.random() < 0.013 ? (Math.random() * 2 - 1) * 0.9 : 0;
    channelData[i] = clamp(white + crackleBurst, -1, 1);
  }

  return buffer;
};

const shouldSkipAudio = (enabled: boolean): boolean => {
  if (!enabled || typeof window === 'undefined') return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
};

interface UseTunerAudioFeedbackOptions {
  enabled: boolean;
}

interface UseTunerAudioFeedbackResult {
  startSweep: (fmFrequency: number, signalStrength: number) => void;
  updateSweep: (fmFrequency: number, signalStrength: number) => void;
  stopSweep: () => void;
  playLockBeep: (fmFrequency: number) => void;
}

export const useTunerAudioFeedback = ({
  enabled,
}: UseTunerAudioFeedbackOptions): UseTunerAudioFeedbackResult => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const sweepOscRef = useRef<OscillatorNode | null>(null);
  const sweepGainRef = useRef<GainNode | null>(null);
  const staticNoiseRef = useRef<AudioBufferSourceNode | null>(null);
  const staticGainRef = useRef<GainNode | null>(null);

  const ensureContext = useCallback((): AudioContext | null => {
    if (shouldSkipAudio(enabled)) return null;

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;

    if (!audioContextRef.current) {
      try {
        const context = new AudioContextCtor();
        const masterGain = context.createGain();
        masterGain.connect(context.destination);
        masterGain.gain.value = 1;

        audioContextRef.current = context;
        masterGainRef.current = masterGain;
      } catch {
        return null;
      }
    }

    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }

    return audioContextRef.current;
  }, [enabled]);

  const stopSweep = useCallback(() => {
    const context = audioContextRef.current;
    if (!context) return;

    const now = context.currentTime;

    if (sweepGainRef.current) {
      sweepGainRef.current.gain.cancelScheduledValues(now);
      sweepGainRef.current.gain.setTargetAtTime(0, now, SWEEP_RELEASE_TC);
    }

    if (staticGainRef.current) {
      staticGainRef.current.gain.cancelScheduledValues(now);
      staticGainRef.current.gain.setTargetAtTime(0, now, STATIC_RELEASE_TC);
    }

    if (sweepOscRef.current) {
      sweepOscRef.current.stop(now + 0.12);
      sweepOscRef.current = null;
    }

    if (staticNoiseRef.current) {
      staticNoiseRef.current.stop(now + 0.12);
      staticNoiseRef.current = null;
    }

    sweepGainRef.current = null;
    staticGainRef.current = null;
  }, []);

  const updateSweep = useCallback(
    (fmFrequency: number, signalStrength: number) => {
      const context = audioContextRef.current;
      const oscillator = sweepOscRef.current;
      const sweepGain = sweepGainRef.current;
      const staticGain = staticGainRef.current;
      if (!context || !oscillator || !sweepGain || !staticGain) return;

      const preferredVolume = readPreferredVolume();
      if (preferredVolume <= 0) {
        stopSweep();
        return;
      }

      const now = context.currentTime;
      const clampedSignal = clamp(signalStrength, 0, 1);
      const toneFrequency = mapFmToTone(fmFrequency);

      oscillator.frequency.cancelScheduledValues(now);
      oscillator.frequency.setTargetAtTime(toneFrequency, now, 0.042);

      sweepGain.gain.cancelScheduledValues(now);
      sweepGain.gain.setTargetAtTime(
        preferredVolume * (0.0003 + clampedSignal * 0.001),
        now,
        SWEEP_ATTACK_TC
      );

      staticGain.gain.cancelScheduledValues(now);
      staticGain.gain.setTargetAtTime(
        preferredVolume * (0.06 + (1 - clampedSignal) * 0.1),
        now,
        STATIC_ATTACK_TC
      );
    },
    [stopSweep]
  );

  const startSweep = useCallback(
    (fmFrequency: number, signalStrength: number) => {
      const context = ensureContext();
      if (!context) return;

      if (!sweepOscRef.current || !sweepGainRef.current || !staticNoiseRef.current || !staticGainRef.current) {
        const oscillator = context.createOscillator();
        const sweepGain = context.createGain();
        oscillator.type = 'sine';
        sweepGain.gain.value = 0;
        oscillator.connect(sweepGain);
        sweepGain.connect(masterGainRef.current!);

        const staticBuffer = createRadioStaticBuffer(context);

        const staticNoise = context.createBufferSource();
        staticNoise.buffer = staticBuffer;
        staticNoise.loop = true;

        const staticHighPass = context.createBiquadFilter();
        staticHighPass.type = 'highpass';
        staticHighPass.frequency.setValueAtTime(950, context.currentTime);
        staticHighPass.Q.value = 0.7;

        const staticLowPass = context.createBiquadFilter();
        staticLowPass.type = 'lowpass';
        staticLowPass.frequency.setValueAtTime(6200, context.currentTime);
        staticLowPass.Q.value = 0.65;

        const staticGain = context.createGain();
        staticGain.gain.value = 0;
        staticNoise.connect(staticHighPass);
        staticHighPass.connect(staticLowPass);
        staticLowPass.connect(staticGain);
        staticGain.connect(masterGainRef.current!);

        oscillator.start();
        staticNoise.start();

        sweepOscRef.current = oscillator;
        sweepGainRef.current = sweepGain;
        staticNoiseRef.current = staticNoise;
        staticGainRef.current = staticGain;
      }

      updateSweep(fmFrequency, signalStrength);
    },
    [ensureContext, updateSweep]
  );

  const playLockBeep = useCallback(
    (fmFrequency: number) => {
      const context = ensureContext();
      if (!context) return;

      const preferredVolume = readPreferredVolume();
      if (preferredVolume <= 0) return;

      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const baseTone = mapFmToTone(fmFrequency) + 170;

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(baseTone * 1.08, now);
      oscillator.frequency.exponentialRampToValueAtTime(baseTone * 0.96, now + 0.2);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(preferredVolume * 0.08, now + 0.016);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

      oscillator.connect(gain);
      gain.connect(masterGainRef.current!);

      oscillator.start(now);
      oscillator.stop(now + 0.22);
    },
    [ensureContext]
  );

  useEffect(() => {
    if (!enabled) {
      stopSweep();
    }
  }, [enabled, stopSweep]);

  useEffect(() => {
    return () => {
      stopSweep();
    };
  }, [stopSweep]);

  return {
    startSweep,
    updateSweep,
    stopSweep,
    playLockBeep,
  };
};

export default useTunerAudioFeedback;
