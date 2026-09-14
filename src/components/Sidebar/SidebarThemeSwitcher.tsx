import type { ThemeId } from '../../types';

const THEME_SWATCHES: { id: ThemeId; color: string; glow: string; border: string }[] = [
  { id: 'cyan', color: 'bg-cyan-500', glow: 'shadow-[0_0_10px_rgba(6,182,212,0.8)]', border: 'border-cyan-400' },
  { id: 'purple', color: 'bg-purple-500', glow: 'shadow-[0_0_10px_rgba(168,85,247,0.8)]', border: 'border-purple-400' },
  { id: 'emerald', color: 'bg-emerald-500', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.8)]', border: 'border-emerald-400' },
  { id: 'gold', color: 'bg-amber-500', glow: 'shadow-[0_0_10px_rgba(245,158,11,0.8)]', border: 'border-amber-400' }
];

interface SidebarThemeSwitcherProps {
  theme: ThemeId;
  changeTheme: (theme: ThemeId) => void;
}

export default function SidebarThemeSwitcher({ theme, changeTheme }: SidebarThemeSwitcherProps) {
  return (
    <div className="hidden lg:block mt-4">
      <div className="text-accent-500/70 text-[10px] font-mono tracking-widest uppercase mb-3 border-b border-accent-500/20 pb-1 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        System Theme
      </div>
      <div className="flex items-center gap-3">
        {THEME_SWATCHES.map((t) => (
          <button
            key={t.id}
            onClick={() => changeTheme(t.id)}
            className={`w-6 h-6 rounded-full border border-white/20 transition-all duration-300 relative group overflow-hidden ${theme === t.id ? t.border : 'hover:border-white/50'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-accent-400`}
            aria-label={`Switch theme to ${t.id}`}
            title={`Protocol: ${t.id.toUpperCase()}`}
          >
            <div className={`absolute inset-0 ${t.color} ${theme === t.id ? t.glow : 'opacity-50 group-hover:opacity-80 group-hover:scale-110'} transition-all duration-300`}></div>
            {theme === t.id && (
              <div className="absolute inset-0 border-2 border-white/40 rounded-full animate-pulse-glow"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
