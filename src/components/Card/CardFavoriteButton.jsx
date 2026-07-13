import Tooltip from '../../Tooltip';
import soundSystem from '../../SoundSystem';
import CardFavoriteBurst from './CardFavoriteBurst';

const VARIANTS = {
  grid: {
    tooltipPrefix: 'SYS: ',
    button: (isFavorite) => `p-2 rounded-full transition-all duration-300 backdrop-blur-md ${isFavorite
      ? 'bg-pink-500/20 text-pink-400 opacity-100 shadow-[0_0_15px_rgba(236,72,153,0.5)] border border-pink-400/50 scale-110'
      : 'bg-black/30 text-white/50 opacity-0 group-hover:opacity-100 border border-white/10 hover:bg-pink-500/20 hover:text-pink-300 hover:border-pink-400/50 hover:scale-110'
    }`,
    icon: 'h-5 w-5',
    burstSize: 'lg'
  },
  compact: {
    tooltipPrefix: '',
    button: (isFavorite) => `p-1.5 rounded-md transition-all duration-300 ${isFavorite
      ? 'text-pink-400 bg-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.3)] border border-pink-400/30'
      : 'text-gray-500 hover:text-pink-300 hover:bg-pink-500/10 hover:border-pink-400/30 border border-transparent'
    }`,
    icon: 'h-4 w-4',
    burstSize: 'sm'
  }
};

// Favorite (heart) toggle button used across grid/list/matrix layouts.
// `variant="grid"` matches the larger, opacity-gated header button; the
// default "compact" variant matches the always-visible list/matrix button.
export default function CardFavoriteButton({ variant = 'compact', project, isFavorite, onToggleFavorite, favoriteParticles, triggerFavoriteBurst }) {
  const cfg = VARIANTS[variant] || VARIANTS.compact;

  return (
    <div className="relative">
      <Tooltip text={isFavorite ? `${cfg.tooltipPrefix}REM_FAV` : `${cfg.tooltipPrefix}ADD_FAV`}>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            soundSystem.playClick();
            triggerFavoriteBurst();
            if (onToggleFavorite) onToggleFavorite(project);
          }}
          className={cfg.button(isFavorite)}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={cfg.icon} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        </button>
      </Tooltip>
      <CardFavoriteBurst particles={favoriteParticles} size={cfg.burstSize} />
    </div>
  );
}
