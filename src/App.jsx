import React from 'react';
import Card from './Card';
import projectData from './projectData';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse animate-pulse-delay"></div>
      </div>
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <header className="text-center mb-16 flex justify-center">
          <img
            src="/title.png"
            alt="Web apps from 1ink.us"
            className="max-w-full h-auto max-h-32 object-contain animate-fade-in drop-shadow-2xl filter"
          />
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projectData.map((project) => (
            <Card key={project.id} project={project} />
          ))}
        </div>
        
        <footer className="mt-20 mb-8 flex justify-center items-center">
          <img
            src="/go1ink.us.png"
            alt="go1ink.us"
            className="h-12 w-auto opacity-80 hover:opacity-100 transition-opacity duration-300"
          />
        </footer>
      </div>
    </div>
  );
}

export default App;
