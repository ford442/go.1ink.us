import { useCallback, useEffect, useRef, useState } from 'react';
import soundSystem from '../SoundSystem';

export default function useBootSequence() {
  // Ensure page loads scrolled to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Tactical Click Ripples State
  const [clickEffects, setClickEffects] = useState([]);

  useEffect(() => {
    const handleClick = (e) => {
      // Don't spawn ripples if clicking inside the terminal or omni palette
      if (e.target.closest('.terminal-modal') || e.target.closest('.omni-palette')) return;

      const newEffect = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
      };

      setClickEffects(prev => [...prev, newEffect]);

      // Remove the effect after animation completes (600ms)
      setTimeout(() => {
        setClickEffects(prev => prev.filter(effect => effect.id !== newEffect.id));
      }, 600);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Real-time Activity Logs State
  const [userActivityLogs, setUserActivityLogs] = useState([]);

  const addActivityLog = useCallback((text) => {
    setUserActivityLogs(prev => {
      const newLog = {
        id: Math.random().toString(36).substr(2, 9),
        text,
        time: new Date().toLocaleTimeString('en-US', { hour12: false })
      };
      // Keep last 15 logs
      return [...prev, newLog].slice(-15);
    });
  }, []);

  // Boot Sequence State — bypassed for public access
  const [isBooting, setIsBooting] = useState(false);
  const [bootLogs, setBootLogs] = useState([]);

  // Biometric Scan State
  const [bootStep, setBootStep] = useState(0); // 0: phase1 logs, 1: scanning, 2: phase2 logs
  const [scanProgress, setScanProgress] = useState(0);
  const scanIntervalRef = useRef(null);

  const startScan = (e) => {
    if (e && e.preventDefault && e.type !== 'touchstart') e.preventDefault();
    if (bootStep !== 1) return;

    soundSystem.playClick();

    scanIntervalRef.current = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(scanIntervalRef.current);
          soundSystem.playSuccess();
          soundSystem.speak("Authorization accepted.");
          setBootStep(2);
          return 100;
        }
        return prev + 2; // Fills in ~1.5s (30ms * 50 steps)
      });
    }, 30);
  };

  const stopScan = () => {
    if (bootStep === 1) {
      clearInterval(scanIntervalRef.current);
      setScanProgress(0);
    }
  };

  // Boot screen hidden — site loads directly into the project grid
  const [showBootScreen, setShowBootScreen] = useState(false);

  // Audio State
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('curator_sound') === 'true';
    }
    return false;
  });

  // Data Decryption (X-Ray) Mode
  const [isDataMode, setIsDataMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('curator_sound', isSoundEnabled);
      if (isSoundEnabled) {
        soundSystem.enable();
      } else {
        soundSystem.disable();
      }
    }
  }, [isSoundEnabled]);

  useEffect(() => {
    if (isBooting && isSoundEnabled) {
      soundSystem.playBoot();
    }
  }, [isBooting, isSoundEnabled]);

  useEffect(() => {
    if (!isBooting) {
      // Let the animation finish before unmounting
      const timer = setTimeout(() => setShowBootScreen(false), 1000);
      return () => clearTimeout(timer);
    }

    const logsPhase1 = [
      "INITIALIZING QUANTUM KERNEL...",
      "LOADING PROJECT MATRIX... OK",
      "ESTABLISHING SECURE CONNECTION... OK",
      "AWAITING BIOMETRIC AUTHORIZATION..."
    ];

    const logsPhase2 = [
      "DECRYPTING ASSETS...",
      "WELCOME TO CURATOR OS"
    ];

    if (bootStep === 0) {
      let currentLog = 0;
      const logInterval = setInterval(() => {
        if (currentLog < logsPhase1.length) {
          setBootLogs(prev => [...prev, logsPhase1[currentLog]]);
          currentLog++;
          if (currentLog === logsPhase1.length) {
            clearInterval(logInterval);
            setTimeout(() => setBootStep(1), 500); // Trigger biometric after a short pause
          }
        }
      }, 400);
      return () => clearInterval(logInterval);
    }

    if (bootStep === 2) {
      let currentLog = 0;
      const logInterval = setInterval(() => {
        if (currentLog < logsPhase2.length) {
          setBootLogs(prev => [...prev, logsPhase2[currentLog]]);
          currentLog++;
        } else {
          clearInterval(logInterval);
          setTimeout(() => {
            setIsBooting(false);
            soundSystem.speak("System Online. Welcome, Curator.");
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('curator_booted', 'true');
            }
            addActivityLog("KERNEL_INITIALIZED: ONLINE");
          }, 800);
        }
      }, 400);
      return () => clearInterval(logInterval);
    }

  }, [isBooting, bootStep, addActivityLog]);

  useEffect(() => {
     // Wait till boot finishes (or if already booted) to play boot sound
     if (!isBooting && showBootScreen) {
        soundSystem.playBoot();
     }
  }, [isBooting, showBootScreen]);

  return {
    addActivityLog,
    bootLogs,
    bootStep,
    clickEffects,
    isBooting,
    isDataMode,
    isSoundEnabled,
    scanProgress,
    setIsDataMode,
    setIsSoundEnabled,
    showBootScreen,
    startScan,
    stopScan,
    userActivityLogs
  };
}
