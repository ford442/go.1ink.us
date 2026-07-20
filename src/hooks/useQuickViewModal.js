import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import soundSystem from '../lib/SoundSystem';

// Project quick-view modal: open/close (with the hyperspace warp
// transition), focus trap, and body scroll lock. `isLockdown`/`addToast`/
// `addActivityLog`/`setIsWarping` are cross-cutting concerns owned
// elsewhere, threaded through as params.
export default function useQuickViewModal({ isLockdown, addToast, addActivityLog, setIsWarping }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const selectedProjectRef = useRef(null);
  const modalRef = useRef(null);
  const [modalImageLoaded, setModalImageLoaded] = useState(false);

  const handleProjectSelect = useCallback((project) => {
    if (isLockdown) {
      soundSystem.playDenied();
      addToast("> SYS_ERR: ACCESS DENIED - SYSTEM IN LOCKDOWN", "error");
      return;
    }
    soundSystem.playClick();
    addActivityLog(`VIEWING PROTOCOL: [${project.title.toUpperCase()}]`);

    setModalImageLoaded(false);

    // Trigger Hyperspace Transition
    setIsWarping(true);
    soundSystem.playWarp(); // Play warp entrance sound

    setTimeout(() => {
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          flushSync(() => {
            setSelectedProject(project);
            setIsWarping(false); // Reset warp after view transition completes
          });
        });
      } else {
        setSelectedProject(project);
        setIsWarping(false);
      }
    }, 600); // Duration to let the warp effect play before opening modal
  }, [isLockdown, addToast, addActivityLog, setIsWarping]);

  const closeProjectModal = useCallback(() => {
    soundSystem.playExitWarp(); // Play exit sound when closing
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => setSelectedProject(null));
      });
    } else {
      setSelectedProject(null);
    }
  }, []);

  useEffect(() => {
    selectedProjectRef.current = selectedProject;

    // Body Scroll Lock for Modal
    if (selectedProject) {
      document.body.style.overflow = 'hidden';

      // Focus Trap for Accessibility
      const handleTab = (e) => {
        if (e.key === 'Tab' && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (focusableElements.length > 0) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
              if (document.activeElement === firstElement || document.activeElement === document.body) {
                lastElement.focus();
                e.preventDefault();
              }
            } else {
              if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
              }
            }
          }
        }
      };

      window.addEventListener('keydown', handleTab);

      // Set initial focus
      setTimeout(() => {
        if (modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          }
        }
      }, 100);

      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleTab);
      };
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedProject]);

  return {
    selectedProject,
    setSelectedProject,
    selectedProjectRef,
    modalRef,
    modalImageLoaded,
    setModalImageLoaded,
    handleProjectSelect,
    closeProjectModal
  };
}
