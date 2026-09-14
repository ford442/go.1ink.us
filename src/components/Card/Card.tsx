import { useMemo } from 'react';
import type { DragEvent, FocusEvent, KeyboardEvent, MouseEvent } from 'react';
import soundSystem from '../../lib/SoundSystem';
import { resolveProjectConnectivity } from '../../lib/projectConnectivity';
import useCardTilt from './useCardTilt';
import useCardHover from './useCardHover';
import useCardMedia from './useCardMedia';
import useFavoriteBurst from './useFavoriteBurst';
import CardDataMode from './CardDataMode';
import CardMatrix from './CardMatrix';
import CardList from './CardList';
import CardGrid from './CardGrid';
import CardCompact from './CardCompact';
import type { DisplayMode, Project } from '../../types';
import type { CardActionProps, CardTagInteractionProps, CardSearchProps } from './cardTypes';

interface CardProps extends CardActionProps, CardTagInteractionProps, CardSearchProps {
  project: Project;
  index?: number;
  // Superset of DisplayMode: 'compact' is a legacy alias for 'dense' that no
  // caller currently passes, kept for backward compatibility.
  layout?: DisplayMode | 'compact';
  isDataMode?: boolean;
  isSelected?: boolean;
  onProjectClick?: (project: Project) => void;
  draggable?: boolean;
  isDragged?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: DragEvent<HTMLDivElement>) => void;
  onContextMenu?: (e: MouseEvent<HTMLDivElement>) => void;
  tabIndex?: number;
  onFocus?: (e: FocusEvent<HTMLElement>) => void;
  onCardHover?: (projectId: number | null) => void;
}

// Shell: owns the state/behavior shared across every layout variant
// (tilt, hover-delay, image loading, favorite burst, search-highlight
// regex, complexity score) and switches to the right presentational
// layout component. See the sibling files in this directory for each
// layout's rendering and src/components/Card/*.js for the shared hooks.
const Card = ({
  project,
  index = 0,
  layout = 'grid',
  isDataMode = false,
  onTagClick,
  searchQuery,
  highlightedTags = [],
  isSelected = false,
  isFavorite = false,
  onToggleFavorite,
  onCopyLink,
  onProjectClick,
  draggable = false,
  isDragged = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onContextMenu,
  tabIndex = -1,
  onFocus,
  onHoverTag,
  onCardHover
}: CardProps) => {
  const connectivity = useMemo(() => resolveProjectConnectivity(project), [project]);
  const tilt = useCardTilt();
  const hover = useCardHover(onCardHover, {
    baselineLatencyMs: connectivity.latencyMs,
    connectivityHealth: connectivity.health,
  });
  const media = useCardMedia(tilt.cardRef, index);
  const { favoriteParticles, triggerFavoriteBurst } = useFavoriteBurst(isFavorite);

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      soundSystem.playClick();
      if (onProjectClick) onProjectClick(project);
    }
  };

  const handleFocus = (e: FocusEvent<HTMLElement>) => {
    if (onFocus) onFocus(e);
  };

  // Composed enter/leave used by the grid and list layouts, which combine
  // the hover-delay state with the tilt DOM-style bookkeeping. Matrix and
  // data-mode layouts don't wire these up at all (matching prior behavior).
  const handleMouseEnter = () => {
    hover.handleHoverEnter(project.id);
    tilt.applyEnterTransition();
  };

  const handleMouseLeave = () => {
    hover.handleHoverLeave();
    tilt.resetTilt();
  };

  // Memoize the RegExp creation
  const regex = useMemo(() => {
    if (!searchQuery) return null;
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(${escapedQuery})`, 'gi');
  }, [searchQuery]);

  // Calculate Complexity Score (1-5)
  const complexityScore = useMemo(() => {
    const techCount = project.tech?.length || 0;
    const tagCount = project.tags?.length || 0;
    const totalComplexity = techCount + tagCount;

    // Normalize score to 1-5
    let score = 1;
    if (totalComplexity > 6) score = 5;
    else if (totalComplexity > 4) score = 4;
    else if (totalComplexity > 3) score = 3;
    else if (totalComplexity > 2) score = 2;

    return score;
  }, [project.tech, project.tags]);

  const shared = {
    project,
    index,
    isSelected,
    draggable,
    isDragged,
    isDragOver,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDrop,
    onContextMenu,
    tabIndex,
    handleKeyDown,
    handleFocus,
    onProjectClick
  };

  if (isDataMode) {
    return <CardDataMode {...shared} />;
  }

  if (layout === 'matrix') {
    return (
      <CardMatrix
        {...shared}
        imageLoaded={media.imageLoaded}
        setImageLoaded={media.setImageLoaded}
        imageError={media.imageError}
        setImageError={media.setImageError}
        isVisible={media.isVisible}
        isHovered={hover.isHovered}
        searchQuery={searchQuery}
        regex={regex}
        highlightedTags={highlightedTags}
        onTagClick={onTagClick}
        onHoverTag={onHoverTag}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
        favoriteParticles={favoriteParticles}
        triggerFavoriteBurst={triggerFavoriteBurst}
        onCopyLink={onCopyLink}
        complexityScore={complexityScore}
      />
    );
  }

  if (layout === 'list') {
    return (
      <CardList
        {...shared}
        isHovered={hover.isHovered}
        isVisible={media.isVisible}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        searchQuery={searchQuery}
        regex={regex}
        highlightedTags={highlightedTags}
        onTagClick={onTagClick}
        onHoverTag={onHoverTag}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
        favoriteParticles={favoriteParticles}
        triggerFavoriteBurst={triggerFavoriteBurst}
        onCopyLink={onCopyLink}
      />
    );
  }

  if (layout === 'dense' || layout === 'compact') {
    return (
      <CardCompact
        {...shared}
        imageLoaded={media.imageLoaded}
        setImageLoaded={media.setImageLoaded}
        imageError={media.imageError}
        setImageError={media.setImageError}
        isHovered={hover.isHovered}
        searchQuery={searchQuery}
        regex={regex}
        highlightedTags={highlightedTags}
        onTagClick={onTagClick}
        onHoverTag={onHoverTag}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
        favoriteParticles={favoriteParticles}
        triggerFavoriteBurst={triggerFavoriteBurst}
        onCopyLink={onCopyLink}
      />
    );
  }

  // Grid Layout (Default 3D Tilt)
  return (
    <CardGrid
      {...shared}
      cardRef={tilt.cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={tilt.handleMouseMove}
      onMouseLeave={handleMouseLeave}
      imageLoaded={media.imageLoaded}
      setImageLoaded={media.setImageLoaded}
      isVisible={media.isVisible}
      isHovered={hover.isHovered}
      isHoverDelayed={hover.isHoverDelayed}
      ping={hover.ping}
      searchQuery={searchQuery}
      regex={regex}
      highlightedTags={highlightedTags}
      onTagClick={onTagClick}
      onHoverTag={onHoverTag}
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
      favoriteParticles={favoriteParticles}
      triggerFavoriteBurst={triggerFavoriteBurst}
      onCopyLink={onCopyLink}
      complexityScore={complexityScore}
    />
  );
};

export default Card;
