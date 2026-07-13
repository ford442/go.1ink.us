import { useEffect, useRef, useState } from 'react';
import projectData from '../projectData';
import soundSystem from '../SoundSystem';
import { CATEGORIES, TAG_TO_CATEGORIES } from '../constants';

export default function useTerminalController({
  addActivityLog,
  changeTheme,
  favorites,
  handleDisplayModeChange,
  handleProjectSelect,
  projectsMatchingQuery,
  setCurrentPage,
  setIsCrtEnabled,
  setIsLockdown,
  setIsMatrixMode,
  setIsSoundEnabled,
  setRandomSeed,
  setSortOption,
  toggleFavorite,
  toggleFilter
}) {

  // Terminal Command Bar State
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isTerminalClosing, setIsTerminalClosing] = useState(false); // For exit animation
  const [terminalHistory, setTerminalHistory] = useState([
    { type: 'system', text: 'CURATOR_OS v1.0.4 - TERMINAL INITIALIZED' },
    { type: 'system', text: 'Type "help" for a list of commands.' }
  ]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [terminalInput, setTerminalInput] = useState('');
  const terminalInputRef = useRef(null);
  const terminalEndRef = useRef(null);

  const handleTerminalKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setTerminalInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setTerminalInput('');
        } else {
          setHistoryIndex(newIndex);
          setTerminalInput(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const input = terminalInput.trimStart();
      if (!input) return;

      const words = input.split(' ');
      const cmd = words[0].toLowerCase();
      const commands = ['help', 'filter', 'view', 'map', 'graph', 'sort', 'ls', 'open', 'fav', 'theme', 'sound', 'crt', 'clear', 'exit', 'lockdown', 'unlock', 'override', 'alert'];

      if (words.length === 1) {
        const matches = commands.filter(c => c.startsWith(cmd));
        if (matches.length === 1) {
          setTerminalInput(matches[0] + ' ');
        }
      } else if (words.length === 2) {
        const arg = words[1].toLowerCase();
        if (cmd === 'theme') {
          const themes = ['cyan', 'purple', 'emerald', 'gold'];
          const matches = themes.filter(t => t.startsWith(arg));
          if (matches.length === 1) setTerminalInput(`${cmd} ${matches[0]}`);
        } else if (cmd === 'sound' || cmd === 'crt') {
          const states = ['on', 'off'];
          const matches = states.filter(s => s.startsWith(arg));
          if (matches.length === 1) setTerminalInput(`${cmd} ${matches[0]}`);
        } else if (cmd === 'view') {
          const views = ['grid', 'matrix'];
          const matches = views.filter(v => v.startsWith(arg));
          if (matches.length === 1) setTerminalInput(`${cmd} ${matches[0]}`);
        } else if (cmd === 'sort') {
          const sorts = ['featured', 'newest', 'a-z', 'random', 'complex'];
          // Remove hyphens for easier matching, e.g., 'a' matches 'a-z'
          const matches = sorts.filter(s => s.replace('-', '').startsWith(arg.replace('-', '')));
          if (matches.length === 1) setTerminalInput(`${cmd} ${matches[0]}`);
        } else if (cmd === 'filter') {
          const filters = ['all', 'favorites', ...Object.keys(CATEGORIES).map(c => c.toLowerCase())];
          const matches = filters.filter(f => f.startsWith(arg));
          if (matches.length === 1) {
             const originalCat = Object.keys(CATEGORIES).find(c => c.toLowerCase() === matches[0]);
             setTerminalInput(`${cmd} ${originalCat || matches[0]}`);
          }
        }
      }
    }
  };

  // Terminal Command Processor
  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const commandStr = terminalInput.trim();
    const [command, ...args] = commandStr.split(/\s+/);

    setCommandHistory(prev => [...prev, commandStr]);
    setHistoryIndex(-1);

    // Echo command
    const newHistory = [...terminalHistory, { type: 'user', text: `root@curator:~# ${commandStr}` }];

    let responseText = '';
    let responseType = 'system'; // 'system' | 'error' | 'success' | 'user'

    switch (command.toLowerCase()) {
      case 'help':
        responseText = `AVAILABLE PROTOCOLS:\n` +
          `  help         - Display this information\n` +
          `  filter <val> - Set filter (e.g., 'filter Games', 'filter all')\n` +
          `  sort <val>   - Set sorting (newest, a-z, random, featured, complex)\n` +
          `  view <val>   - Set display protocol (grid, matrix, list, map)\n` +
          `  map          - Quick switch to Neural Map view\n` +
          `  ls           - List active projects by ID\n` +
          `  open <id>    - Initialize view for specific project ID\n` +
          `  fav <id>     - Toggle favorite status for project ID\n` +
          `  theme <val>  - Change OS theme (cyan, purple, emerald, gold)\n` +
          `  sound <val>  - Toggle UI audio feedback (on, off)\n` +
          `  crt <val>    - Toggle CRT retro effect (on, off)\n` +
          `  matrix <val> - Toggle Matrix Rain background (on, off)\n` +
          `  stats        - View system diagnostics\n` +
          `  clear        - Flush terminal buffer\n` +
          `  lockdown     - Engage system lockdown protocol\n` +
          `  exit / close - Terminate command session`;
        break;

      case 'lockdown':
        setIsLockdown(true);
        soundSystem.playAlarm();
        soundSystem.speak("Warning. System lockdown protocol engaged. Access denied.");
        responseText = `> CRITICAL: SYSTEM LOCKDOWN PROTOCOL ENGAGED`;
        responseType = 'error';
        addActivityLog(`SYSTEM ALERT: LOCKDOWN PROTOCOL`);
        break;

      case 'unlock':
      case 'override':
        setIsLockdown(false);
        soundSystem.playSuccess();
        soundSystem.speak("Lockdown overridden. System restored.");
        responseText = `> LOCKDOWN OVERRIDDEN. SYSTEM RESTORED`;
        responseType = 'success';
        addActivityLog(`SYSTEM ALERT: LOCKDOWN OVERRIDDEN`);
        break;

      case 'alert':
        soundSystem.playAlert();
        responseText = `> SYSTEM ALERT TRIGGERED`;
        responseType = 'warning';
        break;

      case 'sound':
        if (args.length === 0) {
          responseText = 'ERR: Missing parameter. Usage: sound <on|off>';
          responseType = 'error';
        } else {
          const stateParam = args[0].toLowerCase();
          if (stateParam === 'on') {
            setIsSoundEnabled(true);
            responseText = `> AUDIO_FEEDBACK_SYSTEM: ONLINE`;
            responseType = 'success';
          } else if (stateParam === 'off') {
            setIsSoundEnabled(false);
            responseText = `> AUDIO_FEEDBACK_SYSTEM: OFFLINE`;
            responseType = 'success';
          } else {
            responseText = `ERR: Invalid state '${stateParam}'`;
            responseType = 'error';
          }
        }
        break;

      case 'crt':
        if (args.length === 0) {
          responseText = 'ERR: Missing parameter. Usage: crt <on|off>';
          responseType = 'error';
        } else {
          const stateParam = args[0].toLowerCase();
          if (stateParam === 'on') {
            setIsCrtEnabled(true);
            responseText = `> CRT_EFFECT_SYSTEM: ONLINE`;
            responseType = 'success';
          } else if (stateParam === 'off') {
            setIsCrtEnabled(false);
            responseText = `> CRT_EFFECT_SYSTEM: OFFLINE`;
            responseType = 'success';
          } else {
            responseText = `ERR: Invalid state '${stateParam}'`;
            responseType = 'error';
          }
        }
        break;

      case 'stats': {
        const totalProjects = projectData.length;
        const favCount = favorites.length;
        let statsStr = `SYSTEM DIAGNOSTICS\n`;
        statsStr += `------------------\n`;
        statsStr += `TOTAL PROJECTS : ${totalProjects}\n`;
        statsStr += `FAVORITES      : ${favCount}\n\n`;
        statsStr += `CATEGORY DISTRIBUTION:\n`;

        const catCounts = {};
        projectData.forEach(p => {
            const cats = new Set();
            p.tags.forEach(t => {
                if (TAG_TO_CATEGORIES[t]) {
                    TAG_TO_CATEGORIES[t].forEach(c => cats.add(c));
                }
            });
            cats.forEach(c => {
                catCounts[c] = (catCounts[c] || 0) + 1;
            });
        });

        Object.entries(catCounts).forEach(([cat, count]) => {
            const barLen = Math.round((count / totalProjects) * 20);
            const bar = '█'.repeat(barLen) + '░'.repeat(20 - barLen);
            statsStr += `[${bar}] ${cat.padEnd(15)} (${count})\n`;
        });

        responseText = statsStr;
        responseType = 'system';
        break;
      }

      case 'filter':
        if (args.length === 0) {
          responseText = 'ERR: Missing parameter. Usage: filter <category|tag|all>';
          responseType = 'error';
        } else {
          const filterParam = args.join(' ');
          // Basic matching logic: check exact matches first, then case-insensitive
          let matchedFilter = null;
          if (filterParam.toLowerCase() === 'all') matchedFilter = 'All';
          else if (filterParam.toLowerCase() === 'favorites') matchedFilter = 'Favorites';
          else if (CATEGORIES[filterParam]) matchedFilter = filterParam; // Exact Category Match
          else {
             // Case insensitive search across categories and tags
             const allValidFilters = ['All', 'Favorites', ...Object.keys(CATEGORIES)];
             Object.values(CATEGORIES).forEach(tags => allValidFilters.push(...tags));

             matchedFilter = allValidFilters.find(f => f.toLowerCase() === filterParam.toLowerCase());
          }

          if (matchedFilter) {
            toggleFilter(matchedFilter);
            responseText = `> FILTER_PROTOCOL_TOGGLED: [${matchedFilter.toUpperCase()}]`;
            responseType = 'success';
          } else {
             responseText = `ERR: Invalid filter target '${filterParam}'`;
             responseType = 'error';
          }
        }
        break;

      case 'view':
        if (args.length === 0) {
          responseText = 'ERR: Missing parameter. Usage: view <grid|matrix|list|map>';
          responseType = 'error';
        } else {
          const viewParam = args[0].toLowerCase();
          if (viewParam === 'grid' || viewParam === 'matrix' || viewParam === 'list' || viewParam === 'map') {
             handleDisplayModeChange(viewParam);
             responseText = `> DISPLAY_PROTOCOL_UPDATED: [${viewParam.toUpperCase()}]`;
             responseType = 'success';
          } else {
             responseText = `ERR: Unknown display protocol '${args[0]}'`;
             responseType = 'error';
          }
        }
        break;

      case 'map':
      case 'graph':
        handleDisplayModeChange('map');
        responseText = '> DISPLAY_PROTOCOL_UPDATED: [MAP]';
        responseType = 'success';
        break;

      case 'sort':
        if (args.length === 0) {
          responseText = 'ERR: Missing parameter. Usage: sort <featured|newest|a-z|random|complex>';
          responseType = 'error';
        } else {
          const sortParam = args[0].toLowerCase();
          const sortMap = { 'featured': 'Featured', 'newest': 'Newest', 'a-z': 'A-Z', 'random': 'Random', 'complex': 'Most Complex' };
          if (sortMap[sortParam]) {
             if (sortParam === 'random') {
                 // Use setTimeout or a local var so it isn't executing during render evaluation if linter thinks this is during render
                 setTimeout(() => setRandomSeed(Math.random()), 0);
             }
             setSortOption(sortMap[sortParam]);
             setCurrentPage(1);
             responseText = `> SORT_MATRIX_UPDATED: [${sortMap[sortParam].toUpperCase()}]`;
             responseType = 'success';
          } else {
             responseText = `ERR: Unknown sorting algorithm '${args[0]}'`;
             responseType = 'error';
          }
        }
        break;

      case 'ls':
        // Note: we can't directly access filteredProjects safely here without it being a dependency,
        // but since this is called in an event handler, it will read the current closure state.
        // It's safer to use a ref if we want latest, but standard React state closure is usually fine
        // for simple interactive forms.
        if (projectsMatchingQuery.length === 0) {
           responseText = 'NO ACTIVE INSTANCES DETECTED.';
        } else {
           // We use projectsMatchingQuery directly as it already filters by searchQuery
           responseText = projectsMatchingQuery.map(p => `[${p.id.toString().padStart(4, '0')}] ${p.title}`).join('\n');
        }
        break;

      case 'open':
        if (args.length === 0) {
          responseText = 'ERR: Missing parameter. Usage: open <id>';
          responseType = 'error';
        } else {
          const idToOpen = parseInt(args[0], 10);
          const projectToOpen = projectData.find(p => p.id === idToOpen);
          if (projectToOpen) {
            handleProjectSelect(projectToOpen);
            // Close terminal after initiating app launch
            setIsTerminalClosing(true);
            setTimeout(() => {
              setIsTerminalOpen(false);
              setIsTerminalClosing(false);
            }, 300);
            responseText = `> INITIALIZING_VIEW: [${projectToOpen.title.toUpperCase()}]`;
            responseType = 'success';
          } else {
            responseText = `ERR: Instance ID ${args[0]} not found in database.`;
            responseType = 'error';
          }
        }
        break;

      case 'fav':
         if (args.length === 0) {
          responseText = 'ERR: Missing parameter. Usage: fav <id>';
          responseType = 'error';
        } else {
          const idToFav = parseInt(args[0], 10);
          const projectToFav = projectData.find(p => p.id === idToFav);
          if (projectToFav) {
             toggleFavorite(projectToFav);
             responseText = `> FAVORITE_STATUS_TOGGLED: [${projectToFav.title.toUpperCase()}]`;
             responseType = 'success';
          } else {
            responseText = `ERR: Instance ID ${args[0]} not found in database.`;
            responseType = 'error';
          }
        }
        break;

      case 'theme':
         if (args.length === 0) {
          responseText = 'ERR: Missing parameter. Usage: theme <cyan|purple|emerald|gold>';
          responseType = 'error';
        } else {
          const validThemes = ['cyan', 'purple', 'emerald', 'gold'];
          if (validThemes.includes(args[0].toLowerCase())) {
             changeTheme(args[0].toLowerCase());
             responseText = `> COLOR_PROTOCOL_UPDATED`;
             responseType = 'success';
          } else {
             responseText = `ERR: Unsupported color matrix '${args[0]}'`;
             responseType = 'error';
          }
        }
        break;

      case 'matrix':
        if (args.length === 0) {
          responseText = 'ERR: Missing parameter. Usage: matrix <on|off>';
          responseType = 'error';
        } else {
          const stateParam = args[0].toLowerCase();
          if (stateParam === 'on') {
             setIsMatrixMode(true);
             responseText = '> SYSTEM_VISUALS: MATRIX_PROTOCOL_ENGAGED';
          } else if (stateParam === 'off') {
             setIsMatrixMode(false);
             responseText = '> SYSTEM_VISUALS: MATRIX_PROTOCOL_DISENGAGED';
          } else {
             responseText = `ERR: Invalid state '${stateParam}'. Use 'on' or 'off'.`;
             responseType = 'error';
          }
        }
        break;

      case 'clear':
        setTerminalHistory([]);
        setTerminalInput('');
        return; // Early return to avoid adding the command echo

      case 'exit':
      case 'close':
      case 'quit':
        setIsTerminalClosing(true);
        setTimeout(() => {
          setIsTerminalOpen(false);
          setIsTerminalClosing(false);
        }, 300);
        setTerminalInput('');
        return;

      default:
        responseText = `ERR: Command not recognized: '${command}'. Type 'help' for protocols.`;
        responseType = 'error';
    }

    setTerminalHistory([...newHistory, { type: responseType, text: responseText }]);
    setTerminalInput('');
    if (responseType !== 'error' && command !== 'clear') {
      addActivityLog(`TERMINAL CMD: ${command} ${args.join(' ')}`);
    }
  };

  // Auto-scroll terminal content (but only within the terminal, not the page)
  useEffect(() => {
    if (isTerminalOpen && terminalEndRef.current) {
      // Find the terminal output container and scroll it without affecting page scroll
      const terminalContainer = terminalEndRef.current.parentElement;
      if (terminalContainer) {
        terminalContainer.scrollTop = terminalContainer.scrollHeight;
      }
    }
  }, [terminalHistory, isTerminalOpen]);

  // Focus terminal input when opened
  useEffect(() => {
    if (isTerminalOpen && !isTerminalClosing && terminalInputRef.current) {
      setTimeout(() => terminalInputRef.current.focus(), 50);
    }
  }, [isTerminalOpen, isTerminalClosing]);


  return {
    commandHistory,
    handleTerminalKeyDown,
    handleTerminalSubmit,
    historyIndex,
    isTerminalClosing,
    isTerminalOpen,
    setIsTerminalClosing,
    setIsTerminalOpen,
    setTerminalInput,
    terminalEndRef,
    terminalHistory,
    terminalInput,
    terminalInputRef
  };
}
