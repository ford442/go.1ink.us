import { useEffect, useState } from 'react';

// Image-loading state plus the scroll-triggered decryption effect.
// Observes `cardRef.current` (owned by useCardTilt) — note this is only
// ever attached to a DOM node in the grid layout today, so `isVisible`
// stays false for list/matrix layouts, matching pre-existing behavior.
export default function useCardMedia(cardRef, index) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [hasScrolledIntoView, setHasScrolledIntoView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);

          // 🌌 CURATOR FEATURE: Scroll-triggered Decryption
          // Trigger the decryption effect when the card scrolls into view.
          // Use a slight staggered delay based on index for a cascading effect.
          const initialTimeout = setTimeout(() => {
            setHasScrolledIntoView(true);
            const revertTimeout = setTimeout(() => {
              setHasScrolledIntoView(false);
            }, 1500); // Effect duration

            // Store revert timeout to cleanup if needed (though it runs fast)
            if (cardRef.current) cardRef.current.revertTimeout = revertTimeout;
          }, (index % 12) * 100);

          if (cardRef.current) cardRef.current.initialTimeout = initialTimeout;

          observer.disconnect(); // Only load once
        }
      },
      { rootMargin: '200px 0px', threshold: 0.01 }
    );

    const currentCardRef = cardRef.current;
    if (currentCardRef) {
      observer.observe(currentCardRef);
    }

    return () => {
      observer.disconnect();
      if (currentCardRef) {
        clearTimeout(currentCardRef.initialTimeout);
        clearTimeout(currentCardRef.revertTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return { imageLoaded, setImageLoaded, imageError, setImageError, isVisible };
}
