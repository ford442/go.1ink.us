export default function Pagination({ totalPages, currentPage, handlePageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-16 flex justify-center items-center gap-4 border-t border-white/10 pt-8 animate-fade-in">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg bg-black/40 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
        aria-label="Previous Page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </button>

      <div className="flex items-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
          // Show first, last, current, and +/- 1 pages
          if (
            page === 1 ||
            page === totalPages ||
            (page >= currentPage - 1 && page <= currentPage + 1)
          ) {
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-10 h-10 rounded-lg text-sm font-mono font-bold transition-all ${
                  currentPage === page
                    ? 'bg-accent-500/20 text-accent-300 border border-accent-500/50 shadow-[0_0_15px_rgba(var(--rgb-accent-400),0.3)]'
                    : 'bg-black/40 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                {page}
              </button>
            );
          } else if (
            page === currentPage - 2 ||
            page === currentPage + 2
          ) {
            return <span key={page} className="text-gray-600">...</span>;
          }
          return null;
        })}
      </div>

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg bg-black/40 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
        aria-label="Next Page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
