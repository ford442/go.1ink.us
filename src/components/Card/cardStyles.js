// Shared outer-wrapper class-name builder for the four Card layout variants.
// Each variant has a distinct base (perspective/warp/focus-ring treatment)
// and a distinct isDragOver accent, but share the same draggable/isDragged
// state classes — centralized here instead of duplicated per layout file.
const VARIANTS = {
  dataMode: {
    base: 'perspective-container card-focusable focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-400 focus-visible:ring-offset-4 focus-visible:ring-offset-black rounded-xl animate-slide-in-up transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:z-10',
    dragOver: 'ring-2 ring-pink-500 z-50 rounded-lg'
  },
  matrix: {
    base: 'perspective-container warp-scroll-effect card-focusable focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-400 focus-visible:ring-offset-4 focus-visible:ring-offset-black rounded-xl animate-slide-in-up transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:z-10',
    dragOver: 'ring-2 ring-pink-500 z-50 rounded-lg'
  },
  list: {
    base: 'card-focusable warp-scroll-effect-list w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black animate-slide-in-up',
    dragOver: 'ring-2 ring-pink-500 rounded'
  },
  grid: {
    base: 'perspective-container warp-scroll-effect focus-visible:outline-none rounded-xl animate-slide-in-up transition-all duration-500 ease-out hover:-translate-y-3 hover:shadow-[0_20px_40px_-15px_rgba(var(--rgb-accent-400),0.3)] hover:z-10',
    dragOver: 'ring-2 ring-pink-500 scale-105 z-50'
  }
};

export function getCardWrapperClasses(variant, { draggable, isDragged, isDragOver }) {
  const { base, dragOver } = VARIANTS[variant];
  return `${base} ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragged ? 'opacity-50 scale-95 shadow-none' : ''} ${isDragOver ? dragOver : ''}`;
}
