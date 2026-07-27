import { useCallback, useState } from 'react';
import soundSystem from '../lib/SoundSystem';

export type ToastType = 'info' | 'error' | 'success' | 'copy' | 'warning' | string;

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

export default function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = `${Date.now()}${Math.random().toString(36).substring(2, 11)}`;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    import('../lib/a11yAnnouncer').then(({ announce }) => {
      announce(message.replace(/^>\s*/, ''), type === 'error' ? 'assertive' : 'polite');
    });

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
