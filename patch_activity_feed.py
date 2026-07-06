import re

with open('src/ActivityFeed.jsx', 'r') as f:
    content = f.read()

# Add useAppContext
content = content.replace("import projectData from './projectData';", "import projectData from './projectData';\nimport { useAppContext } from './hooks/useAppContext';")

# Add userActivityLogs logic
feed_search = """const ActivityFeed = () => {
  const [logs, setLogs] = useState(() => {"""
feed_replace = """const ActivityFeed = () => {
  const { userActivityLogs = [] } = useAppContext() || {};

  const [logs, setLogs] = useState(() => {"""
content = content.replace(feed_search, feed_replace)

# Render logic
render_search = """          <div className="flex flex-col gap-2 font-mono text-[9px] text-accent-200/70 overflow-y-auto h-[120px] scrollbar-hide py-1">
            {logs.map((log) => (
              <div key={log.id} className="animate-slide-in-up flex gap-2 leading-tight">
                <span className="text-accent-500/50 shrink-0">[{log.time}]</span>
                <span className="text-gray-400 break-words">{log.text}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>"""
render_replace = """          <div className="flex flex-col gap-2 font-mono text-[9px] text-accent-200/70 overflow-y-auto h-[120px] scrollbar-hide py-1">
            {[...logs, ...userActivityLogs].sort((a, b) => a.time.localeCompare(b.time) || (a.id > b.id ? 1 : -1)).slice(-15).map((log) => {
              const isUserAction = userActivityLogs.some(u => u.id === log.id);
              return (
                <div key={log.id} className={`animate-slide-in-up flex gap-2 leading-tight ${isUserAction ? 'text-accent-300 font-bold' : ''}`}>
                  <span className="text-accent-500/50 shrink-0">[{log.time}]</span>
                  <span className={`${isUserAction ? 'text-accent-300' : 'text-gray-400'} break-words`}>
                    {isUserAction ? '> SYS_REQ: ' : ''}{log.text}
                  </span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>"""
content = content.replace(render_search, render_replace)

with open('src/ActivityFeed.jsx', 'w') as f:
    f.write(content)
