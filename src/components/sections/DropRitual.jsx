import { forwardRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { footerCopy } from '../../data/content'

function getNextDropTime(targetDateStr, targetTimeStr) {
  if (!targetDateStr) return 0
  const now = new Date()
  const timeStr = `${targetTimeStr}:00`
  const target = new Date(`${targetDateStr}T${timeStr}+05:30`)
  
  if (target.getTime() > now.getTime()) {
    return target.getTime() - now.getTime()
  }
  return 0
}

function formatCountdown(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  }
}

function TimeBlock({ value, label }) {
  return (
    <div className="flex min-w-[5rem] flex-col items-center rounded-2xl border border-[#2A2A2A] bg-[#181818] px-5 py-4 md:min-w-[6rem] md:px-7 md:py-5 shadow-[0_15px_30px_rgba(0,0,0,0.6)]">
      <span className="text-3xl font-black tabular-nums text-[#FFB300] md:text-5xl font-sora tracking-tight">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#A1A1AA]">
        {label}
      </span>
    </div>
  )
}

const DropRitual = forwardRef(function DropRitual({ dropSettings }, ref) {
  const dateStr = dropSettings?.dropDate || new Date().toISOString().split('T')[0]
  const timeStr = dropSettings?.dropTime || '20:00'
  const label = dropSettings?.dropLabel || 'Friday · 8:00 PM IST'
  const desc = dropSettings?.dropDesc || 'Every Friday at 8 PM IST, we release a fresh batch of 1:64 heat. The rarest pieces usually go in minutes.'

  const [remaining, setRemaining] = useState(() => getNextDropTime(dateStr, timeStr))

  useEffect(() => {
    const id = setInterval(() => setRemaining(getNextDropTime(dateStr, timeStr)), 1000)
    return () => clearInterval(id)
  }, [dateStr, timeStr])

  const { days, hours, minutes, seconds } = formatCountdown(remaining)

  return (
    <section ref={ref} id="drop" className="relative z-20 py-28 md:py-36 bg-[#050505] border-t border-[#2A2A2A]">
      
      {/* 1. Limited Drops section */}
      <div className="px-6 md:px-12 lg:px-16 max-w-4xl mx-auto flex flex-col items-center text-center">
        
        {/* Drop Rarity Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#FFB300]/10 border border-[#FFB300]/20 text-[#FFB300] text-[10px] font-black uppercase tracking-[0.25em] mb-6 font-grotesk"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFB300]" />
          DROP SERIES: STH & RLC ELITE
        </motion.div>

        <motion.h2
          className="text-4xl sm:text-5xl font-black italic tracking-tighter text-white md:text-6xl uppercase font-grotesk"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          Don&apos;t Miss the Drop
        </motion.h2>

        <motion.p
          className="mt-6 max-w-lg text-sm md:text-base leading-relaxed text-[#A1A1AA]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {desc}
        </motion.p>

        {/* Dynamic Sora Countdown widget */}
        <motion.div
          className="mt-12 flex flex-wrap justify-center gap-4 md:gap-6"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <TimeBlock value={days} label="Days" />
          <TimeBlock value={hours} label="Hours" />
          <TimeBlock value={minutes} label="Min" />
          <TimeBlock value={seconds} label="Sec" />
        </motion.div>

        <motion.p className="mt-8 text-sm font-black uppercase tracking-widest text-[#FFB300] font-grotesk">
          {label}
        </motion.p>

        <motion.a
          href="https://instagram.com/garagekingsindia"
          target="_blank"
          rel="noopener noreferrer"
          className="gk-btn-primary mt-10 px-10 py-4.5 text-xs md:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 rounded-xl cursor-pointer"
          whileTap={{ scale: 0.98 }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18">
            <defs>
              <radialGradient id="ig-grad" r="1.5" cx="0.3" cy="1.07" >
                <stop offset="0" stopColor="#fdf497" />
                <stop offset="0.05" stopColor="#fdf497" />
                <stop offset="0.45" stopColor="#fd5949" />
                <stop offset="0.6" stopColor="#d6249f" />
                <stop offset="0.9" stopColor="#285AEB" />
              </radialGradient>
            </defs>
            <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm3.98-10.322a1.44 1.44 0 1 0-2.881.001 1.44 1.44 0 0 0 2.88-.001z"/>
          </svg>
          Follow us on Instagram
        </motion.a>
        <p className="mt-4 text-xs text-[#A1A1AA]">Join the WhatsApp Clubhouse Clubhouse clubhouse clubhouse for real-time notification drops.</p>
      </div>

      {/* 2. Expanded Professional Collector Footer */}
      <footer className="mt-28 border-t border-[#2A2A2A] px-6 md:px-12 lg:px-16 pt-16 max-w-7xl mx-auto text-left">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Logo & Corporate Copy Block */}
          <div className="md:col-span-4 flex flex-col items-start gap-5">
            <div className="flex items-center gap-3">
              <img
                src="/brand-logo.png"
                alt="Garage Kings"
                className="h-12 w-12 rounded-full object-cover ring-1 ring-gk-yellow/20 shadow-[0_0_15px_rgba(255,179,0,0.15)]"
              />
              <div>
                <h4 className="text-base font-black text-white font-grotesk">{BRAND.name}</h4>
                <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-gk-yellow mt-0.5">India&apos;s Collector Hub</span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-[#A1A1AA] max-w-xs">{footerCopy.transparency}</p>
            <p className="text-xs leading-relaxed text-[#A1A1AA] max-w-xs">{footerCopy.returns}</p>
            <p className="text-[10px] text-white/30 mt-4">
              © {new Date().getFullYear()} Garage Kings India. All Rights Reserved.
            </p>
          </div>
          
          {/* Quick Links Column */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <h5 className="text-xs font-black uppercase tracking-[0.2em] text-white font-grotesk">Platforms</h5>
            <ul className="flex flex-col gap-2.5 text-xs text-[#A1A1AA]">
              <li><a href="#vault" className="hover:text-[#E10600] transition-colors">The Vault</a></li>
              <li><a href="/marketplace" className="hover:text-[#E10600] transition-colors">Marketplace</a></li>
              <li><a href="/auctions" className="hover:text-[#E10600] transition-colors">Live Auctions</a></li>
              <li><a href="#garage" className="hover:text-[#E10600] transition-colors">Collector Garage</a></li>
            </ul>
          </div>

          {/* Brands / Lanes Column */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <h5 className="text-xs font-black uppercase tracking-[0.2em] text-white font-grotesk">Collections</h5>
            <ul className="flex flex-col gap-2.5 text-xs text-[#A1A1AA]">
              <li><a href="#lanes" className="hover:text-[#E10600] transition-colors">JDM Legends</a></li>
              <li><a href="#lanes" className="hover:text-[#E10600] transition-colors">The Grail Room</a></li>
              <li><a href="#lanes" className="hover:text-[#E10600] transition-colors">Red Line Club</a></li>
              <li><a href="#lanes" className="hover:text-[#E10600] transition-colors">Super Treasure Hunts</a></li>
            </ul>
          </div>

          {/* Connect & Clubhouse Column */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <h5 className="text-xs font-black uppercase tracking-[0.2em] text-white font-grotesk">Join the Clubhouse</h5>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Subscribe for rare casting drops & unboxing alerts.
            </p>
            <div className="flex w-full gap-2 mt-2">
              <input
                type="email"
                placeholder="Enter collector email..."
                className="w-full bg-[#181818] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E10600] transition-colors font-inter"
              />
              <button
                type="button"
                onClick={() => alert("Subscribed! Unboxing alerts successfully enabled.")}
                className="px-5 py-3 rounded-xl bg-[#E10600] hover:bg-[#FF2A1A] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                Join
              </button>
            </div>
            
            {/* Social icons layout */}
            <div className="flex gap-4 mt-4">
              <a href="https://instagram.com/garagekingsindia" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-[#E10600]/30 hover:bg-[#E10600]/5 text-white/60 hover:text-white transition-all">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="https://youtube.com/@garagekingsindia" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-[#E10600]/30 hover:bg-[#E10600]/5 text-white/60 hover:text-white transition-all">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                </svg>
              </a>
            </div>
          </div>

        </div>
      </footer>
    </section>
  )
})

export default DropRitual
