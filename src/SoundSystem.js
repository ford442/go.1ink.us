class SoundSystem {
  constructor() {
    this.audioCtx = null;
    this.enabled = false;
  }

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) {
      this.init();
      // Resume context if suspended (often required by browsers after user interaction)
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    }
  }

  // Base oscillator function to create sounds
  playTone(frequency, type, duration, vol = 0.1, slide = false) {
    if (!this.enabled || !this.audioCtx) return;

    try {
      const oscillator = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      oscillator.type = type;

      if (slide) {
        oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.5, this.audioCtx.currentTime + duration);
      } else {
        oscillator.frequency.value = frequency;
      }

      // Envelope
      gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, this.audioCtx.currentTime + duration * 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      oscillator.start();
      oscillator.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('AudioContext error:', e);
    }
  }

  playHoverSound() {
    // Subtle, high pitch short bloop
    this.playTone(800, 'sine', 0.05, 0.03);
  }

  playClickSound() {
    // Crisp click
    this.playTone(1200, 'square', 0.05, 0.05, true);
  }

  playTypingSound() {
    // Very short mechanical tick
    this.playTone(600 + Math.random() * 200, 'square', 0.03, 0.02);
  }

  playSuccessSound() {
    // Ascending chime
    if (!this.enabled || !this.audioCtx) return;
    this.playTone(400, 'sine', 0.1, 0.05);
    setTimeout(() => this.playTone(600, 'sine', 0.1, 0.05), 100);
    setTimeout(() => this.playTone(800, 'sine', 0.3, 0.05), 200);
  }

  playErrorSound() {
    // Harsh descending tone
    if (!this.enabled || !this.audioCtx) return;
    this.playTone(200, 'sawtooth', 0.2, 0.05);
    setTimeout(() => this.playTone(150, 'sawtooth', 0.3, 0.05), 150);
  }

  playBootSound() {
    // Deep sci-fi hum that rises
    if (!this.enabled || !this.audioCtx) return;
    this.playTone(50, 'sawtooth', 1.0, 0.1, true);
    setTimeout(() => this.playTone(100, 'sine', 1.5, 0.1, true), 200);
  }
}

// Export a singleton instance
const soundSystem = new SoundSystem();
export default soundSystem;
