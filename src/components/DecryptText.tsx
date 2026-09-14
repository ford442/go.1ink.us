import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';

interface DecryptTextProps {
  text: string;
  isHovered?: boolean;
  isVisible?: boolean;
  searchQuery?: string;
  regex?: RegExp | null;
}

// Helper to highlight matching text
const highlightMatch = (text: string, query: string, regex: RegExp | null | undefined): ReactNode => {
  if (!query || !text || !regex) return text;

  const parts = text.split(regex);
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={i} className="bg-accent-500/30 text-accent-200 rounded px-0.5 shadow-[0_0_8px_rgba(var(--rgb-accent-400),0.2)] font-semibold">{part}</span>
    ) : part
  );
};

const DecryptText = ({ text, isHovered, isVisible, searchQuery, regex }: DecryptTextProps) => {
  const [scrambled, setScrambled] = useState<string | null>(null);

  useEffect(() => {
    // If there's an active search query, skip the scramble to preserve highlight functionality seamlessly
    if (searchQuery || (!isHovered && !isVisible)) {
      // Avoid sync setState warning: just return, rendering handles fallback.
      return;
    }

    let iterations = 0;
    const interval = setInterval(() => {
      setScrambled(
        text
          .split('')
          .map((char, index) => {
            // Preserve spaces
            if (char === ' ') return ' ';
            if (index < iterations) return char;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );

      if (iterations >= text.length) clearInterval(interval);
      iterations += 1 / 2; // Speed of decryption
    }, 30);

    return () => {
      clearInterval(interval);
      setScrambled(null);
    };
  }, [isHovered, isVisible, text, searchQuery]);

  return <span>{searchQuery ? highlightMatch(text, searchQuery, regex) : (!(isHovered || isVisible) ? text : (scrambled || text))}</span>;
};

export default DecryptText;
