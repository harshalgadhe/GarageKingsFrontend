import { useEffect, useState, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { WHATSAPP_URL } from '../../data/content'

// Helper function to query time differences to Friday 8:00 PM IST
function getNextDropTime() {
  const now = new Date()
  const currentDay = now.getDay() // 0 = Sunday, 5 = Friday, etc.
  
  // Calculate days until next Friday
  let daysUntilFriday = 5 - currentDay
  if (daysUntilFriday < 0 || (daysUntilFriday === 0 && now.getHours() >= 20)) {
    daysUntilFriday += 7
  }
  
  const nextFriday = new Date(now)
  nextFriday.setDate(now.getDate() + daysUntilFriday)
  nextFriday.setHours(20, 0, 0, 0) // 8:00 PM IST
  
  return Math.max(0, nextFriday.getTime() - now.getTime())
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

const ReleaseBoard = forwardRef(function ReleaseBoard(props, ref) {
  const [remaining, setRemaining] = useState(() => getNextDropTime())
  const [email, setEmail] = useState('')

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(getNextDropTime())
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const { days, hours, minutes, seconds } = formatCountdown(remaining)

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (email) {
      alert(`Success. Alerts registered for: ${email}`)
      setEmail('')
    }
  }

  return (
    <section
      ref={ref}
      id="releases"
      className="relative min-h-[100dvh] w-full py-28 md:py-36 px-6 md:px-12 lg:px-16 bg-transparent border-t border-zinc-800"
    >
      {/* Background glow highlights */}
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[500px] h-[300px] bg-gk-ice/[0.015] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto w-full h-full flex flex-col justify-center text-center my-auto">
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 mb-2 block">
          SPREAD 04 // HYPE CALENDAR
        </span>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black italic tracking-tighter text-white uppercase font-grotesk leading-none pb-2 mb-10">
          Release <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-400 to-white/30">Schedule</span>
        </h2>

        {/* Telemetry countdown block */}
        <div className="inline-block bg-zinc-900/20 border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 mb-16 shadow-[0_20px_50px_rgba(0,0,0,0.85)] max-w-2xl mx-auto w-full">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gk-ice block mb-6">
            // TELEMETRY COUNTDOWN: WEEKLY DROP
          </span>

          <div className="grid grid-cols-4 gap-4 md:gap-6 justify-center">
            {/* Days block */}
            <div className="flex flex-col items-center">
              <span className="text-4xl md:text-5xl font-black text-white font-sora tabular-nums">
                {String(days).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-mono uppercase text-zinc-500 tracking-widest mt-1">Days</span>
            </div>
            {/* Hours block */}
            <div className="flex flex-col items-center border-l border-zinc-800">
              <span className="text-4xl md:text-5xl font-black text-white font-sora tabular-nums">
                {String(hours).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-mono uppercase text-zinc-500 tracking-widest mt-1">Hours</span>
            </div>
            {/* Minutes block */}
            <div className="flex flex-col items-center border-l border-zinc-800">
              <span className="text-4xl md:text-5xl font-black text-white font-sora tabular-nums">
                {String(minutes).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-mono uppercase text-zinc-500 tracking-widest mt-1">Mins</span>
            </div>
            {/* Seconds block */}
            <div className="flex flex-col items-center border-l border-zinc-800">
              <span className="text-4xl md:text-5xl font-black text-white font-sora tabular-nums text-gk-ice drop-shadow-[0_0_10px_rgba(165,243,252,0.2)]">
                {String(seconds).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-mono uppercase text-zinc-500 tracking-widest mt-1">Secs</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-800 text-xs text-zinc-400 font-mono tracking-wider">
            FRIDAY · 8:00 PM IST · GRAIL ELITE BATCH
          </div>
        </div>

        {/* Email Alerts & WhatsApp Signup spreads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-3xl mx-auto w-full text-left">
          
          {/* Card 01: Clubhouse */}
          <div className="p-8 rounded-[2rem] border border-zinc-800 bg-zinc-900/10 flex flex-col justify-between items-start gap-6">
            <div>
              <h4 className="text-lg font-black italic uppercase text-white font-grotesk tracking-wide mb-2">
                WhatsApp Clubhouse
              </h4>
              <p className="text-xs leading-relaxed text-zinc-400 font-inter">
                Join our private collector room. Direct notifications, early teasers, and exclusive collector negotiations.
              </p>
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg border border-zinc-700 hover:border-zinc-400 text-white font-bold uppercase text-[10px] tracking-widest transition-colors font-mono cursor-pointer"
            >
              Enter Clubhouse
            </a>
          </div>

          {/* Card 02: Drop Alerts */}
          <div className="p-8 rounded-[2rem] border border-zinc-800 bg-zinc-900/10 flex flex-col justify-between items-start gap-6">
            <div>
              <h4 className="text-lg font-black italic uppercase text-white font-grotesk tracking-wide mb-2">
                Drop Notifications
              </h4>
              <p className="text-xs leading-relaxed text-zinc-400 font-inter">
                Receive catalog manifests 30 minutes before the live drop threshold. Never miss an STH or RLC chase release.
              </p>
            </div>
            
            <form onSubmit={handleSubscribe} className="w-full flex gap-2">
              <input
                type="email"
                required
                placeholder="Collector email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-white/20 rounded-lg px-3.5 py-3 text-xs text-white placeholder-zinc-700 focus:outline-none transition-colors font-mono"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-bold uppercase text-[10px] tracking-widest transition-colors font-mono cursor-pointer shrink-0"
              >
                Join
              </button>
            </form>
          </div>

        </div>

      </div>
    </section>
  )
})

export default ReleaseBoard
