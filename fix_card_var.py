with open('src/Card.jsx', 'r') as f:
    content = f.read()

# Find where the regex useMemo block ends to insert complexity calculation
regex_block_end = "  }, [searchQuery]);\n"

complexity_calc = """
  // Calculate Complexity Score (1-5)
  const complexityScore = useMemo(() => {
    const techCount = project.tech?.length || 0;
    const tagCount = project.tags?.length || 0;
    const totalComplexity = techCount + tagCount;

    // Normalize score to 1-5
    let score = 1;
    if (totalComplexity > 6) score = 5;
    else if (totalComplexity > 4) score = 4;
    else if (totalComplexity > 3) score = 3;
    else if (totalComplexity > 2) score = 2;

    return score;
  }, [project.tech, project.tags]);
"""

content = content.replace(regex_block_end, regex_block_end + complexity_calc)

# Remove the incorrectly placed complexity block
bad_complexity_block = """  // Create stable regex object once per render to avoid recreation
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

content = content.replace(bad_complexity_block, "  // Removed bad block")

with open('src/Card.jsx', 'w') as f:
    f.write(content)
