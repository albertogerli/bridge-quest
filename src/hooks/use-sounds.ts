"use client";

import { useCallback, useRef } from "react";

export type SoundType =
  | "cardPlay"
  | "trickWon"
  | "trickLost"
  | "correct"
  | "wrong"
  | "levelUp"
  | "chestOpen"
  | "click";

/** Shared AudioContext singleton (created on first use) */
let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedCtx) {
    try {
      sharedCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  // Resume if suspended (browser autoplay policy)
  if (sharedCtx.state === "suspended") {
    sharedCtx.resume();
  }
  return sharedCtx;
}

// ──── Individual sound synthesizers ────

function playCardPlaySound(ctx: AudioContext) {
  // Short click/snap: high-frequency blip, very short
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(1800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.04);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.06);
}

function playTrickWonSound(ctx: AudioContext) {
  // Ascending two-tone chime
  const t = ctx.currentTime;
  [660, 880].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t + i * 0.12);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + i * 0.12 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.25);
    osc.start(t + i * 0.12);
    osc.stop(t + i * 0.12 + 0.25);
  });
}

function playTrickLostSound(ctx: AudioContext) {
  // Descending tone
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(520, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.25);
  gain.gain.setValueAtTime(0.14, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
}

function playCorrectSound(ctx: AudioContext) {
  // Bright ascending arpeggio (C5 - E5 - G5)
  const t = ctx.currentTime;
  [523, 659, 784].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t + i * 0.08);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.16, t + i * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
    osc.start(t + i * 0.08);
    osc.stop(t + i * 0.08 + 0.2);
  });
}

function playWrongSound(ctx: AudioContext) {
  // Low buzz
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
}

function playLevelUpSound(ctx: AudioContext) {
  // Triumphant ascending scale (C5 - D5 - E5 - G5 - C6)
  const t = ctx.currentTime;
  [523, 587, 659, 784, 1047].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t + i * 0.1);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.15, t + i * 0.1 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.3);
    osc.start(t + i * 0.1);
    osc.stop(t + i * 0.1 + 0.3);
  });
}

function playChestOpenSound(ctx: AudioContext) {
  // Sparkle/shimmer: rapid high-frequency notes
  const t = ctx.currentTime;
  [1200, 1600, 2000, 1800, 2400].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t + i * 0.06);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + i * 0.06 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.15);
    osc.start(t + i * 0.06);
    osc.stop(t + i * 0.06 + 0.15);
  });
}

function playClickSound(ctx: AudioContext) {
  // Subtle tap: very short, mid-high frequency
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(1000, ctx.currentTime);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.03);
}

const SOUND_MAP: Record<SoundType, (ctx: AudioContext) => void> = {
  cardPlay: playCardPlaySound,
  trickWon: playTrickWonSound,
  trickLost: playTrickLostSound,
  correct: playCorrectSound,
  wrong: playWrongSound,
  levelUp: playLevelUpSound,
  chestOpen: playChestOpenSound,
  click: playClickSound,
};

// ──── Hook ────

export function useSounds() {
  // Cache the enabled check so we don't read localStorage on every call
  const enabledRef = useRef<boolean | null>(null);

  const isSoundEnabled = useCallback((): boolean => {
    if (typeof window === "undefined") return false;
    // Re-read on every call to respect setting changes in real-time
    const val = localStorage.getItem("bq_sound");
    const enabled = val !== "off";
    enabledRef.current = enabled;
    return enabled;
  }, []);

  const playSound = useCallback(
    (type: SoundType) => {
      if (!isSoundEnabled()) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        SOUND_MAP[type](ctx);
      } catch {
        // Silently ignore audio errors
      }
    },
    [isSoundEnabled]
  );

  return { playSound };
}
