// src/SoundSystem.js
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
            this.masterGain.gain.value = 0.25; // Balanced master volume
            this.masterGain.connect(this.audioContext.destination);

            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }

    enable() {
        this.isEnabled = true;
        if (!this.initialized) this.init();
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    disable() {
        this.isEnabled = false;
    }

    // Compatibility layer for older curator-audio-protocol code that calls setEnabled
    setEnabled(enabled) {
        if (enabled) {
            this.enable();
        } else {
            this.disable();
        }
    }

    // Enhanced tone engine (combines slide/sweep from curator + masterGain from main)
    playTone(frequency, type = 'sine', duration = 0.1, volume = 1, sweep = 1) {
        if (!this.isEnabled || !this.audioContext) return;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        try {
            const now = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(frequency, now);

            if (sweep !== 1) {
                osc.frequency.exponentialRampToValueAtTime(frequency * sweep, now + duration);
            }

            gainNode.gain.setValueAtTime(volume, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(gainNode);
            gainNode.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + duration);
        } catch {
            // Silently ignore audio errors (safe across all browsers)
        }
    }

    // ──────── UI FEEDBACK SOUNDS (best of both branches) ────────

    playHover() {
        this.playTone(820, 'sine', 0.04, 0.06);
    }

    playClick() {
        this.playTone(1250, 'square', 0.06, 0.04, 0.7); // crisp with slight slide
    }

    playSelect() {
        this.playTone(1150, 'square', 0.07, 0.035);
        setTimeout(() => this.playTone(1650, 'square', 0.09, 0.025), 35);
    }

    playKeystroke() {
        this.playTone(520 + Math.random() * 140, 'triangle', 0.035, 0.022);
    }

    playAlert() {
        this.playTone(620, 'sawtooth', 0.18, 0.065);
        setTimeout(() => this.playTone(920, 'sawtooth', 0.32, 0.055), 85);
    }

    playSuccess() {
        // Pleasant ascending chime – precise envelope version (from main)
        if (!this.isEnabled || !this.audioContext) return;
        const now = this.audioContext.currentTime;
        const playNote = (freq, delay) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            osc.connect(gain);
            gain.connect(this.masterGain);
            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(0.08, now + delay + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.35);
            osc.start(now + delay);
            osc.stop(now + delay + 0.35);
        };
        playNote(620, 0);
        playNote(820, 0.08);
        playNote(1250, 0.18);
    }

    playError() {
        this.playTone(280, 'sawtooth', 0.25, 0.09, 0.45);
        setTimeout(() => this.playTone(160, 'sawtooth', 0.4, 0.08), 110);
    }

    playBoot() {
        // Classic sci-fi boot sweep (feature + masterGain safety)
        if (!this.isEnabled || !this.audioContext) return;
        const now = this.audioContext.currentTime;
        try {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(780, now + 1.35);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.11, now + 0.4);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.7);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 1.7);
        } catch {}
    }
}

const SoundSystem = new ProceduralSoundSystem();
export default SoundSystem;