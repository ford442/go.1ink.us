import React, { useState, useMemo, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import Card from './Card';
import Starfield from './Starfield';
import projectData from './projectData';
import { CATEGORIES, CATEGORY_ICONS, CATEGORY_THEMES, TAG_TO_CATEGORIES, CATEGORY_BUTTON_STYLES, CATEGORY_SETS } from './constants';
import './App.css';

// Helper to check if a project matches the search query in real-time
const isProjectMatchingQuery = (project, query) => {
  if (!query || query.trim() === '') return true;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return terms.every(term =>
    project.title.toLowerCase().includes(term) ||
    project.description.toLowerCase().includes(term) ||
    (project.tags && project.tags.some(tag => tag.toLowerCase().includes(term)))
  );
};

function App() {

  // Theme State
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('curator_theme') || 'cyan';
    }
    return 'cyan';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('curator_theme', theme);
      if (theme === 'cyan') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }
    }
  }, [theme]);


  // Command Center Header State
  const [systemStats, setSystemStats] = useState({
    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    uptime: 999990, // Random high start
    connections: 1337,
    memory: 42
  });

  // Animated Command Center Header Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemStats(prev => {
        // Fluctuate connections slightly
        let newConnections = prev.connections + Math.floor(Math.random() * 5) - 2;
        if (newConnections < 1000) newConnections = 1000 + Math.floor(Math.random() * 50);

        // Fluctuate memory
        let newMemory = prev.memory + (Math.random() > 0.5 ? 1 : -1);
        if (newMemory < 20) newMemory = 20;
        if (newMemory > 80) newMemory = 80;

        return {
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          uptime: prev.uptime + 1,
          connections: newConnections,
          memory: newMemory
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format uptime to HH:MM:SS
  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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

  const [sortOption, setSortOption] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('sort') || 'Featured';
    }
    return 'Featured';
  });

  const [randomSeed, setRandomSeed] = useState(() => Math.random());

  // Quick View Modal State
  const [selectedProject, setSelectedProject] = useState(null);
  const selectedProjectRef = useRef(null);
  const [modalImageLoaded, setModalImageLoaded] = useState(false);

  // Wrapper to handle project selection and reset image loaded state
  const handleProjectSelect = (project) => {
    setModalImageLoaded(false);
    setSelectedProject(project);
  };

  useEffect(() => {
    selectedProjectRef.current = selectedProject;

    // Body Scroll Lock for Modal
    if (selectedProject) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedProject]);

  // Favorites state
  const [favorites, setFavorites] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('curator_favorites');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Sync favorites to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('curator_favorites', JSON.stringify(favorites));
    }
  }, [favorites]);

  // Toast Notifications State
  const [toasts, setToasts] = useState([]);

  const removeToast = (id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, fadingOut: true } : t));
    // Wait for the fade out animation to finish before removing
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300); // matches the 0.3s duration of fade-out-right
  };

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  const changeTheme = (newTheme) => {
    if (theme !== newTheme) {
      setTheme(newTheme);
      addToast(`> SYS_UPDATE: COLOR_PROTOCOL_${newTheme.toUpperCase()}`, 'info');
    }
  };
  const toggleFavorite = (project) => {
    const isFavorited = favorites.includes(project.id);
    if (isFavorited) {
      addToast(`> SYS_UPDATE: [${project.title.toUpperCase()}] REMOVED`, 'warning');
      setFavorites(prev => prev.filter(id => id !== project.id));
    } else {
      addToast(`> SYS_UPDATE: [${project.title.toUpperCase()}] FAVORITED`, 'success');
      setFavorites(prev => [...prev, project.id]);
    }
  };

  const handleCopyLink = (project) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(project.url).then(() => {
        addToast(`> SYS_CMD: [${project.title.toUpperCase()}] LINK_COPIED`, 'info');
      }).catch(() => {
        addToast(`> SYS_ERR: LINK_COPY_FAILED`, 'error');
      });
    } else {
      addToast(`> SYS_ERR: CLIPBOARD_NOT_SUPPORTED`, 'error');
    }
  };

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Sync state to URL (Deep Linking)
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeFilter !== 'All') params.set('filter', activeFilter);
    if (searchQuery) params.set('q', searchQuery);
    if (sortOption !== 'Featured') params.set('sort', sortOption);

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;

    // Use replaceState to update URL without cluttering history stack
    window.history.replaceState(null, '', newUrl);
  }, [activeFilter, searchQuery, sortOption]);

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
        if (selectedProjectRef.current) {
          setSelectedProject(null);
          return;
        }

        if (document.activeElement === searchInputRef.current) {
          // If in search input: Clear if text exists, otherwise Blur
          if (searchInputRef.current.value) {
            setSearchQuery('');
            setCurrentPage(1);
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
                setSortOption('Featured');
                setCurrentPage(1);
              });
            });
          } else {
            setActiveFilter('All');
            setSearchQuery('');
            setSortOption('Featured');
            setCurrentPage(1);
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
  const canvasRef = useRef(null); // Canvas for cursor trail effect

  // Memoize projects that match the search query (basis for filtering and counts)
  const projectsMatchingQuery = useMemo(() => {
    return projectData.filter(p => isProjectMatchingQuery(p, searchQuery));
  }, [searchQuery]);

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

    projectsMatchingQuery.forEach(project => {
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
  }, [projectsMatchingQuery]);

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
        flushSync(() => {
            setActiveFilter(tag);
            setCurrentPage(1);
        });
      });
    } else {
      setActiveFilter(tag);
      setCurrentPage(1);
    }
  };

  const filteredProjects = useMemo(() => {
    const categorySet = CATEGORY_SETS[activeFilter];

    return projectsMatchingQuery.filter(project => {
      if (activeFilter === 'All') return true;
      if (activeFilter === 'Favorites') return favorites.includes(project.id);
      if (categorySet) {
        // It's a Category: Match if project has ANY tag in this category (O(1) membership check)
        return project.tags.some(tag => categorySet.has(tag));
      }
      // It's a specific Tag
      return project.tags.includes(activeFilter);
    });
  }, [activeFilter, projectsMatchingQuery, favorites]);

  const favoriteCount = useMemo(() => {
    return projectsMatchingQuery.filter(project => favorites.includes(project.id)).length;
  }, [projectsMatchingQuery, favorites]);

  const sortedProjects = useMemo(() => {
    const projects = [...filteredProjects];

    switch (sortOption) {
      case 'Newest':
        // Assuming higher ID means newer, otherwise you'd need a date field
        return projects.sort((a, b) => b.id - a.id);
      case 'A-Z':
        return projects.sort((a, b) => a.title.localeCompare(b.title));
      case 'Random':
        // Use a seeded shuffle so order remains stable across renders unless explicitly re-randomized
        return projects.sort((a, b) => {
          const aRandom = Math.sin(a.id * randomSeed) * 10000;
          const bRandom = Math.sin(b.id * randomSeed) * 10000;
          return (aRandom - Math.floor(aRandom)) - (bRandom - Math.floor(bRandom));
        });
      case 'Featured':
      default:
        // Returns original array order from projectData (assumed to be featured order)
        return projects;
    }
  }, [filteredProjects, sortOption, randomSeed]);

  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedProjects, currentPage]);

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

    // Trail particles state
    const trailParticles = [];

    const updateTransforms = () => {
      // Lerp current towards target (0.03 factor for smoother inertia and weighty drift)
      currentMouseX += (targetMouseX - currentMouseX) * 0.03;
      currentMouseY += (targetMouseY - currentMouseY) * 0.03;

      // Time-based organic drift for "breathing" background
      const time = performance.now() * 0.0005; // Slower time factor for more subtle drift

      // Calculate organic drift offsets using sine/cosine waves with different phases/frequencies
      // Increased amplitude and varied frequencies for a more fluid, "lava lamp" feel
      // Blob 1
      const drift1X = Math.sin(time * 0.8) * 150;
      const drift1Y = Math.cos(time * 0.5) * 150;

      // Blob 2
      const drift2X = Math.cos(time * 0.7) * 180;
      const drift2Y = Math.sin(time * 0.9 + 2) * 180;

      // Blob 3
      const drift3X = Math.sin(time * 0.6 + 4) * 120;
      const drift3Y = Math.cos(time * 0.8 + 1) * 120;

      // Blob 4
      const drift4X = Math.cos(time * 0.5 + 5) * 160;
      const drift4Y = Math.sin(time * 0.7 + 3) * 160;

      // Calculate smooth blob positions based on scroll AND interpolated mouse AND organic drift
      // Blob 1: Moves with scroll (0.8), Retreats from mouse (-0.04)
      if (blob1Ref.current) {
        blob1Ref.current.style.transform = `translate3d(${currentMouseX * -0.04 + drift1X}px, ${scrollY * 0.8 + currentMouseY * -0.04 + drift1Y}px, 0)`;
      }
      // Blob 2: Moves with scroll (-0.6), Attracted to mouse (0.06)
      if (blob2Ref.current) {
        blob2Ref.current.style.transform = `translate3d(${currentMouseX * 0.06 + drift2X}px, ${scrollY * -0.6 + currentMouseY * 0.06 + drift2Y}px, 0)`;
      }
      // Blob 3: Moves with scroll (0.4), Slight drift with mouse (0.02)
      if (blob3Ref.current) {
        blob3Ref.current.style.transform = `translate3d(${currentMouseX * 0.02 + drift3X}px, ${scrollY * 0.4 + currentMouseY * 0.02 + drift3Y}px, 0)`;
      }
      // Blob 4: Moves with scroll (-0.4), Counter-drift with mouse (-0.06)
      if (blob4Ref.current) {
        blob4Ref.current.style.transform = `translate3d(${currentMouseX * -0.06 + drift4X}px, ${scrollY * -0.4 + currentMouseY * -0.06 + drift4Y}px, 0)`;
      }

      // Starfield: Subtle parallax (very far away)
      if (starfieldRef.current) {
        starfieldRef.current.style.transform = `translate3d(${currentMouseX * -0.01}px, ${scrollY * 0.04 + currentMouseY * -0.01}px, 0)`;
      }

      // Update the Grid Spotlight
      if (gridSpotlightRef.current) {
        // Use a radial gradient mask to reveal the cyan grid at the mouse position
        // We use pageX/Y because the grid covers the whole document
        const mask = `radial-gradient(300px circle at ${pageMouseX}px ${pageMouseY}px, black, transparent)`;
        gridSpotlightRef.current.style.maskImage = mask;
        gridSpotlightRef.current.style.webkitMaskImage = mask;
      }

      // Update and Draw Canvas Cursor Trail
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        // Ensure canvas matches window size
        if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Add new particle at current mouse position
        trailParticles.push({
          x: pageMouseX,
          y: pageMouseY,
          life: 1.0, // 1.0 down to 0
          size: Math.random() * 4 + 2,
        });

        // Update and draw all particles
        for (let i = trailParticles.length - 1; i >= 0; i--) {
          const p = trailParticles[i];
          p.life -= 0.02; // Fade out speed
          p.y -= 0.5; // Drift upwards slightly

          if (p.life <= 0) {
            trailParticles.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          // Use cyan color with fading opacity
          ctx.fillStyle = `rgba(34, 211, 238, ${p.life * 0.5})`;
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
        }
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
      
      {/* Command Center Status Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-accent-500/30 text-xs font-mono py-1.5 px-4 flex justify-between items-center shadow-[0_0_15px_rgba(var(--rgb-accent-400),0.15)] drop-shadow">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
            <span className="text-green-400 tracking-wider font-bold">SYS.ONLINE</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-accent-200/70 border-l border-accent-500/30 pl-4">
            <span className="opacity-50">UPTIME:</span>
            <span className="text-accent-100">{formatUptime(systemStats.uptime)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">

          <div className="hidden lg:flex items-center gap-2 border-r border-accent-500/30 pr-4">
             <span className="opacity-50 text-accent-200/70 mr-1">THEME:</span>
             <button onClick={() => changeTheme('cyan')} className={`w-3 h-3 rounded-full bg-cyan-400 ${theme === 'cyan' ? 'ring-2 ring-white scale-125' : 'opacity-50 hover:opacity-100'} transition-all`} aria-label="Cyan Theme"></button>
             <button onClick={() => changeTheme('purple')} className={`w-3 h-3 rounded-full bg-purple-400 ${theme === 'purple' ? 'ring-2 ring-white scale-125' : 'opacity-50 hover:opacity-100'} transition-all`} aria-label="Purple Theme"></button>
             <button onClick={() => changeTheme('emerald')} className={`w-3 h-3 rounded-full bg-emerald-400 ${theme === 'emerald' ? 'ring-2 ring-white scale-125' : 'opacity-50 hover:opacity-100'} transition-all`} aria-label="Emerald Theme"></button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-accent-200/70 border-r border-accent-500/30 pr-4">
             <span className="opacity-50">MEM:</span>
             <span className="text-accent-100 min-w-[28px]">{systemStats.memory}%</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-accent-200/70 border-r border-accent-500/30 pr-4">
             <span className="opacity-50">NET:</span>
             <span className="text-accent-100 min-w-[40px]">{systemStats.connections}</span>
          </div>
          <div className="text-accent-300 font-bold tracking-widest drop-shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.8)]">
            {systemStats.time}
          </div>
        </div>
      </div>


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
            backgroundImage: 'linear-gradient(to right, rgba(var(--rgb-accent-400),0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(var(--rgb-accent-400),0.15) 1px, transparent 1px)',
            maskImage: 'transparent', // Initially invisible, updated by JS
            WebkitMaskImage: 'transparent'
          }}
        ></div>

        {/* Dynamic Canvas Cursor Trail */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ mixBlendMode: 'screen', zIndex: 1 }}
        />
      </div>
      
      <div className="container mx-auto px-4 pt-20 pb-12 relative z-10">
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
              <div className="absolute inset-0 bg-accent-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-accent-500/50 group-focus-within:text-accent-400 transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
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
                  placeholder="Search projects by title, description, or tag..."
                  autoComplete="off"
                  spellCheck="false"
                  className="w-full bg-black/40 backdrop-blur-md border border-white/10 text-white pl-12 pr-32 py-4 rounded-full focus:outline-none focus:border-accent-500/50 focus:bg-black/60 transition-all duration-300 shadow-lg placeholder-gray-500"
                />

                {/* Right Actions: Results Count or Shortcut Hint */}
                <div className="absolute right-4 flex items-center space-x-3">
                  {searchQuery ? (
                    <>
                      <span className="text-xs font-mono text-accent-400 bg-accent-900/30 px-2 py-1 rounded">
                        {filteredProjects.length} found
                      </span>
                      <button
                        onClick={() => {
                            setSearchQuery('');
                            setCurrentPage(1);
                        }}
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
             <span className="text-accent-400 text-xs font-bold tracking-wider uppercase drop-shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.5)] flex items-center gap-1 whitespace-nowrap">
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
                            setSearchQuery('');
                            setActiveFilter(tag);
                            setCurrentPage(1);
                          });
                        });
                      } else {
                        setSearchQuery('');
                        setActiveFilter(tag);
                        setCurrentPage(1);
                      }
                   }}
                   className={`
                     px-3 py-1 text-xs font-medium rounded transition-all duration-300 backdrop-blur-md border whitespace-nowrap snap-center shrink-0
                     ${activeFilter === tag
                       ? CATEGORY_BUTTON_STYLES[TAG_TO_CATEGORIES[tag]?.[0]]?.tagClass || CATEGORY_BUTTON_STYLES['default'].tagClass
                       : 'bg-white/5 text-gray-400 border-white/10 hover:bg-accent-500/10 hover:text-accent-200 hover:border-accent-500/30 hover:scale-105'
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
                    flushSync(() => {
                        setActiveFilter('All');
                        setCurrentPage(1);
                    });
                  });
                } else {
                  setActiveFilter('All');
                  setCurrentPage(1);
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
              <span className={`text-xs ml-1 ${activeFilter === 'All' ? 'text-accent-200' : 'text-gray-500'}`}>
                ({projectsMatchingQuery.length})
              </span>
            </button>

            {/* 'Favorites' Button */}
            <button
              onClick={() => {
                if (document.startViewTransition) {
                  document.startViewTransition(() => {
                    flushSync(() => {
                        setActiveFilter('Favorites');
                        setCurrentPage(1);
                    });
                  });
                } else {
                  setActiveFilter('Favorites');
                  setCurrentPage(1);
                }
              }}
              className={`
                px-6 py-2 rounded-full font-medium transition-all duration-300 backdrop-blur-md border flex items-center gap-2 snap-center shrink-0
                ${activeFilter === 'Favorites'
                  ? 'bg-pink-500/80 text-white border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.5)] scale-105 animate-pulse-glow'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-pink-300 hover:border-pink-500/30'
                }
              `}
            >
              <span>💖</span>
              <span>Favorites</span>
              <span className={`text-xs ml-1 ${activeFilter === 'Favorites' ? 'text-pink-200' : 'text-gray-500'}`}>
                ({favoriteCount})
              </span>
            </button>

            {/* Category Buttons */}
            {Object.keys(CATEGORIES).map((category) => {
              const isActive = activeFilter === category || (CATEGORY_SETS[category] && CATEGORY_SETS[category].has(activeFilter));
              const count = counts.categoryCounts[category];

              // Hide category if search yields 0 results for it, unless it's active
              if (count === 0 && !isActive) return null;

              return (
                <button
                  key={category}
                  onClick={() => {
                    if (document.startViewTransition) {
                      document.startViewTransition(() => {
                        flushSync(() => {
                            setActiveFilter(category);
                            setCurrentPage(1);
                        });
                      });
                    } else {
                      setActiveFilter(category);
                      setCurrentPage(1);
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
                  <span className={`text-xs ml-1 ${isActive ? 'text-accent-200' : 'text-gray-500'}`}>
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

          {/* Sort Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-accent-500/10 animate-fade-in px-4">
            <span className="text-xs font-mono text-accent-500/70 tracking-widest uppercase">Sort By:</span>
            <div className="flex overflow-x-auto w-full sm:w-auto scrollbar-hide snap-x mobile-scroll-mask gap-2 pb-2 sm:pb-0">
              {['Featured', 'Newest', 'A-Z', 'Random'].map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    if (option === 'Random') {
                      setRandomSeed(Math.random());
                    }
                    if (document.startViewTransition) {
                      document.startViewTransition(() => {
                        flushSync(() => {
                          setSortOption(option);
                          setCurrentPage(1);
                        });
                      });
                    } else {
                      setSortOption(option);
                      setCurrentPage(1);
                    }
                  }}
                  className={`
                    px-4 py-1 rounded text-xs font-mono transition-all duration-300 border snap-center shrink-0 whitespace-nowrap
                    ${sortOption === option
                      ? 'bg-accent-500/20 text-accent-200 border-accent-400 shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.2)]'
                      : 'bg-black/30 text-gray-500 border-white/5 hover:bg-accent-500/10 hover:text-accent-400 hover:border-accent-500/30'
                    }
                  `}
                >
                  {option === 'Random' ? '🎲 Random' : option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div id="project-grid" className="scroll-mt-24">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2 mb-12">
            {paginatedProjects.map((project) => {
              // Determine which tags to highlight based on active filter
              let highlightedTags = [];
              const activeCategorySet = CATEGORY_SETS[activeFilter];
              if (activeCategorySet) {
                // Active filter is a Category: Highlight all tags that belong to this category
                highlightedTags = project.tags.filter(tag => activeCategorySet.has(tag));
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
                  isFavorite={favorites.includes(project.id)}
                  onToggleFavorite={toggleFavorite}
                  onCopyLink={handleCopyLink}
                  onProjectClick={handleProjectSelect}
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
                      : 'border-accent-500/30 text-accent-400 bg-black/40 hover:bg-accent-500/10 hover:border-accent-400 hover:shadow-[0_0_15px_rgba(var(--rgb-accent-400),0.2)]'
                    }
                  `}
                >
                  <span className={currentPage !== 1 ? "group-hover:-translate-x-1 transition-transform" : ""}>&lt;</span>
                  PREV
                </button>

                <div className="flex flex-col items-center">
                   <span className="font-mono text-accent-200 text-sm tracking-widest drop-shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.5)]">
                     PAGE {currentPage} <span className="text-accent-500/50">/</span> {totalPages}
                   </span>
                   <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-accent-500/50 to-transparent mt-1"></div>
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className={`
                    px-4 py-2 rounded-lg font-mono text-sm border transition-all duration-300 flex items-center gap-2 group
                    ${currentPage >= totalPages
                      ? 'border-white/5 text-gray-600 cursor-not-allowed'
                      : 'border-accent-500/30 text-accent-400 bg-black/40 hover:bg-accent-500/10 hover:border-accent-400 hover:shadow-[0_0_15px_rgba(var(--rgb-accent-400),0.2)]'
                    }
                  `}
                >
                  NEXT
                  <span className={currentPage < totalPages ? "group-hover:translate-x-1 transition-transform" : ""}>&gt;</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto mt-10 animate-fade-in">
             <div className="relative overflow-hidden rounded-xl p-8 backdrop-blur-md bg-accent-900/5 border border-accent-500/30 shadow-[0_0_30px_rgba(var(--rgb-accent-400),0.1),inset_0_0_20px_rgba(var(--rgb-accent-400),0.05)]">
                <div className="scanline"></div>
                <div className="flex flex-col items-center justify-center text-center space-y-4 relative z-10">
                   <div className="text-6xl mb-2 opacity-80 glitch-text" data-text="👻">👻</div>
                   <h3 className="text-2xl font-bold text-accent-200 uppercase tracking-widest glitch-text" data-text="VOID DETECTED">
                      VOID DETECTED
                   </h3>
                   <div className="text-accent-300/80 font-mono text-sm bg-black/30 p-4 rounded border border-accent-500/20 w-full text-left">
                      <p className="mb-2">{`> SEARCH_QUERY: "${searchQuery || activeFilter}"`}</p>
                      <p className="mb-2">{`> STATUS: NO_RESULTS_FOUND`}</p>
                      <p className="animate-pulse mb-4">{`> RECOMMENDATION: TRY_DIFFERENT_KEYWORDS_OR_TAGS`}</p>

                      {/* Suggested Protocols */}
                      <div className="flex flex-col items-center gap-2 pt-2 border-t border-accent-500/30">
                        <p className="text-xs uppercase opacity-70 mb-1">Suggested Protocols:</p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {suggestedTags.map(tag => (
                            <button
                              key={tag}
                              onClick={() => {
                                if (document.startViewTransition) {
                                  document.startViewTransition(() => {
                                    flushSync(() => {
                                      setSearchQuery('');
                                      setActiveFilter(tag);
                                      setCurrentPage(1);
                                    });
                                  });
                                } else {
                                  setSearchQuery('');
                                  setActiveFilter(tag);
                                  setCurrentPage(1);
                                }
                              }}
                              className="px-3 py-1 bg-accent-900/40 hover:bg-accent-500/20 border border-accent-500/30 text-accent-200 text-xs rounded transition-all duration-300 hover:shadow-[0_0_8px_rgba(var(--rgb-accent-400),0.3)]"
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
                             setSearchQuery('');
                             setCurrentPage(1);
                           });
                         });
                       } else {
                         setActiveFilter('All');
                         setSearchQuery('');
                         setCurrentPage(1);
                       }
                     }}
                     className="mt-4 px-6 py-2 bg-accent-500/10 hover:bg-accent-500/20 border border-accent-500/50 text-accent-200 rounded-full transition-all duration-300 hover:shadow-[0_0_15px_rgba(var(--rgb-accent-400),0.4)] uppercase text-sm font-bold tracking-wider"
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

      {/* Project Quick View Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => handleProjectSelect(null)}
          ></div>

          {/* Modal Content */}
          <div className="relative w-full max-w-4xl bg-gray-900/90 border border-accent-500/30 rounded-2xl shadow-[0_0_40px_rgba(var(--rgb-accent-400),0.15)] overflow-hidden flex flex-col md:flex-row transform transition-all">
            {/* Scanline Effect */}
            <div className="scanline"></div>

            {/* Left/Top: Image Area */}
            <div className="w-full md:w-1/2 relative bg-black flex-shrink-0">
              {selectedProject.image ? (
                <div className="w-full h-64 md:h-full relative overflow-hidden group">
                  {!modalImageLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-md z-10 border-r border-accent-500/20">
                      <div className="relative w-20 h-20 flex items-center justify-center mb-6">
                        <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-accent-500/80 animate-spin" style={{ animationDuration: '3s' }}></div>
                        <div className="absolute inset-2 rounded-full border-l-2 border-r-2 border-pink-500/80 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
                        <div className="absolute inset-4 rounded-full border-t-2 border-emerald-500/80 animate-spin" style={{ animationDuration: '1s' }}></div>
                        <div className="text-2xl animate-pulse glitch-text" data-text="⚡">⚡</div>
                      </div>
                      <div className="font-mono text-accent-400 text-sm tracking-[0.3em] uppercase animate-pulse">
                        DECRYPTING_VISUALS...
                      </div>
                      <div className="w-48 h-1 bg-black/50 rounded-full mt-4 overflow-hidden border border-accent-500/20">
                        <div className="h-full bg-accent-500/50 rounded-full w-1/2 animate-ping" style={{ animationDuration: '1.5s' }}></div>
                      </div>
                    </div>
                  )}
                  <img
                    src={selectedProject.image}
                    alt={selectedProject.title}
                    onLoad={() => setModalImageLoaded(true)}
                    className={`w-full h-full object-cover transition-opacity duration-1000 ${modalImageLoaded ? 'opacity-80' : 'opacity-0'}`}
                  />
                  {/* Holographic Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-accent-500/20 via-transparent to-purple-500/20 mix-blend-overlay"></div>
                  {/* Grid Pattern Overlay */}
                  <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: 'linear-gradient(to right, rgba(var(--rgb-accent-400),0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(var(--rgb-accent-400),0.2) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}></div>
                </div>
              ) : (
                <div className="w-full h-64 md:h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
                  <span className="text-8xl drop-shadow-2xl">{selectedProject.icon}</span>
                </div>
              )}

              {/* Category Icon Badge */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                <span className="text-xl">{selectedProject.icon}</span>
                <span className="text-xs font-mono text-accent-300 font-bold uppercase tracking-wider">
                  {TAG_TO_CATEGORIES[selectedProject.tags[0]]?.[0] || 'Project'}
                </span>
              </div>
            </div>

            {/* Right/Bottom: Info Area */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between relative z-10">
              {/* Close Button */}
              <button
                onClick={() => handleProjectSelect(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-transparent hover:border-white/20"
                aria-label="Close modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              <div>
                {/* Title */}
                <h2
                  className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-wide glitch-text uppercase"
                  data-text={selectedProject.title}
                >
                  {selectedProject.title}
                </h2>

                {/* System ID / Status */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                  <span className="text-xs font-mono text-accent-500 bg-accent-500/10 px-2 py-0.5 rounded border border-accent-500/20">
                    ID: {selectedProject.id.toString().padStart(4, '0')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                    <span className="text-xs font-mono text-green-400 tracking-wider">ONLINE</span>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8 relative">
                  <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-500 to-transparent opacity-50"></div>
                  <p className="text-gray-300 text-lg leading-relaxed font-light">
                    {selectedProject.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="mb-8">
                  <h4 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">System Protocols</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-xs font-medium text-accent-200 bg-accent-900/30 border border-accent-500/20 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-auto pt-6 border-t border-white/10">
                <a
                  href={selectedProject.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-accent-500/20 hover:bg-accent-500/30 text-accent-300 border border-accent-400/50 hover:border-accent-300 px-6 py-3 rounded-lg font-bold tracking-widest uppercase text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--rgb-accent-400),0.4)] group"
                >
                  <span className="animate-pulse">▶</span>
                  Launch Protocol
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleFavorite(selectedProject)}
                    className={`p-3 rounded-lg border transition-all duration-300 flex items-center justify-center
                      ${favorites.includes(selectedProject.id)
                        ? 'bg-pink-500/20 text-pink-400 border-pink-400/50 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-pink-500/10 hover:text-pink-300 hover:border-pink-500/30'
                      }
                    `}
                    aria-label="Toggle Favorite"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleCopyLink(selectedProject)}
                    className="p-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 hover:border-white/30 rounded-lg transition-colors flex items-center justify-center"
                    aria-label="Copy Link"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications Container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => {
          let borderClass, textClass, icon;
          switch (toast.type) {
            case 'success':
              borderClass = 'border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.3)]';
              textClass = 'text-pink-400';
              icon = '💖';
              break;
            case 'warning':
              borderClass = 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]';
              textClass = 'text-yellow-400';
              icon = '⚠️';
              break;
            case 'error':
              borderClass = 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
              textClass = 'text-red-400';
              icon = '❌';
              break;
            case 'info':
            default:
              borderClass = 'border-accent-500/50 shadow-[0_0_15px_rgba(var(--rgb-accent-400),0.3)]';
              textClass = 'text-accent-400';
              icon = '🔗';
              break;
          }

          return (
            <div
              key={toast.id}
              className={`${toast.fadingOut ? 'animate-fade-out-right' : 'animate-slide-in-right'} bg-black/80 backdrop-blur-md border ${borderClass} rounded flex items-center gap-3 px-4 py-3 pointer-events-auto cursor-pointer hover:bg-black/90 transition-colors`}
              onClick={() => removeToast(toast.id)}
            >
              <span className="text-lg drop-shadow">{icon}</span>
              <span className={`font-mono text-xs md:text-sm tracking-wider font-bold ${textClass}`}>
                {toast.message}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default App;
// Curator: Search functionality initialized
