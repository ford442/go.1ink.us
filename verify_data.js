/* global process */
import { CATEGORIES } from './src/constants.js';
import { projectData } from './src/projectData.js';

console.log('Verifying project data...');

const validCategories = new Set(Object.values(CATEGORIES));
let hasError = false;

projectData.forEach((project, index) => {
  // Check category
  if (!validCategories.has(project.category)) {
    console.error(`Error in project "${project.title}" (index ${index}): Invalid category "${project.category}"`);
    hasError = true;
  }

  // Check required fields
  const requiredFields = ['title', 'description', 'url', 'tags', 'image'];
  requiredFields.forEach(field => {
    if (!project[field]) {
      console.error(`Error in project "${project.title}" (index ${index}): Missing field "${field}"`);
      hasError = true;
    }
  });

  // Check tags array
  if (!Array.isArray(project.tags) || project.tags.length === 0) {
    console.error(`Error in project "${project.title}" (index ${index}): Tags must be a non-empty array`);
    hasError = true;
  }
});

if (hasError) {
  console.error('Data verification failed.');
  process.exit(1);
} else {
  console.log('Data verification passed!');
  process.exit(0);
}
