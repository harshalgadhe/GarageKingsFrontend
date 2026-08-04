"use client"

import { forwardRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { scrollToSection, useLenis } from '../../providers/SmoothScroll'

const LookbookCover = forwardRef(function LookbookCover(props, ref) {
  const lenisRef = useLenis()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  
  // Parallax mapping for the hero visual image: 10-20px max shift
  const yParallax = useTransform(scrollY, [0, 1000], [0, -20])

  const handleExplore = () => {
    navigate('/marketplace')
  }

  const handleDrops = () => {
    scrollToSection(lenisRef, 'archive')
  }

  return (
    <div ref={ref} id="hero" className="gk-noise bg-gk-black w-full relative">
      
      {/* Subtle background grid */}
      <div className="absolute inset-0 gk-grid-floor opacity-[0.12] pointer-events-none z-0" />

      {/* SECTION 1: HERO (85-100vh) */}
      <section className="relative min-h-[100dvh] w-full flex flex-col justify-center pt-28 pb-16 px-6 md:px-12 lg:px-16 overflow-hidden z-10">
        
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center my-auto relative">
          
          {/* Left Column: Clear copy */}
          <motion.div className="lg:col-span-6 flex flex-col items-start text-left relative z-20" initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-gk-orange mb-6 block font-inter">
              GARAGEKINGS / PRIVATE COLLECTOR PLATFORM
            </span>
            
            <h1 className="text-6xl sm:text-7xl lg:text-8.5xl font-bold tracking-normal text-[#F7F7F7] uppercase leading-[0.88] font-grotesk">
              BUILT FOR THOSE<br />
              WHO NEVER<br />
              <span className="text-gk-gold">STOPPED COLLECTING.</span>
            </h1>
            
            <div className="mt-8 flex flex-col gap-2 max-w-[42ch]">
              <p className="text-sm md:text-base leading-relaxed text-[#F7F7F7] font-medium font-inter">
                A collector-led archive of exceptional automotive miniatures.
              </p>
              <p className="text-xs md:text-sm leading-relaxed text-[#A1A1A1] font-inter">
                Inspect every model, understand its condition, then speak directly with us on WhatsApp or Instagram.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-4 w-full sm:w-auto">
              <motion.button
                onClick={handleExplore}
                whileHover={{ scale: 1.01, y: -0.5 }}
                whileTap={{ scale: 0.99 }}
                className="px-8 py-4 rounded-xl bg-gk-orange hover:bg-gk-orange/90 text-gk-black font-bold uppercase tracking-wider text-xs transition-all duration-300 shadow-lg cursor-pointer"
              >
                Enter the Vault
              </motion.button>
              
              <motion.button
                onClick={handleDrops}
                whileHover={{ scale: 1.01, y: -0.5 }}
                whileTap={{ scale: 0.99 }}
                className="px-8 py-4 rounded-xl bg-transparent border border-zinc-800 hover:border-zinc-500 text-[#F7F7F7] font-bold uppercase tracking-wider text-xs transition-all duration-300 hover:bg-white/[0.01] cursor-pointer"
              >
                Explore the marques
              </motion.button>
            </div>
          </motion.div>

          {/* Right Column: Parallax Cinematic Hero Image */}
          <div className="lg:col-span-6 flex justify-center items-center w-full relative z-10">
            <motion.div
              style={{ y: reduce ? 0 : yParallax }}
              initial={reduce ? false : { opacity: 0, scale: 0.975, clipPath: 'inset(8% 0 8% 0)' }}
              animate={{ opacity: 1, scale: 1, clipPath: 'inset(0% 0 0% 0)' }}
              transition={{ duration: 1.05, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full aspect-[4/3] max-w-[580px] rounded-2xl border border-white/[0.03] bg-zinc-950/45 overflow-hidden shadow-[0_35px_80px_-25px_rgba(0,0,0,0.95)]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(216,198,163,0.06)_0%,transparent_75%)] pointer-events-none" />
              <img
                src="/luxury_hero.png"
                alt="Diecast collection under spotlight"
                className="w-full h-full object-cover select-none pointer-events-none scale-102 hover:scale-104 transition-transform duration-[1200ms] ease-out"
              />
            </motion.div>
          </div>

        </div>
      </section>

      {/* SECTION 2: BRAND STATEMENT (Max 40vh, Enormous typography, No distractions) */}
      <section className="relative w-full py-16 md:py-20 px-6 md:px-12 lg:px-16 border-t border-zinc-900 bg-[#090909] z-10 flex flex-col justify-center items-center text-center max-h-[40vh]">
        <div className="max-w-4xl mx-auto w-full flex flex-col items-center justify-center">
          <h2 className="text-4xl sm:text-6xl lg:text-7.5xl font-bold tracking-normal text-[#F7F7F7] uppercase leading-[0.95] font-grotesk max-w-4xl">
            NOT ANOTHER PRODUCT FEED.<br />
            <span className="text-gk-gold">A COLLECTION WITH A POINT OF VIEW.</span>
          </h2>
        </div>
      </section>

    </div>
  )
})

export default LookbookCover
