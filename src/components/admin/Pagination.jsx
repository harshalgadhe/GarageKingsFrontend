import React from 'react';

const Pagination = ({ currentPage, totalPages, totalItems, totalCount, pageSize, onPageChange }) => {
  if (totalPages <= 1) return null;
  const itemCount = totalItems ?? totalCount;
  const visiblePages = Array.from(new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1
  ].filter(page => page >= 1 && page <= totalPages))).sort((a, b) => a - b);
  return (
    <nav aria-label="Pagination" className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-white/5">
      <span className="text-[10px] font-mono text-[#888888] uppercase tracking-wider">
        Page {currentPage} of {totalPages} {itemCount != null ? `(${itemCount} total${pageSize ? `, ${pageSize} per page` : ''})` : ''}
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
          {visiblePages.map((pageNum, index) => (
              <React.Fragment key={pageNum}>
                {index > 0 && pageNum - visiblePages[index - 1] > 1 && (
                  <span className="text-[#555555] text-xs px-0.5 font-mono" aria-hidden="true">...</span>
                )}
                <button
                  onClick={() => onPageChange(pageNum)}
                  aria-current={currentPage === pageNum ? 'page' : undefined}
                  aria-label={`Go to page ${pageNum}`}
                  className={`w-7 h-7 rounded-lg border text-[10px] font-mono font-bold flex items-center justify-center transition-colors cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-[#ff5500]/10 border-[#ff5500]/30 text-[#ff5500]'
                      : 'border-white/5 bg-transparent text-[#888888] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {pageNum}
                </button>
              </React.Fragment>
          ))}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
