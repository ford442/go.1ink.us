import { useState } from 'react';

// Particle-burst animation state for the favorite toggle.
export default function useFavoriteBurst(isFavorite) {
  const [favoriteParticles, setFavoriteParticles] = useState([]);

  const triggerFavoriteBurst = () => {
    if (!isFavorite) {
      const particles = Array.from({ length: 12 }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / 12 + (Math.random() * 0.5 - 0.25);
        const velocity = 30 + Math.random() * 30;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        return {
          id: i,
          tx: `${tx}px`,
          ty: `${ty}px`,
        };
      });
      setFavoriteParticles(particles);
      setTimeout(() => setFavoriteParticles([]), 600);
    }
  };

  return { favoriteParticles, triggerFavoriteBurst };
}
