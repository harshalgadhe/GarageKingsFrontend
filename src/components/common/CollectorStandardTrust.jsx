import React, { useState } from 'react';
import { ShieldCheck, Package, MessageCircle, ChevronDown } from 'lucide-react';

/**
 * CollectorStandardTrust: Full-width archival trust section and policy accordion
 * 
 * Replaces generic 4-tile icon boxes with plain-language, operationally accurate collector guarantees.
 */
export default function CollectorStandardTrust() {
  const [openIndex, setOpenIndex] = useState(0);

  const pillars = [
    {
      id: 'authenticity',
      title: 'Clear model details',
      icon: ShieldCheck,
      summary: 'Useful model, edition and condition information presented before you enquire.',
      details: 'We list each model using the information and images available to us. If a specific detail matters to your decision, ask GarageKings and we will confirm what we can before you proceed.'
    },
    {
      id: 'packaging',
      title: 'Condition & Handover Clarity',
      icon: Package,
      summary: 'Ask about card, box and model condition before arranging delivery or collection.',
      details: 'Packaging and handover arrangements can vary by model and destination. GarageKings can share available condition details and discuss delivery or collection before anything is confirmed.'
    },
    {
      id: 'preorder',
      title: 'Pre-Order Enquiry Clarity',
      icon: MessageCircle,
      summary: 'Displayed pricing and availability are confirmed directly with GarageKings.',
      details: 'GarageKings does not accept checkout on this website. For a pre-booking model, contact us on WhatsApp or Instagram to confirm current availability, pricing, payment stages and the terms that apply before making any commitment.'
    }
  ];

  return (
    <section className="w-full bg-[#050505] border-y border-white/[0.06] py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#C8AE7D] mb-2 flex items-center gap-2">
            <span className="w-2 h-0.5 bg-[#C8AE7D]" />
            THE GARAGEKINGS PROMISE
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-[#F4F1EC] tracking-tight">
            The Collector Standard.
          </h2>
          <p className="text-sm md:text-base text-[#A9A49C] mt-3 leading-relaxed">
            Built by collectors, for collectors. Clear information, direct conversation and no anonymous checkout flow.
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
