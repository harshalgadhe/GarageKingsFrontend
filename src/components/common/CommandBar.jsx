import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, SlidersHorizontal, X, RotateCcw, Check, ChevronDown } from 'lucide-react';

function FilterMenu({ label, value, options, onChange, className = 'w-44' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.key === 'Escape' || !rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    window.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`group flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition duration-200 ${open ? 'border-[#C8AE7D]/45 bg-[#15130F] shadow-[0_0_0_3px_rgba(200,174,125,.06)]' : 'border-white/[0.08] bg-[#070707] hover:border-white/[0.16] hover:bg-[#0E0E0E]'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0">
          <span className="block text-[8px] font-bold uppercase tracking-[0.18em] text-[#716D66]">{label}</span>
          <span className="mt-0.5 block truncate text-xs font-semibold text-[#F4F1EC]">{options.find((option) => option.value === value)?.label || value}</span>
        </span>
        <ChevronDown size={14} className={`ml-3 shrink-0 text-[#9C927E] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-full min-w-[190px] overflow-hidden rounded-2xl border border-white/[0.12] bg-[#10100F]/[0.98] p-1.5 shadow-[0_22px_65px_rgba(0,0,0,.72)] backdrop-blur-2xl" role="listbox" aria-label={label}>
          <div className="px-3 pb-2 pt-1.5 text-[8px] font-bold uppercase tracking-[0.2em] text-[#68645E]">Select {label.toLowerCase()}</div>
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                type="button"
                key={option.value}
                onClick={() => { onChange(option.value); setOpen(false); }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${selected ? 'bg-[#C8AE7D]/[0.12] text-[#E7D5AB]' : 'text-[#A8A39A] hover:bg-white/[0.055] hover:text-white'}`}
                role="option"
                aria-selected={selected}
              >
                <span>{option.label}</span>
                {selected && <span className="grid h-5 w-5 place-items-center rounded-full bg-[#C8AE7D] text-black"><Check size={12} strokeWidth={3} /></span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * CommandBar: Unified desktop command bar and mobile inspection drawer
 */
export default function CommandBar({
  searchQuery,
  setSearchQuery,
  brandFilter,
  setBrandFilter,
  scaleFilter,
  setScaleFilter,
  inStockOnly,
  setInStockOnly,
  preBookingOnly,
  setPreBookingOnly,
  backendBrands = [],
  totalItems = 0,
  onResetFilters
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState({
    brand: brandFilter,
    scale: scaleFilter,
    inStock: inStockOnly,
    preBooking: preBookingOnly,
  });

  const openDrawer = () => {
    setDraftFilters({
      brand: brandFilter,
      scale: scaleFilter,
      inStock: inStockOnly,
      preBooking: preBookingOnly,
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => setIsDrawerOpen(false);

  const applyDraftFilters = () => {
    setBrandFilter(draftFilters.brand);
    setScaleFilter(draftFilters.scale);
    setInStockOnly(draftFilters.inStock);
    setPreBookingOnly(draftFilters.preBooking);
    setIsDrawerOpen(false);
  };

  useEffect(() => {
    if (!isDrawerOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') closeDrawer();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isDrawerOpen]);

  // Active filter counter
  const activeCount = 
    (brandFilter !== 'All' ? 1 : 0) +
    (scaleFilter !== 'All' ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (preBookingOnly ? 1 : 0);

  const draftActiveCount =
    (draftFilters.brand !== 'All' ? 1 : 0) +
    (draftFilters.scale !== 'All' ? 1 : 0) +
    (draftFilters.inStock ? 1 : 0) +
    (draftFilters.preBooking ? 1 : 0);

  return (
    <div className="sticky top-16 z-30 w-full border-b border-white/[0.05] bg-black/88 px-0 backdrop-blur-xl lg:border-0 lg:bg-black/72 lg:px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-3 sm:px-6 md:flex-row lg:my-3 lg:rounded-2xl lg:border lg:border-white/[0.08] lg:bg-[#0A0A0A]/95 lg:px-3 lg:shadow-[0_18px_50px_rgba(0,0,0,.38)]">
        
        {/* ── Search Command Input ── */}
        <div className="group relative w-full md:w-[19rem] lg:w-[22rem]">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#74716B] transition-colors group-focus-within:text-[#C8AE7D]" />
          <input
            id="marketplace-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search models, brands or SKU"
            className="w-full rounded-full border border-white/[0.08] bg-[#050505] py-3 pl-10 pr-9 text-sm text-[#F4F1EC] outline-none transition focus:border-[#C8AE7D]/45 focus:shadow-[0_0_0_3px_rgba(200,174,125,.06)] placeholder:text-[#69655F]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#74716B] hover:text-white cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── Desktop Inline Filter Controls ── */}
        <div className="hidden items-center gap-1 lg:flex">
          <FilterMenu
            label="Brand"
            value={brandFilter}
            onChange={setBrandFilter}
            options={[{ value: 'All', label: 'All brands' }, ...backendBrands.map((brand) => ({ value: brand.name, label: brand.name }))]}
          />

          <FilterMenu
            label="Scale"
            value={scaleFilter}
            onChange={setScaleFilter}
            className="w-36"
            options={[
              { value: 'All', label: 'All scales' },
              { value: '1:64', label: '1:64' },
              { value: '1:32', label: '1:32' },
              { value: '1:18', label: '1:18' },
            ]}
          />

          {/* Toggle Switches */}
          <button
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] transition-all ${
              inStockOnly
                ? 'bg-[#5E9F78]/15 border-[#5E9F78]/40 text-[#5E9F78]'
                : 'bg-transparent border-white/[0.08] text-[#817D76] hover:border-white/[0.16] hover:text-[#F4F1EC]'
            }`}
          >
            {inStockOnly && <Check size={12} />}
            <span>In Stock</span>
          </button>

          <button
            onClick={() => setPreBookingOnly(!preBookingOnly)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] transition-all ${
              preBookingOnly
                ? 'bg-[#C99652]/15 border-[#C99652]/40 text-[#C99652]'
                : 'bg-transparent border-white/[0.08] text-[#817D76] hover:border-white/[0.16] hover:text-[#F4F1EC]'
            }`}
          >
            {preBookingOnly && <Check size={12} />}
            <span>Pre-Booking</span>
          </button>

          {activeCount > 0 && (
            <button
              onClick={onResetFilters}
              className="ml-1 flex cursor-pointer items-center gap-1 text-[10px] font-semibold text-[#817D76] transition-colors hover:text-[#C8AE7D]"
            >
              <RotateCcw size={12} />
              Reset ({activeCount})
            </button>
          )}
        </div>

        {/* ── Mobile Filter Trigger Button ── */}
        <div className="flex lg:hidden items-center justify-between w-full">
          <button
            onClick={openDrawer}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#050505] border border-white/[0.08] text-xs font-mono text-[#F4F1EC] cursor-pointer"
          >
            <SlidersHorizontal size={14} className="text-[#D8BC78]" />
            <span>Filters</span>
            {activeCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#E1BD65] text-black text-[10px] font-bold font-sans">
                {activeCount}
              </span>
            )}
          </button>

          <div className="text-[11px] font-mono text-[#74716B]">
            <strong className="text-[#F4F1EC]">{totalItems}</strong> models
          </div>
        </div>

        {/* ── Results Count (Desktop) ── */}
        <div className="hidden shrink-0 border-l border-white/[0.07] pl-3 font-mono text-[10px] text-[#74716B] lg:block">
          <strong className="text-[#D8C49A]">{totalItems}</strong> models
        </div>
      </div>

      {/* ── Mobile Inspection Sheet / Drawer ── */}
      {isDrawerOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex h-[100dvh] flex-col justify-end bg-black/72 backdrop-blur-sm lg:hidden" onClick={closeDrawer} role="presentation">
          <div className="max-h-[calc(100dvh-72px)] overflow-y-auto rounded-t-[28px] border-t border-white/[0.14] bg-[#101010] px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-24px_70px_rgba(0,0,0,.7)]" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="mobile-filter-title">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <h3 id="mobile-filter-title" className="text-lg font-semibold tracking-tight text-[#F4F1EC]">
                Filter models
              </h3>
              <button onClick={closeDrawer} className="text-[#74716B] hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Brand choices */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.16em] text-[#8C877F] font-bold block">Brand</label>
              <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto pr-1">
                {['All', ...backendBrands.map((brand) => brand.name)].map((brand) => (
                  <button key={brand} type="button" onClick={() => setDraftFilters((current) => ({ ...current, brand }))} className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${draftFilters.brand === brand ? 'border-white bg-white text-black' : 'border-white/[0.1] bg-[#080808] text-[#A1A1A6] hover:border-white/25 hover:text-white'}`}>
                    {brand === 'All' ? 'All brands' : brand}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale choices */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.16em] text-[#8C877F] font-bold block">Scale</label>
              <div className="grid grid-cols-4 gap-2">
                {['All', '1:64', '1:32', '1:18'].map((scale) => (
                  <button key={scale} type="button" onClick={() => setDraftFilters((current) => ({ ...current, scale }))} className={`rounded-xl border py-2.5 text-xs font-semibold transition ${draftFilters.scale === scale ? 'border-[#E1BD65] bg-[#E1BD65] text-black' : 'border-white/[0.1] bg-[#080808] text-[#A1A1A6]'}`}>
                    {scale === 'All' ? 'Any' : scale}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftFilters.inStock}
                  onChange={(e) => setDraftFilters((current) => ({ ...current, inStock: e.target.checked }))}
                className="h-4 w-4 accent-[#E1BD65]"
                />
                <span className="text-sm font-semibold text-[#F4F1EC]">In Stock Items Only</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftFilters.preBooking}
                  onChange={(e) => setDraftFilters((current) => ({ ...current, preBooking: e.target.checked }))}
                className="h-4 w-4 accent-[#E1BD65]"
                />
                <span className="text-sm font-semibold text-[#F4F1EC]">Pre-Order / Pre-Booking Only</span>
              </label>
            </div>

            {/* Pinned Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
              <button
                onClick={() => setDraftFilters({ brand: 'All', scale: 'All', inStock: false, preBooking: false })}
                className="flex-1 py-3 border border-white/[0.1] rounded-lg text-xs font-mono uppercase font-bold text-[#A9A49C] hover:text-white"
              >
                Reset
              </button>
              <button
                onClick={applyDraftFilters}
                className="flex-1 py-3 bg-[#F5F5F7] rounded-full text-xs font-mono uppercase font-black text-black"
              >
                Apply filters{draftActiveCount > 0 ? ` (${draftActiveCount})` : ''}
              </button>
            </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
