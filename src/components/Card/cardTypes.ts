import type { DragEvent, FocusEvent, KeyboardEvent, MouseEvent } from 'react';
import type { Project } from '../../types';
import type { FavoriteParticle } from './CardFavoriteBurst';

/** Drag-and-drop + keyboard-nav + selection envelope shared by every Card layout variant. */
export interface CardInteractionProps {
  index?: number;
  isSelected?: boolean;
  draggable?: boolean;
  isDragged?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: DragEvent<HTMLDivElement>) => void;
  onContextMenu?: (e: MouseEvent<HTMLDivElement>) => void;
  tabIndex?: number;
  // Reused for both the top-level wrapper <div> and, on some layouts, an
  // inner clickable <button> overlay, so the element type stays generic.
  handleKeyDown?: (e: KeyboardEvent<HTMLElement>) => void;
  handleFocus?: (e: FocusEvent<HTMLElement>) => void;
  onProjectClick?: (project: Project) => void;
}

/** Favorite-toggle + copy-link action props shared by most layouts. */
export interface CardActionProps {
  isFavorite?: boolean;
  onToggleFavorite?: (project: Project) => void;
  favoriteParticles?: FavoriteParticle[];
  triggerFavoriteBurst?: () => void;
  onCopyLink?: (project: Project) => void;
}

/** Tag-pill interaction props shared by grid/list/matrix/compact layouts. */
export interface CardTagInteractionProps {
  highlightedTags?: string[];
  onTagClick?: (tag: string) => void;
  onHoverTag?: (tag: string | null) => void;
}

/** Search-highlight props threaded through DecryptText / highlightMatch / tag lists. */
export interface CardSearchProps {
  searchQuery?: string;
  regex?: RegExp | null;
}
