import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * LiveSignalRail — Operational Ticker Bar
 * Directly below hero section, displaying live collection metrics, pre-order deadlines, and archive entries.
 */
export default function LiveSignalRail({ totalEntries = 215, latestBrand = 'Mini GT' }) {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-[#090909] border-y border-white/[0.06] py-3 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3 text-[#A9A49C]">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#E86A2F]/15 border border-[#E86A2F]/30 text-[#E86A2F] text-[10px] font-bold uppercase tracking-widest animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E86A2F]" />
            LIVE SIGNAL
          </span>
          <span className="text-[#F4F1EC] font-semibold tracking-wide truncate max-w-md sm:max-w-xl">
            INCOMING TO THE VAULT — {latestBrand} Pre-Orders &amp; Curated Arrivals Active
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-[#74716B] shrink-0">
          <span>
            <strong className="text-[#F4F1EC] font-mono">{totalEntries}</strong> VAULT ENTRIES
          </span>
          <span className="text-white/10">•</span>
          <button
            onClick={() => navigate('/marketplace')}
            className="text-[#C8AE7D] hover:text-[#F4F1EC] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
          >
            Explore Vault →
          </button>
        </div>
      </div>
    </div>
  );
}
