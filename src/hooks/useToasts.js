import { useCallback, useState } from 'react';
import soundSystem from '../lib/SoundSystem';

export default function useToasts() {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 11);
    setToasts(prev => [...prev, { id, message, type, duration }]);

    if (type === 'error') {
      soundSystem.playError();
    } else if (type === 'success') {
      soundSystem.playSuccess();
    } else {
      soundSystem.playClick();
    }
  }, []);

  return { toasts, addToast, removeToast };
}
