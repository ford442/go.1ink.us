import { useCallback, useEffect, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { Project } from '../types';

export interface ContextMenuState {
  mouseX: number;
  mouseY: number;
  project: Project;
}

export default function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleContextMenu = useCallback((e: ReactMouseEvent, project: Project) => {
    e.preventDefault();
    setContextMenu({
      mouseX: e.clientX,
      mouseY: e.clientY,
      project
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    if (!contextMenu) return;

    // Close context menu on any outside click or scroll
    window.addEventListener('click', closeContextMenu);
    window.addEventListener('scroll', closeContextMenu);
    return () => {
      window.removeEventListener('click', closeContextMenu);
      window.removeEventListener('scroll', closeContextMenu);
    };
  }, [contextMenu, closeContextMenu]);

  return { contextMenu, setContextMenu, handleContextMenu, closeContextMenu };
}
