"use client"

import { useState, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ... FEATURED_ITEMS code omitted for brevity ...
// We will target the export default block below.

const FEATURED_ITEMS = [
  {
    id: 'gtr-nissan',
    name: 'Nissan Skyline GT-R',
    brand: 'MINI GT',
    sku: 'MG-R34-B1',
    scale: '1:64',
    series: 'LBWK Performance',
    finish: 'Bayside Blue Metallic',
    grade: 'MIB (Mint in Box) · Sealed',
    price: '₹4,999',
    image: '/vault-1.png',
    bgTone: 'bg-zinc-950/30'
  },
  {
    id: 'porsche-rsr',
    name: 'Porsche 934 Turbo RSR',
    brand: 'INNO64',
    sku: 'IN-P934-W1',
    scale: '1:64',
    series: 'Euro Touring Masters',
    finish: 'Signal White / Livery',
    grade: 'Acrylic Case · Pristine Bubble',
    price: '₹2,499',
    image: '/vault-4.png',
    bgTone: 'bg-zinc-900/10'
  },
  {
    id: 'muscle-purple',
    name: 'RLC Purple Muscle',
    brand: 'HOT WHEELS RLC',
    sku: 'HW-RLC-M1',
    scale: '1:64',
    series: 'Red Line Club Premium',
    finish: 'Spectraflame Purple',
    grade: 'Blister Pack · Card Grade 9.5',
    price: '₹12,500',
    image: '/vault-2.png',
    bgTone: 'bg-zinc-950/50'
  }
]

const LookbookGallery = forwardRef(function LookbookGallery(props, ref) {
  const [activeIdx, setActiveIdx] = useState(0)
  const current = FEATURED_ITEMS[activeIdx]

  return (
    <section
      ref={ref}
      id="gallery"
      className="relative min-h-[100dvh] w-full py-28 md:py-36 px-6 md:px-12 lg:px-16 bg-transparent border-t border-zinc-800"
    >
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col justify-center my-auto">
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 mb-2 text-left">
          SPREAD 02 // SELECTED WORK
        </span>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black italic tracking-tighter text-white uppercase font-grotesk text-left mb-16 pb-2 leading-none">
          Featured <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-400 to-white/30">Castings</span>
        </h2>

        {/* 50/50 Split Spread Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Image Spread Container */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center w-full">
            <div className={`relative w-full aspect-[4/3] rounded-[2.5rem] border border-zinc-800 ${current.bgTone} p-8 flex items-center justify-center overflow-hidden transition-colors duration-500`}>
              <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950/20 via-transparent to-white/[0.01] pointer-events-none" />
              
              <AnimatePresence mode="wait">
                <motion.img
                  key={current.id}
                  src={current.image}
                  alt={current.name}
                  initial={{ opacity: 0, scale: 0.9, rotate: -4 }}
                  animate={{ opacity: 1, scale: 1.05, rotate: 1 }}
                  exit={{ opacity: 0, scale: 0.9, rotate: 4 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="max-h-[80%] max-w-[85%] object-contain filter drop-shadow-[0_25px_45px_rgba(0,0,0,0.85)] select-none pointer-events-none"
                />
              </AnimatePresence>
            </div>

            {/* Slider Navigation Dots */}
            <div className="flex gap-4 mt-8">
              {FEATURED_ITEMS.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 cursor-pointer ${
                    activeIdx === idx 
                      ? 'bg-white border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.4)]' 
                      : 'border-zinc-800 hover:border-zinc-500 hover:scale-105'
                  }`}
                  aria-label={`Show ${item.name}`}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Spec Data Panel */}
          <div className="lg:col-span-6 flex flex-col items-start text-left lg:pl-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full flex flex-col gap-6"
              >
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 block mb-1">
                    {current.brand} // SCALE {current.scale}
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-black italic tracking-wide text-white uppercase font-grotesk leading-none">
                    {current.name}
                  </h3>
                </div>

                {/* Technical Properties specs block */}
                <div className="w-full space-y-4 pt-6 border-t border-zinc-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 uppercase tracking-widest font-mono">SPEC SKU</span>
                    <span className="text-zinc-300 font-mono font-bold">{current.sku}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 uppercase tracking-widest font-mono">SERIES DECK</span>
                    <span className="text-zinc-300 font-bold">{current.series}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 uppercase tracking-widest font-mono">COLOR FINISH</span>
                    <span className="text-zinc-300 font-bold">{current.finish}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 uppercase tracking-widest font-mono">BOX CONDITION</span>
                    <span className="text-[#00C389] font-bold">{current.grade}</span>
                  </div>
                </div>

                {/* Pricing & Checkout actions */}
                <div className="w-full flex justify-between items-center pt-6 border-t border-zinc-800">
                  <div className="text-left">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">MINT EVALUATION</span>
                    <span className="text-2xl font-black text-white font-sora">{current.price}</span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => alert(`Catalog Item ${current.sku} reserved. Proceeding to direct checkout.`)}
                    className="px-8 py-4 rounded-xl bg-white hover:bg-zinc-100 text-black font-black uppercase tracking-wider text-xs transition-colors cursor-pointer"
                  >
                    Secure Casting
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  )
})

export default LookbookGallery
