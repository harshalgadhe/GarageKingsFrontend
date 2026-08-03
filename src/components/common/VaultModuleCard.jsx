import React from 'react';

/**
 * VaultModuleCard — Signature GarageKings Collector Display Card
 * 
 * Replaces generic dark ecommerce cards with an archival vault entry module:
 * - Internal Archive Reference (Vault Index)
 * - Controlled Artifact Stage lighting & pedestal grounded shadow
 * - Tabular figures & Collector Plaque metadata
 * - High-contrast state markers (AVAILABLE, FEW REMAINING, INCOMING, ARCHIVED)
 * - Complete touch & keyboard parity (composite focus ring)
 */
export default function VaultModuleCard({ car, onClick, isPreview = false }) {
  if (!car) return null;

  // Determine stock availability state
  const isSoldOut = car.isSoldOut !== undefined
    ? car.isSoldOut
    : (car.availableStock !== undefined 
        ? car.availableStock <= 0 
        : (Number(car.totalStock || 0) - Number(car.soldStock || 0) <= 0));

  const isPrebook = Boolean(car.isPrebook || car.status === 'Pre-Order');
  const availableCount = Number(car.availableStock ?? car.stock ?? 0);
  const isLowStock = !isSoldOut && availableCount > 0 && availableCount <= 3;

  // Generate deterministic Vault Index Archive ID based on ID hash
  const shortHash = String(car.id || '').replace(/-/g, '').substring(0, 4).toUpperCase() || '0001';
  const vaultIndex = `GK-2026-${shortHash}`;

  // Formatted price strings with tabular numbers
  const displayPrice = car.price != null && Number(car.price) > 0
    ? `₹${Number(car.price).toLocaleString('en-IN')}`
    : null;

  const poDeposit = car.poAmount != null && Number(car.poAmount) > 0
    ? `₹${Number(car.poAmount).toLocaleString('en-IN')}`
    : null;

  return (
    <article
      onClick={onClick}
      tabIndex={0}
      role="region"
      aria-label={`Vault entry: ${car.name || 'Collectible'}`}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group relative flex flex-col rounded-xl bg-[#0D0D0D] border border-white/[0.06] overflow-hidden transition-all duration-300 gk-focus-ring ${
        isPreview ? 'w-full shadow-lg' : 'hover:border-[#E86A2F]/40 hover:bg-[#121212] hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.8)] cursor-pointer h-full min-h-[440px]'
      }`}
    >
      {/* ── 1. ARCHIVE / VAULT INDEX HEADER BAR ── */}
      <div className="px-4 pt-3.5 pb-2 flex items-center justify-between border-b border-white/[0.04] bg-[#050505]/40 text-[10px] uppercase font-mono tracking-widest text-[#74716B]">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C8AE7D]/60" />
          <span className="text-[#A9A49C] font-semibold">{vaultIndex}</span>
        </span>

        {/* State Badge */}
        {isSoldOut ? (
          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider bg-[#B85C5C]/15 text-[#B85C5C] border border-[#B85C5C]/30">
            ARCHIVED
          </span>
        ) : isPrebook ? (
          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider bg-[#C99652]/15 text-[#C99652] border border-[#C99652]/30">
            INCOMING
          </span>
        ) : isLowStock ? (
          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider bg-[#C99652]/15 text-[#C99652] border border-[#C99652]/30">
            FEW REMAINING
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider bg-[#5E9F78]/15 text-[#5E9F78] border border-[#5E9F78]/30">
            AVAILABLE
          </span>
        )}
      </div>

      {/* ── 2. ARTIFACT STAGE (Controlled Radial Spotlight & Museum Presentation) ── */}
      <div className="h-52 w-full bg-[#080808] artifact-stage-light relative overflow-hidden flex items-center justify-center p-4 border-b border-white/[0.04]">
        {/* Soft Pedestal Shadow under the model */}
        <div className="absolute bottom-3 inset-x-12 h-4 rounded-full bg-black/80 blur-md pointer-events-none" />

        <img
          src={car.image || '/brand-logo.png'}
          alt={`${car.brand || ''} ${car.name || 'Diecast model'}`}
          loading="lazy"
          onLoad={(e) => { e.target.style.opacity = '1'; }}
          onError={(e) => {
            e.target.src = '/brand-logo.png';
            e.target.style.opacity = '0.7';
            e.target.className = "max-h-full max-w-full object-contain p-6 grayscale transition-all duration-500 pointer-events-none select-none";
          }}
          className="max-h-full max-w-full object-contain group-hover:scale-[1.025] transition-transform duration-500 ease-out pointer-events-none select-none relative z-10"
          style={{ WebkitUserDrag: 'none', opacity: car.image ? 1 : 0.8 }}
        />

        {/* Grade / Lane Accent Badge */}
        {car.tag && !['standard', 'standard edition', 'none', ''].includes(String(car.tag).trim().toLowerCase()) && (
          <div className="absolute top-3 right-3 z-20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-[#050505]/80 text-[#C8AE7D] border border-[#C8AE7D]/30 backdrop-blur-md">
            {car.tag}
          </div>
        )}
      </div>

      {/* ── 3. COLLECTOR PLAQUE CONTENT ── */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Brand + Metadata Line */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#E86A2F]">
              {car.brand || 'Mini GT'}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#A9A49C] bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded">
                {car.scale || '1:64'}
              </span>
              {car.casing && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#7E93A8] bg-[#7E93A8]/10 border border-[#7E93A8]/20 px-2 py-0.5 rounded">
                  {car.casing}
                </span>
              )}
            </div>
          </div>

          {/* Title Line */}
          <h3 className="text-sm font-bold text-[#F4F1EC] leading-snug group-hover:text-[#E86A2F] transition-colors line-clamp-2 mb-1.5">
            {car.name || 'Collectible Title'}
          </h3>

          {/* Subtags / Collections */}
          {(() => {
            const rawSubtags = Array.isArray(car.subtags) && car.subtags.length > 0
              ? car.subtags
              : (Array.isArray(car.tags) ? car.tags : []);

            const validSubtags = rawSubtags.filter(t => t && String(t).trim().toLowerCase() !== 'none').slice(0, 3);
            if (validSubtags.length === 0) return null;
            return (
              <div className="flex flex-wrap gap-1 mb-2">
                {validSubtags.map((t, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider bg-white/[0.03] text-[#A9A49C] border border-white/[0.06]">
                    {t}
                  </span>
                ))}
              </div>
            );
          })()}

          {/* Human-formatted ETA */}
          {car.customerEta && (
            <div className="text-[10px] font-semibold text-[#C99652] mt-1 flex items-center gap-1 font-mono">
              <span className="text-[8px] uppercase tracking-wider text-[#74716B]">EST. ARRIVAL:</span>
              <span>{car.customerEta}</span>
            </div>
          )}
        </div>

        {/* ── 4. FINANCIAL FOOTER & ACTION ── */}
        <div className="pt-3 border-t border-white/[0.06] flex items-end justify-between gap-2">
          <div>
            <div className="text-[8px] font-bold uppercase tracking-widest text-[#74716B] mb-0.5">
              {isPrebook ? (poDeposit ? 'PO Deposit' : 'Pre-Booking') : 'Acquisition Price'}
            </div>

            {displayPrice ? (
              <div className="font-mono text-base font-black text-[#F4F1EC]">
                {displayPrice}
                {isPrebook && poDeposit && (
                  <span className="block text-[9px] font-normal text-[#C99652] font-mono mt-0.5">
                    Deposit: {poDeposit}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-[10px] font-medium text-[#74716B] uppercase tracking-wider">Inquire for Price</div>
            )}
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-white/[0.04] group-hover:bg-[#E86A2F] border border-white/[0.08] group-hover:border-[#E86A2F] text-[#F4F1EC] text-[10px] font-extrabold tracking-wider uppercase transition-all duration-200 shrink-0 flex items-center gap-1">
            <span>Inspect</span>
            <span className="text-xs">→</span>
          </div>
        </div>
      </div>
    </article>
  );
}
