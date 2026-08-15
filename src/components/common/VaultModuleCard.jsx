import React, { useState } from 'react';
import { ArrowUpRight, ImageOff } from 'lucide-react';

/**
 * VaultModuleCard: Signature GarageKings collector display card
 * 
 * Replaces generic dark ecommerce cards with an archival vault entry module:
 * - Clear availability state
 * - Controlled Artifact Stage lighting & pedestal grounded shadow
 * - Tabular figures & Collector Plaque metadata
 * - High-contrast state markers for exceptional availability states
 * - Complete touch & keyboard parity (composite focus ring)
 */
export default function VaultModuleCard({ car, onClick, isPreview = false, theme }) {
  const [imageFailed, setImageFailed] = useState(false);
  if (!car) return null;
  const hasImage = Boolean(car.image) && !imageFailed;

  // Determine stock availability state
  const availabilityState = String(car.availabilityState || '').trim().toUpperCase();
  const hasStockFigure = car.availableStock != null || car.stock != null || car.totalStock != null;
  const calculatedAvailableStock = car.availableStock != null
    ? Number(car.availableStock)
    : car.stock != null
      ? Number(car.stock)
      : Number(car.totalStock || 0) - Number(car.soldStock || 0) - Number(car.lockedStock || 0);
  const explicitlySoldOut = car.isSoldOut === true || String(car.isSoldOut).toLowerCase() === 'true';
  const isSoldOut = availabilityState === 'OUT_OF_STOCK'
    || availabilityState === 'SOLD_OUT'
    || explicitlySoldOut
    || (hasStockFigure && calculatedAvailableStock <= 0);

  const isPrebook = Boolean(car.isPrebook || car.status === 'Pre-Order');
  const availableCount = Number(car.availableStock ?? car.stock ?? 0);
  const isLowStock = !isSoldOut && availableCount > 0 && availableCount <= 3;

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
      role="button"
      aria-label={`View model: ${car.name || 'Collectible'}`}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`gk-vault-card group relative flex flex-col rounded-xl ${theme ? '' : 'bg-[#0D0D0D]'} border border-white/[0.08] overflow-hidden outline-none transition-[transform,border-color,box-shadow,background-color] duration-300 ${
        isPreview ? 'w-full shadow-lg' : 'cursor-pointer h-full min-h-[440px] hover:-translate-y-1 hover:border-[#D8BC78]/35 hover:bg-[#12110F] hover:shadow-[0_24px_60px_rgba(0,0,0,0.76),0_0_0_1px_rgba(216,188,120,.08)] focus-visible:-translate-y-1 focus-visible:border-[#E1BD65]/70 focus-visible:shadow-[0_0_0_3px_rgba(225,189,101,.18),0_24px_60px_rgba(0,0,0,.76)]'
      }`}
      style={theme ? { backgroundColor: theme.cardSurface || theme.background, borderColor: `${theme.accent}24` } : undefined}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" style={{ background: 'radial-gradient(360px circle at var(--pointer-x, 50%) var(--pointer-y, 24%), rgba(216,188,120,.08), transparent 55%)' }} />
      {/* ── 1. ARCHIVE / VAULT INDEX HEADER BAR ── */}
      {/* ── 2. ARTIFACT STAGE (Controlled Radial Spotlight & Museum Presentation) ── */}
      <div className="relative flex h-72 w-full items-center justify-center overflow-hidden border-b border-white/[0.04] bg-[#080808] sm:h-60" style={theme ? { backgroundColor: theme.cardStage || theme.background, borderBottomColor: `${theme.accent}18` } : undefined}>
        {hasImage ? (
          <>
            <img
              src={car.image}
              alt={`${car.brand || ''} ${car.name || 'Diecast model'}`}
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-center transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.055]"
              style={{ WebkitUserDrag: 'none' }}
            />
            <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(0,0,0,.08)_0%,transparent_52%,rgba(0,0,0,.38)_100%)]" />
          </>
        ) : (
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="relative grid h-16 w-16 place-items-center rounded-full border border-white/[0.08] bg-white/[0.025] text-[#77736B]">
              <ImageOff size={20} strokeWidth={1.35} />
              <span className="absolute inset-2 rounded-full border border-[#C8AE7D]/[0.08]" />
            </div>
            <span className="mt-4 text-[9px] font-bold uppercase tracking-[0.2em] text-[#8B867E]">Photos coming soon</span>
            <span className="mt-1 max-w-[22ch] text-[10px] leading-relaxed text-[#55514C]">Model details are available while images are being prepared.</span>
          </div>
        )}

        {/* Curated/rarity labels always occupy the left lane. */}
        {car.tag && !['standard', 'standard edition', 'none', ''].includes(String(car.tag).trim().toLowerCase()) && (
          <div className="absolute left-3 top-3 z-20 max-w-[46%] truncate rounded-md border border-[#E45A50]/40 bg-[#2B1110]/90 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-[#FF8178] backdrop-blur-md">
            {car.tag}
          </div>
        )}

        {/* Availability always occupies the right lane and takes visual priority. */}
        {(isSoldOut || isPrebook || isLowStock) && (
          <div className={`absolute right-3 top-3 z-20 max-w-[48%] truncate rounded-md border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] backdrop-blur-md ${
            isSoldOut
              ? 'border-[#D96A62]/40 bg-[#351918]/90 text-[#FF8178]'
              : 'border-[#C99652]/35 bg-[#261D12]/90 text-[#E0B36E]'
          }`}>
            {isSoldOut ? 'Sold out' : isPrebook ? 'Pre-booking' : 'Few remaining'}
          </div>
        )}
      </div>

      {/* ── 3. COLLECTOR PLAQUE CONTENT ── */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Brand + Metadata Line */}
          <div className="mb-1.5">
            <span className="block truncate text-[10px] font-black uppercase tracking-widest text-[#E2665D]" style={theme ? { color: theme.accent } : undefined}>
              {car.brand || 'Mini GT'}
            </span>
          </div>

          {/* Title Line */}
          <h3 className="mb-1.5 min-h-[2.5rem] line-clamp-2 break-words text-sm font-bold leading-snug text-[#F4F1EC] transition-colors group-hover:text-[#D8C49A]">
            {car.name || 'Collectible Title'}
          </h3>

          {/* Subtags / Collections */}
          {(() => {
            const rawSubtags = Array.isArray(car.subtags) && car.subtags.length > 0
              ? car.subtags
              : (Array.isArray(car.tags) ? car.tags : []);

            const hiddenMetadata = new Set(['blister', 'box', 'acrylic', '1:64', '1:43', '1:24', '1:18', '1:12']);
            const validSubtags = rawSubtags.filter((t) => {
              const normalized = String(t || '').trim().toLowerCase();
              return normalized && normalized !== 'none' && !hiddenMetadata.has(normalized);
            }).slice(0, 3);
            if (validSubtags.length === 0) return null;
            return (
              <div className="mb-2 flex max-w-full gap-1 overflow-hidden" title={validSubtags.join(', ')}>
                {validSubtags.map((t, idx) => (
                  <span key={idx} className="max-w-[42%] shrink-0 truncate rounded border border-[#D4473F]/20 bg-[#D4473F]/[0.07] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-[#DFA09A]">
                    {t}
                  </span>
                ))}
              </div>
            );
          })()}

          {/* Human-formatted ETA */}
          {car.customerEta && (
            <div className="mt-1 flex min-w-0 items-center gap-1 font-mono text-[10px] font-semibold text-[#D77A72]" title={`Estimated arrival: ${car.customerEta}`}>
              <span className="shrink-0 text-[8px] uppercase tracking-wider text-[#74716B]">EST. ARRIVAL:</span>
              <span className="truncate">{car.customerEta}</span>
            </div>
          )}
        </div>

        {/* ── 4. FINANCIAL FOOTER & ACTION ── */}
        <div className="grid gap-3 border-t border-white/[0.06] pt-3">
          <div>
            <div className="text-[8px] font-bold uppercase tracking-widest text-[#74716B] mb-0.5">
              Price
            </div>

            {displayPrice ? (
              <div className="font-mono text-xl font-black text-[#F4F1EC]">
                {displayPrice}
                {isPrebook && poDeposit && (
                  <span className="mt-0.5 block font-mono text-[9px] font-normal text-[#D77A72]">
                    Deposit: {poDeposit}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-[10px] font-medium text-[#74716B] uppercase tracking-wider">Inquire for Price</div>
            )}
          </div>

          <div className="flex min-h-11 w-full items-center justify-between rounded-xl border border-[#E45A50]/45 bg-[#B93630] px-4 py-2.5 text-[#FFF8F2] shadow-[0_10px_28px_rgba(185,54,48,.22)] transition-all duration-200 group-hover:border-[#FF7A70]/60 group-hover:bg-[#D4473F] group-hover:shadow-[0_14px_34px_rgba(212,71,63,.32)] group-active:scale-[.985]">
            <span className="text-[10px] font-black uppercase tracking-[.14em]">View details</span>
            <span className="grid h-6 w-6 place-items-center rounded-full bg-black/20 ring-1 ring-white/10 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"><ArrowUpRight size={14} strokeWidth={2.2} /></span>
          </div>
        </div>
      </div>
    </article>
  );
}
