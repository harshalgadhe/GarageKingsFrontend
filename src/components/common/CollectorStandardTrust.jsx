import React, { useState } from 'react';
import { ShieldCheck, Package, RotateCcw, ChevronDown } from 'lucide-react';

/**
 * CollectorStandardTrust — Full-width Archival Trust Section & Policy Accordion
 * 
 * Replaces generic 4-tile icon boxes with plain-language, operationally accurate collector guarantees.
 */
export default function CollectorStandardTrust() {
  const [openIndex, setOpenIndex] = useState(0);

  const pillars = [
    {
      id: 'authenticity',
      title: 'Direct Sourcing & Verified Authenticity',
      icon: ShieldCheck,
      summary: '100% genuine diecast collectibles sourced directly from authorized brand distributors.',
      details: 'Every item entering the GarageKings Vault undergoes physical inspection. We verify manufacturer security holograms, casting details, and packaging integrity before listing. No counterfeit or unauthorized reproductions are ever cataloged.'
    },
    {
      id: 'packaging',
      title: 'Collector-Grade Packaging Protection',
      icon: Package,
      summary: 'Double-walled heavy armor boxes with custom bubble cushioning for blister card & box preservation.',
      details: 'We understand that mint packaging is essential for collector value. Every order is dispatched inside a 5-ply cardboard box with multi-layer bubble wrap to protect blister cards from soft corners and box sleeves from crushing during transit.'
    },
    {
      id: 'preorder',
      title: 'Pre-Order Transparency & Price Guarantee',
      icon: RotateCcw,
      summary: 'Clear deposit structure with locked final prices. No surprise price hikes when stock arrives.',
      details: 'When you place a Pre-Order deposit on GarageKings, your total purchase price is locked. The remaining balance is due only when stock lands at our vault. If an item cannot be fulfilled from our end, a 100% full refund is immediately issued.'
    }
  ];

  return (
    <section className="w-full bg-[#050505] border-y border-white/[0.06] py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#E86A2F] mb-2 flex items-center gap-2">
            <span className="w-2 h-0.5 bg-[#E86A2F]" />
            THE GARAGEKINGS PROMISE
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-[#F4F1EC] tracking-tight">
            The Collector Standard.
          </h2>
          <p className="text-sm md:text-base text-[#A9A49C] mt-3 leading-relaxed">
            Built by collectors, for collectors. Clear terms, pristine packaging, and absolute authenticity across every vault acquisition.
          </p>
        </div>

        {/* Accordions Stack */}
        <div className="space-y-4">
          {pillars.map((p, idx) => {
            const isOpen = openIndex === idx;
            const Icon = p.icon;

            return (
              <div
                key={p.id}
                className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? 'bg-[#0D0D0D] border-[#E86A2F]/40 shadow-xl'
                    : 'bg-[#090909] border-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  className="w-full p-6 text-left flex items-start justify-between gap-4 cursor-pointer focus:outline-none"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg border transition-colors ${
                      isOpen ? 'bg-[#E86A2F]/10 border-[#E86A2F]/30 text-[#E86A2F]' : 'bg-white/[0.03] border-white/[0.06] text-[#A9A49C]'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#F4F1EC] mb-1">
                        {p.title}
                      </h3>
                      <p className="text-xs md:text-sm text-[#A9A49C]">
                        {p.summary}
                      </p>
                    </div>
                  </div>

                  <div className={`p-1.5 rounded-md text-[#74716B] transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#E86A2F]' : ''}`}>
                    <ChevronDown size={18} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-2 border-t border-white/[0.04] text-xs md:text-sm text-[#A9A49C] leading-relaxed pl-19">
                    {p.details}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
