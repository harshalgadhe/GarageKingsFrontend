"use client"

import { useRef, forwardRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

// ... SHOWCASE_ITEMS code omitted for brevity ...
// We will target the export default block below.

const SHOWCASE_ITEMS = [
  {
    id: 'nissan-skyline',
    name: 'Nissan Skyline GT-R R34',
    brand: 'MINI GT',
    series: 'Grail Division · Chase',
    scale: '1:64',
    price: '₹4,999',
    image: '/vault-1.png',
    glowColor: 'rgba(255, 85, 0, 0.45)', // Racing Orange
    textColor: 'text-[#FF5500]',
    bgGlow: 'from-[#FF5500]/10 to-transparent'
  },
  {
    id: 'porsche-934',
    name: 'Porsche 934 Turbo RSR',
    brand: 'INNO64',
    series: 'Euro Speed · Touring',
    scale: '1:64',
    price: '₹2,499',
    image: '/vault-4.png',
    glowColor: 'rgba(0, 150, 255, 0.45)', // Electric Blue
    textColor: 'text-[#0096FF]',
    bgGlow: 'from-[#0096FF]/10 to-transparent'
  },
  {
    id: 'gtr-liberty',
    name: 'Nissan GT-R Liberty Walk',
    brand: 'MINI GT',
    series: 'Liberty Walk · Matte Black',
    scale: '1:64',
    price: '₹1,500',
    image: '/vault-2.png',
    glowColor: 'rgba(255, 85, 0, 0.45)', // Orange
    textColor: 'text-[#ff5500]',
    bgGlow: 'from-[#ff5500]/10 to-transparent'
  }
]

const CollectorShelfShowcase = forwardRef(function CollectorShelfShowcase(props, ref) {
  const containerRef = useRef(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  })

  // Map scroll progress to each showcase item's animations
  // Each item occupies roughly a 33% scroll window.
  // Item 0: Active in [0, 0.33]
  // Item 1: Active in [0.33, 0.66]
  // Item 2: Active in [0.66, 1.0]

  return (
    <div ref={(node) => {
      containerRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    }} className="relative h-[300vh] w-full bg-zinc-950/20 z-10">
      {/* Sticky viewport container */}
      <div className="sticky top-0 h-[100dvh] w-full flex flex-col justify-center overflow-hidden">
        
        {/* Ambient back lighting that changes opacity with scroll */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,179,0,0.02)_0%,transparent_60%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 w-full h-full flex items-center grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
          
          {/* Left Side: Dynamic Text Panel */}
          <div className="lg:col-span-5 flex flex-col justify-center items-start text-left relative min-h-[300px] md:min-h-[400px]">
            <div className="w-full">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FFB300] block mb-2 font-grotesk">
                GRAIL SHOWCASE
              </span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black italic tracking-tighter text-white uppercase font-grotesk mb-4">
                The Showcase <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-400 to-white/30">Shelves</span>
              </h2>
              <p className="text-[#A1A1AA] text-sm md:text-base leading-relaxed mb-8 max-w-md font-inter">
                Scroll to slide our rarest verified acquisitions onto the telemetry shelf. Grade-verified acrylic condition checking.
              </p>
            </div>

            {/* Overlapping Text Blocks with scroll transitions */}
            <div className="relative w-full h-44 overflow-hidden">
              {SHOWCASE_ITEMS.map((item, index) => {
                // Determine active ranges for transitions
                const start = index * 0.33
                const end = (index + 1) * 0.33
                const peak = start + 0.165

                // Smoothly fade in/out and translate Y
                const opacity = useTransform(
                  scrollYProgress,
                  [start - 0.08, start, peak, end, end + 0.08],
                  [0, 1, 1, 0, 0]
                )
                const y = useTransform(
                  scrollYProgress,
                  [start - 0.08, start, peak, end, end + 0.08],
                  [15, 0, 0, -15, -15]
                )

                return (
                  <motion.div
                    key={item.id}
                    style={{ opacity, y }}
                    className="absolute inset-0 flex flex-col items-start justify-start text-left pointer-events-none"
                  >
                    <div className="flex gap-3 mb-2 items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2 py-0.5 rounded border border-white/10 bg-white/5">
                        {item.scale}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${item.textColor}`}>
                        {item.brand}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black italic tracking-wide text-white uppercase mb-1 font-grotesk">
                      {item.name}
                    </h3>
                    <p className="text-xs text-[#A1A1AA] uppercase tracking-wider mb-4 font-inter">
                      {item.series}
                    </p>

                    <div className="flex items-center gap-6 pt-3 border-t border-white/5 w-full">
                      <div className="text-left">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                          EST. MARKET PRICE
                        </span>
                        <span className="text-xl font-black text-white font-sora">
                          {item.price}
                        </span>
                      </div>
                      <span className="text-[9px] font-black text-[#00C389] px-2 py-1 rounded bg-[#00C389]/10 border border-[#00C389]/20 tracking-wider font-grotesk uppercase">
                        VERIFIED MINT
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Right Side: The Glass Display Shelf and sliding Car images */}
          <div className="lg:col-span-7 w-full flex flex-col items-center justify-center relative min-h-[350px] md:min-h-[480px]">
            
            {/* Visual Backplate Grid */}
            <div className="absolute w-[450px] h-[350px] bg-gradient-to-tr from-white/[0.01] to-transparent border border-white/5 rounded-[2.5rem] pointer-events-none z-0" />

            {/* Car Placement and Transforms */}
            <div className="relative w-full max-w-[500px] h-64 flex items-center justify-center z-10 mb-8">
              {SHOWCASE_ITEMS.map((item, index) => {
                const start = index * 0.33
                const end = (index + 1) * 0.33
                const peak = start + 0.165

                // Car drives in from the right (+250px) to center (0) and out to left (-250px)
                const x = useTransform(
                  scrollYProgress,
                  [start - 0.12, start, peak, end, end + 0.12],
                  [250, 0, 0, -250, -250]
                )
                // Opacity fades in and out
                const opacity = useTransform(
                  scrollYProgress,
                  [start - 0.12, start, peak, end, end + 0.12],
                  [0, 1, 1, 0, 0]
                )
                // Car tilts slightly during transition for a "sliding drift" effect
                const rotate = useTransform(
                  scrollYProgress,
                  [start - 0.12, start, peak, end, end + 0.12],
                  [4, 0, 0, -4, -4]
                )
                // Interactive scaling for focus effect
                const scale = useTransform(
                  scrollYProgress,
                  [start - 0.12, start, peak, end, end + 0.12],
                  [0.9, 1.05, 1.05, 0.9, 0.9]
                )

                // Neon underglow reflecting on the shelf
                const underglowOpacity = useTransform(
                  scrollYProgress,
                  [start - 0.05, start, peak, end, end + 0.05],
                  [0, 0.95, 0.95, 0, 0]
                )

                return (
                  <div key={item.id} className="absolute inset-0 flex items-center justify-center">
                    {/* Glowing underlight blur backing */}
                    <motion.div
                      style={{ opacity: underglowOpacity }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-32 blur-3xl pointer-events-none rounded-full"
                      style={{ backgroundColor: item.glowColor, opacity: underglowOpacity }}
                    />

                    {/* Realistic Car Image with transforms */}
                    <motion.img
                      src={item.image}
                      alt={item.name}
                      style={{ x, opacity, rotate, scale }}
                      className="max-h-[170px] max-w-[85vw] object-contain filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)] select-none pointer-events-none"
                    />
                  </div>
                )
              })}
            </div>

            {/* The Glass Shelf representation */}
            <div className="relative w-full max-w-[480px] h-10 z-20 flex justify-center">
              {/* Telemetry lights embedded in the shelf */}
              <div className="absolute inset-x-10 -top-1 h-[2px] bg-gradient-to-r from-transparent via-[#FFB300]/40 to-transparent blur-[1px]" />
              
              {/* Glossy Shelf Surface */}
              <div className="w-full h-full rounded-full border border-white/10 bg-zinc-900/40 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_15px_30px_rgba(0,0,0,0.95)] flex items-center justify-between px-6">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00C389] animate-pulse" />
                <div className="text-[8px] font-black uppercase tracking-[0.25em] text-white/50 font-grotesk">
                  ACRYLIC SHELF STATUS: LOCKED
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#00C389] animate-pulse" />
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
})

export default CollectorShelfShowcase
