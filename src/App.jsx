import React from 'react';
import Card from './Card';
import projectData from './projectData';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            My Web Projects
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Explore my portfolio of innovative web applications
          </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projectData.map((project) => (
            <Card key={project.id} project={project} />
          ))}
        </div>
        
        <footer className="mt-16 text-center text-gray-600 dark:text-gray-400">
          <p>Built with React, Vite, and Tailwind CSS</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
