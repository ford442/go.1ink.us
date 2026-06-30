import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../AppContext';
import soundSystem from '../SoundSystem';

export default function useVoiceCommand() {
  const {
    setSearchQuery,
    changeTheme,
    setDisplayMode,
    setIsLockdown,
    addToast,
    addActivityLog
  } = useAppContext();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const [isSupported] = useState(() => {
    return typeof window !== 'undefined' && (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);
  });

  const processCommand = useCallback((cmd) => {
    if (cmd.includes('theme')) {
      if (cmd.includes('cyan')) changeTheme('cyan');
      else if (cmd.includes('purple')) changeTheme('purple');
      else if (cmd.includes('emerald')) changeTheme('emerald');
      else if (cmd.includes('gold')) changeTheme('gold');
      soundSystem.playSuccess();
      addToast('System theme updated via voice command.', 'success');
    } else if (cmd.includes('search')) {
      const term = cmd.replace('search for', '').replace('search', '').trim();
      if (term) {
        setSearchQuery(term);
        soundSystem.playSuccess();
        addToast(`Searching for: ${term}`, 'success');
      }
    } else if (cmd.includes('layout') || cmd.includes('view') || cmd.includes('mode')) {
      if (cmd.includes('grid')) setDisplayMode('grid');
      else if (cmd.includes('list')) setDisplayMode('list');
      else if (cmd.includes('matrix')) setDisplayMode('matrix');
      else if (cmd.includes('map')) setDisplayMode('map');
      soundSystem.playSuccess();
      addToast('Display mode updated via voice command.', 'success');
    } else if (cmd.includes('lockdown')) {
      if (cmd.includes('disable') || cmd.includes('off') || cmd.includes('cancel')) {
        setIsLockdown(false);
        soundSystem.playSuccess();
      } else {
        setIsLockdown(true);
        soundSystem.playAlert();
      }
    } else {
       addToast(`Unknown voice command: ${cmd}`, 'warning');
    }
  }, [changeTheme, setSearchQuery, setDisplayMode, setIsLockdown, addToast]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        soundSystem.playClick();
        addActivityLog('VOICE_PROTOCOL: LISTENING...');
      };

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const result = event.results[current][0].transcript.toLowerCase();
        setTranscript(result);
        addActivityLog(`VOICE_PROTOCOL: "${result}"`);
        processCommand(result);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [addActivityLog, processCommand]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return {
    isSupported,
    isListening,
    transcript,
    startListening,
    stopListening
  };
}
