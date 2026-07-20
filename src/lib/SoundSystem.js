const PRESETS = {
  tactical: { masterGain: 0.25, sfxGain: 1, ambienceGain: 0.05, voiceVolume: 0.8, ambienceFreqs: [55, 56], sfxScale: 1 },
  minimal: { masterGain: 0.14, sfxGain: 0.55, ambienceGain: 0, voiceVolume: 0.65, ambienceFreqs: [48, 48.5], sfxScale: 0.55 },
  silent: { masterGain: 0, sfxGain: 0, ambienceGain: 0, voiceVolume: 0, ambienceFreqs: [55, 56], sfxScale: 0 },
};

function parsePreset(raw) {
  return raw && raw in PRESETS ? raw : 'tactical';
}

/** Procedural UI audio: gain buses + shared analyser. Context starts on user gesture only. */
class ProceduralSoundSystem {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.ambienceGain = null;
    this.analyser = null;
    this.timeDomainBuffer = null;
    this.preset = PRESETS.tactical;
    this.wantsEnabled = false;
    this.unlocked = false;
    this.isAmbienceRunning = false;
    this.ambientOscillators = [];
    this.subscribers = new Set();
    this.analyserRafId = null;
  }

  get isEnabled() {
    return this.wantsEnabled;
  }

  unlockFromGesture() {
    if (this.unlocked) return;
    this.unlocked = true;
    if (typeof localStorage !== 'undefined') {
      this.setPreset(parsePreset(localStorage.getItem('curator_audio_preset')));
    }
    this.initGraph();
    this.applyEnabled(this.wantsEnabled);
  }

  setPreset(id) {
    this.preset = PRESETS[id] ?? PRESETS.tactical;
    this.applyPresetGains();
    if (this.preset === PRESETS.silent) this.stopAmbience();
    else if (this.wantsEnabled && this.unlocked) this.startAmbience();
  }

  loadPresetFromStorage(raw) {
    this.setPreset(parsePreset(raw));
  }

  setEnabled(enabled) {
    this.wantsEnabled = enabled;
    if (!this.unlocked) return;
    this.applyEnabled(enabled);
  }

  subscribe(fn) {
    this.subscribers.add(fn);
    this.startAnalyserLoop();
    return () => {
      this.subscribers.delete(fn);
      if (this.subscribers.size === 0) this.stopAnalyserLoop();
    };
  }

  startAmbience() {
    if (!this.wantsEnabled || !this.audioContext || this.isAmbienceRunning || this.preset.ambienceGain <= 0) return;
    this.isAmbienceRunning = true;
    void this.resumeContext();
    try {
      this.ambientOscillators = this.preset.ambienceFreqs.map((freq) => {
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(this.ambienceGain);
        osc.start();
        return osc;
      });
    } catch {
      this.isAmbienceRunning = false;
    }
  }

  stopAmbience() {
    if (!this.isAmbienceRunning) return;
    this.isAmbienceRunning = false;
    try {
      this.ambientOscillators.forEach((osc) => osc.stop());
    } catch { /* stopped */ }
    this.ambientOscillators = [];
  }

  speak(text) {
    if (!this.wantsEnabled || this.preset.voiceVolume <= 0 || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1;
      u.pitch = 0.85;
      u.volume = this.preset.voiceVolume;
      window.speechSynthesis.speak(u);
    } catch { /* ignore */ }
  }

  playTone(frequency, type = 'sine', duration = 0.1, volume = 1, sweep = 1) {
    if (!this.canPlaySfx()) return;
    void this.resumeContext();
    try {
      const ctx = this.audioContext;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const vol = volume * this.preset.sfxScale * this.preset.sfxGain;
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, now);
      if (sweep !== 1) osc.frequency.exponentialRampToValueAtTime(frequency * sweep, now + duration);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + duration);
    } catch { /* ignore */ }
  }

  playHover() { this.playTone(820, 'sine', 0.04, 0.06); }
  playDeepFocus() {
    this.playTone(150, 'sine', 0.8, 0.04, 1.2);
    setTimeout(() => this.playTone(220, 'triangle', 0.6, 0.02, 1.1), 100);
  }
  playClick() { this.playTone(1250, 'square', 0.06, 0.04, 0.7); }
  playSelect() {
    this.playTone(1150, 'square', 0.07, 0.035);
    setTimeout(() => this.playTone(1650, 'square', 0.09, 0.025), 35);
  }
  playKeystroke() { this.playTone(520 + Math.random() * 140, 'triangle', 0.035, 0.022); }
  playTyping() { this.playKeystroke(); }
  playAlert() {
    this.playTone(620, 'sawtooth', 0.18, 0.065);
    setTimeout(() => this.playTone(920, 'sawtooth', 0.32, 0.055), 85);
  }
  playAlarm() {
    this.playTone(400, 'sawtooth', 0.2, 0.15);
    setTimeout(() => this.playTone(600, 'sawtooth', 0.2, 0.15), 200);
    setTimeout(() => this.playTone(400, 'sawtooth', 0.2, 0.15), 400);
  }
  playDenied() {
    this.playTone(150, 'sawtooth', 0.15, 0.1, 0.5);
    setTimeout(() => this.playTone(100, 'sawtooth', 0.25, 0.1), 150);
  }
  playWarp() { if (this.canPlaySfx()) this.playSweep(80, 600, 0.8, 0.15); }
  playExitWarp() { if (this.canPlaySfx()) this.playSweep(400, 60, 0.5, 0.1); }
  playBoot() { if (this.canPlaySfx()) this.playSweep(120, 780, 1.7, 0.11); }
  playEpicUnlock() {
    if (!this.canPlaySfx()) return;
    void this.resumeContext();
    [[440, 0, 'triangle', 0.4], [554, 0.2, 'triangle', 0.4], [659, 0.4, 'triangle', 0.4], [880, 0.6, 'sawtooth', 1]]
      .forEach(([f, d, t, dur]) => this.playScheduled(f, d, t, dur, 0.15));
  }
  playSuccess() {
    if (!this.canPlaySfx()) return;
    void this.resumeContext();
    [[620, 0], [820, 0.08], [1250, 0.18]].forEach(([f, d]) => this.playScheduled(f, d, 'sine', 0.35, 0.08));
  }
  playError() {
    this.playTone(280, 'sawtooth', 0.25, 0.09, 0.45);
    setTimeout(() => this.playTone(160, 'sawtooth', 0.4, 0.08), 110);
  }

  initGraph() {
    if (this.audioContext || typeof window === 'undefined') return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
      const ctx = new Ctx();
      this.audioContext = ctx;
      this.masterGain = ctx.createGain();
      this.sfxGain = ctx.createGain();
      this.ambienceGain = ctx.createGain();
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.timeDomainBuffer = new Uint8Array(this.analyser.frequencyBinCount);
      this.sfxGain.connect(this.masterGain);
      this.ambienceGain.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(ctx.destination);
      this.applyPresetGains();
    } catch {
      this.audioContext = null;
    }
  }

  applyEnabled(enabled) {
    if (!enabled) this.stopAmbience();
    else {
      void this.resumeContext();
      this.startAmbience();
      if (this.subscribers.size > 0) this.startAnalyserLoop();
    }
  }

  applyPresetGains() {
    if (!this.masterGain || !this.audioContext) return;
    const now = this.audioContext.currentTime;
    this.masterGain.gain.setTargetAtTime(this.preset.masterGain, now, 0.02);
    this.sfxGain.gain.setTargetAtTime(this.preset.sfxGain, now, 0.02);
    this.ambienceGain.gain.setTargetAtTime(this.preset.ambienceGain, now, 0.02);
  }

  canPlaySfx() {
    return this.wantsEnabled && this.unlocked && this.audioContext && this.preset.sfxScale > 0;
  }

  async resumeContext() {
    if (this.audioContext?.state === 'suspended') {
      try { await this.audioContext.resume(); } catch { /* ignore */ }
    }
  }

  startAnalyserLoop() {
    if (this.analyserRafId != null) return;
    const tick = () => {
      this.analyserRafId = requestAnimationFrame(tick);
      if (!this.analyser || !this.timeDomainBuffer || this.subscribers.size === 0) return;
      if (this.wantsEnabled) this.analyser.getByteTimeDomainData(this.timeDomainBuffer);
      else this.timeDomainBuffer.fill(128);
      const frame = { timeDomain: this.timeDomainBuffer };
      this.subscribers.forEach((fn) => fn(frame));
    };
    this.analyserRafId = requestAnimationFrame(tick);
  }

  stopAnalyserLoop() {
    if (this.analyserRafId != null) {
      cancelAnimationFrame(this.analyserRafId);
      this.analyserRafId = null;
    }
  }

  playSweep(fromHz, toHz, duration, peak) {
    void this.resumeContext();
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(fromHz, now);
    osc.frequency.exponentialRampToValueAtTime(toHz, now + duration * 0.75);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak * this.preset.sfxScale, now + duration * 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  playScheduled(freq, delay, type, dur, peak) {
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(this.sfxGain);
    const p = peak * this.preset.sfxScale * this.preset.sfxGain;
    gain.gain.setValueAtTime(0, now + delay);
    gain.gain.linearRampToValueAtTime(p, now + delay + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
    osc.start(now + delay);
    osc.stop(now + delay + dur);
  }
}

const soundSystem = new ProceduralSoundSystem();
export default soundSystem;
