import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# Replace the initial state
old_state = """  const [systemStats, setSystemStats] = useState({
    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    uptime: 999990, // Random high start
    connections: 1337,
    memory: 42
  });"""

new_state = """  const [systemStats, setSystemStats] = useState({
    time: `${new Date().toLocaleTimeString('en-US', { hour12: false })}.${new Date().getMilliseconds().toString().padStart(3, '0')}`,
    uptime: 999990, // Random high start
    connections: 1337,
    memory: 42
  });"""

content = content.replace(old_state, new_state)

old_effect = """  // Animated Command Center Header Logic
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
  }, []);"""

new_effect = """  // Animated Command Center Header Logic
  useEffect(() => {
    const slowTimer = setInterval(() => {
      setSystemStats(prev => {
        // Fluctuate connections slightly
        let newConnections = prev.connections + Math.floor(Math.random() * 5) - 2;
        if (newConnections < 1000) newConnections = 1000 + Math.floor(Math.random() * 50);

        // Fluctuate memory
        let newMemory = prev.memory + (Math.random() > 0.5 ? 1 : -1);
        if (newMemory < 20) newMemory = 20;
        if (newMemory > 80) newMemory = 80;

        return {
          ...prev,
          uptime: prev.uptime + 1,
          connections: newConnections,
          memory: newMemory
        };
      });
    }, 1000);

    const fastTimer = setInterval(() => {
      setSystemStats(prev => ({
        ...prev,
        time: `${new Date().toLocaleTimeString('en-US', { hour12: false })}.${new Date().getMilliseconds().toString().padStart(3, '0')}`
      }));
    }, 50);

    return () => {
      clearInterval(slowTimer);
      clearInterval(fastTimer);
    };
  }, []);"""

content = content.replace(old_effect, new_effect)


old_memory = """          <div className="hidden md:flex items-center gap-2 text-accent-200/70 border-r border-accent-500/30 pr-4">
             <span className="opacity-50">MEM:</span>
             <span className="text-accent-100 min-w-[28px]">{systemStats.memory}%</span>
          </div>"""

new_memory = """          <div className="hidden md:flex items-center gap-2 text-accent-200/70 border-r border-accent-500/30 pr-4">
             <span className="opacity-50">MEM:</span>
             <span className="text-accent-100 min-w-[28px]">{systemStats.memory}%</span>
             <div className="flex gap-0.5 ml-1">
                <div className={`w-1 h-3 ${systemStats.memory >= 20 ? 'bg-accent-400' : 'bg-accent-900/50'}`}></div>
                <div className={`w-1 h-3 ${systemStats.memory >= 40 ? 'bg-accent-400' : 'bg-accent-900/50'}`}></div>
                <div className={`w-1 h-3 ${systemStats.memory >= 60 ? 'bg-accent-400' : 'bg-accent-900/50'}`}></div>
                <div className={`w-1 h-3 ${systemStats.memory >= 80 ? 'bg-accent-400' : 'bg-accent-900/50'}`}></div>
                <div className={`w-1 h-3 ${systemStats.memory >= 95 ? 'bg-accent-400' : 'bg-accent-900/50'}`}></div>
             </div>
          </div>"""

content = content.replace(old_memory, new_memory)

# Update connections visualizer
old_connections = """          <div className="hidden sm:flex items-center gap-2 text-accent-200/70 border-r border-accent-500/30 pr-4">
             <span className="opacity-50">NET:</span>
             <span className="text-accent-100 min-w-[40px]">{systemStats.connections}</span>
          </div>"""

new_connections = """          <div className="hidden sm:flex items-center gap-2 text-accent-200/70 border-r border-accent-500/30 pr-4">
             <span className="opacity-50">NET:</span>
             <span className="text-accent-100 min-w-[40px]">{systemStats.connections}</span>
             <div className="flex gap-0.5 ml-1">
                <div className={`w-1 h-3 ${systemStats.connections >= 400 ? 'bg-accent-400' : 'bg-accent-900/50'}`}></div>
                <div className={`w-1 h-3 ${systemStats.connections >= 800 ? 'bg-accent-400' : 'bg-accent-900/50'}`}></div>
                <div className={`w-1 h-3 ${systemStats.connections >= 1200 ? 'bg-accent-400' : 'bg-accent-900/50'}`}></div>
                <div className={`w-1 h-3 ${systemStats.connections >= 1600 ? 'bg-accent-400' : 'bg-accent-900/50'}`}></div>
                <div className={`w-1 h-3 ${systemStats.connections >= 2000 ? 'bg-accent-400' : 'bg-accent-900/50'}`}></div>
             </div>
          </div>"""

content = content.replace(old_connections, new_connections)

# Update time styling
old_time = """          <div className="text-accent-300 font-bold tracking-widest drop-shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.8)]">
            {systemStats.time}
          </div>"""

new_time = """          <div className="text-accent-300 font-bold tracking-widest drop-shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.8)] font-mono tabular-nums min-w-[110px] text-right">
            {systemStats.time}
          </div>"""

content = content.replace(old_time, new_time)

with open('src/App.jsx', 'w') as f:
    f.write(content)
