import React from 'react';

export default function ProductCard({ car, onClick, isPreview = false }) {
  const isSoldOut = car.availableStock !== undefined 
    ? car.availableStock <= 0 
    : (Number(car.totalStock || 0) - Number(car.soldStock || 0) <= 0);

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col rounded-2xl bg-[#141416] border border-white/10 overflow-hidden transition-all duration-300 ${
        isPreview ? 'w-full shadow-lg' : 'hover:border-[#ff5500]/50 hover:shadow-[0_12px_32px_rgba(0,0,0,0.6)] cursor-pointer h-[450px]'
      }`}
    >
      {/* Full Size Image Banner */}
      <div className="h-56 sm:h-52 w-full bg-[#0c0c0e] relative overflow-hidden flex-shrink-0" onContextMenu={(e) => e.preventDefault()}>
        <div className="absolute inset-0 z-30" />
        <img
          src={car.image || '/brand-logo.png'}
          alt={car.name}
          loading="lazy"
          onLoad={(e) => { e.target.style.opacity = '1'; }}
          onError={(e) => {
            e.target.src = '/brand-logo.png';
            e.target.style.opacity = '1';
            e.target.className = "w-full h-full object-contain p-6 bg-zinc-950/90 transition-all duration-500 pointer-events-none select-none";
          }}
          className="w-full h-full object-contain p-3.5 group-hover:scale-105 transition-transform duration-500 ease-out pointer-events-none select-none"
          style={{ WebkitUserDrag: 'none', opacity: car.image ? 1 : 0 }}
        />
        {/* Gradient Vignette */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#141416] to-transparent pointer-events-none z-10" />

        {/* Top Badges */}
        {car.isPrebook && (
          <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-[#ff5500]/90 backdrop-blur-md border border-white/20 text-[9px] font-black uppercase tracking-widest text-white shadow-lg animate-pulse">
            Pre-Order
          </div>
        )}

        {car.lane && !['standard', 'standard edition', 'none', ''].includes(String(car.lane).trim().toLowerCase()) && (
          <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-amber-500/30 text-[9px] font-black uppercase tracking-widest text-amber-400 shadow-lg">
            {car.lane}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 min-h-0 justify-between">
        <div>
          {/* Brand + Scale Header */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#ff5500] bg-[#ff5500]/10 border border-[#ff5500]/20 px-2 py-0.5 rounded-md truncate">
              {car.brand || car.carBrand || 'Mini GT'}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                {car.scale || '1:64'}
              </span>
              {(car.casingType || car.casing) && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                  {car.casingType || car.casing}
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-sm sm:text-base font-bold text-white leading-snug mb-1.5 group-hover:text-[#ff5500] transition-colors line-clamp-2">
            {car.name || 'Product Title'}
          </h3>

          {/* Backend Subtags (Up to 5, excluding top-right main badge) */}
          {(() => {
            const rawSubtags = Array.isArray(car.subtags) && car.subtags.length > 0
              ? car.subtags
              : (Array.isArray(car.tags) ? car.tags : []);
            
            const mainBadgeStr = String(car.lane || car.tag || car.grade || '').trim().toLowerCase();

            const validSubtags = rawSubtags.filter(t => {
              if (!t) return false;
              const s = String(t).trim().toLowerCase();
              if (s === 'none' || s === '' || s === 'standard' || s === 'standard edition') return false;
              if (mainBadgeStr && (s === mainBadgeStr || mainBadgeStr.includes(s))) return false;
              return true;
            }).slice(0, 5);

            if (validSubtags.length === 0) return null;
            return (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {validSubtags.map((t, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {t}
                  </span>
                ))}
              </div>
            );
          })()}

          {/* Description */}
          {car.description ? (
            <p className="text-[11px] text-zinc-400 line-clamp-1 font-medium">{car.description}</p>
          ) : null}

          {/* ETA / Release Date */}
          {(car.customerEta || car.arrivalDate || car.releaseDate) && (
            <div className="text-[10px] text-[#ff5500] font-bold mt-1 flex items-center gap-1">
              <span className="uppercase text-[9px] tracking-wider text-[#ff5500]/70">ETA:</span>
              <span className="font-mono text-[#ff5500]">{car.customerEta || car.arrivalDate || car.releaseDate}</span>
            </div>
          )}
        </div>

        {/* Price Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between w-full mt-3">
          {isSoldOut && !isPreview ? (
            <div className="text-red-500 font-black text-xs uppercase tracking-wider bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-md">
              Sold Out
            </div>
          ) : (
            <div>
              <div className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">
                {car.isPrebook ? 'Total Item Price' : 'Price'}
              </div>
              {(car.price != null && Number(car.price) > 0) ? (
                <div className="font-mono text-base sm:text-lg text-white font-black">
                  ₹{Number(car.price).toLocaleString('en-IN')}
                </div>
              ) : (
                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Contact Us</div>
              )}
            </div>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#ff5500] border border-white/10 hover:border-[#ff5500] text-white text-[11px] font-extrabold flex items-center gap-1 transition-all group-hover:bg-[#ff5500] group-hover:border-[#ff5500]">
            Details →
          </div>
        </div>
      </div>
    </div>
  );
}
