import React, { useState, useMemo, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import Card from './Card';
import Starfield from './Starfield';
import projectData from './projectData';
import './App.css';

// Define high-level categories to organize the clutter of tags
const CATEGORIES = {
  'Games': ['Game', 'Fun', 'Candy', 'Tetris', 'Toy', 'Adventure'],
  'Audio/Visual': ['Audio', 'DAW', 'Music', 'Sound', 'Ambient', 'Relaxation', 'Graphics', 'Shaders', 'Video', 'Art', 'Visualization', 'Fluid'],
  'Tools': ['Utility', 'Weather', 'Clock', 'Maps', '360', 'Exploration', 'UI', 'Components', 'Design', 'Data', 'Science'],
  'Experiments': ['Web', 'Interactive', 'Experiment', 'External', 'Project', 'Portfolio']
};

const CATEGORY_ICONS = {
  'Games': '🎮',
  'Audio/Visual': '🎧',
  'Tools': '🛠️',
  'Experiments': '🧪'
};

// Helper to find which category a tag belongs to
const getCategoryForTag = (tag) => {
  return Object.keys(CATEGORIES).find(cat => CATEGORIES[cat].includes(tag));
};

// Helper to check if a project matches the search query
const isProjectMatchingQuery = (project, query) => {
  if (!query) return true;
  const lowerQuery = query.toLowerCase();
  return (
    project.title.toLowerCase().includes(lowerQuery) ||
    project.description.toLowerCase().includes(lowerQuery) ||
    project.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

function App() {
  // activeFilter can be 'All', a Category Key (e.g., 'Games'), or a specific Tag (e.g., 'Fluid')
  const [activeFilter, setActiveFilter] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('filter') || 'All';
    }
    return 'All';
  });

  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('q') || '';
    }
    return '';
  });

  // Sync state to URL (Deep Linking)
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeFilter !== 'All') params.set('filter', activeFilter);
    if (searchQuery) params.set('q', searchQuery);

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;

    // Use replaceState to update URL without cluttering history stack
    window.history.replaceState(null, '', newUrl);
  }, [activeFilter, searchQuery]);

  const searchInputRef = useRef(null);

  // Keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Focus on '/' or 'Cmd+K' / 'Ctrl+K'
      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Clear/Blur on Escape
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        if (searchInputRef.current.value) {
          setSearchQuery('');
        } else {
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Refs for background blobs to implement parallax
  const blob1Ref = useRef(null);
  const blob2Ref = useRef(null);
  const blob3Ref = useRef(null);
  const blob4Ref = useRef(null);

  // Ref for the spotlight grid
  const gridSpotlightRef = useRef(null);

  // Calculate the current parent category based on the active filter
  // This allows us to show the relevant sub-tags even when a specific tag is selected
  const currentCategory = useMemo(() => {
    if (activeFilter === 'All') return null;
    if (CATEGORIES[activeFilter]) return activeFilter;
    return getCategoryForTag(activeFilter);
  }, [activeFilter]);

  // Helper to get count for a category (respecting search)
  const getCategoryCount = (categoryKey) => {
    const categoryTags = CATEGORIES[categoryKey];
    // Count projects that have AT LEAST ONE tag from this category AND match search
    return projectData.filter(p =>
      p.tags.some(t => categoryTags.includes(t)) &&
      isProjectMatchingQuery(p, searchQuery)
    ).length;
  };

  // Helper to get count for a specific tag (respecting search)
  const getTagCount = (tag) => {
    return projectData.filter(p =>
      p.tags.includes(tag) &&
      isProjectMatchingQuery(p, searchQuery)
    ).length;
  };

  const handleTagClick = (tag) => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => setActiveFilter(tag));
      });
    } else {
      setActiveFilter(tag);
    }
  };

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

    const matchesSearch = isProjectMatchingQuery(project, searchQuery);
    return matchesFilter && matchesSearch;
  });

  // Dynamic Background: Parallax (Scroll) + Interactive (Mouse)
  useEffect(() => {
    let scrollY = window.scrollY;
    let mouseX = 0;
    let mouseY = 0;
    let pageMouseX = 0;
    let pageMouseY = 0;
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
      // Blob 4: Moves with scroll (-0.1), Counter-drift with mouse (-0.03)
      if (blob4Ref.current) {
        blob4Ref.current.style.transform = `translate3d(${mouseX * -0.03}px, ${scrollY * -0.1 + mouseY * -0.03}px, 0)`;
      }

      // Update the Grid Spotlight
      if (gridSpotlightRef.current) {
        // Use a radial gradient mask to reveal the cyan grid at the mouse position
        // We use pageX/Y because the grid covers the whole document
        const mask = `radial-gradient(300px circle at ${pageMouseX}px ${pageMouseY}px, black, transparent)`;
        gridSpotlightRef.current.style.maskImage = mask;
        gridSpotlightRef.current.style.webkitMaskImage = mask;
      }

      animationFrameId = requestAnimationFrame(updateTransforms);
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    const handleMouseMove = (e) => {
      // Center the coordinate system for mouse (for parallax)
      mouseX = e.clientX - window.innerWidth / 2;
      mouseY = e.clientY - window.innerHeight / 2;
      // Viewport coordinates (for spotlight fixed background)
      pageMouseX = e.clientX;
      pageMouseY = e.clientY;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-slate-950 relative overflow-hidden font-sans">
      
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <Starfield />

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

        <div ref={blob4Ref} className="absolute top-[10%] right-[20%] w-[35rem] h-[35rem] will-change-transform transition-transform duration-75 linear">
            <div className="w-full h-full bg-cyan-600/20 rounded-full blur-[90px] animate-blob mix-blend-screen" style={{ animationDelay: "6s" }}></div>
        </div>

        {/* Base Grid Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundSize: '60px 60px',
            backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)'
          }}
        ></div>

        {/* Spotlight Grid Overlay (Revealed by Mouse) */}
        <div
          ref={gridSpotlightRef}
          className="absolute inset-0"
          style={{
            backgroundSize: '60px 60px',
            backgroundImage: 'linear-gradient(to right, rgba(34, 211, 238, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(34, 211, 238, 0.15) 1px, transparent 1px)',
            maskImage: 'transparent', // Initially invisible, updated by JS
            WebkitMaskImage: 'transparent'
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
                ref={searchInputRef}
                type="text"
                placeholder="Search portal... (Press /)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all duration-300 backdrop-blur-sm ${searchQuery ? 'pr-32' : 'pr-12'}`}
             />
             {searchQuery && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
                   <span className="text-xs text-gray-500 animate-fade-in">{filteredProjects.length} found</span>
                   <button
                     onClick={() => setSearchQuery('')}
                     className="text-gray-500 hover:text-cyan-400 transition-colors px-2 py-1"
                     aria-label="Clear search"
                   >
                     ✕
                   </button>
                </div>
             )}
          </div>
        </div>

        {/* Main Category Filter Bar */}
        <div className="mb-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex flex-wrap justify-center gap-2 px-4 max-w-4xl mx-auto">
            {/* 'All' Button */}
            <button
              onClick={() => {
                if (document.startViewTransition) {
                  document.startViewTransition(() => {
                    flushSync(() => setActiveFilter('All'));
                  });
                } else {
                  setActiveFilter('All');
                }
              }}
              className={`
                px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 backdrop-blur-sm border
                ${activeFilter === 'All'
                  ? 'bg-cyan-600/30 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.3)] scale-105'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white'}
              `}
            >
              All <span className="text-xs opacity-60 ml-1">({projectData.filter(p => isProjectMatchingQuery(p, searchQuery)).length})</span>
            </button>

            {/* Category Buttons */}
            {Object.keys(CATEGORIES).map((category) => {
              // Highlight if this category is selected OR if a tag within this category is selected
              const isActive = activeFilter === category || currentCategory === category;
              const count = getCategoryCount(category);
              return (
                <button
                  key={category}
                  onClick={() => {
                    if (document.startViewTransition) {
                      document.startViewTransition(() => {
                        flushSync(() => setActiveFilter(category));
                      });
                    } else {
                      setActiveFilter(category);
                    }
                  }}
                  className={`
                    px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 backdrop-blur-sm border
                    ${isActive
                      ? 'bg-cyan-600/30 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.3)] scale-105'
                      : count === 0
                        ? 'bg-white/5 border-white/5 text-gray-600 cursor-default opacity-50'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white'}
                  `}
                >
                  <span className="mr-2">{CATEGORY_ICONS[category]}</span>
                  {category} <span className="text-xs opacity-60 ml-1">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-Category Tag Filter Bar */}
        {/* Only visible when a category (or a tag within it) is active */}
        <div className={`mb-10 transition-all duration-500 ease-in-out overflow-hidden ${currentCategory ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
          {currentCategory && (
             <div className="flex flex-nowrap overflow-x-auto justify-start md:flex-wrap md:justify-center gap-2 px-4 max-w-3xl mx-auto py-2 scrollbar-hide">
               {/* Option to view all in this category */}
               <button
                 onClick={() => {
                   if (document.startViewTransition) {
                     document.startViewTransition(() => {
                       flushSync(() => setActiveFilter(currentCategory));
                     });
                   } else {
                     setActiveFilter(currentCategory);
                   }
                 }}
                 className={`
                    px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 border whitespace-nowrap
                    ${activeFilter === currentCategory
                      ? 'bg-white/20 text-white border-white/30 cursor-default'
                      : 'bg-transparent text-gray-400 border-transparent hover:text-gray-200'}
                 `}
               >
                 All {currentCategory} <span className="opacity-60 ml-1">({getCategoryCount(currentCategory)})</span>
               </button>

               {/* Specific Tags in this Category */}
               {CATEGORIES[currentCategory].map((tag, index) => {
                 const count = getTagCount(tag);
                 return (
                   <button
                     key={tag}
                     onClick={() => {
                       if (document.startViewTransition) {
                         document.startViewTransition(() => {
                           flushSync(() => setActiveFilter(tag));
                         });
                       } else {
                         setActiveFilter(tag);
                       }
                     }}
                     style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
                     className={`
                        px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 border animate-fade-in whitespace-nowrap
                        ${activeFilter === tag
                          ? 'bg-purple-600/40 border-purple-400 text-purple-100 shadow-[0_0_10px_rgba(168,85,247,0.3)] scale-105'
                          : count === 0
                            ? 'bg-white/5 border-white/5 text-gray-600 cursor-default opacity-50'
                            : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10 hover:text-white hover:border-white/10'}
                     `}
                   >
                     {tag} <span className="opacity-60 ml-1">({count})</span>
                   </button>
                 );
               })}
             </div>
          )}
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
            {filteredProjects.map((project) => {
              // Determine which tags to highlight based on active filter
              let highlightedTags = [];
              if (CATEGORIES[activeFilter]) {
                // Active filter is a Category: Highlight all tags that belong to this category
                highlightedTags = project.tags.filter(tag => CATEGORIES[activeFilter].includes(tag));
              } else if (activeFilter !== 'All') {
                // Active filter is a specific Tag: Highlight just that tag
                if (project.tags.includes(activeFilter)) {
                  highlightedTags = [activeFilter];
                }
              }

              return (
                <Card
                  key={project.id}
                  project={project}
                  onTagClick={handleTagClick}
                  searchQuery={searchQuery}
                  highlightedTags={highlightedTags}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 animate-fade-in">
             <div className="text-6xl mb-4 opacity-50 animate-float">👻</div>
             <p className="text-xl text-gray-400">
               {searchQuery ? `No projects found matching "${searchQuery}"` : 'No projects found for this filter.'}
             </p>
             <button
               onClick={() => {
                 if (document.startViewTransition) {
                   document.startViewTransition(() => {
                     flushSync(() => {
                       setActiveFilter('All');
                       setSearchQuery('');
                     });
                   });
                 } else {
                   setActiveFilter('All');
                   setSearchQuery('');
                 }
               }}
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
