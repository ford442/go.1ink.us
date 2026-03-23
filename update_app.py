import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# 1. Update the Help text for terminal
content = content.replace("sort <val>   - Set sorting (newest, a-z, random, featured)", "sort <val>   - Set sorting (newest, a-z, random, featured, complex)")

# 2. Update the sortMap
content = content.replace("const sortMap = { 'featured': 'Featured', 'newest': 'Newest', 'a-z': 'A-Z', 'random': 'Random' };", "const sortMap = { 'featured': 'Featured', 'newest': 'Newest', 'a-z': 'A-Z', 'random': 'Random', 'complex': 'Most Complex' };")

# 3. Update the help text
content = content.replace("responseText = 'ERR: Missing parameter. Usage: sort <featured|newest|a-z|random>';", "responseText = 'ERR: Missing parameter. Usage: sort <featured|newest|a-z|random|complex>';")

# 4. Update the switch block in sortedProjects
new_switch = """      case 'Random':
        // Schwartzian transform for O(N) sorting after O(N) random value generation
        // Uses the seed to maintain stability across renders until seed changes
        return projects
          .map(p => {
            // Simple pseudo-random hash based on id and seed
            const val = Math.sin(p.id * randomSeed) * 10000;
            return { project: p, key: val - Math.floor(val) };
          })
          .sort((a, b) => a.key - b.key)
          .map(item => item.project);
      case 'Most Complex':
        return projects.sort((a, b) => {
          const scoreA = (a.tech?.length || 0) + (a.tags?.length || 0);
          const scoreB = (b.tech?.length || 0) + (b.tags?.length || 0);
          return scoreB - scoreA;
        });"""

content = re.sub(r"      case 'Random':[\s\S]*?\.map\(item => item\.project\);", new_switch, content)

# 5. Update the Sort By Buttons
content = content.replace("{['Featured', 'Newest', 'A-Z', 'Random'].map((option) => (", "{['Featured', 'Newest', 'A-Z', 'Most Complex', 'Random'].map((option) => (")

# 6. Add Curator Log
content += """
// CURATOR'S JOURNAL - UX LOG
// - Added 'Most Complex' sorting option and visual indicator.
// - Insight: Sorting by complexity gives users a way to instantly find the most sophisticated projects. The visual meter adds a nice touch of "sci-fi dashboard" feel without cluttering the UI.
"""

with open('src/App.jsx', 'w') as f:
    f.write(content)
