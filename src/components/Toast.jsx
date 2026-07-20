import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import { useRef } from 'react';

export default function Toast({ toast, removeToast }) {
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 3000;
  const remainingRef = useRef(duration);

  useEffect(() => {
    let startTime = Date.now();
    let animationFrame;

    const animate = () => {
      if (isHovered) {
        // Just update startTime so elapsed doesn't grow while paused
        startTime = Date.now();
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      const elapsed = Date.now() - startTime;
      const currentRemaining = remainingRef.current - elapsed;

      if (currentRemaining <= 0) {
        removeToast(toast.id);
      } else {
        setProgress((currentRemaining / duration) * 100);
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      // when unmounting (or hovering), save remaining time
      remainingRef.current -= (Date.now() - startTime);
    };
  }, [isHovered, removeToast, toast.id, duration]);

  let borderClass, textClass, icon;
  switch (toast.type) {
    case 'success':
      borderClass = 'border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.3)]';
      textClass = 'text-pink-400';
      icon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
      break;
    case 'favorite':
      borderClass = 'border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.3)]';
      textClass = 'text-pink-400';
      icon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
      );
      break;
    case 'copy':
      borderClass = 'border-accent-500/50 shadow-[0_0_15px_rgba(var(--rgb-accent-400),0.3)]';
      textClass = 'text-accent-400';
      icon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      );
      break;
    case 'warning':
      borderClass = 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]';
      textClass = 'text-yellow-400';
      icon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
      break;
    case 'error':
      borderClass = 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
      textClass = 'text-red-400';
      icon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
      break;
    case 'info':
    default:
      borderClass = 'border-accent-500/50 shadow-[0_0_15px_rgba(var(--rgb-accent-400),0.3)]';
      textClass = 'text-accent-400';
      icon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
      break;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => removeToast(toast.id)}
      className={`relative bg-black/80 backdrop-blur-md border ${borderClass} rounded-lg overflow-hidden flex flex-col pointer-events-auto cursor-pointer hover:bg-black/90 transition-colors w-[300px] shadow-lg`}
      role="alert"
      aria-label={`${toast.type} notification: ${toast.message}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`shrink-0 ${textClass}`}>{icon}</div>
        <div className={`font-mono text-sm tracking-wide ${textClass} flex-1 truncate`}>
          {toast.message}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-white/5 relative">
        <div
          className={`h-full ${textClass.replace('text-', 'bg-')} transition-all duration-100 linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}
