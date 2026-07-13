// Renders the transient particle dots spawned by useFavoriteBurst.
export default function CardFavoriteBurst({ particles, size = 'sm' }) {
  const dotClass = size === 'lg' ? 'w-1.5 h-1.5' : 'w-1 h-1';
  return (
    <>
      {particles.map(p => (
        <div
          key={p.id}
          className={`absolute left-1/2 top-1/2 ${dotClass} bg-pink-400 rounded-full pointer-events-none z-50 shadow-[0_0_5px_rgba(236,72,153,0.8)]`}
          style={{
            '--tx': p.tx,
            '--ty': p.ty,
            animation: 'particle-fly 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards'
          }}
        />
      ))}
    </>
  );
}
