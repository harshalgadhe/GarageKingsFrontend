import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BRAND } from '../data/content'
import { scrollToSection, useLenis } from '../providers/SmoothScroll'
import { getCurrentUser, signOutCognito } from '../lib/auth'
import AuthModal from './AuthModal'
import { LogOut, User } from 'lucide-react'

const links = [
  { id: 'hero', label: 'Home' },
  { id: 'vault', label: 'Shop' },
  { id: 'lanes', label: 'Brands' },
  { id: 'drop', label: 'Drops' },
  { id: 'garage', label: 'Garage' },
  { id: 'community', label: 'Community' },
]

export default function Navigation({ activeSection }) {
  const lenisRef = useLenis()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('hero')
  const [user, setUser] = useState(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

  const handleProfileClick = () => {
    if (user) {
      window.location.href = '/admin'
    } else {
      setIsAuthModalOpen(true)
    }
  }

  const handleLogout = () => {
    signOutCognito()
    window.location.reload()
  }

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleNavClick = (id) => {
    setIsOpen(false)
    setActiveTab(id)
    scrollToSection(lenisRef, id)
  }

  return (
    <>
      <motion.header
        className="fixed top-0 right-0 left-0 z-[70] bg-gradient-to-b from-[#050505]/95 via-[#050505]/50 to-transparent pt-2 pb-8 pointer-events-none"
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 md:px-12 pointer-events-auto">
          {/* Logo Brand */}
          <button
            type="button"
            onClick={() => handleNavClick('hero')}
            className="flex shrink-0 items-center gap-3 relative z-[80]"
          >
            <img
              src="/brand-logo.png"
              alt={BRAND.name}
              className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover ring-1 ring-gk-yellow/30 shadow-[0_0_15px_rgba(255,179,0,0.2)]"
            />
            <span className="text-left">
              <span className="block text-[8px] md:text-[9px] font-black uppercase tracking-[0.25em] text-gk-yellow">
                Collector Vault
              </span>
              <span className="block text-sm md:text-base font-black tracking-tight text-white">{BRAND.name}</span>
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:block">
            <ul className="flex gap-7 items-center">
              {links.map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => handleNavClick(link.id)}
                    className={`whitespace-nowrap text-xs font-black uppercase tracking-[0.15em] transition-colors duration-300 py-1.5 px-0.5 border-b-2 ${
                      activeTab === link.id || activeSection === links.findIndex(l => l.id === link.id)
                        ? 'text-[#E10600] border-[#E10600]'
                        : 'text-white/70 border-transparent hover:text-white'
                    }`}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              <li>
                <a
                  href="/marketplace"
                  className="whitespace-nowrap text-xs font-black uppercase tracking-[0.15em] transition-colors duration-300 text-white/70 hover:text-white py-1.5 px-0.5 border-b-2 border-transparent"
                >
                  Marketplace
                </a>
              </li>
            </ul>
          </nav>

          {/* Header Quick Actions Icons */}
          <div className="hidden md:flex items-center gap-3">
            <button 
              type="button"
              className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-[#E10600]/30 hover:bg-[#E10600]/5 text-white/80 hover:text-white transition-all cursor-pointer group"
              title="Search Collection"
            >
              <svg className="w-4.5 h-4.5 group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button 
              type="button"
              onClick={handleProfileClick}
              className={`p-2.5 rounded-xl bg-white/5 border hover:border-[#E10600]/30 hover:bg-[#E10600]/5 hover:text-white transition-all cursor-pointer group ${user ? 'border-gk-yellow/40 text-gk-yellow' : 'border-white/5 text-white/80'}`}
              title={user ? `Collector Profile (${user.email})` : "Collector Profile"}
            >
              <svg className="w-4.5 h-4.5 group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            {user && (
              <button 
                type="button"
                onClick={handleLogout}
                className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all cursor-pointer group"
                title="Logout Session"
              >
                <LogOut className="w-4.5 h-4.5 group-hover:scale-105 transition-transform" />
              </button>
            )}
            <button 
              type="button"
              className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-[#E10600]/30 hover:bg-[#E10600]/5 text-white/80 hover:text-white transition-all cursor-pointer group relative"
              title="Your Cart"
            >
              <svg className="w-4.5 h-4.5 group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-[#E10600] text-white font-mono text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#050505] shadow-[0_0_10px_rgba(225,6,0,0.6)]">2</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="lg:hidden relative z-[80] flex flex-col justify-center items-center w-11 h-11 rounded-xl bg-white/5 border border-white/5"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <span className={`bg-white block transition-all duration-300 ease-out h-[2px] w-5 rounded-sm ${isOpen ? 'rotate-45 translate-y-[3px]' : '-translate-y-1'}`} />
            <span className={`bg-white block transition-all duration-300 ease-out h-[2px] w-5 rounded-sm my-0.5 ${isOpen ? 'opacity-0' : 'opacity-100'}`} />
            <span className={`bg-white block transition-all duration-300 ease-out h-[2px] w-5 rounded-sm ${isOpen ? '-rotate-45 -translate-y-[5px]' : 'translate-y-1'}`} />
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[60] bg-[#050505]/95 flex flex-col items-center justify-center"
          >
            <nav className="flex flex-col gap-6 items-center w-full px-6">
              {links.map((link, i) => (
                <motion.button
                  key={link.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.4, delay: i * 0.04 + 0.1, ease: [0.22, 1, 0.36, 1] }}
                  type="button"
                  onClick={() => handleNavClick(link.id)}
                  className="group relative flex items-center justify-center w-full"
                >
                  <span className={`text-3xl font-black tracking-tighter uppercase transition-colors duration-300 ${
                    activeSection === i ? 'text-[#E10600]' : 'text-white/40 group-hover:text-white'
                  }`}>
                    {link.label}
                  </span>
                </motion.button>
              ))}
              
              <motion.a
                href="/marketplace"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4, delay: links.length * 0.04 + 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-2 text-3xl font-black uppercase tracking-tighter text-white/40 hover:text-white transition-colors"
              >
                Marketplace
              </motion.a>

              {user ? (
                <>
                  <motion.a
                    href="/admin"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.4, delay: (links.length + 1) * 0.04 + 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-2 text-3xl font-black uppercase tracking-tighter text-gk-yellow hover:text-yellow-400 transition-colors"
                  >
                    Your Profile
                  </motion.a>
                  
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.4, delay: (links.length + 2) * 0.04 + 0.1, ease: [0.22, 1, 0.36, 1] }}
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-3xl font-black uppercase tracking-tighter text-red-500 hover:text-red-400 transition-colors cursor-pointer bg-transparent border-none"
                  >
                    Sign Out
                  </motion.button>
                </>
              ) : (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.4, delay: (links.length + 1) * 0.04 + 0.1, ease: [0.22, 1, 0.36, 1] }}
                  onClick={handleProfileClick}
                  className="flex items-center gap-2 text-3xl font-black uppercase tracking-tighter text-white/40 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                >
                  Collector Log In
                </motion.button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📱 Persistent Glassmorphic Mobile Bottom Navigation */}
      {createPortal(
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111111]/85 backdrop-blur-lg border-t border-[#2A2A2A] px-4 py-3 flex justify-between items-center text-white/50 shadow-[0_-10px_30px_rgba(0,0,0,0.85)] pb-[calc(12px+env(safe-area-inset-bottom))]">
          <button 
            onClick={() => handleNavClick('hero')} 
            className={`flex flex-col items-center gap-1 flex-1 py-1 transition-colors cursor-pointer ${
              activeTab === 'hero' ? 'text-[#E10600]' : 'hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-wider">Home</span>
          </button>
          
          <button 
            onClick={() => handleNavClick('vault')} 
            className={`flex flex-col items-center gap-1 flex-1 py-1 transition-colors cursor-pointer ${
              activeTab === 'vault' ? 'text-[#E10600]' : 'hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-wider">Shop</span>
          </button>

          <button 
            className="flex flex-col items-center gap-1 flex-1 py-1 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-wider">Search</span>
          </button>

          <button 
            onClick={() => handleNavClick('garage')} 
            className={`flex flex-col items-center gap-1 flex-1 py-1 transition-colors cursor-pointer ${
              activeTab === 'garage' ? 'text-[#E10600]' : 'hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-wider">Garage</span>
          </button>

          <button 
            onClick={handleProfileClick}
            className={`flex flex-col items-center gap-1 flex-1 py-1 transition-colors cursor-pointer ${user ? 'text-gk-yellow' : 'hover:text-white'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-wider">Profile</span>
          </button>
        </div>,
        document.body
      )}

      <AnimatePresence>
        {isAuthModalOpen && (
          <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)} 
            themeColor="orange" 
            onAuthSuccess={() => {
              setIsAuthModalOpen(false);
              window.location.reload();
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
