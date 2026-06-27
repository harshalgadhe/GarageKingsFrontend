"use client"

import { useEffect, useState, forwardRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { getCars } from '../../lib/db'

const INSTAGRAM_URL = "https://www.instagram.com/garagekingsindia/"

const WEEK_DROPS = [
  {
    id: 's15-drift',
    name: 'Nissan Skyline H/T 2000GT-X',
    brand: 'Mini GT',
    scale: '1:64',
    finish: 'Granite Silver Chase',
    price: '₹8,999',
    image: '/vault-8.png',
    bgTone: 'bg-zinc-950/40',
    colorGlow: 'rgba(216,198,163,0.06)',
    description: "New arrival added this week. Sourced in original factory condition with standard packaging."
  },
  {
    id: 'camaro-1969',
    name: "'69 Ford Mustang Boss 302",
    brand: 'Hot Wheels Premium',
    scale: '1:64',
    finish: 'Grabber Yellow',
    price: '₹5,500',
    image: '/vault-6.png',
    bgTone: 'bg-zinc-950/20',
    colorGlow: 'rgba(225,91,44,0.04)'
  },
  {
    id: 'bronco-offroad',
    name: "'83 Chevy Silverado",
    brand: 'Hot Wheels Premium',
    scale: '1:64',
    finish: 'Spectraflame Red',
    price: '₹1,299',
    image: '/vault-5.png',
    bgTone: 'bg-zinc-950/30',
    colorGlow: 'rgba(239,68,68,0.03)'
  },
  {
    id: 'exotic-supercar',
    name: 'Silver Supercar',
    brand: 'Inno64',
    scale: '1:64',
    finish: 'Liquid Metal Silver',
    price: '₹1,899',
    image: '/vault-3.png',
    bgTone: 'bg-zinc-950/20',
    colorGlow: 'rgba(161,161,161,0.03)'
  }
]

const TechnicalArchive = forwardRef(function TechnicalArchive(props, ref) {
  const reduce = useReducedMotion()
  const [drops, setDrops] = useState(WEEK_DROPS)

  useEffect(() => {
    getCars()
      .then(cars => {
        if (cars && cars.length > 0) {
          const filtered = cars.filter(car => 
            car.tags && (car.tags.includes('drop') || car.tags.includes('weekly-drop'))
          )
          if (filtered.length > 0) {
            const GLOWS = [
              'rgba(216,198,163,0.06)',
              'rgba(225,91,44,0.04)',
              'rgba(239,68,68,0.03)',
              'rgba(161,161,161,0.03)'
            ]
            const mapped = filtered.map((car, idx) => {
              const rawPrice = parseFloat(car.price)
              const formattedPrice = !isNaN(rawPrice) 
                ? `₹${rawPrice.toLocaleString('en-IN')}` 
                : (car.price || 'Price on request')

              return {
                id: car.id,
                name: car.name,
                brand: car.brand,
                scale: car.scale || '1:64',
                finish: car.finish || car.grade || car.lane || 'Standard Finish',
                price: formattedPrice,
                image: car.image || '/vault-1.png',
                bgTone: 'bg-zinc-950/30',
                colorGlow: GLOWS[idx % GLOWS.length],
                description: car.description || "New arrival added this week. Sourced in original factory condition."
              }
            })
            setDrops(mapped)
          }
        }
      })
      .catch(err => {
        console.error("Error fetching drop products from backend:", err)
      })
  }, [])

  const handleOrder = () => {
    window.open(INSTAGRAM_URL, '_blank')
  }

  return (
    <div ref={ref} id="archive" className="w-full bg-gk-black">
      
      {/* SECTION 3: THIS WEEK'S DROP */}
      <section className="relative w-full py-24 md:py-32 px-6 md:px-12 lg:px-16 border-t border-zinc-900 overflow-hidden bg-gk-black">
        <div className="max-w-7xl mx-auto w-full">
          
          {/* Header row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-zinc-900 pb-8 text-left w-full">
            <div>
              <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-gk-orange mb-3 block font-inter">
                NEW DIECASTS AVAILABLE
              </span>
              <h2 className="text-4xl sm:text-5xl md:text-6.5xl font-bold tracking-normal text-[#F7F7F7] uppercase leading-none font-grotesk">
                THIS WEEK'S<br />
                <span className="text-gk-gold">DROP</span>
              </h2>
            </div>
            
            <div className="text-left md:text-right">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block">
                NEW ARRIVALS
              </span>
            </div>
          </div>

          {/* Magazine Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Column: Large Dominating Featured Drop */}
            {drops[0] && (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="lg:col-span-7 col-span-12 p-2 relative overflow-hidden group text-left w-full"
              >
                {/* Big Image Container with spotlight glow */}
                <div className={`relative w-full aspect-[4/3] rounded-2xl border border-white/[0.02] bg-[#111111] p-8 flex items-center justify-center overflow-hidden mb-6 shadow-[0_20px_45px_-10px_rgba(0,0,0,0.9)]`}>
                  <div 
                    className="absolute inset-0 opacity-70 group-hover:opacity-100 transition-opacity duration-[1200ms] pointer-events-none" 
                    style={{ background: `radial-gradient(circle at center, ${drops[0].colorGlow} 0%, transparent 65%)` }}
                  />
                  <motion.img
                    src={drops[0].image}
                    alt={drops[0].name}
                    className="max-h-[90%] max-w-[90%] object-contain filter drop-shadow-[0_25px_40px_rgba(0,0,0,0.9)] select-none pointer-events-none scale-102 group-hover:scale-105 group-hover:-translate-y-2 transition-transform duration-[1200ms] ease-out"
                  />
                </div>

                {/* Typography info */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 text-left pb-4 mb-4">
                  <div>
                    <h3 className="text-3xl sm:text-4xl font-bold tracking-normal text-[#F7F7F7] uppercase font-grotesk leading-tight">
                      {drops[0].name}
                    </h3>
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 block mt-1.5">
                      {drops[0].brand} • {drops[0].scale} • {drops[0].finish}
                    </span>
                  </div>
                  <div className="md:text-right shrink-0">
                    <span className="text-2xl font-bold text-gk-gold font-mono tracking-tight">{drops[0].price}</span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center pt-4 border-t border-zinc-900/60">
                  <div className="text-left font-inter text-xs text-zinc-500 max-w-[40ch]">
                    {drops[0].description}
                  </div>
                  <div className="flex flex-wrap gap-3 w-full md:w-auto shrink-0">
                    <button
                      onClick={() => window.open("https://www.instagram.com/garagekingsindia/", '_blank')}
                      className="px-6 py-3.5 rounded-xl bg-gk-orange hover:bg-orange-500 text-black font-black uppercase tracking-wider text-xs transition-all duration-300 cursor-pointer shadow-lg flex items-center gap-2"
                    >
                      Instagram DM
                    </button>
                    <button
                      onClick={() => window.open("https://chat.whatsapp.com/EX1NbXHU63ZCQ4qhFVCubb", '_blank')}
                      className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider text-xs transition-all duration-300 cursor-pointer shadow-lg flex items-center gap-2"
                    >
                      WhatsApp Community
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Right Column: 3 Supporting Drops (Borderless list format) */}
            <div className="lg:col-span-5 col-span-12 flex flex-col gap-8 w-full">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500 font-inter text-left border-b border-zinc-900 pb-2 block">
                SUPPORTING MODELS
              </span>
              
              {drops.slice(1).map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={reduce ? false : { opacity: 0, x: 25 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between group transition-all duration-700 text-left bg-white/[0.01] sm:bg-transparent border border-white/5 sm:border-none p-4 sm:p-0 rounded-2xl sm:rounded-none"
                >
                  <div className="flex gap-4 items-center flex-1 min-w-0 w-full">
                    {/* Small Image */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-white/[0.02] bg-[#111111] p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                      <div 
                        className="absolute inset-0 opacity-50 group-hover:opacity-85 transition-opacity duration-700 pointer-events-none" 
                        style={{ background: `radial-gradient(circle at center, ${item.colorGlow} 0%, transparent 70%)` }}
                      />
                      <img
                        src={item.image}
                        alt={item.name}
                        className="max-h-[90%] max-w-[90%] object-contain filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.8)] select-none pointer-events-none group-hover:scale-104 group-hover:-translate-y-1 transition-transform duration-700 ease-out"
                      />
                    </div>

                    {/* Info details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base sm:text-lg font-bold tracking-normal text-[#F7F7F7] uppercase font-grotesk leading-tight truncate block">
                        {item.name}
                      </h4>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block mt-1">
                        {item.brand} • {item.scale} • {item.finish}
                      </span>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="w-full sm:w-auto text-left sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 border-t border-white/5 sm:border-none pt-3 sm:pt-0">
                    <span className="text-base sm:text-sm font-bold text-gk-gold font-mono tracking-tight">{item.price}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open("https://www.instagram.com/garagekingsindia/", '_blank')}
                        className="px-3 py-2 sm:px-2 sm:py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-500 text-[#F7F7F7] font-bold uppercase tracking-wider text-[9px] sm:text-[8px] transition-all duration-300 hover:bg-white/[0.01] cursor-pointer"
                        title="Order via Instagram DM"
                      >
                        Instagram
                      </button>
                      <button
                        onClick={() => window.open("https://chat.whatsapp.com/EX1NbXHU63ZCQ4qhFVCubb", '_blank')}
                        className="px-3 py-2 sm:px-2 sm:py-1.5 rounded-lg border border-emerald-800/60 hover:border-emerald-500 text-emerald-400 font-bold uppercase tracking-wider text-[9px] sm:text-[8px] transition-all duration-300 hover:bg-emerald-500/5 cursor-pointer"
                        title="Join WhatsApp"
                      >
                        WhatsApp
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>

        </div>
      </section>

    </div>
  )
})

export default TechnicalArchive
