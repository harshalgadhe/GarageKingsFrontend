"use client"

import { useEffect, useState, forwardRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { getPublicSettings } from '../../lib/db'

// Helper function to resolve target countdown time from backend settings
function getTargetTime(settings) {
  if (settings && settings.dropDate) {
    const timeStr = settings.dropTime || '21:00'
    const target = new Date(`${settings.dropDate}T${timeStr}:00+05:30`)
    if (!isNaN(target.getTime())) {
      return target.getTime()
    }
  }

  // Fallback to next Friday 9:00 PM IST (21:00)
  const now = new Date()
  const currentDay = now.getDay() // 0 = Sunday, 5 = Friday, etc.
  let daysUntilFriday = 5 - currentDay
  if (daysUntilFriday < 0 || (daysUntilFriday === 0 && now.getHours() >= 21)) {
    daysUntilFriday += 7
  }
  
  const nextFriday = new Date(now)
  nextFriday.setDate(now.getDate() + daysUntilFriday)
  nextFriday.setHours(21, 0, 0, 0)
  
  return nextFriday.getTime()
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
  const reduce = useReducedMotion()
  const [settings, setSettings] = useState({
    dropLabel: 'Friday • 9 PM IST',
    dropDesc: 'Next Curated Drop Countdown'
  })
  const [targetTime, setTargetTime] = useState(() => getTargetTime(null))
  const [remaining, setRemaining] = useState(() => Math.max(0, targetTime - Date.now()))

  useEffect(() => {
    getPublicSettings().then(data => {
      if (data) {
        setSettings(prev => ({
          ...prev,
          ...data,
          dropLabel: data.dropLabel || 'Friday • 9 PM IST',
          dropDesc: data.dropDesc || 'Next Curated Drop Countdown'
        }))
        const t = getTargetTime(data)
        setTargetTime(t)
        setRemaining(Math.max(0, t - Date.now()))
      }
    }).catch(err => {
      console.error("Error loading release board settings from backend:", err)
    })
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, targetTime - Date.now()))
    }, 1000)
    return () => clearInterval(id)
  }, [targetTime])

  const { days, hours, minutes, seconds } = formatCountdown(remaining)

  return (
    <div ref={ref} id="releases" className="w-full bg-gk-black">

      {/* SECTION 6: UPCOMING RELEASE (Countdown timer only) */}
      <section className="relative w-full py-28 md:py-36 px-6 md:px-12 lg:px-16 border-t border-zinc-900 overflow-hidden bg-gk-black text-center flex flex-col justify-center items-center z-10">
        <div className="max-w-2xl mx-auto w-full text-center">
          
          <div className="gk-noise gk-metal-highlight inline-block p-8 md:p-12 rounded-2xl border border-white/[0.02] bg-[#111111]/80 shadow-[0_30px_70px_rgba(0,0,0,0.95)] w-full text-center">
            
            <div className="flex flex-col items-center justify-center text-center gap-1.5 mb-8">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gk-orange font-bold">
                NEXT DROP
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-normal uppercase text-white font-grotesk leading-none mt-1">
                {settings.dropLabel}
              </h3>
              <p className="text-sm font-medium text-gk-gold font-inter mt-1.5">
                {settings.dropDesc}
              </p>
            </div>

            {/* Live Countdown numbers */}
            <div className="grid grid-cols-4 gap-4 md:gap-6 justify-center">
              <div className="flex flex-col items-center">
                <span className="text-4xl md:text-5xl font-bold text-[#F7F7F7] font-mono tracking-tight tabular-nums leading-none">
                  {String(days).padStart(2, '0')}
                </span>
                <span className="text-[8px] font-mono uppercase text-zinc-500 tracking-widest mt-2 block">Days</span>
              </div>
              <div className="flex flex-col items-center border-l border-zinc-900">
                <span className="text-4xl md:text-5xl font-bold text-[#F7F7F7] font-mono tracking-tight tabular-nums leading-none">
                  {String(hours).padStart(2, '0')}
                </span>
                <span className="text-[8px] font-mono uppercase text-zinc-500 tracking-widest mt-2 block">Hours</span>
              </div>
              <div className="flex flex-col items-center border-l border-zinc-900">
                <span className="text-4xl md:text-5xl font-bold text-[#F7F7F7] font-mono tracking-tight tabular-nums leading-none">
                  {String(minutes).padStart(2, '0')}
                </span>
                <span className="text-[8px] font-mono uppercase text-zinc-500 tracking-widest mt-2 block">Mins</span>
              </div>
              <div className="flex flex-col items-center border-l border-zinc-900">
                <span className="text-4xl md:text-5xl font-bold text-gk-orange font-mono tracking-tight tabular-nums leading-none">
                  {String(seconds).padStart(2, '0')}
                </span>
                <span className="text-[8px] font-mono uppercase text-zinc-500 tracking-widest mt-2 block">Secs</span>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  )
})

export default ReleaseBoard
