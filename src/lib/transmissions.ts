import type { Project, Transmission } from '../types';

const MONTH_NAMES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

/**
 * Format a date string (YYYY-MM-DD, YYYY-MM, or YYYY) into a clean terminal OS badge.
 * e.g. "2026-08-16" -> "AUG 16, 2026", "2026-08" -> "AUG 2026", "2024" -> "2024"
 */
export function formatTransmissionDate(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') return '';

  const fullDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (fullDateMatch) {
    const [, year, month, day] = fullDateMatch;
    const monthIndex = parseInt(month, 10) - 1;
    const monthName = MONTH_NAMES[monthIndex] || month;
    const dayNum = parseInt(day, 10);
    return `${monthName} ${dayNum}, ${year}`;
  }

  const yearMonthMatch = /^(\d{4})-(\d{2})$/.exec(dateStr.trim());
  if (yearMonthMatch) {
    const [, year, month] = yearMonthMatch;
    const monthIndex = parseInt(month, 10) - 1;
    const monthName = MONTH_NAMES[monthIndex] || month;
    return `${monthName} ${year}`;
  }

  return dateStr.trim();
}

/**
 * Parses a project changelog string, extracting date prefix if present.
 * Supported formats:
 * - "2026-08-16 · Major feature rewrite..."
 * - "2026-08 - Added new audio nodes..."
 * - "2026-07: Shaders and filter updates..."
 * - "Raw summary without date prefix..." (falls back to project.year)
 */
export function parseChangelog(
  changelog: string,
  defaultYear: number,
): { date: string; formattedDate: string; summary: string } {
  const trimmed = changelog.trim();
  const datePrefixMatch = /^(\d{4}(?:-\d{2}(?:-\d{2})?)?)\s*[-·:•|]\s*(.+)$/s.exec(trimmed);

  if (datePrefixMatch) {
    const rawDate = datePrefixMatch[1];
    const summary = datePrefixMatch[2].trim();
    return {
      date: rawDate,
      formattedDate: formatTransmissionDate(rawDate),
      summary,
    };
  }

  const fallbackDate = String(defaultYear || new Date().getFullYear());
  return {
    date: fallbackDate,
    formattedDate: fallbackDate,
    summary: trimmed,
  };
}

/**
 * Derives a clean, reverse-chronologically sorted list of transmissions
 * from projects with non-null changelog entries.
 */
export function deriveTransmissions(projects: Project[]): Transmission[] {
  if (!Array.isArray(projects)) return [];

  const transmissions: Transmission[] = [];

  for (const project of projects) {
    if (!project || typeof project.changelog !== 'string' || project.changelog.trim().length === 0) {
      continue;
    }

    const { date, formattedDate, summary } = parseChangelog(project.changelog, project.year);

    transmissions.push({
      id: `transmission-${project.id}-${date}`,
      projectId: project.id,
      project,
      date,
      formattedDate,
      summary,
      raw: project.changelog,
    });
  }

  // Sort reverse-chronologically: newest date first, then highest project year/id
  return transmissions.sort((a, b) => {
    const dateComp = b.date.localeCompare(a.date);
    if (dateComp !== 0) return dateComp;
    const yearComp = (b.project.year || 0) - (a.project.year || 0);
    if (yearComp !== 0) return yearComp;
    return b.projectId - a.projectId;
  });
}
