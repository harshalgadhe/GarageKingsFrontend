"use client"

import { forwardRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const BRANDS = [
  {
    name: 'Mini GT',
    dbValue: 'Mini GT',
    origin: 'TSM Model',
    style: '1:64 Premium',
    desc: 'Renowned for ultra-precise scaling, high-fidelity replication of modern GT racers, supercars, and premium factory road cars.',
    color: 'from-orange-500/10 to-transparent',
    glow: 'rgba(251,146,60,0.08)'
  },
  {
    name: 'Kaido House',
    dbValue: 'Kaido House',
    origin: 'Designed by Jun Imai',
    style: 'Custom JDM',
    desc: 'Widebody JDM masterpieces, retro styling, and opening hood details designed by Hot Wheels legend Jun Imai.',
    color: 'from-purple-500/10 to-transparent',
    glow: 'rgba(192,132,252,0.08)'
  },
  {
    name: 'Hot Wheels',
    dbValue: 'Hotwheels',
    origin: 'Mattel Premium',
    style: 'Classic & Pop Culture',
    desc: 'The gold standard of diecast. Real Riders rubber tires, premium metal-on-metal construction, and legendary street car castings.',
    color: 'from-amber-500/10 to-transparent',
    glow: 'rgba(251,191,36,0.08)'
  },
  {
    name: 'Takara Tomy',
    dbValue: 'Takara Tomy',
    origin: 'Tomica Premium',
    style: 'Japanese Craftsmanship',
    desc: 'Precision Japanese engineering featuring functional suspensions, opening parts, and extremely accurate Japanese domestic market casting lines.',
    color: 'from-blue-500/10 to-transparent',
    glow: 'rgba(96,165,250,0.08)'
  },
  {
    name: 'POP Race',
    dbValue: 'POP Race',
    origin: 'Boutique Racing',
    style: 'Modern GT & Rally',
    desc: 'Rising star in boutique diecast, featuring intricate engine details, opening parts, and iconic livery designs from worldwide motorsports.',
    color: 'from-emerald-500/10 to-transparent',
    glow: 'rgba(52,211,153,0.08)'
  },
  {
    name: 'Cool Car',
    dbValue: 'COOLCAR',
    origin: 'Boutique Castings',
    style: 'Limited Editions',
    desc: 'Exclusive, limited-run boutique diecasts showcasing custom tuner culture, unique paint finishes, and high collector appeal.',
    color: 'from-red-500/10 to-transparent',
    glow: 'rgba(248,113,113,0.08)'
  },
  {
    name: 'Solido',
    dbValue: 'Solido',
    origin: 'French Heritage since 1932',
    style: '1:18 & 1:64 Classics',
    desc: 'French model manufacturer renowned for opening doors, diecast bodies, and exceptional value-for-money classic and modern rally cars.',
    color: 'from-cyan-500/10 to-transparent',
    glow: 'rgba(6,182,212,0.08)'
  },
  {
    name: 'Flame',
    dbValue: 'Flame',
    origin: 'Boutique Performance',
    style: 'Premium Details',
    desc: 'Rising performance diecast specialist featuring high-end wheel rolls, authentic paints, and unique display presentations.',
    color: 'from-orange-600/10 to-transparent',
    glow: 'rgba(234,88,12,0.08)'
  }
]

const TechnicalArchive = forwardRef(function TechnicalArchive(props, ref) {
  const reduce = useReducedMotion()
  const navigate = useNavigate()

  return (
    <div ref={ref} id="archive" className="w-full bg-gk-black">
      {/* SECTION 3: THE BRANDS WE SELL */}
      <section className="relative w-full py-24 md:py-32 px-6 md:px-12 lg:px-16 border-t border-zinc-900 overflow-hidden bg-gk-black">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-40" />
        
        {/* Subtle orange ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gk-orange/5 rounded-full filter blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full relative z-10">
          {/* Header row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-zinc-900 pb-8 text-left w-full">
            <div>
              <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-gk-orange mb-3 block font-inter">
                OFFICIAL STOCKISTS &amp; PARTNERS
              </span>
              <h2 className="text-4xl sm:text-5xl md:text-6.5xl font-bold tracking-normal text-[#F7F7F7] uppercase leading-none font-grotesk">
                THE BRANDS WE<br />
                <span className="text-gk-gold">SELL</span>
              </h2>
            </div>
            
            <div className="text-left md:text-right max-w-xs">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">
                CURATED SELECTIONS
              </span>
              <p className="text-xs text-zinc-500 font-inter">
                Directly sourced from official global lines to ensure absolute authenticity and mint-condition packaging.
              </p>
            </div>
          </div>

          {/* Brands Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {BRANDS.map((brand, idx) => (
              <motion.div
                key={brand.dbValue}
                initial={reduce ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.6, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => navigate(`/marketplace?brand=${brand.dbValue}`)}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-950/40 p-8 flex flex-col justify-between min-h-[280px] cursor-pointer hover:border-white/10 hover:bg-zinc-900/40 transition-all duration-500 text-left"
              >
                {/* Background Brand Initials for high-end aesthetic */}
                <div className="absolute right-[-20px] bottom-[-20px] text-[120px] font-black text-white/[0.01] group-hover:text-white/[0.02] tracking-tighter select-none pointer-events-none transition-all duration-700 ease-out uppercase font-grotesk group-hover:scale-110">
                  {brand.name.substring(0, 2)}
                </div>

                {/* Spot-glow backdrop */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" 
                  style={{ background: `radial-gradient(circle at top right, ${brand.glow} 0%, transparent 65%)` }}
                />

                <div>
                  {/* Brand Meta */}
                  <div className="flex justify-between items-start gap-4 mb-6">
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500">
                        {brand.origin}
                      </span>
                      <h3 className="text-2xl font-bold tracking-tight text-[#F7F7F7] uppercase font-grotesk mt-1 group-hover:text-gk-orange transition-colors duration-300">
                        {brand.name}
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded bg-white/5 border border-white/5 text-zinc-400 group-hover:border-gk-orange/20 group-hover:text-white transition-all duration-500">
                      {brand.style}
                    </span>
                  </div>

                  {/* Brand Description */}
                  <p className="text-xs text-zinc-400 font-inter leading-relaxed max-w-[90%] group-hover:text-zinc-300 transition-colors duration-300">
                    {brand.desc}
                  </p>
                </div>

                {/* Action button */}
                <div className="pt-6 border-t border-zinc-900/60 mt-6 flex justify-between items-center w-full">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-white transition-colors duration-300">
                    View Catalog
                  </span>
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-zinc-500 group-hover:border-gk-orange group-hover:text-gk-orange transition-all duration-500">
                    <svg 
                      className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
})

export default TechnicalArchive
