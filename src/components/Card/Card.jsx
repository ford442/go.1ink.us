import { useMemo } from 'react';
import soundSystem from '../../lib/SoundSystem';
import useCardTilt from './useCardTilt';
import useCardHover from './useCardHover';
import useCardMedia from './useCardMedia';
import useFavoriteBurst from './useFavoriteBurst';
import CardDataMode from './CardDataMode';
import CardMatrix from './CardMatrix';
import CardList from './CardList';
import CardGrid from './CardGrid';

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
}) => {
  const tilt = useCardTilt();
  const hover = useCardHover(onCardHover);
  const media = useCardMedia(tilt.cardRef, index);
  const { favoriteParticles, triggerFavoriteBurst } = useFavoriteBurst(isFavorite);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      soundSystem.playClick();
      if (onProjectClick) onProjectClick(project);
    }
  };

  const handleFocus = (e) => {
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

  // Grid Layout (Default)
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
