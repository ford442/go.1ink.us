import React, { useRef, useEffect, memo } from 'react';

// Extract Particle class outside of the component to avoid recreating it
class Particle {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.radius = Math.random() * 1.6 + 0.4;
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

const ParticleNetwork = memo(() => {
  const canvasRef = useRef(null);
  const colorRef = useRef('34, 211, 238'); // default cyan rgb

  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const updateAccentColor = () => {
      const computed = getComputedStyle(document.documentElement);
      const rgb = computed.getPropertyValue('--rgb-accent-400').trim();
      colorRef.current = rgb || '34, 211, 238';
    };

    // Initial + live theme reaction via attribute observer
    updateAccentColor();
    const observer = new MutationObserver(() => updateAccentColor());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const numParticles = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 14500), 110);
      for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle(canvas));
      }
    };

    let mouse = { x: null, y: null };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseOut = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);

    resizeCanvas();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const accent = colorRef.current;

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw(ctx, accent);

        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 118) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${accent}, ${0.28 * (1 - dist / 118)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }

        if (mouse.x != null && mouse.y != null) {
          const dx = particles[i].x - mouse.x;
          const dy = particles[i].y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 155) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${accent}, ${0.55 * (1 - dist / 155)})`;
            ctx.lineWidth = 1.1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
});

export default ParticleNetwork;