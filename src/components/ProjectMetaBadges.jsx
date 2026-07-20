import { getStatusDisplay } from '../lib/projectStatus';
import { getConnectivityDisplay, resolveProjectConnectivity } from '../lib/projectConnectivity';

const sizeStyles = {
  card: {
    wrap: 'flex flex-col gap-1',
    status: 'flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded border',
    dot: 'w-1.5 h-1.5 rounded-full',
    label: 'text-[9px] font-mono font-bold tracking-wider',
    year: 'text-[9px] font-mono text-gray-400 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/5 w-fit',
    featured: 'text-[9px] font-mono font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 w-fit tracking-wider',
  },
  modal: {
    wrap: 'flex flex-wrap items-center gap-2',
    status: 'flex items-center gap-1.5 px-2 py-0.5 rounded border',
    dot: 'w-2 h-2 rounded-full',
    label: 'text-xs font-mono tracking-wider',
    year: 'text-xs font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10',
    featured: 'text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 tracking-wider',
  },
};

export function ProjectConnectivityBadge({ project, variant = 'card', className = '' }) {
  const connectivity = resolveProjectConnectivity(project);
  const display = getConnectivityDisplay(connectivity.health);
  const styles = sizeStyles[variant] ?? sizeStyles.card;

  return (
    <div
      className={`${styles.status} ${display.borderClass} ${className}`}
      data-testid="project-connectivity-badge"
      title={
        connectivity.latencyMs != null
          ? `Probe: ${connectivity.latencyMs}ms`
          : 'Reachability from build-time catalog probe'
      }
    >
      <div className={`${styles.dot} ${display.dotClass}`} />
      <span className={`${styles.label} ${display.textClass}`}>{display.label}</span>
    </div>
  );
}

export function ProjectStatusBadge({ project, variant = 'card', className = '' }) {
  const display = getStatusDisplay(project.status);
  const styles = sizeStyles[variant] ?? sizeStyles.card;

  return (
    <div className={`${styles.status} ${display.borderClass} ${className}`} data-testid="project-status-badge">
      <div className={`${styles.dot} ${display.dotClass}`} />
      <span className={`${styles.label} ${display.textClass}`}>{display.label}</span>
    </div>
  );
}

export function ProjectYearBadge({ project, variant = 'card', className = '' }) {
  const styles = sizeStyles[variant] ?? sizeStyles.card;
  return (
    <span className={`${styles.year} ${className}`}>{project.year}</span>
  );
}

export function ProjectFeaturedBadge({ variant = 'card', className = '' }) {
  const styles = sizeStyles[variant] ?? sizeStyles.card;
  return (
    <span className={`${styles.featured} ${className}`} title="Featured project">
      ★ FEATURED
    </span>
  );
}

/** Status, year, and optional featured badge — shared by cards and quick view. */
export default function ProjectMetaBadges({
  project,
  variant = 'card',
  showFeatured = true,
  showYear = true,
  showStatus = true,
  showConnectivity = true,
  className = '',
}) {
  const styles = sizeStyles[variant] ?? sizeStyles.card;

  return (
    <div className={`${styles.wrap} ${className}`}>
      {showConnectivity && <ProjectConnectivityBadge project={project} variant={variant} />}
      {showStatus && <ProjectStatusBadge project={project} variant={variant} />}
      {showYear && <ProjectYearBadge project={project} variant={variant} />}
      {showFeatured && project.featured && <ProjectFeaturedBadge variant={variant} />}
    </div>
  );
}
