import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const SCENES = [
  { number: '01', eyebrow: 'Models chosen by collectors', title: ['Some people see toys.', 'We see the stories', 'worth keeping.'], body: 'GarageKings brings together scale models with strong design, history and collector appeal.', image: '/journey-entrance.webp', tone: '#050505', accent: '#E1BD65' },
  { number: '02', eyebrow: 'See the important details', title: ['Look closer.', 'Every angle tells', 'you something.'], body: 'Photos and product details help you check the model and its packaging before you enquire.', image: '/journey-inspection.webp', tone: '#070A08', accent: '#76B18C' },
  { number: '03', eyebrow: 'A focused collection', title: ['Not every model', 'makes it into', 'the Garage.'], body: 'We choose models we would be happy to own, from familiar favourites to limited releases.', image: '/journey-archive.webp', tone: '#0D0807', accent: '#E06C5A' },
  { number: '04', eyebrow: 'Talk to a real person', title: ['Found your model?', 'Talk to someone', 'who understands it.'], body: 'Ask about availability, condition, delivery or collection directly on WhatsApp or Instagram.', image: '/journey-desk.webp', tone: '#090806', accent: '#E1BD65' },
]

export default function VaultScrollJourney() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const [activeScene, setActiveScene] = useState(0)
  const pointerStart = useRef(null)
  const scene = SCENES[activeScene]

  const goTo = (index) => setActiveScene((index + SCENES.length) % SCENES.length)

  useEffect(() => {
    if (reduceMotion) return undefined
    const timer = window.setTimeout(() => setActiveScene((current) => (current + 1) % SCENES.length), 8000)
    return () => window.clearTimeout(timer)
  }, [reduceMotion, activeScene])

  return (
    <section
      id="hero"
      aria-roledescription="carousel"
      aria-label="The GarageKings story"
      className="relative h-[100dvh] min-h-[38rem] w-full overflow-hidden border-b border-white/[0.07]"
      style={{ backgroundColor: scene.tone }}
      onPointerDown={(event) => { pointerStart.current = event.clientX }}
      onPointerUp={(event) => {
        if (pointerStart.current == null) return
        const distance = event.clientX - pointerStart.current
        if (Math.abs(distance) > 55) goTo(activeScene + (distance < 0 ? 1 : -1))
        pointerStart.current = null
      }}
    >
      <AnimatePresence initial={false} mode="sync">
        <motion.div key={`background-${activeScene}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.7 }} className="absolute inset-0" style={{ background: `radial-gradient(circle at 72% 38%, ${scene.accent}18, transparent 38%), linear-gradient(115deg, ${scene.tone}, #050505 78%)` }} />
      </AnimatePresence>
      <div className="gk-journey-grid absolute inset-0 opacity-40" />

      <div className="relative grid h-full w-full grid-cols-1 grid-rows-[43%_57%] px-5 pb-[calc(76px+env(safe-area-inset-bottom))] pt-20 sm:px-8 lg:grid-cols-12 lg:grid-rows-1 lg:items-center lg:gap-10 lg:px-[clamp(2.5rem,5vw,6rem)] lg:pb-12 lg:pt-20">
        <div className="order-2 z-20 self-center lg:order-1 lg:col-span-5">
          <AnimatePresence mode="wait">
            <motion.div key={`copy-${activeScene}`} initial={reduceMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? {} : { opacity: 0, y: -14 }} transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}>
              <div className="mb-3 flex items-center gap-3 font-mono text-[8px] uppercase tracking-[0.18em] sm:text-[9px]" style={{ color: scene.accent }}><span>{scene.number}</span><span className="h-px w-8" style={{ backgroundColor: scene.accent }} /><span>{scene.eyebrow}</span></div>
              <h1 className="text-[clamp(2rem,9vw,3rem)] font-semibold leading-[0.91] tracking-[-0.045em] text-[#F4F1EC] lg:text-[clamp(2.8rem,4.5vw,5.1rem)]">
                {scene.title.map((line, index) => <span key={line} className="block" style={index === scene.title.length - 1 ? { color: scene.accent } : undefined}>{line}</span>)}
              </h1>
              <p className="mt-4 max-w-[42ch] text-[13px] leading-relaxed text-[#A9A49C] sm:text-base lg:mt-6">{scene.body}</p>
              <button onClick={() => navigate('/marketplace')} className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[#F5F5F7] px-6 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-black transition hover:-translate-y-0.5 hover:bg-white lg:mt-7">View collection <ArrowUpRight size={14} /></button>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="order-1 relative min-h-0 lg:order-2 lg:col-span-7 lg:h-[calc(100dvh-8rem)]">
          <AnimatePresence mode="wait">
            <motion.div key={scene.image} initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={reduceMotion ? {} : { opacity: 0, scale: 1.015 }} transition={{ duration: reduceMotion ? 0 : 0.65, ease: [0.16, 1, 0.3, 1] }} className="relative h-full overflow-hidden rounded-2xl border border-white/[0.07] bg-[#080808]">
              <img src={scene.image} alt="GarageKings diecast model" fetchPriority={activeScene === 0 ? 'high' : 'auto'} loading={activeScene === 0 ? 'eager' : 'lazy'} className="h-full w-full select-none object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute bottom-[calc(78px+env(safe-area-inset-bottom))] left-5 right-5 z-30 sm:left-8 sm:right-8 lg:bottom-7 lg:left-16 lg:right-16">
        <div className="flex gap-2" role="tablist" aria-label="Story slides">
          {SCENES.map((item, index) => <button key={item.number} onClick={() => goTo(index)} role="tab" aria-selected={index === activeScene} aria-label={`Show story ${item.number}`} className={`h-1 rounded-full transition-all ${index === activeScene ? 'w-10 bg-[#E1BD65]' : 'w-4 bg-white/20 hover:bg-white/40'}`} />)}
        </div>
      </div>
      <div className="sr-only" aria-live="polite">Story {activeScene + 1} of {SCENES.length}</div>
    </section>
  )
}
