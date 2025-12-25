import React from 'react';
import Card from './Card';
import projectData from './projectData';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4 animate-fade-in">
            Web apps from 1ink.us
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 animate-fade-in-delay">
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
