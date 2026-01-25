import projectData from './src/projectData.js';

const CATEGORIES = {
  'Games': ['Game', 'Fun', 'Candy', 'Tetris', 'Toy', 'Adventure'],
  'Audio/Visual': ['Audio', 'DAW', 'Music', 'Sound', 'Ambient', 'Relaxation', 'Graphics', 'Shaders', 'Video', 'Art', 'Visualization', 'Fluid'],
  'Tools': ['Utility', 'Weather', 'Clock', 'Maps', '360', 'Exploration', 'UI', 'Components', 'Design', 'Data', 'Science'],
  'Experiments': ['Web', 'Interactive', 'Experiment', 'External', 'Project', 'Portfolio']
};

const allDefinedTags = new Set(Object.values(CATEGORIES).flat());

console.log("Checking for missing tags...");
const missingTags = new Set();
projectData.forEach(p => {
  p.tags.forEach(t => {
    if (!allDefinedTags.has(t)) {
      missingTags.add(t);
    }
  });
});

if (missingTags.size > 0) {
  console.log("Tags in projectData but NOT in CATEGORIES:", Array.from(missingTags));
} else {
  console.log("All tags in projectData are covered by CATEGORIES.");
}

console.log("\nChecking for duplicate tags in CATEGORIES...");
const seenTags = new Set();
const duplicates = [];
Object.entries(CATEGORIES).forEach(([cat, tags]) => {
  tags.forEach(t => {
    if (seenTags.has(t)) {
      duplicates.push({ tag: t, category: cat });
    }
    seenTags.add(t);
  });
});

if (duplicates.length > 0) {
  console.log("Duplicate tags found:", duplicates);
} else {
  console.log("No duplicate tags across categories.");
}
