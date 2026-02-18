import projectData from './src/projectData.js';
import { CATEGORIES } from './src/constants.js';

console.log('Verifying project data...');

let hasErrors = false;

// Flatten categories to a set of valid tags
const validTags = new Set();
Object.values(CATEGORIES).forEach(tags => {
  tags.forEach(tag => validTags.add(tag));
});

projectData.forEach(project => {
  if (!project.tags || !Array.isArray(project.tags)) {
    console.error(`Project ${project.id} (${project.title}) has invalid tags.`);
    hasErrors = true;
    return;
  }

  project.tags.forEach(tag => {
    if (!validTags.has(tag)) {
      console.error(`Project ${project.id} (${project.title}) has invalid tag: "${tag}"`);
      hasErrors = true;
    }
  });
});

if (hasErrors) {
  console.error('Data verification failed.');
  process.exit(1);
} else {
  console.log('Data verification passed.');
  process.exit(0);
}
