import { useCallback, useEffect, useState } from 'react';

export default function useContextMenu() {
  const [contextMenu, setContextMenu] = useState(null);

  const handleContextMenu = useCallback((e, project) => {
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
