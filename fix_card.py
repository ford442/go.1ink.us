import re

with open('src/Card.jsx', 'r') as f:
    content = f.read()

# 1. Add complexity score calculation
score_calc = """  // Create stable regex object once per render to avoid recreation
  const regex = searchQuery ? new RegExp(`(${searchQuery})`, 'gi') : null;

  // Calculate Complexity Score (1-5)
  const techCount = project.tech?.length || 0;
  const tagCount = project.tags?.length || 0;
  const totalComplexity = techCount + tagCount;

  // Normalize score to 1-5
  let complexityScore = 1;
  if (totalComplexity > 6) complexityScore = 5;
  else if (totalComplexity > 4) complexityScore = 4;
  else if (totalComplexity > 3) complexityScore = 3;
  else if (totalComplexity > 2) complexityScore = 2;"""

content = content.replace("  // Create stable regex object once per render to avoid recreation\n  const regex = searchQuery ? new RegExp(`(${searchQuery})`, 'gi') : null;", score_calc)

# 2. Add EQ/Meter to Title Area
title_area = """            <div className="flex items-center mb-3">
              {project.image && <div className="text-2xl mr-3 transform transition-transform duration-300 group-hover:rotate-12 filter drop-shadow">{project.icon}</div>}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white tracking-wide group-hover:text-blue-300 transition-colors duration-300 flex items-center justify-between">
                  <span>{highlightMatch(project.title, searchQuery, regex)}</span>

                  {/* Complexity Meter */}
                  <div className="flex gap-0.5 ml-3" title={`Complexity: ${complexityScore}/5`}>
                    {[1, 2, 3, 4, 5].map(level => (
                      <div
                        key={level}
                        className={`w-1 h-3 rounded-sm transition-all duration-300 ${
                          level <= complexityScore
                            ? 'bg-accent-400 shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.8)]'
                            : 'bg-white/10'
                        }`}
                        style={{
                          height: `${8 + (level * 2)}px`,
                          opacity: level <= complexityScore ? 1 : 0.3
                        }}
                      />
                    ))}
                  </div>
                </h3>
              </div>
            </div>"""

old_title_area = """            <div className="flex items-center mb-3">
              {project.image && <div className="text-2xl mr-3 transform transition-transform duration-300 group-hover:rotate-12 filter drop-shadow">{project.icon}</div>}
              <h3 className="text-xl font-bold text-white tracking-wide group-hover:text-blue-300 transition-colors duration-300">
                {highlightMatch(project.title, searchQuery, regex)}
              </h3>
            </div>"""

content = content.replace(old_title_area, title_area)

with open('src/Card.jsx', 'w') as f:
    f.write(content)
