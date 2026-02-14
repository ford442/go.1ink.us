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

const CATEGORY_THEMES = {
  'Games': ['bg-orange-600/30', 'bg-red-600/30', 'bg-amber-600/20', 'bg-yellow-600/20'],
  'Audio/Visual': ['bg-fuchsia-600/30', 'bg-violet-600/30', 'bg-purple-600/20', 'bg-pink-600/20'],
  'Tools': ['bg-blue-600/30', 'bg-sky-600/30', 'bg-cyan-600/20', 'bg-slate-600/20'],
  'Experiments': ['bg-emerald-600/30', 'bg-lime-600/30', 'bg-green-600/20', 'bg-teal-600/20'],
  'default': ['bg-blue-600/30', 'bg-purple-600/30', 'bg-pink-600/20', 'bg-cyan-600/20']
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

      // Global Escape Handler
      if (e.key === 'Escape') {
        if (document.activeElement === searchInputRef.current) {
          // If in search input: Clear if text exists, otherwise Blur
          if (searchInputRef.current.value) {
            setSearchQuery('');
          } else {
            searchInputRef.current?.blur();
          }
        } else {
          // If anywhere else: Reset everything
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
  const starfieldRef = useRef(null);

  // Calculate the current parent category based on the active filter
  // This allows us to show the relevant sub-tags even when a specific tag is selected
  const currentCategory = useMemo(() => {
    if (activeFilter === 'All') return null;
    if (CATEGORIES[activeFilter]) return activeFilter;
    return getCategoryForTag(activeFilter);
  }, [activeFilter]);

  // Determine the active color theme based on the current category context
  const currentTheme = useMemo(() => {
    if (currentCategory && CATEGORY_THEMES[currentCategory]) {
      return CATEGORY_THEMES[currentCategory];
    }
    return CATEGORY_THEMES['default'];
  }, [currentCategory]);


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

  const filteredProjects = useMemo(() => {
    return projectData.filter(project => {
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
  }, [activeFilter, searchQuery, projectData]);

  // Dynamic Background: Parallax (Scroll) + Interactive (Mouse)
  useEffect(() => {
    let scrollY = window.scrollY;

    // Target mouse position (where the cursor actually is)
    let targetMouseX = 0;
    let targetMouseY = 0;

    // Current interpolated mouse position (for smooth animation)
    let currentMouseX = 0;
    let currentMouseY = 0;

    let pageMouseX = 0;
    let pageMouseY = 0;
    let animationFrameId;

    const updateTransforms = () => {
      // Lerp current towards target (0.05 factor for smooth inertia)
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      // Calculate smooth blob positions based on scroll AND interpolated mouse
      // Blob 1: Moves with scroll (0.2), Retreats from mouse (-0.02)
      if (blob1Ref.current) {
        blob1Ref.current.style.transform = `translate3d(${currentMouseX * -0.02}px, ${scrollY * 0.2 + currentMouseY * -0.02}px, 0)`;
      }
      // Blob 2: Moves with scroll (-0.15), Attracted to mouse (0.03)
      if (blob2Ref.current) {
        blob2Ref.current.style.transform = `translate3d(${currentMouseX * 0.03}px, ${scrollY * -0.15 + currentMouseY * 0.03}px, 0)`;
      }
      // Blob 3: Moves with scroll (0.1), Slight drift with mouse (0.01)
      if (blob3Ref.current) {
        blob3Ref.current.style.transform = `translate3d(${currentMouseX * 0.01}px, ${scrollY * 0.1 + currentMouseY * 0.01}px, 0)`;
      }
      // Blob 4: Moves with scroll (-0.1), Counter-drift with mouse (-0.03)
      if (blob4Ref.current) {
        blob4Ref.current.style.transform = `translate3d(${currentMouseX * -0.03}px, ${scrollY * -0.1 + currentMouseY * -0.03}px, 0)`;
      }

      // Starfield: Subtle parallax (very far away)
      if (starfieldRef.current) {
        starfieldRef.current.style.transform = `translate3d(${currentMouseX * -0.005}px, ${scrollY * 0.02 + currentMouseY * -0.005}px, 0)`;
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
      targetMouseX = e.clientX - window.innerWidth / 2;
      targetMouseY = e.clientY - window.innerHeight / 2;
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
        <Starfield ref={starfieldRef} />

        {/* Animated Blobs with Parallax Wrapper */}
        <div ref={blob1Ref} className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] will-change-transform">
            <div className={`w-full h-full ${currentTheme[0]} rounded-full blur-[100px] animate-blob mix-blend-screen transition-colors duration-[2000ms]`}></div>
        </div>

        <div ref={blob2Ref} className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] will-change-transform">
            <div className={`w-full h-full ${currentTheme[1]} rounded-full blur-[100px] animate-blob mix-blend-screen transition-colors duration-[2000ms]`} style={{ animationDelay: "2s" }}></div>
        </div>

        <div ref={blob3Ref} className="absolute top-[40%] left-[30%] w-[30rem] h-[30rem] will-change-transform">
            <div className={`w-full h-full ${currentTheme[2]} rounded-full blur-[80px] animate-blob mix-blend-screen transition-colors duration-[2000ms]`} style={{ animationDelay: "4s" }}></div>
        </div>

        <div ref={blob4Ref} className="absolute top-[10%] right-[20%] w-[35rem] h-[35rem] will-change-transform">
            <div className={`w-full h-full ${currentTheme[3]} rounded-full blur-[90px] animate-blob mix-blend-screen transition-colors duration-[2000ms]`} style={{ animationDelay: "6s" }}></div>
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
        <header className="text-center mb-12 flex justify-center">
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

        {/* Command Center: Filter Bar & Search */}
        <div className="max-w-7xl mx-auto mb-16 space-y-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {/* Search Input Section */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-lg group">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-cyan-500/50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' || e.key === 'Enter') {
                      const firstCard = document.querySelector('.card-link');
                      if (firstCard) {
                        e.preventDefault();
                        firstCard.focus();
                        firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }
                  }}
                  placeholder="Search protocols..."
                  className="w-full bg-black/40 backdrop-blur-md border border-white/10 text-white pl-12 pr-32 py-4 rounded-full focus:outline-none focus:border-cyan-500/50 focus:bg-black/60 transition-all duration-300 shadow-lg placeholder-gray-500"
                />

                {/* Right Actions: Results Count or Shortcut Hint */}
                <div className="absolute right-4 flex items-center space-x-3">
                  {searchQuery ? (
                    <>
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded">
                        {filteredProjects.length} found
                      </span>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-gray-400 hover:text-white transition-colors"
                        aria-label="Clear search"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <div className="hidden md:flex items-center space-x-1 text-gray-500 text-xs border border-white/10 rounded px-2 py-1">
                      <span className="text-xs">⌘</span>
                      <span>K</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Category Filter Section */}
          <div className="flex flex-wrap justify-center gap-4">
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
                px-6 py-2 rounded-full font-medium transition-all duration-300 backdrop-blur-md border flex items-center gap-2
                ${activeFilter === 'All'
                  ? 'bg-cyan-500/80 text-white border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-105'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30'
                }
              `}
            >
              <span>🌌</span>
              <span>All</span>
              <span className={`text-xs ml-1 ${activeFilter === 'All' ? 'text-cyan-200' : 'text-gray-500'}`}>
                ({projectData.filter(p => isProjectMatchingQuery(p, searchQuery)).length})
              </span>
            </button>

            {/* Category Buttons */}
            {Object.keys(CATEGORIES).map((category) => {
              const isActive = activeFilter === category || (CATEGORIES[category] && CATEGORIES[category].includes(activeFilter));
              const count = getCategoryCount(category);

              // Hide category if search yields 0 results for it, unless it's active
              if (count === 0 && !isActive) return null;

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
                    px-5 py-2 rounded-full font-medium transition-all duration-300 backdrop-blur-md border flex items-center gap-2
                    ${isActive
                      ? 'bg-cyan-500/80 text-white border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-105'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30'
                    }
                  `}
                >
                  <span>{CATEGORY_ICONS[category]}</span>
                  <span>{category}</span>
                  <span className={`text-xs ml-1 ${isActive ? 'text-cyan-200' : 'text-gray-500'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sub-Category Tags Section */}
          {currentCategory && (
            <div className="flex flex-wrap justify-center gap-2 animate-fade-in">
              {CATEGORIES[currentCategory].map((tag, index) => {
                const isActive = activeFilter === tag;
                const count = getTagCount(tag);

                if (count === 0 && !isActive) return null;

                return (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className={`
                      px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border flex items-center gap-2 animate-fade-in
                      ${isActive
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                        : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/20'
                      }
                    `}
                  >
                    <span>{tag}</span>
                    <span className="text-xs opacity-60">({count})</span>
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
          <div className="max-w-2xl mx-auto mt-10 animate-fade-in">
             <div className="system-alert rounded-xl p-8 backdrop-blur-md">
                <div className="scanline"></div>
                <div className="flex flex-col items-center justify-center text-center space-y-4 relative z-10">
                   <div className="text-6xl mb-2 opacity-80 glitch-text" data-text="⚠️">⚠️</div>
                   <h3 className="text-2xl font-bold text-red-400 uppercase tracking-widest glitch-text" data-text="SYSTEM ALERT">
                      SYSTEM ALERT
                   </h3>
                   <div className="text-red-300/80 font-mono text-sm bg-black/30 p-4 rounded border border-red-500/20 w-full">
                      <p className="mb-2">{`> SEARCH_QUERY: "${searchQuery || activeFilter}"`}</p>
                      <p className="mb-2">{`> STATUS: 0_MATCHES_FOUND`}</p>
                      <p className="animate-pulse">{`> RECOMMENDATION: ADJUST_PARAMETERS`}</p>
                   </div>
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
                     className="mt-4 px-6 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 rounded-full transition-all duration-300 hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] uppercase text-sm font-bold tracking-wider"
                   >
                     Reset Protocol
                   </button>
                </div>
             </div>
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
