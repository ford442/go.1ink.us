import { useCallback, useEffect, useState, type DragEvent } from 'react';
import soundSystem from '../lib/SoundSystem';
import { sanitizeIds } from '../lib/loadoutIds';
import type { Project } from '../types';
import type { ToastType } from './useToasts';

interface UseFavoritesParams {
  isLockdown: boolean;
  addToast: (message: string, type?: ToastType) => void;
  addActivityLog: (text: string) => void;
}

interface ReplaceFavoritesOptions {
  silent?: boolean;
}

// Favorites list (persisted to localStorage) plus its drag-and-drop
// reordering state/handlers. `isLockdown`/`addToast`/`addActivityLog` are
// cross-cutting concerns owned elsewhere, threaded through as params.
export default function useFavorites({ isLockdown, addToast, addActivityLog }: UseFavoritesParams) {
  const [favorites, setFavorites] = useState<number[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('curator_favorites');
      return stored ? sanitizeIds(JSON.parse(stored)) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('curator_favorites', JSON.stringify(favorites));
    }
  }, [favorites]);

  const replaceFavorites = useCallback((ids: number[], label?: string, { silent = false }: ReplaceFavoritesOptions = {}) => {
    if (isLockdown) {
      soundSystem.playDenied();
      addToast('> SYS_ERR: ACCESS DENIED - SYSTEM IN LOCKDOWN', 'error');
      return;
    }
    const sanitized = sanitizeIds(ids);
    setFavorites(sanitized);
    const tag = label ? `[${label.toUpperCase()}]` : `[${sanitized.length} NODES]`;
    if (!silent) {
      addToast(`> SYS_UPDATE: FAVORITES_REPLACED ${tag}`, 'success');
    }
    addActivityLog(`FAVORITES REPLACED ${tag}`);
  }, [isLockdown, addToast, addActivityLog]);

  const toggleFavorite = useCallback((project: Project) => {
    if (isLockdown) {
      soundSystem.playDenied();
      addToast('> SYS_ERR: ACCESS DENIED - SYSTEM IN LOCKDOWN', 'error');
      return;
    }
    setFavorites(prev => {
      const isFavorited = prev.includes(project.id);
      if (isFavorited) {
        addToast(`> SYS_UPDATE: [${project.title.toUpperCase()}] REMOVED`, 'warning');
        addActivityLog(`FAVORITE REMOVED: [${project.title.toUpperCase()}]`);
        return prev.filter(id => id !== project.id);
      }
      addToast(`> SYS_UPDATE: [${project.title.toUpperCase()}] FAVORITED`, 'favorite');
      addActivityLog(`FAVORITE ADDED: [${project.title.toUpperCase()}]`);
      return [...prev, project.id];
    });
  }, [isLockdown, addToast, addActivityLog]);

  // Drag and Drop State for Favorites
  const [draggedFavoriteId, setDraggedFavoriteId] = useState<number | null>(null);
  const [dragOverFavoriteId, setDragOverFavoriteId] = useState<number | null>(null);

  const handleDragStart = useCallback((e: DragEvent, projectId: number) => {
    setDraggedFavoriteId(projectId);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(projectId));
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent, projectId: number) => {
    e.preventDefault(); // Necessary to allow dropping
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    setDragOverFavoriteId(prev => (prev !== projectId ? projectId : prev));
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedFavoriteId(null);
    setDragOverFavoriteId(null);
  }, []);

  const handleDrop = useCallback((e: DragEvent, targetProjectId: number) => {
    e.preventDefault();
    setDraggedFavoriteId(currentDraggedId => {
      if (!currentDraggedId || currentDraggedId === targetProjectId) {
        setDragOverFavoriteId(null);
        return null;
      }

      setFavorites(prevFavorites => {
        const draggedIndex = prevFavorites.indexOf(currentDraggedId);
        const targetIndex = prevFavorites.indexOf(targetProjectId);

        if (draggedIndex === -1 || targetIndex === -1) return prevFavorites;

        const newFavorites = [...prevFavorites];
        newFavorites.splice(draggedIndex, 1);
        newFavorites.splice(targetIndex, 0, currentDraggedId);

        return newFavorites;
      });

      addToast(`> SYS_CMD: FAVORITES_REORDERED`, 'success');
      setDragOverFavoriteId(null);
      return null;
    });
  }, [addToast]);

  return {
    favorites,
    replaceFavorites,
    toggleFavorite,
    draggedFavoriteId,
    dragOverFavoriteId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop
  };
}
