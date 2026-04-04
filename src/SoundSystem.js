class ProceduralSoundSystem {
  constructor() {
    this.audioContext = null;
    this.isEnabled = false;
    this.masterGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      this.audioContext = new AudioContextClass();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.2; // Default global volume
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  enable() {
    this.isEnabled = true;
    if (!this.initialized) {
      this.init();
    }
    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  disable() {
    this.isEnabled = false;
  }

  // Helper to create basic oscillator
  playTone(frequency, type, duration, volume = 1) {
    if (!this.isEnabled || !this.audioContext) return;

    // Resume context if suspended (browser autoplay policy for returning users)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    try {
      const osc = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

      osc.connect(gainNode);
      gainNode.connect(this.masterGain);

      osc.start();
      osc.stop(this.audioContext.currentTime + duration);
    } catch {
      // Ignore audio errors
    }
  }

  // Subtle click/hover sound
  playHover() {
    this.playTone(800, 'sine', 0.05, 0.05);
  }

  // Higher pitched click for selection
  playSelect() {
    this.playTone(1200, 'square', 0.1, 0.03);
    setTimeout(() => this.playTone(1600, 'square', 0.1, 0.03), 50);
  }

  // Terminal typing sound
  playKeystroke() {
    this.playTone(400 + Math.random() * 100, 'triangle', 0.05, 0.02);
  }

  // System alert / Toast
  playAlert() {
    this.playTone(600, 'sawtooth', 0.2, 0.05);
    setTimeout(() => this.playTone(800, 'sawtooth', 0.4, 0.05), 100);
  }

  // Error sound
  playError() {
    this.playTone(150, 'sawtooth', 0.3, 0.1);
    setTimeout(() => this.playTone(100, 'sawtooth', 0.4, 0.1), 150);
  }

  // Boot sequence start
  playBoot() {
    if (!this.isEnabled || !this.audioContext) return;

    // Resume context if suspended (browser autoplay policy for returning users)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    try {
      const osc = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 1);

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.5);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 2);

      osc.connect(gainNode);
      gainNode.connect(this.masterGain);

      osc.start();
      osc.stop(this.audioContext.currentTime + 2);
    } catch {
      // Ignore audio errors
    }
  }
}

const SoundSystem = new ProceduralSoundSystem();
export default SoundSystem;
