import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Search, Share2, User } from 'lucide-react'
import { SiInstagram, SiWhatsapp } from 'react-icons/si'
import { BRAND, CONTACT, WHATSAPP_URL } from '../data/content'
import { getCurrentUser } from '../lib/auth'
import { scrollToSection, useLenis } from '../providers/SmoothScroll'
import AuthModal from './AuthModal'

const sections = [
  { id: 'hero', label: 'Home' },
  { id: 'brands', label: 'Brands' },
  { id: 'collections', label: 'Collections' },
]

export default function Navigation({ activeSection }) {
  const lenisRef = useLenis()
  const navigate = useNavigate()
  const location = useLocation()
  const reduce = useReducedMotion()
  const [authOpen, setAuthOpen] = useState(false)
  const [socialOpen, setSocialOpen] = useState(false)
  const [user, setUser] = useState(() => getCurrentUser())

  useEffect(() => {
    const syncUser = () => setUser(getCurrentUser())
    window.addEventListener('gk_user_updated', syncUser)
    return () => window.removeEventListener('gk_user_updated', syncUser)
  }, [])

  useEffect(() => {
    if (location.pathname !== '/' || !location.hash) return

    const target = location.hash.slice(1)
    let secondFrame = 0
    const frame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => scrollToSection(lenisRef, target))
    })

    return () => {
      window.cancelAnimationFrame(frame)
      window.cancelAnimationFrame(secondFrame)
    }
  }, [lenisRef, location.hash, location.pathname])

  useEffect(() => setSocialOpen(false), [location.pathname])

  const goToSection = (id) => {
    if (location.pathname !== '/') {
      navigate(`/#${id}`)
      return
    }

    window.history.replaceState(null, '', `/#${id}`)
    scrollToSection(lenisRef, id)
  }

  const openCollectorProfile = () => {
    if (user) navigate('/account')
    else setAuthOpen(true)
  }

  const isHome = location.pathname === '/'
  const isVault = location.pathname === '/marketplace' || location.pathname.startsWith('/product/')
  const enquiryMessage = location.pathname.startsWith('/product/')
    ? `Hi GarageKings, I would like to enquire about this model: ${window.location.href}`
    : `Hi GarageKings, I would like help finding a collectible. ${window.location.href}`

  return (
    <>
      <motion.header
        initial={reduce ? false : { y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-[80] border-b border-white/[0.06] bg-[#050505]/78 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 md:px-10 lg:px-16">
          <button onClick={() => goToSection('hero')} className="group flex items-center text-left" aria-label="GarageKings home">
            <span className="grid h-11 w-24 shrink-0 place-items-center">
              <img src="/brand-wordmark.png?v=3" alt="" className="max-h-11 w-full object-contain drop-shadow-[0_0_10px_rgba(225,189,101,.16)] transition-transform duration-500 group-hover:scale-[1.02]" />
            </span>
          </button>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary navigation">
            {sections.map((item) => (
              <button key={item.id} onClick={() => goToSection(item.id)} className={`relative py-5 text-[13px] font-semibold tracking-[0.015em] transition-colors ${activeSection === item.id ? 'text-[#F4F1EC]' : 'text-[#8A867F] hover:text-[#F4F1EC]'}`}>
                {item.label}
                {activeSection === item.id && <span className="absolute inset-x-0 bottom-0 h-px bg-[#E1BD65]" />}
              </button>
            ))}
            <Link to="/marketplace" className={`relative py-5 text-[13px] font-semibold tracking-[0.015em] transition-colors ${isVault ? 'text-[#F4F1EC]' : 'text-[#8A867F] hover:text-[#F4F1EC]'}`}>
              Marketplace
              {isVault && <span className="absolute inset-x-0 bottom-0 h-px bg-[#E1BD65]" />}
            </Link>
          </nav>

          <div className="hidden items-center lg:flex">
            <button onClick={openCollectorProfile} className="flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.025] px-4 py-2 text-[12px] font-medium text-[#B0ACA4] transition hover:border-[#C8AE7D]/30 hover:bg-[#C8AE7D]/[0.05] hover:text-[#F4F1EC]" aria-label="Collector profile"><User size={15} strokeWidth={1.7} /><span>Account</span></button>
          </div>

          <button
            onClick={openCollectorProfile}
            className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-[#C8AE7D]/25 bg-[#C8AE7D]/[0.07] text-[#D7C59D] shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_5px_18px_rgba(0,0,0,.22)] transition duration-300 active:scale-95 lg:hidden"
            aria-label="Collector profile"
          >
            {user ? (
              <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#E6D6B2]">
                {(user.name || user.email || 'G').charAt(0)}
              </span>
            ) : (
              <User size={16} strokeWidth={1.65} />
            )}
            <span className="pointer-events-none absolute inset-x-2 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C8AE7D]/70 to-transparent" />
          </button>
        </div>
      </motion.header>

      {socialOpen && <button className="fixed inset-0 z-[85] bg-black/20 lg:hidden" onClick={() => setSocialOpen(false)} aria-label="Close social menu" />}

      <nav className="gk-mobile-dock fixed inset-x-0 bottom-0 z-[90] grid h-[calc(64px+env(safe-area-inset-bottom))] grid-cols-3 items-end border-t border-white/[0.1] bg-black/94 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-14px_40px_rgba(0,0,0,.62)] backdrop-blur-2xl lg:hidden" aria-label="Mobile navigation">
        <button onClick={() => goToSection('hero')} className={`gk-dock-item ${isHome ? 'text-[#F4F1EC]' : 'text-[#74716B]'}`} aria-current={isHome ? 'page' : undefined}>
          <Home size={18} strokeWidth={isHome ? 2.4 : 1.8} />
          <span>Home</span>
          {isHome && <span className="gk-dock-marker" />}
        </button>

        <Link to="/marketplace" className={`gk-dock-item ${isVault ? 'text-[#F4F1EC]' : 'text-[#74716B]'}`} aria-current={isVault ? 'page' : undefined}>
          <Search size={18} strokeWidth={isVault ? 2.4 : 1.8} />
          <span>Vault</span>
          {isVault && <span className="gk-dock-marker" />}
        </Link>

        <button onClick={() => setSocialOpen((open) => !open)} className={`gk-dock-item ${socialOpen ? 'text-white' : 'text-[#A1A1A6]'}`} aria-expanded={socialOpen} aria-controls="mobile-social-arc">
          <Share2 size={18} strokeWidth={2} />
          <span>Social</span>
        </button>

        <motion.div id="mobile-social-arc" initial={false} animate={socialOpen ? 'open' : 'closed'} className="pointer-events-none absolute bottom-[calc(70px+env(safe-area-inset-bottom))] right-3 h-28 w-36" aria-hidden={!socialOpen}>
          <motion.a href={`${WHATSAPP_URL}?text=${encodeURIComponent(enquiryMessage)}`} target="_blank" rel="noreferrer" variants={{ closed: { opacity: 0, scale: 0.6, x: 38, y: 55 }, open: { opacity: 1, scale: 1, x: 0, y: 0 } }} transition={{ type: 'spring', stiffness: 420, damping: 27 }} className={`absolute bottom-1 right-16 grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow-xl ${socialOpen ? 'pointer-events-auto' : ''}`} aria-label="Contact GarageKings on WhatsApp"><SiWhatsapp size={23} /></motion.a>
          <motion.a href={CONTACT.instagramUrl} target="_blank" rel="noreferrer" variants={{ closed: { opacity: 0, scale: 0.6, x: 12, y: 70 }, open: { opacity: 1, scale: 1, x: 0, y: 0 } }} transition={{ type: 'spring', stiffness: 420, damping: 27, delay: socialOpen ? 0.035 : 0 }} className={`absolute right-1 top-0 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] text-white shadow-xl ${socialOpen ? 'pointer-events-auto' : ''}`} aria-label="Open GarageKings on Instagram"><SiInstagram size={22} /></motion.a>
        </motion.div>
      </nav>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} onAuthSuccess={() => setUser(getCurrentUser())} />
    </>
  )
}
