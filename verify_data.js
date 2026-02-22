/* global process */
import { CATEGORIES } from './src/constants.js';
import projectData from './src/projectData.js';

console.log('Verifying project data...');

// Create a Set of all valid tags from CATEGORIES
const validTags = new Set();
Object.values(CATEGORIES).forEach(tags => {
  tags.forEach(tag => validTags.add(tag));
});

let hasError = false;

projectData.forEach((project, index) => {
  // Check tags against valid tags
  if (!project.tags || !Array.isArray(project.tags)) {
    console.error(`Error in project "${project.title}" (index ${index}): Tags missing or not an array`);
    hasError = true;
  } else {
    project.tags.forEach(tag => {
      if (!validTags.has(tag)) {
        console.error(`Error in project "${project.title}" (index ${index}): Invalid tag "${tag}"`);
        hasError = true;
      }
    });
  }

  // Check required fields
  const requiredFields = ['title', 'description', 'url', 'tags', 'image'];
  requiredFields.forEach(field => {
    if (!project[field]) {
      console.error(`Error in project "${project.title}" (index ${index}): Missing field "${field}"`);
      hasError = true;
    }
  });
});

if (hasError) {
  console.error('Data verification failed.');
  process.exit(1);
} else {
  console.log('Data verification passed!');
  process.exit(0);
}
