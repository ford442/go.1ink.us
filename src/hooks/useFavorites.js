import { useCallback, useEffect, useState } from 'react';
import projectData from '../data/projectData';
import soundSystem from '../lib/SoundSystem';

const VALID_FAV_IDS = new Set(projectData.map((p) => p.id));

function sanitizeIds(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const result = [];
  for (const item of raw) {
    const id = typeof item === 'number' ? item : parseInt(String(item), 10);
    if (!Number.isFinite(id) || !VALID_FAV_IDS.has(id) || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

// Favorites list (persisted to localStorage) plus its drag-and-drop
// reordering state/handlers. `isLockdown`/`addToast`/`addActivityLog` are
// cross-cutting concerns owned elsewhere, threaded through as params.
export default function useFavorites({ isLockdown, addToast, addActivityLog }) {
  const [favorites, setFavorites] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('curator_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('curator_favorites', JSON.stringify(favorites));
    }
  }, [favorites]);

  const replaceFavorites = useCallback((ids, label, { silent = false } = {}) => {
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

  const toggleFavorite = useCallback((project) => {
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
  const [draggedFavoriteId, setDraggedFavoriteId] = useState(null);
  const [dragOverFavoriteId, setDragOverFavoriteId] = useState(null);

  const handleDragStart = useCallback((e, projectId) => {
    setDraggedFavoriteId(projectId);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', projectId);
    }
  }, []);

  const handleDragOver = useCallback((e, projectId) => {
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

  const handleDrop = useCallback((e, targetProjectId) => {
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
