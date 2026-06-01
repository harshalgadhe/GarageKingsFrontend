import { forwardRef, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { vaultProducts } from '../../data/content'

gsap.registerPlugin(ScrollTrigger)

// Helper function to dynamically curate premium collector tags for any car in the vault!
function getCollectorMetadata(name) {
  const lowercase = name.toLowerCase()
  if (lowercase.includes('skyline') || lowercase.includes('s15')) {
    return {
      brand: 'MINI GT',
      series: 'LBWK Performance',
      scale: '1:64',
      rarity: 'Ultra Rare',
      rarityColor: '#D4AF37', // Gold
      rarityBg: 'rgba(212, 175, 55, 0.1)'
    }
  } else if (lowercase.includes('muscle') || lowercase.includes('chevy') || lowercase.includes('silverado')) {
    return {
      brand: 'HOT WHEELS RLC',
      series: 'Red Line Club',
      scale: '1:64',
      rarity: 'Grail Chase',
      rarityColor: '#E10600', // Red
      rarityBg: 'rgba(225, 6, 0, 0.1)'
    }
  } else if (lowercase.includes('porsche') || lowercase.includes('turbo')) {
    return {
      brand: 'INNO64',
      series: 'Euro Touring',
      scale: '1:64',
      rarity: 'Limited Special',
      rarityColor: '#D9D9D9', // Silver
      rarityBg: 'rgba(217, 217, 217, 0.1)'
    }
  } else {
    return {
      brand: 'HOT WHEELS PREMIUM',
      series: 'Car Culture',
      scale: '1:64',
      rarity: 'Premium Pull',
      rarityColor: '#FFB300', // Yellow
      rarityBg: 'rgba(255, 179, 0, 0.1)'
    }
  }
}

const VaultShowcase = forwardRef(function VaultShowcase({ carouselCars = [] }, ref) {
  const containerRef = useRef(null)
  const scrollWrapperRef = useRef(null)
  const carouselRef = useRef(null)

  const activeCars = carouselCars && carouselCars.length > 0 ? carouselCars : vaultProducts

  useEffect(() => {
    const container = containerRef.current
    const carousel = carouselRef.current
    if (!container || !carousel) return

    let ctx = gsap.context(() => {
      const getScrollAmount = () => carousel.scrollWidth - window.innerWidth + 100

      gsap.to(carousel, {
        x: () => -getScrollAmount(),
        ease: 'none',
        scrollTrigger: {
          trigger: scrollWrapperRef.current,
          start: 'top top',
          end: () => `+=${getScrollAmount()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      })
    })

    return () => ctx.revert()
  }, [activeCars.length])

  return (
    <section 
      ref={(node) => {
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
        containerRef.current = node
      }} 
      id="vault" 
      className="relative w-full"
    >
      {/* Scroll Pinning Wrapper */}
      <div ref={scrollWrapperRef} className="h-screen w-full flex flex-col justify-start pt-24 md:pt-32 overflow-hidden bg-[#050505]">
        
        <div className="px-6 md:px-12 lg:px-16 w-full mb-8">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#E10600]">
              Featured Pulls
            </p>
            <h2 className="mt-3 text-4xl sm:text-5xl font-black italic tracking-tighter text-white md:text-7xl uppercase font-grotesk">
              The Vault
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#A1A1AA]">
              Macro-lit. Mint-documented. Hover over a casting to reveal its finish. Built for high-end shelf showcases.
            </p>
          </motion.div>
        </div>

        {/* Horizontal Scrolling Track */}
        <div 
          ref={carouselRef} 
          className="flex gap-8 px-6 md:px-12 lg:px-16 w-max pb-12"
        >
          {activeCars.map((product) => {
            const meta = getCollectorMetadata(product.name)
            return (
              <div 
                key={product.id || product.name} 
                className="relative w-[85vw] sm:w-[350px] md:w-[420px] h-[55vh] min-h-[460px] shrink-0 rounded-[2.5rem] border border-[#2A2A2A] bg-[#111111]/85 backdrop-blur-xl overflow-hidden group transition-all duration-500 hover:border-[#E10600]/40 hover:shadow-[0_25px_60px_rgba(0,0,0,0.95)]"
              >
                {/* Glossy gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/[0.015] pointer-events-none" />

                {/* Main Vehicle Image */}
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Brand Header Label (Top Left) */}
                <div className="absolute top-6 left-6 z-20">
                  <span className="text-[10px] font-black tracking-[0.25em] text-[#A1A1AA] uppercase">
                    {meta.brand}
                  </span>
                </div>

                {/* Rarity Tag (Top Right) */}
                <div className="absolute top-6 right-6 z-20">
                  <span 
                    className="inline-block px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded"
                    style={{ color: meta.rarityColor, backgroundColor: meta.rarityBg, border: `1px solid ${meta.rarityColor}22` }}
                  >
                    {meta.rarity}
                  </span>
                </div>

                {/* Bottom Details (Collector Stack) */}
                <div className="absolute bottom-0 left-0 w-full p-8 z-20 flex flex-col gap-4">
                  {/* Casting title */}
                  <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-wider text-white mb-1.5 font-grotesk group-hover:text-[#E10600] transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-semibold text-[#A1A1AA]">
                      <span>Series: {meta.series}</span>
                      <span>·</span>
                      <span>Scale: {meta.scale}</span>
                    </div>
                  </div>

                  {/* Price Row */}
                  <div className="flex justify-between items-center pt-4 border-t border-[#2A2A2A]">
                    <span className="text-sm font-semibold uppercase tracking-widest text-[#A1A1AA]">
                      Mint Valuation
                    </span>
                    <span className="text-xl font-black text-white font-sora tracking-tight">
                      {product.price || '₹1,499'}
                    </span>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
})

export default VaultShowcase
