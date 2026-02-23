// js/audio/SoundManager.js — Sound manager (works with or without Howler.js)

class SoundManagerClass {
  constructor() {
    this.sounds = {};
    this.muted = localStorage.getItem('azul-muted') === 'true';
    this.volume = parseFloat(localStorage.getItem('azul-volume') || '0.5');
    this.audioContext = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Create simple audio elements for each sound
    const soundDefs = {
      tilePick: { freq: 800, duration: 0.08, type: 'sine' },
      tilePlace: { freq: 600, duration: 0.1, type: 'sine' },
      tileWall: { freq: 500, duration: 0.15, type: 'triangle' },
      tileBreak: { freq: 300, duration: 0.12, type: 'sawtooth' },
      scoreTick: { freq: 1000, duration: 0.05, type: 'sine' },
      scoreBonus: { freq: 1200, duration: 0.2, type: 'sine' },
      roundEnd: { freq: 700, duration: 0.3, type: 'triangle' },
      gameOver: { freq: 880, duration: 0.5, type: 'sine' },
      turnAlert: { freq: 900, duration: 0.15, type: 'sine' },
      playerJoin: { freq: 660, duration: 0.12, type: 'sine' },
      error: { freq: 200, duration: 0.15, type: 'square' },
    };

    this.soundDefs = soundDefs;
  }

  unlock() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    } catch (e) {
      // Audio not supported
    }
  }

  play(soundName) {
    if (this.muted || !this.audioContext) return;

    const def = this.soundDefs?.[soundName];
    if (!def) return;

    try {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = def.type;
      osc.frequency.setValueAtTime(def.freq, this.audioContext.currentTime);

      gain.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + def.duration);

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.start(this.audioContext.currentTime);
      osc.stop(this.audioContext.currentTime + def.duration);
    } catch (e) {
      // Ignore audio errors
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('azul-muted', this.muted);
    return this.muted;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('azul-volume', this.volume);
  }

  isMuted() {
    return this.muted;
  }
}

export const SoundManager = new SoundManagerClass();
