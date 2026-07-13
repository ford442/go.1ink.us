import Tooltip from '../Tooltip';
import soundSystem from '../../lib/SoundSystem';

const VARIANTS = {
  grid: {
    tooltip: 'SYS: COPY_LINK',
    button: 'p-2 rounded-full transition-all duration-300 backdrop-blur-md bg-black/30 text-white/50 opacity-0 group-hover:opacity-100 border border-white/10 hover:bg-accent-500/20 hover:text-accent-300 hover:border-accent-400/50 hover:scale-110',
    icon: 'h-5 w-5'
  },
  compact: {
    tooltip: 'COPY_LINK',
    button: 'p-1.5 rounded-md text-gray-500 hover:text-accent-300 hover:bg-accent-500/20 hover:border-accent-400/30 border border-transparent transition-all duration-300',
    icon: 'h-4 w-4'
  }
};

// Copy-link button used across grid/list/matrix layouts.
export default function CardCopyLinkButton({ variant = 'compact', project, onCopyLink }) {
  const cfg = VARIANTS[variant] || VARIANTS.compact;

  return (
    <Tooltip text={cfg.tooltip}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          soundSystem.playClick();
          if (onCopyLink) onCopyLink(project);
        }}
        className={cfg.button}
        aria-label="Copy link"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={cfg.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </button>
    </Tooltip>
  );
}
