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
