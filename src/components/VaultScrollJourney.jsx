import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const SCENES = [
  {
    number: '01',
    eyebrow: 'The private collector archive',
    title: ['Some people see toys.', 'We see the stories', 'worth keeping.'],
    body: 'GarageKings is a collector-led selection of automotive miniatures with character, provenance and presence.',
    image: '/journey-entrance.webp',
    objectFit: 'cover',
    tone: '#050505',
    accent: '#E1BD65',
  },
  {
    number: '02',
    eyebrow: 'The inspection ritual',
    title: ['Look closer.', 'Every angle tells', 'you something.'],
    body: 'Packaging, seals, finish and condition are presented as evidence, not buried beneath promotional copy.',
    image: '/journey-inspection.webp',
    objectFit: 'cover',
    tone: '#070A08',
    accent: '#76B18C',
  },
  {
    number: '03',
    eyebrow: 'One collection, one point of view',
    title: ['Not everything', 'belongs in', 'the Vault.'],
    body: 'We select models we would be proud to own ourselves, from accessible icons to rare limited releases.',
    image: '/journey-archive.webp',
    objectFit: 'cover',
    tone: '#0D0807',
    accent: '#E06C5A',
  },
  {
    number: '04',
    eyebrow: 'A human collector desk',
    title: ['Found your model?', 'Talk to someone', 'who understands it.'],
    body: 'No anonymous checkout maze. Ask about availability, condition or delivery directly on WhatsApp or Instagram.',
    image: '/journey-desk.webp',
    objectFit: 'cover',
    tone: '#090806',
    accent: '#E1BD65',
  },
]

