import React from 'react';

const Card = ({ project }) => {
  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50 flex flex-col h-full"
    >
      {/* Image Area */}
      {project.image ? (
        <div className="h-48 overflow-hidden">
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        // Fallback graphical area if no image is present
        <div className="h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-6xl">{project.icon}</span>
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center mb-4">
          {/* Only show the small icon if we have an image, otherwise the big icon above is enough (or show both as requested by design choice)
              Let's show it to keep consistent branding.
          */}
          {project.image && <div className="text-2xl mr-3">{project.icon}</div>}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
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
              className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
};

export default Card;
