import React, { useState, useMemo, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import Card from './Card';
import Starfield from './Starfield';
import projectData from './projectData';
import { CATEGORIES, CATEGORY_ICONS, CATEGORY_THEMES, TAG_TO_CATEGORIES, CATEGORY_BUTTON_STYLES } from './constants';
import './App.css';

// Helper to check if a project matches the search query
const isProjectMatchingQuery = (project, query) => {
  if (!query) return true;
  const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
  return terms.every(term =>
    project.title.toLowerCase().includes(term) ||
    project.description.toLowerCase().includes(term) ||
    project.tags?.some(tag => tag.toLowerCase().includes(term))
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

  const [searchTerm, setSearchTerm] = useState(() => {
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
    if (searchTerm) params.set('q', searchTerm);

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;

    // Use replaceState to update URL without cluttering history stack
    window.history.replaceState(null, '', newUrl);
  }, [activeFilter, searchTerm]);

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
            setSearchTerm('');
          } else {
            searchInputRef.current?.blur();
          }
        } else {
          // If anywhere else: Reset everything
          if (document.startViewTransition) {
            document.startViewTransition(() => {
              flushSync(() => {
                setActiveFilter('All');
                setSearchTerm('');
              });
            });
          } else {
            setActiveFilter('All');
            setSearchTerm('');
          }
        }
      }

      // Card Navigation (Arrow Keys - Spatial Grid)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // Prevent double-handling if focus originated from search input
        if (e.target === searchInputRef.current) return;

        const cardLinks = Array.from(document.querySelectorAll('.card-link'));
        const activeIndex = cardLinks.indexOf(document.activeElement);

        if (activeIndex !== -1) {
          e.preventDefault(); // Prevent page scroll

          // Determine current grid layout
          const getGridColumns = () => {
            if (window.matchMedia('(min-width: 1024px)').matches) return 3; // lg:grid-cols-3
            if (window.matchMedia('(min-width: 768px)').matches) return 2;  // md:grid-cols-2
            return 1; // grid-cols-1
          };

          const cols = getGridColumns();
          let nextIndex = activeIndex;

          if (e.key === 'ArrowRight') nextIndex = activeIndex + 1;
          if (e.key === 'ArrowLeft') nextIndex = activeIndex - 1;
          if (e.key === 'ArrowDown') nextIndex = activeIndex + cols;

          if (e.key === 'ArrowUp') {
            // If in the top row, move focus back to search input
            if (activeIndex < cols) {
              searchInputRef.current?.focus();
              searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              return;
            }
            nextIndex = activeIndex - cols;
          }

          if (nextIndex >= 0 && nextIndex < cardLinks.length) {
            cardLinks[nextIndex].focus();
            cardLinks[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  // Memoize projects that match the search query (basis for filtering and counts)
  const projectsMatchingSearch = useMemo(() => {
    return projectData.filter(p => isProjectMatchingQuery(p, searchTerm));
  }, [searchTerm]);

  // Calculate the current parent category based on the active filter
  // This allows us to show the relevant sub-tags even when a specific tag is selected
  const currentCategory = useMemo(() => {
    if (activeFilter === 'All') return null;
    if (CATEGORIES[activeFilter]) return activeFilter;
    // Find category for the active tag
    const categories = TAG_TO_CATEGORIES[activeFilter];
    return categories ? categories[0] : null;
  }, [activeFilter]);

  // Determine the active color theme based on the current category context
  const currentTheme = useMemo(() => {
    if (currentCategory && CATEGORY_THEMES[currentCategory]) {
      return CATEGORY_THEMES[currentCategory];
    }
    return CATEGORY_THEMES['default'];
  }, [currentCategory]);

  // Single-pass calculation of all category and tag counts
  const counts = useMemo(() => {
    const categoryCounts = {};
    const tagCounts = {};

    // Initialize counts
    Object.keys(CATEGORIES).forEach(cat => {
      categoryCounts[cat] = 0;
      CATEGORIES[cat].forEach(tag => {
        tagCounts[tag] = 0;
      });
    });

    projectsMatchingSearch.forEach(project => {
      const projectCategories = new Set();
      const projectTags = new Set(project.tags);

      projectTags.forEach(tag => {
        // Increment tag count if it's one of our tracked tags
        if (tagCounts[tag] !== undefined) {
          tagCounts[tag]++;
        }
        // Add categories this tag belongs to
        const categories = TAG_TO_CATEGORIES[tag];
        if (categories) {
          categories.forEach(cat => projectCategories.add(cat));
        }
      });

      // Increment category counts once per project
      projectCategories.forEach(cat => {
        categoryCounts[cat]++;
      });
    });

    return { categoryCounts, tagCounts };
  }, [projectsMatchingSearch]);

  // Calculate global tag counts to use for suggestions when search yields no results
  const suggestedTags = useMemo(() => {
    const globalTagCounts = {};
    projectData.forEach(p => {
      p.tags.forEach(t => {
        globalTagCounts[t] = (globalTagCounts[t] || 0) + 1;
      });
    });

    // Return top 6 most used tags
    return Object.entries(globalTagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([tag]) => tag);
  }, []);


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
    return projectsMatchingSearch.filter(project => {
      if (activeFilter === 'All') return true;
      if (CATEGORIES[activeFilter]) {
        // It's a Category: Match if project has ANY tag in this category
        const categoryTags = CATEGORIES[activeFilter];
        return project.tags.some(tag => categoryTags.includes(tag));
      }
      // It's a specific Tag
      return project.tags.includes(activeFilter);
    });
  }, [activeFilter, projectsMatchingSearch]);

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Reset to Page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchTerm]);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProjects, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;

    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => setCurrentPage(newPage));
      });
    } else {
      setCurrentPage(newPage);
    }

    // Smooth scroll to top of grid area
    const gridElement = document.getElementById('project-grid');
    if (gridElement) {
        gridElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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

      // Time-based organic drift for "breathing" background
      const time = performance.now() * 0.001; // Convert to seconds

      // Calculate organic drift offsets using sine/cosine waves with different phases/frequencies
      // Blob 1
      const drift1X = Math.sin(time * 0.5) * 30;
      const drift1Y = Math.cos(time * 0.3) * 30;

      // Blob 2
      const drift2X = Math.cos(time * 0.4) * 40;
      const drift2Y = Math.sin(time * 0.6 + 2) * 40;

      // Blob 3
      const drift3X = Math.sin(time * 0.6 + 4) * 25;
      const drift3Y = Math.cos(time * 0.5 + 1) * 25;

      // Blob 4
      const drift4X = Math.cos(time * 0.3 + 5) * 35;
      const drift4Y = Math.sin(time * 0.4 + 3) * 35;

      // Calculate smooth blob positions based on scroll AND interpolated mouse AND organic drift
      // Blob 1: Moves with scroll (0.2), Retreats from mouse (-0.02)
      if (blob1Ref.current) {
        blob1Ref.current.style.transform = `translate3d(${currentMouseX * -0.02 + drift1X}px, ${scrollY * 0.2 + currentMouseY * -0.02 + drift1Y}px, 0)`;
      }
      // Blob 2: Moves with scroll (-0.15), Attracted to mouse (0.03)
      if (blob2Ref.current) {
        blob2Ref.current.style.transform = `translate3d(${currentMouseX * 0.03 + drift2X}px, ${scrollY * -0.15 + currentMouseY * 0.03 + drift2Y}px, 0)`;
      }
      // Blob 3: Moves with scroll (0.1), Slight drift with mouse (0.01)
      if (blob3Ref.current) {
        blob3Ref.current.style.transform = `translate3d(${currentMouseX * 0.01 + drift3X}px, ${scrollY * 0.1 + currentMouseY * 0.01 + drift3Y}px, 0)`;
      }
      // Blob 4: Moves with scroll (-0.1), Counter-drift with mouse (-0.03)
      if (blob4Ref.current) {
        blob4Ref.current.style.transform = `translate3d(${currentMouseX * -0.03 + drift4X}px, ${scrollY * -0.1 + currentMouseY * -0.03 + drift4Y}px, 0)`;
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
            maskImage: 'radial-gradient(circle at center, black 10%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 10%, transparent 80%)'
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
                <div className="absolute left-4 text-cyan-500/50 group-focus-within:text-cyan-400 transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                  {searchTerm ? (
                    <>
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded">
                        {filteredProjects.length} found
                      </span>
                      <button
                        onClick={() => setSearchTerm('')}
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

          {/* Quick Filter / Trending Tags */}
          <div className="flex justify-center items-center gap-3 mb-6 animate-fade-in px-4" style={{ animationDelay: '0.1s' }}>
             <span className="text-cyan-400 text-xs font-bold tracking-wider uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.5)] flex items-center gap-1 whitespace-nowrap">
               <span className="animate-pulse">⚡</span> Trending:
             </span>
             <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 px-1 mobile-scroll-mask snap-x">
               {suggestedTags.map((tag) => (
                 <button
                   key={tag}
                   onClick={() => {
                     if (document.startViewTransition) {
                        document.startViewTransition(() => {
                          flushSync(() => {
                            setSearchTerm('');
                            setActiveFilter(tag);
                          });
                        });
                      } else {
                        setSearchTerm('');
                        setActiveFilter(tag);
                      }
                   }}
                   className={`
                     px-3 py-1 text-xs font-medium rounded transition-all duration-300 backdrop-blur-md border whitespace-nowrap snap-center shrink-0
                     ${activeFilter === tag
                       ? CATEGORY_BUTTON_STYLES[TAG_TO_CATEGORIES[tag]?.[0]]?.tagClass || CATEGORY_BUTTON_STYLES['default'].tagClass
                       : 'bg-white/5 text-gray-400 border-white/10 hover:bg-cyan-500/10 hover:text-cyan-200 hover:border-cyan-500/30 hover:scale-105'
                     }
                   `}
                 >
                   {tag}
                 </button>
               ))}
             </div>
          </div>

          {/* Category Filter Section */}
          <div className="flex overflow-x-auto md:flex-wrap md:justify-center gap-4 pb-2 md:pb-0 scrollbar-hide mobile-scroll-mask px-4 md:px-0 snap-x">
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
                px-6 py-2 rounded-full font-medium transition-all duration-300 backdrop-blur-md border flex items-center gap-2 snap-center shrink-0
                ${activeFilter === 'All'
                  ? CATEGORY_BUTTON_STYLES['All'].activeClass
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30'
                }
              `}
            >
              <span>🌌</span>
              <span>All</span>
              <span className={`text-xs ml-1 ${activeFilter === 'All' ? 'text-cyan-200' : 'text-gray-500'}`}>
                ({projectsMatchingSearch.length})
              </span>
            </button>

            {/* Category Buttons */}
            {Object.keys(CATEGORIES).map((category) => {
              const isActive = activeFilter === category || (CATEGORIES[category] && CATEGORIES[category].includes(activeFilter));
              const count = counts.categoryCounts[category];

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
                    px-5 py-2 rounded-full font-medium transition-all duration-300 backdrop-blur-md border flex items-center gap-2 snap-center shrink-0
                    ${isActive
                      ? CATEGORY_BUTTON_STYLES[category]?.activeClass || CATEGORY_BUTTON_STYLES['default'].activeClass
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
            <div className="flex overflow-x-auto md:flex-wrap md:justify-center gap-2 animate-fade-in pb-2 md:pb-0 scrollbar-hide mobile-scroll-mask px-4 md:px-0 snap-x">
              {CATEGORIES[currentCategory].map((tag, index) => {
                const isActive = activeFilter === tag;
                const count = counts.tagCounts[tag];

                if (count === 0 && !isActive) return null;

                return (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className={`
                      px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border flex items-center gap-2 animate-fade-in snap-center shrink-0
                      ${isActive
                        ? CATEGORY_BUTTON_STYLES[currentCategory]?.tagClass || CATEGORY_BUTTON_STYLES['default'].tagClass
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
          <div id="project-grid" className="scroll-mt-24">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2 mb-12">
            {paginatedProjects.map((project) => {
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
                  searchTerm={searchTerm}
                  highlightedTags={highlightedTags}
                />
              );
            })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-6 pb-8 animate-fade-in">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`
                    px-4 py-2 rounded-lg font-mono text-sm border transition-all duration-300 flex items-center gap-2 group
                    ${currentPage === 1
                      ? 'border-white/5 text-gray-600 cursor-not-allowed'
                      : 'border-cyan-500/30 text-cyan-400 bg-black/40 hover:bg-cyan-500/10 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                    }
                  `}
                >
                  <span className={currentPage !== 1 ? "group-hover:-translate-x-1 transition-transform" : ""}>&lt;</span>
                  PREV
                </button>

                <div className="flex flex-col items-center">
                   <span className="font-mono text-cyan-200 text-sm tracking-widest drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                     PAGE {currentPage} <span className="text-cyan-500/50">/</span> {totalPages}
                   </span>
                   <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mt-1"></div>
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`
                    px-4 py-2 rounded-lg font-mono text-sm border transition-all duration-300 flex items-center gap-2 group
                    ${currentPage === totalPages
                      ? 'border-white/5 text-gray-600 cursor-not-allowed'
                      : 'border-cyan-500/30 text-cyan-400 bg-black/40 hover:bg-cyan-500/10 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                    }
                  `}
                >
                  NEXT
                  <span className={currentPage !== totalPages ? "group-hover:translate-x-1 transition-transform" : ""}>&gt;</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto mt-10 animate-fade-in">
             <div className="relative overflow-hidden rounded-xl p-8 backdrop-blur-md bg-cyan-900/5 border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.1),inset_0_0_20px_rgba(34,211,238,0.05)]">
                <div className="scanline"></div>
                <div className="flex flex-col items-center justify-center text-center space-y-4 relative z-10">
                   <div className="text-6xl mb-2 opacity-80 glitch-text" data-text="👻">👻</div>
                   <h3 className="text-2xl font-bold text-cyan-200 uppercase tracking-widest glitch-text" data-text="VOID DETECTED">
                      VOID DETECTED
                   </h3>
                   <div className="text-cyan-300/80 font-mono text-sm bg-black/30 p-4 rounded border border-cyan-500/20 w-full">
                      <p className="mb-2">{`> SEARCH_QUERY: "${searchTerm || activeFilter}"`}</p>
                      <p className="mb-2">{`> STATUS: VOID_DETECTED`}</p>
                      <p className="animate-pulse mb-4">{`> RECOMMENDATION: INITIATE_NEW_SEARCH_PROTOCOL`}</p>

                      {/* Suggested Protocols */}
                      <div className="flex flex-col items-center gap-2 pt-2 border-t border-cyan-500/30">
                        <p className="text-xs uppercase opacity-70 mb-1">Suggested Protocols:</p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {suggestedTags.map(tag => (
                            <button
                              key={tag}
                              onClick={() => {
                                if (document.startViewTransition) {
                                  document.startViewTransition(() => {
                                    flushSync(() => {
                                      setSearchTerm('');
                                      setActiveFilter(tag);
                                    });
                                  });
                                } else {
                                  setSearchTerm('');
                                  setActiveFilter(tag);
                                }
                              }}
                              className="px-3 py-1 bg-cyan-900/40 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-200 text-xs rounded transition-all duration-300 hover:shadow-[0_0_8px_rgba(34,211,238,0.3)]"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                   </div>
                   <button
                     onClick={() => {
                       if (document.startViewTransition) {
                         document.startViewTransition(() => {
                           flushSync(() => {
                             setActiveFilter('All');
                             setSearchTerm('');
                           });
                         });
                       } else {
                         setActiveFilter('All');
                         setSearchTerm('');
                       }
                     }}
                     className="mt-4 px-6 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/50 text-cyan-200 rounded-full transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] uppercase text-sm font-bold tracking-wider"
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
