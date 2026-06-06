import { forwardRef, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { scrollToSection, useLenis } from '../../providers/SmoothScroll'
import { getCurrentUser } from '../../lib/auth'
import { Link } from 'react-router-dom'

const HERO_SHOWCASE_VEHICLES = [
  {
    image: '/hotwheels-car.png',
    name: 'Nissan Skyline GT-R R34',
    brand: 'MINI GT',
    rarity: 'ULTRA RARE',
    series: 'Grail Division'
  },
  {
    image: '/vault-3.png',
    name: 'Porsche 934 Turbo RSR',
    brand: 'INNO64',
    rarity: 'LIMITED CHASE',
    series: 'Euro Speed'
  },
  {
    image: '/vault-4.png',
    name: "'83 Chevy Silverado",
    brand: 'HOT WHEELS PREMIUM',
    rarity: 'STH GRAIL',
    series: 'Truck Legends'
  }
]

const Hero = forwardRef(function Hero({ heroImages = [] }, ref) {
  const lenisRef = useLenis()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [user, setUser] = useState(null)

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

  // Preload showcase images
  useEffect(() => {
    HERO_SHOWCASE_VEHICLES.forEach(v => {
      const img = new Image()
      img.src = v.image
    })
  }, [])

  // Auto-scroll showcase every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % HERO_SHOWCASE_VEHICLES.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const currentVehicle = HERO_SHOWCASE_VEHICLES[currentIdx]

  return (
    <section
      ref={ref}
      id="hero"
      className="relative min-h-[100svh] w-full flex flex-col justify-between pt-32 pb-12 px-6 md:px-12 lg:px-16 overflow-hidden bg-[#050505]"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_70%_30%,rgba(225,6,0,0.06)_0%,transparent_60%)]" />

      {/* Main Split Screen Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full max-w-7xl mx-auto my-auto z-10">
        
        {/* Left Side: Brand Storytelling Stack */}
        <div className="lg:col-span-6 flex flex-col items-start text-left">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#E10600]/10 border border-[#E10600]/20 text-[#E10600] text-[10px] font-black uppercase tracking-[0.25em] mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#E10600] animate-pulse" />
            Enthusiast Clubhouse
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl font-black leading-[0.9] tracking-tighter text-white uppercase font-grotesk"
          >
            Build Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#D9D9D9] to-white/50">Dream</span> <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E10600] to-[#FF2A1A] drop-shadow-[0_0_30px_rgba(225,6,0,0.2)]">Garage</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-6 text-base md:text-lg leading-relaxed text-[#A1A1AA] max-w-lg font-inter"
          >
            {user 
              ? `Welcome back, Collector! View your garage collection, check your acquisition history, or secure upcoming drops.`
              : 'Discover rare Hot Wheels, Mini GT, Inno64 and collector-grade die-cast models curated for enthusiasts.'
            }
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-8 flex flex-wrap gap-4 w-full sm:w-auto"
          >
            {user ? (
              <Link
                to="/garage"
                className="px-8 py-4 rounded-xl bg-[#E10600] hover:bg-[#FF2A1A] text-white font-black uppercase tracking-wider text-xs transition-all shadow-[0_0_35px_rgba(225,6,0,0.3)] hover:shadow-[0_0_45px_rgba(255,42,26,0.55)] cursor-pointer flex items-center justify-center text-center"
              >
                Enter Your Garage
              </Link>
            ) : (
              <button
                onClick={() => scrollToSection(lenisRef, 'vault')}
                className="px-8 py-4 rounded-xl bg-[#E10600] hover:bg-[#FF2A1A] text-white font-black uppercase tracking-wider text-xs transition-all shadow-[0_0_35px_rgba(225,6,0,0.3)] hover:shadow-[0_0_45px_rgba(255,42,26,0.55)] cursor-pointer"
              >
                Explore Collection
              </button>
            )}
            <button
              onClick={() => scrollToSection(lenisRef, 'drop')}
              className="px-8 py-4 rounded-xl bg-[#111111] border border-[#2A2A2A] hover:border-white/20 text-white font-black uppercase tracking-wider text-xs transition-colors cursor-pointer"
            >
              View Limited Drops
            </button>
          </motion.div>
        </div>

        {/* Right Side: Featured Premium Spotlight Vehicle Showcase */}
        <div className="lg:col-span-6 flex justify-center items-center w-full relative min-h-[350px] md:min-h-[450px]">
          {/* Spotlight Glow Rings */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,6,0,0.1)_0%,transparent_60%)] pointer-events-none" />
          <div className="absolute w-80 h-80 rounded-full border border-white/5 bg-white/[0.01] blur-3xl pointer-events-none" />
          <div className="absolute w-64 h-64 rounded-full border border-[#E10600]/10 shadow-[0_0_80px_rgba(225,6,0,0.15)] animate-pulse pointer-events-none" />

          {/* Dynamic Swapping Card Surface */}
          <div className="relative w-full max-w-[420px] rounded-[2.5rem] border border-[#2A2A2A] bg-[#111111] p-8 shadow-[0_30px_70px_rgba(0,0,0,0.95)] overflow-hidden group">
            {/* Glossy Reflection Highlight */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#E10600]/5 via-transparent to-white/[0.02] pointer-events-none" />

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center"
              >
                {/* Vehicle Showcase Details header */}
                <div className="w-full flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] border border-[#D4AF37]/30 px-2.5 py-1 rounded bg-[#D4AF37]/5 font-grotesk">
                    {currentVehicle.rarity}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#A1A1AA]">
                    {currentVehicle.brand}
                  </span>
                </div>

                {/* Main Vehicle Image */}
                <div className="w-full h-48 md:h-56 relative flex items-center justify-center mb-6">
                  <img
                    src={currentVehicle.image}
                    alt={currentVehicle.name}
                    className="max-h-full max-w-full object-contain filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.7)] transform hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Title stack */}
                <div className="w-full text-center">
                  <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-wider text-white mb-1.5 font-grotesk">
                    {currentVehicle.name}
                  </h3>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#A1A1AA]">
                    Series: {currentVehicle.series} · 1:64
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
})

export default Hero

