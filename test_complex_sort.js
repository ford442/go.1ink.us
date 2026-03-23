import fs from 'fs';

const content = fs.readFileSync('src/App.jsx', 'utf-8');
if (content.includes("case 'Most Complex':")) {
  console.log("Sort logic verified in App.jsx");
} else {
  console.log("Sort logic missing from App.jsx");
}

const cardContent = fs.readFileSync('src/Card.jsx', 'utf-8');
if (cardContent.includes("const complexityScore")) {
  console.log("Complexity calculation verified in Card.jsx");
} else {
  console.log("Complexity calculation missing from Card.jsx");
}
