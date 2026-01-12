import React, { useState, useMemo, useEffect, useRef } from 'react';
import Card from './Card';
import projectData from './projectData';
import './App.css';

// Define high-level categories to organize the clutter of tags
const CATEGORIES = {
  'Games': ['Game', 'Fun', 'Candy', 'Tetris', 'Toy', 'Adventure'],
  'Audio/Visual': ['Audio', 'DAW', 'Music', 'Sound', 'Ambient', 'Relaxation', 'Graphics', 'Shaders', 'Video', 'Art', 'Visualization', 'Fluid'],
  'Tools': ['Utility', 'Weather', 'Clock', 'Maps', '360', 'Exploration', 'UI', 'Components', 'Design', 'Data', 'Science'],
  'Experiments': ['Web', 'Interactive', 'Experiment', 'External', 'Project', 'Portfolio']
};

function App() {
  // activeFilter can be 'All', a Category Key (e.g., 'Games'), or a specific Tag (e.g., 'Fluid')
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Refs for background blobs to implement parallax
  const blob1Ref = useRef(null);
  const blob2Ref = useRef(null);
  const blob3Ref = useRef(null);

  // We don't need allTags list for the main filter bar anymore, but keeping it if needed for debug
  // const allTags = useMemo(() => ['All', ...new Set(projectData.flatMap(p => p.tags))], []);

  const filteredProjects = projectData.filter(project => {
    let matchesFilter = false;

    if (activeFilter === 'All') {
      matchesFilter = true;
    } else if (CATEGORIES[activeFilter]) {
      // It's a Category: Match if project has ANY tag in this category
      const categoryTags = CATEGORIES[activeFilter];
      matchesFilter = project.tags.some(tag => categoryTags.includes(tag));
    } else {
      // It's a specific Tag
      matchesFilter = project.tags.includes(activeFilter);
    }

    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Dynamic Background: Parallax (Scroll) + Interactive (Mouse)
  useEffect(() => {
    let scrollY = window.scrollY;
    let mouseX = 0;
    let mouseY = 0;
    let animationFrameId;

    const updateTransforms = () => {
      // Calculate smooth blob positions based on scroll AND mouse
      // Blob 1: Moves with scroll (0.2), Retreats from mouse (-0.02)
      if (blob1Ref.current) {
        blob1Ref.current.style.transform = `translate3d(${mouseX * -0.02}px, ${scrollY * 0.2 + mouseY * -0.02}px, 0)`;
      }
      // Blob 2: Moves with scroll (-0.15), Attracted to mouse (0.03)
      if (blob2Ref.current) {
        blob2Ref.current.style.transform = `translate3d(${mouseX * 0.03}px, ${scrollY * -0.15 + mouseY * 0.03}px, 0)`;
      }
      // Blob 3: Moves with scroll (0.1), Slight drift with mouse (0.01)
      if (blob3Ref.current) {
        blob3Ref.current.style.transform = `translate3d(${mouseX * 0.01}px, ${scrollY * 0.1 + mouseY * 0.01}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(updateTransforms);
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    const handleMouseMove = (e) => {
      // Center the coordinate system for mouse
      mouseX = e.clientX - window.innerWidth / 2;
      mouseY = e.clientY - window.innerHeight / 2;
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    // Start animation loop
    updateTransforms();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const isCustomTag = activeFilter !== 'All' && !CATEGORIES[activeFilter];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-slate-950 relative overflow-hidden font-sans">
      
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated Blobs with Parallax Wrapper */}
        <div ref={blob1Ref} className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] will-change-transform transition-transform duration-75 linear">
            <div className="w-full h-full bg-blue-600/30 rounded-full blur-[100px] animate-blob mix-blend-screen"></div>
        </div>

        <div ref={blob2Ref} className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] will-change-transform transition-transform duration-75 linear">
            <div className="w-full h-full bg-purple-600/30 rounded-full blur-[100px] animate-blob mix-blend-screen" style={{ animationDelay: "2s" }}></div>
        </div>

        <div ref={blob3Ref} className="absolute top-[40%] left-[30%] w-[30rem] h-[30rem] will-change-transform transition-transform duration-75 linear">
            <div className="w-full h-full bg-pink-600/20 rounded-full blur-[80px] animate-blob mix-blend-screen" style={{ animationDelay: "4s" }}></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundSize: '60px 60px',
            backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
            maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)'
          }}
        ></div>
      </div>
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <header className="text-center mb-10 flex justify-center">
          <div className="relative">
            {/* Glow behind title */}
            <div className="absolute inset-0 bg-indigo-500/30 blur-3xl rounded-full transform scale-75"></div>
            <img
              src="./title.png"
              alt="Web apps from 1ink.us"
              className="relative max-w-lg md:max-w-2xl h-auto max-h-48 md:max-h-64 object-contain animate-fade-in animate-float drop-shadow-2xl filter"
            />
          </div>
        </header>
        
        {/* Search Bar */}
        <div className="flex justify-center mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="relative w-full max-w-md group px-4">
             <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none">
                <span className="text-gray-400 group-focus-within:text-cyan-400 transition-colors text-lg">🔍</span>
             </div>
             <input
                type="text"
                placeholder="Search portal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all duration-300 backdrop-blur-sm"
             />
             {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-8 flex items-center text-gray-500 hover:text-cyan-400 transition-colors"
                  aria-label="Clear search"
                >
                  ✕
                </button>
             )}
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="mb-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex flex-wrap justify-center gap-2 px-4 max-w-4xl mx-auto">
            {/* 'All' Button */}
            <button
              onClick={() => setActiveFilter('All')}
              className={`
                px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 backdrop-blur-sm border
                ${activeFilter === 'All'
                  ? 'bg-cyan-600/30 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.3)] scale-105'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white'}
              `}
            >
              All
            </button>

            {/* Category Buttons */}
            {Object.keys(CATEGORIES).map((category) => (
              <button
                key={category}
                onClick={() => setActiveFilter(category)}
                className={`
                  px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 backdrop-blur-sm border
                  ${activeFilter === category
                    ? 'bg-cyan-600/30 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.3)] scale-105'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white'}
                `}
              >
                {category}
              </button>
            ))}

            {/* Custom Tag Button (Only shows if a specific non-category tag is active) */}
            {isCustomTag && (
              <div className="flex items-center ml-2 pl-4 border-l border-white/20">
                <span className="text-gray-500 text-xs mr-2 uppercase tracking-wider">Tag:</span>
                <button
                  onClick={() => setActiveFilter('All')} // Clicking it resets to All, or we could keep it active
                  className="px-4 py-2 rounded-full text-sm font-medium bg-purple-600/30 border border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center gap-2 animate-fade-in"
                >
                  {activeFilter}
                  <span className="text-purple-300 text-xs hover:text-white">✕</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                project={project}
                onTagClick={setActiveFilter} // Passing setActiveFilter allows clicking tags on cards to switch filter
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 animate-fade-in">
             <div className="text-6xl mb-4 opacity-50">👻</div>
             <p className="text-xl text-gray-400">
               {searchQuery ? `No projects found matching "${searchQuery}"` : 'No projects found for this filter.'}
             </p>
             <button
               onClick={() => { setActiveFilter('All'); setSearchQuery(''); }}
               className="mt-4 text-cyan-400 hover:text-cyan-300 underline underline-offset-4"
             >
               Reset filters
             </button>
          </div>
        )}
        
        <footer className="mt-24 mb-8 flex flex-col justify-center items-center gap-4">
          <img
            src="./go1inkus.png"
            alt="go1ink.us"
            className="h-16 md:h-20 lg:h-24 w-auto opacity-60 hover:opacity-100 transition-all duration-300 hover:scale-105"
          />
        </footer>
      </div>
    </div>
  );
}

export default App;
