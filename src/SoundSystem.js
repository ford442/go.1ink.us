// src/SoundSystem.js
class ProceduralSoundSystem {
    constructor() {
        this.audioContext = null;
        this.isEnabled = false;
        this.masterGain = null;
        this.analyser = null;
        this.dataArray = null;
        this.initialized = false;
        this.ambientOscillators = [];
        this.ambientGain = null;
        this.isAmbienceRunning = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;

            this.audioContext = new AudioContextClass();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.25; // Balanced master volume

            // Add AnalyserNode for visualization
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 64; // Smaller size for simple sci-fi visualization
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            // Route: masterGain -> analyser -> destination
            this.masterGain.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }

    // Return the current time-domain data
    getAudioData() {
        if (!this.isEnabled || !this.initialized || !this.analyser) {
            return null;
        }
        this.analyser.getByteTimeDomainData(this.dataArray);
        return this.dataArray;
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

    startAmbience() {
        if (!this.isEnabled || !this.audioContext || this.isAmbienceRunning) return;
        this.isAmbienceRunning = true;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        try {
            this.ambientGain = this.audioContext.createGain();
            this.ambientGain.gain.value = 0.05; // Low volume for ambience
            this.ambientGain.connect(this.masterGain);

            // Create two low frequency oscillators for a beating drone effect
            const freqs = [55, 56]; // Subtle phasing/beating
            this.ambientOscillators = freqs.map(freq => {
                const osc = this.audioContext.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;
                osc.connect(this.ambientGain);
                osc.start();
                return osc;
            });
        } catch (e) {
            console.warn('Could not start ambient sound', e);
        }
    }

    stopAmbience() {
        if (!this.isAmbienceRunning) return;
        this.isAmbienceRunning = false;

        try {
            this.ambientOscillators.forEach(osc => osc.stop());
            this.ambientOscillators = [];
            if (this.ambientGain) {
                this.ambientGain.disconnect();
                this.ambientGain = null;
            }
        } catch (e) {
            console.warn('Error stopping ambience', e);
        }
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

    // ──────── AI SPEECH SYNTHESIS ────────
    speak(text) {
        if (!this.isEnabled || !window.speechSynthesis) return;

        try {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 0.85; // Slightly lower pitch for a more synthetic/robotic AI feel
            utterance.volume = 0.8;

            // Try to select an English voice, preferably male/robotic if possible
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Zira')));

            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }

            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn('Speech Synthesis error', e);
        }
    }

    // ──────── UI FEEDBACK SOUNDS (best of both branches) ────────

    playHover() {
        this.playTone(820, 'sine', 0.04, 0.06);
    }

    playDeepFocus() {
        // Deep, resonant sci-fi swelling tone for delayed hover state
        this.playTone(150, 'sine', 0.8, 0.04, 1.2);
        setTimeout(() => this.playTone(220, 'triangle', 0.6, 0.02, 1.1), 100);
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

    playAlarm() {
        this.playTone(400, 'sawtooth', 0.2, 0.15);
        setTimeout(() => this.playTone(600, 'sawtooth', 0.2, 0.15), 200);
        setTimeout(() => this.playTone(400, 'sawtooth', 0.2, 0.15), 400);
    }

    playDenied() {
        this.playTone(150, 'sawtooth', 0.15, 0.1, 0.5);
        setTimeout(() => this.playTone(100, 'sawtooth', 0.25, 0.1), 150);
    }

    playWarp() {
        // Deep, sweeping riser for hyperspace transition
        if (!this.isEnabled || !this.audioContext) return;
        const now = this.audioContext.currentTime;
        try {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(80, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.6);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.15, now + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.8);
        } catch {
            // ignore
        }
    }

    playExitWarp() {
        // Quick, descending power-down sound
        if (!this.isEnabled || !this.audioContext) return;
        const now = this.audioContext.currentTime;
        try {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.4);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.5);
        } catch {
            // ignore
        }
    }


    playEpicUnlock() {
        if (!this.isEnabled || !this.audioContext) return;
        const now = this.audioContext.currentTime;
        const playNote = (freq, delay, type = 'sine', dur = 0.5) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            osc.connect(gain);
            gain.connect(this.masterGain);
            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(0.15, now + delay + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
            osc.start(now + delay);
            osc.stop(now + delay + dur);
        };
        playNote(440, 0, 'triangle', 0.4);
        playNote(554, 0.2, 'triangle', 0.4);
        playNote(659, 0.4, 'triangle', 0.4);
        playNote(880, 0.6, 'sawtooth', 1.0);
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
        } catch {
            // Ignore errors
        }
    }
}

const SoundSystem = new ProceduralSoundSystem();
export default SoundSystem;