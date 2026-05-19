# go.1ink.us

A React application showcasing various web projects built with Vite and styled with Tailwind CSS.

## Features

- **React + Vite**: Fast development with Hot Module Replacement (HMR)
- **Tailwind CSS**: Modern utility-first CSS framework for responsive design
- **Project Portfolio**: Display multiple projects with card-based layout
- **Responsive Grid**: Automatically adjusts from 1 column (mobile) to 2 columns (tablet) to 3 columns (desktop)
- **Hover Effects**: Cards scale up and show a blue glow effect on hover
- **Dark Mode Support**: Automatically adapts to system color scheme preferences

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

- `src/projectData.js` - Contains the array of project objects
- `src/Card.jsx` - Reusable card component with hover effects
- `src/App.jsx` - Main application with responsive grid layout
- `src/index.css` - Global styles with Tailwind directives

## Customization

To add your own projects, edit `src/projectData.js` and update the project objects with your own information (id, title, description, url, icon, tags).

