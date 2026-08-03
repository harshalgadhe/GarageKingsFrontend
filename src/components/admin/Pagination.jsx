import React from 'react';

const Pagination = ({ currentPage, totalPages, totalItems, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-white/5">
      <span className="text-[10px] font-mono text-[#888888] uppercase tracking-wider">
        Showing Page {currentPage} of {totalPages} {totalItems ? `(${totalItems} Total)` : ''}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          Prev
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            if (pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1) {
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-7 h-7 rounded-lg border text-[10px] font-mono font-bold flex items-center justify-center transition-colors cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-[#ff5500]/10 border-[#ff5500]/30 text-[#ff5500]'
                      : 'border-white/5 bg-transparent text-[#888888] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {pageNum}
                </button>
              );
            }
            if (pageNum === 2 || pageNum === totalPages - 1) {
              return (
                <span key={pageNum} className="text-[#555555] text-xs px-0.5 font-mono">
                  ...
                </span>
              );
            }
            return null;
          })}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
