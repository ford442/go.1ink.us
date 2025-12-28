import React from 'react';

const Card = ({ project }) => {
  return (
    <div className="perspective-container">
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        className="glass-card card-3d block rounded-xl overflow-hidden flex flex-col h-full relative group"
      >
      {/* Image Area with overlay gradient */}
      {project.image ? (
        <div className="h-48 overflow-hidden relative border-b border-white/5">
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 flex items-center justify-center relative overflow-hidden border-b border-white/5">
            <span className="text-6xl transform transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12 drop-shadow-lg">{project.icon}</span>
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col relative z-10">
        <div className="flex items-center mb-3">
          {project.image && <div className="text-2xl mr-3 transform transition-transform duration-300 group-hover:rotate-12 filter drop-shadow">{project.icon}</div>}
          <h3 className="text-xl font-bold text-white tracking-wide group-hover:text-blue-300 transition-colors duration-300">
            {project.title}
          </h3>
        </div>
        
        <p className="text-gray-300 mb-5 line-clamp-3 leading-relaxed flex-1">
          {project.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mt-auto">
          {project.tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 text-xs font-semibold tracking-wider text-cyan-200 bg-cyan-900/30 border border-cyan-500/20 rounded-full transition-all duration-300 group-hover:border-cyan-400/50 group-hover:shadow-[0_0_10px_rgba(34,211,238,0.2)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      {/* 3D shine effect overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent shine-effect"></div>
      </div>
    </a>
    </div>
  );
};

export default Card;
