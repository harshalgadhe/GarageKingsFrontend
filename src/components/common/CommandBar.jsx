import React, { useState } from 'react';
import { Search, Filter, X, RotateCcw, Check } from 'lucide-react';

/**
 * CommandBar — Unified Desktop Command Bar & Mobile Inspection Drawer
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

  // Active filter counter
  const activeCount = 
    (brandFilter !== 'All' ? 1 : 0) +
    (scaleFilter !== 'All' ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (preBookingOnly ? 1 : 0);

  return (
    <div className="w-full bg-[#0D0D0D] border-y border-white/[0.06] sticky top-16 z-30 shadow-2xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* ── Search Command Input ── */}
        <div className="relative w-full md:w-80 group">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74716B] group-focus-within:text-[#E86A2F] transition-colors" />
          <input
            id="marketplace-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vault (model, brand, SKU)..."
            className="w-full bg-[#050505] border border-white/[0.08] focus:border-[#E86A2F] rounded-lg pl-10 pr-8 py-2 text-xs text-[#F4F1EC] placeholder-[#74716B] focus:outline-none gk-focus-ring transition-all font-mono"
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
        <div className="hidden lg:flex items-center gap-3">
          {/* Brand Filter */}
          <div className="flex items-center gap-1.5 bg-[#050505] border border-white/[0.08] px-3 py-1.5 rounded-lg text-xs font-mono">
            <span className="text-[#74716B] uppercase font-bold text-[10px]">BRAND:</span>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="bg-transparent text-[#F4F1EC] focus:outline-none cursor-pointer font-sans"
            >
              <option value="All" className="bg-[#0D0D0D]">All Brands</option>
              {backendBrands.map(b => (
                <option key={b.name} value={b.name} className="bg-[#0D0D0D]">{b.name}</option>
              ))}
            </select>
          </div>

          {/* Scale Filter */}
          <div className="flex items-center gap-1.5 bg-[#050505] border border-white/[0.08] px-3 py-1.5 rounded-lg text-xs font-mono">
            <span className="text-[#74716B] uppercase font-bold text-[10px]">SCALE:</span>
            <select
              value={scaleFilter}
              onChange={(e) => setScaleFilter(e.target.value)}
              className="bg-transparent text-[#F4F1EC] focus:outline-none cursor-pointer font-sans"
            >
              <option value="All" className="bg-[#0D0D0D]">All Scales</option>
              <option value="1:64" className="bg-[#0D0D0D]">1:64</option>
              <option value="1:32" className="bg-[#0D0D0D]">1:32</option>
              <option value="1:18" className="bg-[#0D0D0D]">1:18</option>
            </select>
          </div>

          {/* Toggle Switches */}
          <button
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase border transition-all cursor-pointer flex items-center gap-1.5 ${
              inStockOnly
                ? 'bg-[#5E9F78]/15 border-[#5E9F78]/40 text-[#5E9F78]'
                : 'bg-[#050505] border-white/[0.08] text-[#74716B] hover:text-[#F4F1EC]'
            }`}
          >
            {inStockOnly && <Check size={12} />}
            <span>In Stock</span>
          </button>

          <button
            onClick={() => setPreBookingOnly(!preBookingOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase border transition-all cursor-pointer flex items-center gap-1.5 ${
              preBookingOnly
                ? 'bg-[#C99652]/15 border-[#C99652]/40 text-[#C99652]'
                : 'bg-[#050505] border-white/[0.08] text-[#74716B] hover:text-[#F4F1EC]'
            }`}
          >
            {preBookingOnly && <Check size={12} />}
            <span>Pre-Booking</span>
          </button>

          {activeCount > 0 && (
            <button
              onClick={onResetFilters}
              className="text-[#74716B] hover:text-[#E86A2F] text-xs font-mono font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw size={12} />
              Reset ({activeCount})
            </button>
          )}
        </div>

        {/* ── Mobile Filter Trigger Button ── */}
        <div className="flex lg:hidden items-center justify-between w-full">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#050505] border border-white/[0.08] text-xs font-mono text-[#F4F1EC] cursor-pointer"
          >
            <Filter size={14} className="text-[#E86A2F]" />
            <span>Inspection Filters</span>
            {activeCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#E86A2F] text-black text-[10px] font-bold font-sans">
                {activeCount}
              </span>
            )}
          </button>

          <div className="text-[11px] font-mono text-[#74716B]">
            <strong className="text-[#F4F1EC]">{totalItems}</strong> Vault Entries
          </div>
        </div>

        {/* ── Results Count (Desktop) ── */}
        <div className="hidden lg:block text-xs font-mono text-[#74716B] shrink-0">
          Displaying <strong className="text-[#F4F1EC]">{totalItems}</strong> vault entries
        </div>
      </div>

      {/* ── Mobile Inspection Sheet / Drawer ── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm lg:hidden">
          <div className="bg-[#0D0D0D] border-t border-white/[0.12] rounded-t-2xl p-6 space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <h3 className="text-base font-bold text-[#F4F1EC] font-mono uppercase tracking-wider">
                Inspection Parameters
              </h3>
              <button onClick={() => setIsDrawerOpen(false)} className="text-[#74716B] hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Brand Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-[#74716B] font-bold block">Brand Filter</label>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full bg-[#050505] border border-white/[0.08] p-3 rounded-lg text-sm text-white focus:outline-none"
              >
                <option value="All">All Brands</option>
                {backendBrands.map(b => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Scale Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-[#74716B] font-bold block">Scale Filter</label>
              <select
                value={scaleFilter}
                onChange={(e) => setScaleFilter(e.target.value)}
                className="w-full bg-[#050505] border border-white/[0.08] p-3 rounded-lg text-sm text-white focus:outline-none"
              >
                <option value="All">All Scales</option>
                <option value="1:64">1:64</option>
                <option value="1:32">1:32</option>
                <option value="1:18">1:18</option>
              </select>
            </div>

            {/* Checkbox Options */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 accent-[#E86A2F]"
                />
                <span className="text-sm font-semibold text-[#F4F1EC]">In Stock Items Only</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preBookingOnly}
                  onChange={(e) => setPreBookingOnly(e.target.checked)}
                  className="w-4 h-4 accent-[#E86A2F]"
                />
                <span className="text-sm font-semibold text-[#F4F1EC]">Pre-Order / Pre-Booking Only</span>
              </label>
            </div>

            {/* Pinned Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
              <button
                onClick={() => { onResetFilters(); setIsDrawerOpen(false); }}
                className="flex-1 py-3 border border-white/[0.1] rounded-lg text-xs font-mono uppercase font-bold text-[#A9A49C] hover:text-white"
              >
                Reset
              </button>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 py-3 bg-[#E86A2F] rounded-lg text-xs font-mono uppercase font-black text-black"
              >
                Apply Parameters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