export default function VaultScrollJourney() {
  const navigate = useNavigate()
  const journeyRef = useRef(null)
  const reduceMotion = useReducedMotion()
  const [activeScene, setActiveScene] = useState(0)
  const { scrollYProgress } = useScroll({ target: journeyRef, offset: ['start start', 'end end'] })
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1])
  const lightX = useTransform(scrollYProgress, [0, 1], ['-35%', '135%'])
  const objectY = useTransform(scrollYProgress, [0, 1], [12, -12])

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    const next = Math.min(SCENES.length - 1, Math.floor(value * SCENES.length))
    setActiveScene((current) => current === next ? current : next)
  })

  useEffect(() => {
    const updateVh = () => document.documentElement.style.setProperty('--gk-vh', `${window.innerHeight * 0.01}px`)
    updateVh()
    window.addEventListener('resize', updateVh, { passive: true })
    return () => window.removeEventListener('resize', updateVh)
  }, [])

  const scene = SCENES[activeScene]

  return (
    <div ref={journeyRef} className="relative h-[400vh] h-[400dvh] bg-[#050505]" style={{ position: 'relative' }} id="hero">
      <span id="story" className="absolute top-[25%] scroll-mt-20" aria-hidden="true" />

      <section className="sticky top-0 h-screen h-[100dvh] overflow-hidden" style={{ backgroundColor: scene.tone }}>
        <AnimatePresence initial={false}>
          <motion.div
            key={`wash-${activeScene}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.75 }}
            className="absolute inset-0"
            style={{ background: `radial-gradient(circle at 70% 42%, ${scene.accent}17, transparent 36%), linear-gradient(110deg, ${scene.tone} 0%, #050505 72%)` }}
          />
        </AnimatePresence>

        <div className="gk-journey-grid absolute inset-0 opacity-50" />
        <motion.div style={{ x: reduceMotion ? '50%' : lightX }} className="pointer-events-none absolute -top-1/4 h-[150%] w-[22%] rotate-[14deg] bg-gradient-to-r from-transparent via-white/[0.035] to-transparent blur-2xl" />

        <div className="relative mx-auto grid h-full max-w-[1440px] grid-cols-1 grid-rows-[minmax(0,48%)_minmax(0,52%)] gap-2 px-5 pb-[calc(76px+env(safe-area-inset-bottom))] pt-20 sm:gap-3 sm:pt-24 md:px-10 lg:grid-cols-12 lg:grid-rows-1 lg:items-center lg:gap-0 lg:px-16 lg:pb-12 lg:pt-20">
          <div className="order-2 z-20 min-h-0 self-center lg:order-1 lg:col-span-5">
            <AnimatePresence mode="wait">
              <motion.div key={activeScene} initial={reduceMotion ? false : { opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? {} : { opacity: 0, y: -18 }} transition={{ duration: reduceMotion ? 0 : 0.48, ease: [0.16, 1, 0.3, 1] }}>
                <div className="mb-3 flex items-center gap-3 font-mono text-[8px] uppercase tracking-[0.2em] sm:text-[9px] lg:mb-4 lg:tracking-[0.22em]" style={{ color: scene.accent }}>
                  <span>{scene.number}</span><span className="h-px w-8" style={{ backgroundColor: scene.accent }} /><span>{scene.eyebrow}</span>
                </div>
                <h1 className="text-[clamp(2rem,9.5vw,3rem)] font-semibold leading-[0.9] tracking-[-0.045em] text-[#F4F1EC] lg:text-[clamp(2.2rem,4.6vw,5.35rem)]">
                  {scene.title.map((line, index) => <span key={line} className="block" style={index === scene.title.length - 1 ? { color: scene.accent } : undefined}>{line}</span>)}
                </h1>
                <p className="mt-4 max-w-[40ch] text-[13px] leading-relaxed text-[#A9A49C] sm:text-sm md:text-base lg:mt-5">{scene.body}</p>

                {activeScene === 0 && (
                  <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:flex sm:flex-wrap sm:gap-3 lg:mt-7">
                    <button onClick={() => navigate('/marketplace')} className="flex min-w-0 items-center justify-center gap-1.5 rounded-full bg-[#F5F5F7] px-3 py-3 text-[8px] font-black uppercase tracking-[0.11em] text-black transition hover:-translate-y-0.5 hover:bg-white sm:gap-2 sm:px-6 sm:text-[10px] sm:tracking-[0.15em]">View collection <ArrowUpRight size={13} /></button>
                    <button onClick={() => document.getElementById('story')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })} className="flex min-w-0 items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-3 text-[8px] font-black uppercase tracking-[0.11em] text-[#F4F1EC] transition hover:border-white/25 sm:gap-2 sm:px-5 sm:text-[10px] sm:tracking-[0.15em]">Begin the story <ArrowDown size={13} /></button>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          <div className="order-1 relative flex min-h-0 items-stretch justify-center lg:order-2 lg:col-span-7 lg:h-[78vh] lg:items-center">
            <div className="pointer-events-none absolute inset-x-[5%] bottom-[8%] top-[8%] border-x border-white/[0.04]" />
            <div className="pointer-events-none absolute left-[2%] right-[14%] top-[14%] h-px bg-gradient-to-r from-white/[0.08] to-transparent" />
            <div className="pointer-events-none absolute bottom-[14%] left-[14%] right-[2%] h-px bg-gradient-to-l from-white/[0.08] to-transparent" />
            <AnimatePresence mode="wait">
              <motion.div key={scene.image} initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={reduceMotion ? {} : { opacity: 0, scale: 1.025 }} transition={{ duration: reduceMotion ? 0 : 0.72, ease: [0.16, 1, 0.3, 1] }} className="relative h-full w-full max-w-[680px] overflow-hidden rounded-xl lg:h-[62vh] 2xl:h-[66vh]">
                <motion.img src={scene.image} alt="Curated GarageKings diecast model" fetchPriority={activeScene === 0 ? 'high' : 'auto'} loading={activeScene === 0 ? 'eager' : 'lazy'} style={{ y: reduceMotion ? 0 : objectY, objectFit: scene.objectFit }} className="h-full w-full select-none drop-shadow-[0_32px_45px_rgba(0,0,0,.7)]" />
                {scene.objectFit === 'cover' && <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/65 via-transparent to-transparent" />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <aside className="absolute right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col border-r border-white/[0.1] py-2 md:flex lg:right-8">
          {SCENES.map((item, index) => <button key={item.number} onClick={() => window.scrollTo({ top: (journeyRef.current?.offsetTop || 0) + index * window.innerHeight, behavior: reduceMotion ? 'auto' : 'smooth' })} aria-label={`Go to chapter ${item.number}`} className={`relative py-2.5 pr-4 font-mono text-[8px] tracking-[0.16em] transition-all duration-300 ${index === activeScene ? 'text-[#E1BD65]' : 'text-[#555] hover:text-[#A1A1A6]'}`}>{item.number}{index === activeScene && <span className="absolute -right-px top-1/2 h-5 w-px -translate-y-1/2 bg-[#E1BD65]" />}</button>)}
        </aside>

        <div className="absolute bottom-[calc(76px+env(safe-area-inset-bottom))] left-5 right-5 z-30 h-[2px] overflow-hidden rounded-full bg-white/[0.1] md:bottom-4 md:left-16 md:right-16">
          <motion.div className="h-full origin-left rounded-full bg-[#E1BD65] shadow-[0_0_10px_rgba(225,189,101,.5)]" style={{ scaleX: progressScale }} />
        </div>
        <div className="absolute bottom-[calc(84px+env(safe-area-inset-bottom))] right-5 font-mono text-[8px] uppercase tracking-[0.18em] text-[#74716B] md:hidden">{scene.number} / 04</div>
      </section>
    </div>
  )
}
