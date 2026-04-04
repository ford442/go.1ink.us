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
            this.masterGain.gain.value = 0.25; // Balanced global volume (was 0.2)
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

    // Enhanced tone helper (best of both branches)
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
            // Silently ignore audio errors (safe for all browsers)
        }
    }

    // ──────── UI FEEDBACK SOUNDS ────────

    playHover() {
        this.playTone(800, 'sine', 0.05, 0.06);
    }

    playClick() {
        // Sharp mechanical click (from feature)
        this.playTone(1200, 'square', 0.08, 0.03, 0.6);
    }

    playSelect() {
        // Double high-pitched select (from main + feature polish)
        this.playTone(1100, 'square', 0.08, 0.04);
        setTimeout(() => this.playTone(1600, 'square', 0.08, 0.03), 40);
    }

    playKeystroke() {
        // Terminal-style typing (from main)
        this.playTone(400 + Math.random() * 120, 'triangle', 0.04, 0.025);
    }

    playAlert() {
        // System toast / notification (kept from main, slightly richer)
        this.playTone(600, 'sawtooth', 0.18, 0.07);
        setTimeout(() => this.playTone(900, 'sawtooth', 0.35, 0.05), 90);
    }

    playSuccess() {
        // Pleasant ascending chime (from feature)
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
        // Harsh descending tone (combined best of both)
        this.playTone(320, 'sawtooth', 0.35, 0.09, 0.4);
        setTimeout(() => this.playTone(180, 'sawtooth', 0.45, 0.08), 120);
    }

    playBoot() {
        // Classic sci-fi boot sweep (feature + masterGain safety)
        if (!this.isEnabled || !this.audioContext) return;
        const now = this.audioContext.currentTime;
        try {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(820, now + 1.4);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.12, now + 0.45);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 1.8);
        } catch {}
    }
}

const SoundSystem = new ProceduralSoundSystem();
export default SoundSystem;