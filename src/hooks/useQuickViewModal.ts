import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { flushSync } from 'react-dom';
import soundSystem from '../lib/SoundSystem';
import type { Project } from '../types';
import type { ToastType } from './useToasts';

interface UseQuickViewModalParams {
  isLockdown: boolean;
  addToast: (message: string, type?: ToastType) => void;
  addActivityLog: (text: string) => void;
  setIsWarping: Dispatch<SetStateAction<boolean>>;
  warpTransition: boolean;
}

// Project quick-view modal: open/close (with the hyperspace warp
// transition), focus trap, and body scroll lock. `isLockdown`/`addToast`/
// `addActivityLog`/`setIsWarping` are cross-cutting concerns owned
// elsewhere, threaded through as params.
export default function useQuickViewModal({
  isLockdown,
  addToast,
  addActivityLog,
  setIsWarping,
  warpTransition,
}: UseQuickViewModalParams) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const selectedProjectRef = useRef<Project | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [modalImageLoaded, setModalImageLoaded] = useState(false);

  const handleProjectSelect = useCallback((project: Project) => {
    if (isLockdown) {
      soundSystem.playDenied();
      addToast("> SYS_ERR: ACCESS DENIED - SYSTEM IN LOCKDOWN", "error");
      return;
    }
    soundSystem.playClick();
    addActivityLog(`VIEWING PROTOCOL: [${project.title.toUpperCase()}]`);

    setModalImageLoaded(false);

    const openModal = () => {
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          flushSync(() => setSelectedProject(project));
        });
      } else {
        setSelectedProject(project);
      }
    };

    if (!warpTransition) {
      openModal();
      return;
    }

    setIsWarping(true);
    soundSystem.playWarp();

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
  }, [isLockdown, addToast, addActivityLog, setIsWarping, warpTransition]);

  const closeProjectModal = useCallback(() => {
    if (warpTransition) soundSystem.playExitWarp();
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => setSelectedProject(null));
      });
    } else {
      setSelectedProject(null);
    }
  }, [warpTransition]);

  useEffect(() => {
    selectedProjectRef.current = selectedProject;

    // Body Scroll Lock for Modal
    if (selectedProject) {
      document.body.style.overflow = 'hidden';

      // Focus Trap for Accessibility
      const handleTab = (e: KeyboardEvent) => {
        if (e.key === 'Tab' && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (focusableElements.length > 0) {
            const firstElement = focusableElements[0]!;
            const lastElement = focusableElements[focusableElements.length - 1]!;

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
          const focusableElements = modalRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (focusableElements.length > 0) {
            focusableElements[0]!.focus();
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
