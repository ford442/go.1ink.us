import React from 'react';

const Card = ({ project }) => {
  return (
    <div className="perspective-container">
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        className="card-3d block bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-500 flex flex-col h-full relative group"
      >
      {/* Image Area with overlay gradient */}
      {project.image ? (
        <div className="h-48 overflow-hidden relative">
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      ) : (
        // Fallback graphical area if no image is present
        <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center relative overflow-hidden">
            <span className="text-6xl transform transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">{project.icon}</span>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col relative z-10">
        <div className="flex items-center mb-4">
          {/* Only show the small icon if we have an image, otherwise the big icon above is enough (or show both as requested by design choice)
              Let's show it to keep consistent branding.
          */}
          {project.image && <div className="text-2xl mr-3 transform transition-transform duration-300 group-hover:rotate-12">{project.icon}</div>}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {project.title}
          </h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 flex-1">
          {project.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mt-auto">
          {project.tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-md"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      {/* 3D shine effect overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent shine-effect"></div>
      </div>
    </a>
    </div>
  );
};

export default Card;
