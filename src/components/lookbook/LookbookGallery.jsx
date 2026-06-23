"use client"

import { useEffect, useState, forwardRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getCars } from '../../lib/db'

const INSTAGRAM_URL = "https://www.instagram.com/garagekingsindia/"

const PREVIEW_MODELS = [
  {
    id: 'gtr-nissan',
    name: 'Nissan Skyline GT-R',
    brand: 'Mini GT',
    scale: '1:64',
    price: '₹4,999',
    image: '/vault-1.png'
  },
  {
    id: 'porsche-rsr',
    name: 'Porsche 934 Turbo RSR',
    brand: 'Inno64',
    scale: '1:64',
    price: '₹2,499',
    image: '/vault-4.png'
  },
  {
    id: 'gtr-liberwalk',
    name: 'Nissan GT-R Liberty Walk',
    brand: 'Mini GT',
    scale: '1:64',
    price: '₹1,500',
    image: '/vault-2.png'
  },
  {
    id: 's15-drift',
    name: 'Nissan Skyline 2000GT-X',
    brand: 'Mini GT',
    scale: '1:64',
    price: '₹8,999',
    image: '/vault-8.png'
  },
  {
    id: 'bronco-offroad',
    name: "'83 Chevy Silverado",
    brand: 'Hot Wheels Premium',
    scale: '1:64',
    price: '₹1,299',
    image: '/vault-5.png'
  },
  {
    id: 'camaro-1969',
    name: "'69 Ford Mustang Boss 302",
    brand: 'Hot Wheels Premium',
    scale: '1:64',
    price: '₹5,500',
    image: '/vault-6.png'
  },
  {
    id: 'mclaren-p1',
    name: 'Lamborghini Countach Pace Car',
    brand: 'Hot Wheels Premium',
    scale: '1:64',
    price: '₹3,200',
    image: '/vault-7.png'
  },
  {
    id: 'exotic-supercar',
    name: 'Silver Supercar',
    brand: 'Inno64',
    scale: '1:64',
    price: '₹1,899',
    image: '/vault-3.png'
  }
]

const TRUST_PILLARS = [
  {
    num: '01',
    title: 'AUTHENTICITY',
    body: 'Every model is carefully checked before being listed.'
  },
  {
    num: '02',
    title: 'TRUSTED TRANSACTIONS',
    body: 'Transparent and reliable purchases.'
  },
  {
    num: '03',
    title: 'COLLECTOR FIRST DELIVERY',
    body: 'Secure packaging designed for collectors.'
  }
]

