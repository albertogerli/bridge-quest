/**
 * useSound - Hook React per la gestione degli effetti sonori
 */

import { useState, useCallback, useEffect } from 'react';
import { audioManager, type SoundName } from '@/lib/audio-manager';

export function useSound() {
  const [enabled, setEnabled] = useState(() => audioManager.isEnabled());
  const [volume, setVolume] = useState(() => audioManager.getVolume());

  const play = useCallback((sound: SoundName) => {
    audioManager.play(sound);
  }, []);

  const toggleSound = useCallback(() => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    audioManager.setEnabled(newEnabled);
  }, [enabled]);

  const updateVolume = useCallback((v: number) => {
    const newVolume = Math.max(0, Math.min(1, v));
    setVolume(newVolume);
    audioManager.setVolume(newVolume);
  }, []);

  // Sincronizza lo stato con l'audioManager all'avvio
  useEffect(() => {
    setEnabled(audioManager.isEnabled());
    setVolume(audioManager.getVolume());
  }, []);

  return {
    play,
    enabled,
    toggleSound,
    volume,
    updateVolume,
  };
}
