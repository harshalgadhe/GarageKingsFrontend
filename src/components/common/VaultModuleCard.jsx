import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

/**
 * VaultModuleCard: Signature GarageKings collector display card
 * 
 * Replaces generic dark ecommerce cards with an archival vault entry module:
 * - Internal Archive Reference (Vault Index)
 * - Controlled Artifact Stage lighting & pedestal grounded shadow
 * - Tabular figures & Collector Plaque metadata
 * - High-contrast state markers for availability and pre-booking
 * - Complete touch & keyboard parity (composite focus ring)
 */
export default function VaultModuleCard({ car, onClick, isPreview = false, theme }) {
  const [imageFailed, setImageFailed] = useState(false);
  if (!car) return null;
  const hasImage = Boolean(car.image) && !imageFailed;

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
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
        event.currentTarget.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
      }}
      tabIndex={0}
      role="region"
      aria-label={`Vault entry: ${car.name || 'Collectible'}`}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`gk-vault-card group relative flex flex-col rounded-xl ${theme ? '' : 'bg-[#0D0D0D]'} border border-white/[0.06] overflow-hidden transition-[transform,border-color,box-shadow,background-color] duration-300 gk-focus-ring ${
        isPreview ? 'w-full shadow-lg' : 'hover:border-white/[0.18] hover:bg-[#141414] hover:-translate-y-1.5 hover:shadow-[0_24px_60px_rgba(0,0,0,0.82)] cursor-pointer h-full min-h-[440px]'
      }`}
      style={theme ? { backgroundColor: theme.cardSurface || theme.background, borderColor: `${theme.accent}24` } : undefined}
    >
      {/* ── 1. ARCHIVE / VAULT INDEX HEADER BAR ── */}
      <div className="px-4 pt-3.5 pb-2 flex items-center justify-between border-b border-white/[0.04] bg-[#050505]/40 text-[10px] uppercase font-mono tracking-widest text-[#74716B]" style={theme ? { backgroundColor: `${theme.cardStage || theme.background}CC`, borderBottomColor: `${theme.accent}18` } : undefined}>
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
            PRE-BOOKING
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
      <div className="relative flex h-72 w-full items-center justify-center overflow-hidden border-b border-white/[0.04] bg-[#080808] p-3 sm:h-60 sm:p-5" style={theme ? { backgroundColor: theme.cardStage || theme.background, borderBottomColor: `${theme.accent}18` } : undefined}>
        {hasImage && <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,.08),rgba(5,5,5,.62)),radial-gradient(circle_at_50%_42%,rgba(255,255,255,.11),transparent_54%)]" />}
        {/* Soft Pedestal Shadow under the model */}
        <div className="absolute bottom-3 inset-x-12 h-4 rounded-full bg-black/80 blur-md pointer-events-none" />

        {hasImage ? (
          <img
            src={car.image}
            alt={`${car.brand || ''} ${car.name || 'Diecast model'}`}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="pointer-events-none relative z-10 h-full w-full select-none object-contain drop-shadow-[0_22px_30px_rgba(0,0,0,.72)] transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-1 group-hover:scale-[1.035]"
            style={{ WebkitUserDrag: 'none' }}
          />
        ) : (
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="relative grid h-16 w-16 place-items-center rounded-full border border-white/[0.08] bg-white/[0.025] text-[#77736B]">
              <ImageOff size={20} strokeWidth={1.35} />
              <span className="absolute inset-2 rounded-full border border-[#C8AE7D]/[0.08]" />
            </div>
            <span className="mt-4 text-[9px] font-bold uppercase tracking-[0.2em] text-[#8B867E]">Photography pending</span>
            <span className="mt-1 max-w-[22ch] text-[10px] leading-relaxed text-[#55514C]">Model details are available while images are being prepared.</span>
          </div>
        )}

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
            <span className="text-[10px] font-black uppercase tracking-widest text-[#C8AE7D]" style={theme ? { color: theme.accent } : undefined}>
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
          <h3 className="text-sm font-bold text-[#F4F1EC] leading-snug group-hover:text-[#D8C49A] transition-colors line-clamp-2 mb-1.5">
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
              {isPrebook ? (poDeposit ? 'Pre-order reference' : 'Pre-booking') : 'Listed at'}
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

          <div className="px-3 py-1.5 rounded-full bg-white/[0.04] group-hover:bg-white border border-white/[0.08] group-hover:border-white text-[#F4F1EC] group-hover:text-black text-[10px] font-extrabold tracking-wider uppercase transition-all duration-200 shrink-0 flex items-center gap-1">
            <span>View details</span>
            <span className="text-xs">→</span>
          </div>
        </div>
      </div>
    </article>
  );
}
