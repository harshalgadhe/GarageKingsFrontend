"use client"

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { scrollToSection, useLenis } from '../../providers/SmoothScroll'

const springTransition = {
  type: "spring",
  stiffness: 100,
  damping: 22,
  mass: 0.9
}

const LookbookCover = forwardRef(function LookbookCover(props, ref) {
  const lenisRef = useLenis()

  const handleExplore = () => {
    scrollToSection(lenisRef, 'archive')
  }

  const handleCalendar = () => {
    scrollToSection(lenisRef, 'releases')
  }

  return (
    <section
      ref={ref}
      id="hero"
      className="relative min-h-[100dvh] w-full flex flex-col justify-center pt-24 pb-12 px-6 md:px-12 lg:px-16 overflow-hidden bg-transparent"
    >
      {/* Subtle spotlight glow behind text and car */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.015] rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 my-auto">
        
        {/* Left Column: Manifesto and Titles */}
        <div className="lg:col-span-6 flex flex-col items-start text-left">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 mb-6"
          >
            ISSUE 01 // THE CHASE
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-7xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.9] font-grotesk pb-2"
          >
            SPEED <br />
            STANCE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-500 to-white/20">MINT</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-8 text-sm md:text-base leading-relaxed text-zinc-400 max-w-[32ch] font-inter"
          >
            Die-cast is not a toy. It is a micro-stance culture. Direct, transparent acquisitions for verified collectors.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-10 flex flex-wrap gap-4 w-full sm:w-auto"
          >
            <motion.button
              onClick={handleExplore}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 rounded-xl bg-white hover:bg-zinc-100 text-black font-black uppercase tracking-wider text-xs transition-colors cursor-pointer"
            >
              Explore Archive
            </motion.button>
            
            <motion.button
              onClick={handleCalendar}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 rounded-xl bg-transparent border border-zinc-800 hover:border-zinc-500 text-white font-black uppercase tracking-wider text-xs transition-colors cursor-pointer"
            >
              Release Calendar
            </motion.button>
          </motion.div>
        </div>

        {/* Right Column: Layered Car Render with Outlined Typography */}
        <div className="lg:col-span-6 flex justify-center items-center w-full relative min-h-[320px] md:min-h-[480px]">
          
          {/* Outlined text sitting behind the car in z-0 */}
          <div className="absolute text-[16vw] lg:text-[18vw] font-black italic tracking-tighter text-zinc-900/40 select-none z-0 pointer-events-none font-grotesk uppercase leading-none right-0 translate-x-[5%] pb-4 lookbook-outline-text">
            R34
          </div>

          {/* Floating Sports Car Render with spring transitions */}
          <motion.div
            initial={{ opacity: 0, x: 80, rotate: 6, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, rotate: -2, scale: 1.05 }}
            transition={springTransition}
            whileHover={{ scale: 1.1, rotate: 0, y: -8 }}
            className="relative z-10 w-full max-w-[500px]"
          >
            <img
              src="/hotwheels-car.png"
              alt="Nissan Skyline GT-R R34"
              className="w-full h-auto object-contain filter drop-shadow-[0_30px_50px_rgba(0,0,0,0.95)] select-none pointer-events-none"
            />
          </motion.div>
        </div>

      </div>
    </section>
  )
})

export default LookbookCover
