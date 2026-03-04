/**
 * AudioManager - Singleton per la gestione degli effetti sonori
 * Sintetizza tutti i suoni programmaticamente usando Web Audio API
 */

export type SoundName =
  | 'cardPlay'
  | 'trickWon'
  | 'contractMade'
  | 'contractFailed'
  | 'levelUp'
  | 'badgeUnlock'
  | 'buttonClick'
  | 'error'
  | 'countdown'
  | 'success';

class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.5;

  private constructor() {
    // Carica le preferenze da localStorage
    const savedEnabled = localStorage.getItem('bq_sound_enabled');
    const savedVolume = localStorage.getItem('bq_sound_volume');

    this.enabled = savedEnabled !== null ? savedEnabled === 'true' : true;
    this.volume = savedVolume !== null ? parseFloat(savedVolume) : 0.5;
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API non supportata:', e);
        return null;
      }
    }

    // Riprendi il context se è sospeso (richiesto dai browser)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.warn('Impossibile riprendere AudioContext:', e));
    }

    return this.ctx;
  }

  play(sound: SoundName): void {
    if (!this.enabled) return;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      switch (sound) {
        case 'cardPlay':
          this.playCardPlay(ctx);
          break;
        case 'trickWon':
          this.playTrickWon(ctx);
          break;
        case 'contractMade':
          this.playContractMade(ctx);
          break;
        case 'contractFailed':
          this.playContractFailed(ctx);
          break;
        case 'levelUp':
          this.playLevelUp(ctx);
          break;
        case 'badgeUnlock':
          this.playBadgeUnlock(ctx);
          break;
        case 'buttonClick':
          this.playButtonClick(ctx);
          break;
        case 'error':
          this.playError(ctx);
          break;
        case 'countdown':
          this.playCountdown(ctx);
          break;
        case 'success':
          this.playSuccess(ctx);
          break;
      }
    } catch (e) {
      console.warn('Errore durante la riproduzione del suono:', e);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    localStorage.setItem('bq_sound_enabled', String(enabled));
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('bq_sound_volume', String(this.volume));
  }

  getVolume(): number {
    return this.volume;
  }

  // Suoni sintetizzati

  private playCardPlay(ctx: AudioContext): void {
    // Quick snap/click - short noise burst (50ms)
    const now = ctx.currentTime;
    const duration = 0.05;

    // Noise buffer
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  }

  private playTrickWon(ctx: AudioContext): void {
    // Pleasant ding - sine wave at 880Hz, quick decay (200ms)
    const now = ctx.currentTime;
    const duration = 0.2;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 880;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  private playContractMade(ctx: AudioContext): void {
    // Triumphant short fanfare - ascending notes C5-E5-G5 (300ms total)
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const now = ctx.currentTime;
    const noteLength = 0.1;

    notes.forEach((freq, i) => {
      const startTime = now + i * noteLength;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.volume * 0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + noteLength);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + noteLength);
    });
  }

  private playContractFailed(ctx: AudioContext): void {
    // Sad descend - descending notes G4-E4-C4 (300ms total)
    const notes = [392.00, 329.63, 261.63]; // G4, E4, C4
    const now = ctx.currentTime;
    const noteLength = 0.1;

    notes.forEach((freq, i) => {
      const startTime = now + i * noteLength;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.volume * 0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + noteLength);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + noteLength);
    });
  }

  private playLevelUp(ctx: AudioContext): void {
    // Ascending sparkle melody - C5-E5-G5-C6 with shimmer (500ms)
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const now = ctx.currentTime;
    const noteLength = 0.125;

    notes.forEach((freq, i) => {
      const startTime = now + i * noteLength;

      // Oscillatore principale
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      // Oscillatore armonico per shimmer
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = freq * 2;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.volume * 0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + noteLength * 2);

      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(this.volume * 0.1, startTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, startTime + noteLength * 2);

      osc.connect(gain);
      osc2.connect(gain2);
      gain.connect(ctx.destination);
      gain2.connect(ctx.destination);

      osc.start(startTime);
      osc2.start(startTime);
      osc.stop(startTime + noteLength * 2);
      osc2.stop(startTime + noteLength * 2);
    });
  }

  private playBadgeUnlock(ctx: AudioContext): void {
    // Sparkle/chime - high sine + harmonics with reverb-like decay (400ms)
    const now = ctx.currentTime;
    const duration = 0.4;
    const baseFreq = 1318.51; // E6

    [1, 2, 3].forEach((harmonic, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = baseFreq * harmonic;

      const gain = ctx.createGain();
      const vol = this.volume * (0.25 / harmonic);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    });
  }

  private playButtonClick(ctx: AudioContext): void {
    // Subtle soft click - very short noise burst (30ms)
    const now = ctx.currentTime;
    const duration = 0.03;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  }

  private playError(ctx: AudioContext): void {
    // Soft low bonk - low sine 200Hz, quick decay (150ms)
    const now = ctx.currentTime;
    const duration = 0.15;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 200;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  private playCountdown(ctx: AudioContext): void {
    // Tick - short click at 1000Hz (50ms)
    const now = ctx.currentTime;
    const duration = 0.05;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  private playSuccess(ctx: AudioContext): void {
    // Happy arpeggio - C5-E5-G5 staccato (250ms)
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const now = ctx.currentTime;
    const noteLength = 0.08;

    notes.forEach((freq, i) => {
      const startTime = now + i * noteLength;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.volume * 0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + noteLength);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + noteLength);
    });
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();
