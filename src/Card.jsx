import React from 'react';

const Card = ({ project }) => {
  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
    >
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="text-4xl mr-4">{project.icon}</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {project.title}
          </h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
          {project.description}
        </p>
        
        <div className="flex flex-wrap gap-2">
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
