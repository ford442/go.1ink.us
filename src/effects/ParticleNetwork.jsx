import React, { useRef, useEffect, useCallback, memo } from 'react';
import useAnimationLoop from '../hooks/useAnimationLoop';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';

const LINK_DISTANCE = 118;
const LINK_DISTANCE_SQ = LINK_DISTANCE * LINK_DISTANCE;
const MOUSE_DISTANCE = 155;
const MOUSE_DISTANCE_SQ = MOUSE_DISTANCE * MOUSE_DISTANCE;
const MAX_PARTICLES = 110;
const GOD_MODE_MULTIPLIER = 2;
const DEFAULT_ACCENT = '34, 211, 238'; // cyan-400

// Extract Particle class outside of the component to avoid recreating it
class Particle {
  constructor(canvas, isGodMode) {
    this.canvas = canvas;
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    const speedMultiplier = isGodMode ? 3 : 0.5;
    this.vx = (Math.random() - 0.5) * speedMultiplier;
    this.vy = (Math.random() - 0.5) * speedMultiplier;
    this.radius = Math.random() * (isGodMode ? 3 : 1.6) + (isGodMode ? 1 : 0.4);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > this.canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > this.canvas.height) this.vy *= -1;
  }

  draw(ctx, color) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color}, 0.55)`;
    ctx.fill();
  }
}

/**
 * Uniform spatial hash sized to the link radius. Linking every particle to
 * every other is O(n²) — ~6k pair tests per frame at 110 particles — but two
 * particles can only be linked if they share a cell or sit in one of the eight
 * neighbours, so bucketing reduces it to roughly O(n) for a uniform spread.
 */
class SpatialGrid {
  constructor(width, height, cellSize) {
    this.cellSize = cellSize;
    this.cols = Math.max(1, Math.ceil(width / cellSize));
    this.rows = Math.max(1, Math.ceil(height / cellSize));
    this.cells = Array.from({ length: this.cols * this.rows }, () => []);
  }

  clear() {
    for (let i = 0; i < this.cells.length; i++) this.cells[i].length = 0;
  }

  cellIndex(x, y) {
    const col = Math.min(this.cols - 1, Math.max(0, Math.floor(x / this.cellSize)));
    const row = Math.min(this.rows - 1, Math.max(0, Math.floor(y / this.cellSize)));
    return row * this.cols + col;
  }

  insert(index, x, y) {
    this.cells[this.cellIndex(x, y)].push(index);
  }

  /**
   * Call `visit(otherIndex, isOwnCell)` for each candidate neighbour of the
   * particle at (x, y). Only the forward half of the neighbourhood is scanned
   * — own cell, the cell to the right, and the three below — so a cross-cell
   * pair is visited exactly once, from whichever particle sits in the earlier
   * cell. Within the shared cell both particles see each other, so the caller
   * breaks that tie on index; it must NOT filter by index across cells, or the
   * link is dropped whenever the neighbour happens to have the lower index.
   */
  forEachNeighbor(x, y, visit) {
    const col = Math.min(this.cols - 1, Math.max(0, Math.floor(x / this.cellSize)));
    const row = Math.min(this.rows - 1, Math.max(0, Math.floor(y / this.cellSize)));

    for (let r = row; r <= Math.min(this.rows - 1, row + 1); r++) {
      const startCol = r === row ? col : Math.max(0, col - 1);
      for (let c = startCol; c <= Math.min(this.cols - 1, col + 1); c++) {
        const isOwnCell = r === row && c === col;
        const cell = this.cells[r * this.cols + c];
        for (let k = 0; k < cell.length; k++) visit(cell[k], isOwnCell);
      }
    }
  }
}

const ParticleNetwork = memo(({ isGodMode }) => {
  const canvasRef = useRef(null);
  const colorRef = useRef(DEFAULT_ACCENT);
  const particlesRef = useRef([]);
  const gridRef = useRef(null);
  const mouseRef = useRef({ x: null, y: null });
  const prefersReducedMotion = usePrefersReducedMotion();

  // Canvas sizing, particle seeding, theme colour and pointer tracking. None of
  // this runs per frame, so it stays in a plain effect.
  useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateAccentColor = () => {
      const rgb = getComputedStyle(document.documentElement)
        .getPropertyValue('--rgb-accent-400')
        .trim();
      colorRef.current = rgb || DEFAULT_ACCENT;
    };
    updateAccentColor();
    const observer = new MutationObserver(updateAccentColor);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const initParticles = () => {
      const baseParticles = Math.min(
        Math.floor((window.innerWidth * window.innerHeight) / 14500),
        MAX_PARTICLES,
      );
      const numParticles = isGodMode ? Math.round(baseParticles * GOD_MODE_MULTIPLIER) : baseParticles;
      const particles = [];
      for (let i = 0; i < numParticles; i++) particles.push(new Particle(canvas, isGodMode));
      particlesRef.current = particles;
      gridRef.current = new SpatialGrid(canvas.width, canvas.height, LINK_DISTANCE);
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };
    resizeCanvas();

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    const handleMouseOut = () => {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseout', handleMouseOut);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
    };
  }, [isGodMode, prefersReducedMotion]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles = particlesRef.current;
    const grid = gridRef.current;
    if (!grid) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const accent = colorRef.current;
    const mouse = mouseRef.current;

    grid.clear();
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      grid.insert(i, particles[i].x, particles[i].y);
    }

    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      a.draw(ctx, accent);

      grid.forEachNeighbor(a.x, a.y, (j, isOwnCell) => {
        // Only the shared cell yields both orderings of a pair; forward cells
        // are visited once already, so index order says nothing there.
        if (isOwnCell ? j <= i : j === i) return;
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        // Compare squared distance first so the sqrt only runs for the few
        // pairs actually close enough to draw a link.
        const dsq = dx * dx + dy * dy;
        if (dsq >= LINK_DISTANCE_SQ) return;

        const dist = Math.sqrt(dsq);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${accent}, ${0.28 * (1 - dist / LINK_DISTANCE)})`;
        ctx.lineWidth = 0.6;
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });

      if (mouse.x != null && mouse.y != null) {
        const dx = a.x - mouse.x;
        const dy = a.y - mouse.y;
        const dsq = dx * dx + dy * dy;
        if (dsq < MOUSE_DISTANCE_SQ) {
          const dist = Math.sqrt(dsq);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${accent}, ${0.55 * (1 - dist / MOUSE_DISTANCE)})`;
          ctx.lineWidth = 1.1;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }
  }, []);

  useAnimationLoop(animate, { enabled: !prefersReducedMotion });

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
});

ParticleNetwork.displayName = 'ParticleNetwork';

export default ParticleNetwork;
