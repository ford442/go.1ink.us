// src/SoundSystem.js

class SciFiSoundSystem {
  constructor() {
    this.audioCtx = null;
    this.enabled = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
      this.initialized = true;
      // Unlock audio context on mobile/browsers requiring user gesture
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  enable() {
    this.enabled = true;
    if (!this.initialized) this.init();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  disable() {
    this.enabled = false;
  }

  _playTone(frequency, type, duration, vol, sweep = 0) {
    if (!this.enabled || !this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = type;
    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    const now = this.audioCtx.currentTime;

    osc.frequency.setValueAtTime(frequency, now);
    if (sweep !== 0) {
      osc.frequency.exponentialRampToValueAtTime(frequency * sweep, now + duration);
    }

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(vol, now + duration * 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }

  playHover() {
    // Soft, quick high-pitched blip
    this._playTone(800, 'sine', 0.05, 0.03);
  }

  playClick() {
    // Sharp, short mechanical click
    this._playTone(1200, 'square', 0.08, 0.02, 0.5);
  }

  playTyping() {
    // Very short, quiet click for typing
    this._playTone(1500, 'triangle', 0.03, 0.01, 0.8);
  }

  playSuccess() {
    // Pleasant ascending chime
    if (!this.enabled || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    const playNote = (freq, delay) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.05, now + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3);

      osc.start(now + delay);
      osc.stop(now + delay + 0.3);
    };

    playNote(600, 0);
    playNote(800, 0.1);
    playNote(1200, 0.2);
  }

  playError() {
    // Harsh descending tone
    this._playTone(300, 'sawtooth', 0.4, 0.03, 0.5);
  }

  playBoot() {
    // Long sweeping sci-fi boot sound
    if (!this.enabled || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 1.5);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc.start(now);
    osc.stop(now + 1.5);
  }
}

const soundSystem = new SciFiSoundSystem();
export default soundSystem;
