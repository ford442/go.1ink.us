// Define high-level categories to organize the clutter of tags
export const CATEGORIES = {
  'Games': ['Game', 'Fun', 'Candy', 'Tetris', 'Toy', 'Adventure'],
  'Audio/Visual': ['Audio', 'DAW', 'Music', 'Sound', 'Ambient', 'Relaxation', 'Graphics', 'Shaders', 'Video', 'Art', 'Visualization', 'Fluid'],
  'Tools': ['Utility', 'Weather', 'Clock', 'Maps', '360', 'Exploration', 'UI', 'Components', 'Design', 'Data', 'Science'],
  'Experiments': ['Web', 'Interactive', 'Experiment', 'External', 'Project', 'Portfolio']
};

export const CATEGORY_ICONS = {
  'Games': '🎮',
  'Audio/Visual': '🎧',
  'Tools': '🛠️',
  'Experiments': '🧪'
};

export const CATEGORY_THEMES = {
  'Games': ['bg-orange-600/30', 'bg-red-600/30', 'bg-amber-600/20', 'bg-yellow-600/20'],
  'Audio/Visual': ['bg-fuchsia-600/30', 'bg-violet-600/30', 'bg-purple-600/20', 'bg-pink-600/20'],
  'Tools': ['bg-blue-600/30', 'bg-sky-600/30', 'bg-cyan-600/20', 'bg-slate-600/20'],
  'Experiments': ['bg-emerald-600/30', 'bg-lime-600/30', 'bg-green-600/20', 'bg-teal-600/20'],
  'default': ['bg-blue-600/30', 'bg-purple-600/30', 'bg-pink-600/20', 'bg-cyan-600/20']
};

// Pre-calculate tag-to-category mapping for O(1) lookup
export const TAG_TO_CATEGORIES = {};
Object.entries(CATEGORIES).forEach(([category, tags]) => {
  tags.forEach(tag => {
    if (!TAG_TO_CATEGORIES[tag]) TAG_TO_CATEGORIES[tag] = [];
    TAG_TO_CATEGORIES[tag].push(category);
  });
});

// Styles for active category and tag buttons
export const CATEGORY_BUTTON_STYLES = {
  'Games': {
    activeClass: 'bg-orange-500/80 text-white border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.5)] scale-105 animate-pulse-glow-orange',
    tagClass: 'bg-orange-500/20 text-orange-200 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.3)] animate-pulse-glow-orange'
  },
  'Audio/Visual': {
    activeClass: 'bg-fuchsia-500/80 text-white border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.5)] scale-105 animate-pulse-glow-fuchsia',
    tagClass: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-500/50 shadow-[0_0_10px_rgba(217,70,239,0.3)] animate-pulse-glow-fuchsia'
  },
  'Tools': {
    activeClass: 'bg-blue-500/80 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105 animate-pulse-glow-blue',
    tagClass: 'bg-blue-500/20 text-blue-200 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)] animate-pulse-glow-blue'
  },
  'Experiments': {
    activeClass: 'bg-emerald-500/80 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-105 animate-pulse-glow-emerald',
    tagClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse-glow-emerald'
  },
  'All': {
    activeClass: 'bg-cyan-500/80 text-white border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-105 animate-pulse-glow',
    tagClass: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.3)] animate-pulse-glow'
  },
  'default': {
    activeClass: 'bg-cyan-500/80 text-white border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-105 animate-pulse-glow',
    tagClass: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.3)] animate-pulse-glow'
  }
};
