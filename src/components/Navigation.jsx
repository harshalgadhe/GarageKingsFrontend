import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Search, Share2, Tags, User } from 'lucide-react'
import { SiInstagram, SiWhatsapp } from 'react-icons/si'
import { BRAND, CONTACT, WHATSAPP_URL } from '../data/content'
import { getCurrentUser } from '../lib/auth'
import AuthModal from './AuthModal'

const sections = [
  { to: '/', label: 'Home' },
  { to: '/brands', label: 'Brands' },
  { to: '/marketplace', label: 'Garage' },
]

export default function Navigation({ activeSection, theme }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [authOpen, setAuthOpen] = useState(false)
  const [socialOpen, setSocialOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState(() => new URLSearchParams(location.search).get('search') || '')
  const [user, setUser] = useState(() => getCurrentUser())

  useEffect(() => {
    const syncUser = () => setUser(getCurrentUser())
    window.addEventListener('gk_user_updated', syncUser)
    return () => window.removeEventListener('gk_user_updated', syncUser)
  }, [])

  useEffect(() => setSocialOpen(false), [location.pathname])

  useEffect(() => {
    setGlobalSearch(new URLSearchParams(location.search).get('search') || '')
  }, [location.search])

  const openCollectorProfile = () => {
    if (user) navigate('/account')
    else setAuthOpen(true)
  }

  const submitGlobalSearch = (event) => {
    event.preventDefault()
    const query = globalSearch.trim()
    navigate(query ? `/marketplace?search=${encodeURIComponent(query)}` : '/marketplace')
  }

  const isHome = location.pathname === '/'
  const isBrands = location.pathname.startsWith('/brands')
  const isVault = location.pathname === '/marketplace' || location.pathname.startsWith('/product/')
  const enquiryMessage = location.pathname.startsWith('/product/')
    ? `Hi GarageKings, I would like to enquire about this model: ${window.location.href}`
    : `Hi GarageKings, I would like help finding a collectible. ${window.location.href}`

  return (
    <>
      <motion.header
        initial={false}
        className="fixed inset-x-0 top-0 z-[80] border-b border-white/[0.07] bg-[#050505]/88 shadow-[0_10px_35px_rgba(0,0,0,.22)] backdrop-blur-2xl"
        style={theme?.navigation ? { backgroundColor: theme.navigation, borderBottomColor: `${theme.accent}24` } : undefined}
      >
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-2.5 px-3 sm:gap-4 sm:px-5 md:px-10 lg:grid lg:grid-cols-[minmax(120px,1fr)_auto_minmax(440px,1fr)] lg:gap-8 lg:px-12 xl:px-16">
          <button onClick={() => navigate('/')} className="group flex items-center text-left" aria-label="GarageKings home">
            <span className="grid h-12 w-[5.75rem] shrink-0 place-items-center sm:w-28">
              <img src="/brand-wordmark.png?v=3" alt="" className="max-h-11 w-full object-contain drop-shadow-[0_0_10px_rgba(225,189,101,.16)] transition-transform duration-500 group-hover:scale-[1.02]" />
            </span>
          </button>

          <form onSubmit={submitGlobalSearch} role="search" className="group relative min-w-0 flex-1 lg:hidden">
            <Search size={14} strokeWidth={1.8} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#817D76] transition-colors group-focus-within:text-[#D8BC78]" />
            <input
              type="search"
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
              placeholder="Search collection"
              aria-label="Search all GarageKings models"
              className="h-10 w-full min-w-0 rounded-full border border-white/[0.09] bg-white/[0.035] pl-9 pr-3 text-[12px] text-[#F4F1EC] outline-none transition placeholder:text-[#68645E] focus:border-[#C8AE7D]/45 focus:bg-[#0A0908] focus:shadow-[0_0_0_3px_rgba(200,174,125,.07)]"
            />
          </form>

          <nav className="hidden items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.025] p-1 lg:flex" aria-label="Primary navigation">
            {sections.map((item) => {
              const selected = item.to === '/' ? location.pathname === '/' : item.to === '/brands' ? location.pathname.startsWith('/brands') : isVault
              return <Link key={item.to + item.label} to={item.to} className={`relative rounded-full px-5 py-2.5 text-[12px] font-semibold tracking-[0.02em] transition-all ${selected ? 'bg-[#D8BC78]/[0.11] text-[#F4E5BD] shadow-[inset_0_0_0_1px_rgba(216,188,120,.12)]' : 'text-[#8F8B84] hover:bg-white/[0.045] hover:text-[#F4F1EC]'}`}>
                {item.label}
                {selected && <span className="absolute inset-x-5 -bottom-[5px] h-px bg-[#E1BD65]/80" />}
              </Link>
            })}
          </nav>

          <div className="hidden min-w-0 items-center justify-end gap-3 lg:flex">
            <form onSubmit={submitGlobalSearch} role="search" className="group relative w-[clamp(300px,28vw,430px)]">
              <Search size={15} strokeWidth={1.7} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#817D76] transition-colors group-focus-within:text-[#D8BC78]" />
              <input
                type="search"
                value={globalSearch}
                onChange={(event) => setGlobalSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') submitGlobalSearch(event)
                }}
                placeholder="Search models"
                aria-label="Search all GarageKings models"
                className="h-11 w-full rounded-full border border-white/[0.09] bg-white/[0.035] pl-11 pr-12 text-[13px] text-[#F4F1EC] shadow-[inset_0_1px_0_rgba(255,255,255,.025)] outline-none transition-all placeholder:text-[#6F6B65] hover:border-white/[0.16] hover:bg-white/[0.045] focus:border-[#C8AE7D]/45 focus:bg-[#0A0908] focus:shadow-[0_0_0_3px_rgba(200,174,125,.07)]"
              />
              <button type="submit" aria-label="Submit global search" className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-transparent text-[#8A867F] transition hover:border-white/[0.08] hover:bg-white/[0.06] hover:text-white">
                <Search size={13} strokeWidth={2} />
              </button>
            </form>
            <button onClick={openCollectorProfile} className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.025] px-4 text-[12px] font-medium text-[#B0ACA4] transition hover:border-[#C8AE7D]/30 hover:bg-[#C8AE7D]/[0.06] hover:text-[#F4F1EC]" aria-label="Collector profile"><User size={15} strokeWidth={1.7} /><span>Account</span></button>
          </div>

          <button
            onClick={openCollectorProfile}
            className="relative ml-auto grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-[#C8AE7D]/25 bg-[#C8AE7D]/[0.07] text-[#D7C59D] shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_5px_18px_rgba(0,0,0,.22)] transition duration-300 active:scale-95 lg:hidden"
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

      <nav className="gk-mobile-dock fixed inset-x-0 bottom-0 z-[90] grid h-[calc(64px+env(safe-area-inset-bottom))] grid-cols-4 items-end border-t border-white/[0.1] bg-black/94 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-14px_40px_rgba(0,0,0,.62)] backdrop-blur-2xl lg:hidden" style={theme?.navigation ? { backgroundColor: theme.navigation, borderTopColor: `${theme.accent}2E` } : undefined} aria-label="Mobile navigation">
        <button onClick={() => navigate('/')} className={`gk-dock-item ${isHome ? 'text-[#F4F1EC]' : 'text-[#74716B]'}`} aria-current={isHome ? 'page' : undefined}>
          <Home size={18} strokeWidth={isHome ? 2.4 : 1.8} />
          <span>Home</span>
          {isHome && <span className="gk-dock-marker" />}
        </button>

        <Link to="/brands" className={`gk-dock-item ${isBrands ? 'text-[#F4F1EC]' : 'text-[#74716B]'}`} aria-current={isBrands ? 'page' : undefined}>
          <Tags size={18} strokeWidth={isBrands ? 2.4 : 1.8} />
          <span>Brands</span>
          {isBrands && <span className="gk-dock-marker" />}
        </Link>

        <Link to="/marketplace" className={`gk-dock-item ${isVault ? 'text-[#F4F1EC]' : 'text-[#74716B]'}`} aria-current={isVault ? 'page' : undefined}>
          <Search size={18} strokeWidth={isVault ? 2.4 : 1.8} />
          <span>Garage</span>
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