const LookbookGallery = forwardRef(function LookbookGallery(props, ref) {
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const [models, setModels] = useState(PREVIEW_MODELS)

  useEffect(() => {
    getCars()
      .then(cars => {
        if (cars && cars.length > 0) {
          // Take the first 8 products for the preview grid
          const slice = cars.slice(0, 8)
          const mapped = slice.map(car => {
            const rawPrice = parseFloat(car.price)
            const formattedPrice = !isNaN(rawPrice) 
              ? `₹${rawPrice.toLocaleString('en-IN')}` 
              : (car.price || 'Price on request')

            return {
              id: car.id,
              name: car.name,
              brand: car.brand,
              scale: car.scale || '1:64',
              price: formattedPrice,
              image: car.image || '/vault-1.png'
            }
          })
          setModels(mapped)
        }
      })
      .catch(err => {
        console.error("Error fetching marketplace preview from backend:", err)
      })
  }, [])

  const handleOrder = (name) => {
    window.open(INSTAGRAM_URL, '_blank')
  }

  return (
    <div ref={ref} id="gallery" className="w-full bg-gk-black">
      
      {/* SECTION 4: MARKETPLACE PREVIEW */}
      <section className="relative w-full py-24 md:py-32 px-6 md:px-12 lg:px-16 border-t border-zinc-900 overflow-hidden bg-gk-black">
        <div className="max-w-7xl mx-auto w-full">
          
          {/* Section Header */}
          <div className="flex flex-col items-start gap-2 mb-16 border-b border-zinc-900 pb-8 text-left w-full">
            <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-gk-orange block font-inter">
              MODELS CURRENTLY IN STOCK.
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6.5xl font-bold tracking-normal text-[#F7F7F7] uppercase leading-[0.95] font-grotesk">
              MARKETPLACE<br />
              <span className="text-gk-gold">PREVIEW</span>
            </h2>
          </div>

          {/* Simple Grid (4 cols desktop, 2 cols tablet, 1 col mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
            {models.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.7, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="bg-[#151515] rounded-xl border border-white/[0.02] p-4 flex flex-col justify-between h-[310px] group hover:border-white/10 transition-all duration-500 relative overflow-hidden"
              >
                {/* Image Container: 70% of Card Height */}
                <div className="relative w-full h-[155px] bg-zinc-950/20 rounded-lg flex items-center justify-center overflow-hidden mb-4 shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950/10 via-transparent to-white/[0.01] pointer-events-none" />
                  <img
                    src={item.image}
                    alt={item.name}
                    className="max-h-[85%] max-w-[85%] object-contain filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.8)] select-none pointer-events-none scale-100 group-hover:scale-104 transition-transform duration-700 ease-out"
                  />
                </div>

                {/* Text Info & CTA */}
                <div className="flex flex-col justify-between flex-1 text-left">
                  <div>
                    <h4 className="text-sm font-bold tracking-normal uppercase text-[#F7F7F7] font-grotesk truncate block">
                      {item.name}
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-500 block mt-1">
                      {item.brand} • {item.scale}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-900/60">
                    <span className="text-xs font-bold text-gk-gold font-mono tracking-tight">{item.price}</span>
                    <div className="flex gap-2 items-center">
                      <button 
                        onClick={() => window.open("https://www.instagram.com/garagekingsindia/", '_blank')}
                        className="text-[9px] font-bold uppercase tracking-wider text-gk-orange hover:text-white transition-colors cursor-pointer"
                      >
                        Insta
                      </button>
                      <span className="text-zinc-700 text-[9px] select-none">•</span>
                      <button 
                        onClick={() => window.open("https://chat.whatsapp.com/EX1NbXHU63ZCQ4qhFVCubb", '_blank')}
                        className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                      >
                        WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* View More Option */}
          <div className="flex justify-center mt-14 w-full">
            <button
              onClick={() => navigate('/marketplace')}
              className="px-10 py-3.5 rounded-xl border border-zinc-800 hover:border-zinc-500 text-[#F7F7F7] font-bold uppercase tracking-wider text-xs transition-all duration-300 hover:bg-white/[0.02] cursor-pointer shadow-lg"
            >
              View More in Marketplace
            </button>
          </div>

        </div>
      </section>

      {/* SECTION 5: WHY COLLECTORS TRUST GARAGEKINGS */}
      <section className="relative w-full py-24 md:py-32 px-6 md:px-12 lg:px-16 border-t border-zinc-900 overflow-hidden bg-gk-black">
        <div className="max-w-7xl mx-auto w-full">
          
          <div className="max-w-3xl text-left mb-16">
            <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-gk-orange mb-3 block font-inter">
              ASSURANCE
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6.5xl font-bold tracking-normal text-[#F7F7F7] uppercase leading-none font-grotesk">
              WHY COLLECTORS TRUST<br />
              <span className="text-gk-gold">GARAGEKINGS</span>
            </h2>
          </div>

          {/* Three pillars layout - Typography led */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 items-start">
            {TRUST_PILLARS.map((pillar, idx) => (
              <motion.div
                key={pillar.title}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.8, delay: idx * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-start text-left group"
              >
                {/* Giant Numbers as visual anchors */}
                <span className="text-5xl sm:text-6xl md:text-7xl font-light font-grotesk text-zinc-800 tracking-tight leading-none mb-6 select-none group-hover:text-gk-orange/45 transition-colors duration-700">
                  {pillar.num}
                </span>
                
                <h3 className="text-xl font-bold tracking-normal text-[#F7F7F7] uppercase font-grotesk mb-3 leading-none">
                  {pillar.title}
                </h3>
                
                <p className="text-xs leading-relaxed text-[#A1A1A1] font-inter max-w-[36ch]">
                  {pillar.body}
                </p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

    </div>
  )
})

export default LookbookGallery
