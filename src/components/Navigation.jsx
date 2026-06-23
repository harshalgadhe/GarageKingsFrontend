import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BRAND } from '../data/content'
import { scrollToSection, useLenis } from '../providers/SmoothScroll'
import { getCurrentUser, signOutCognito } from '../lib/auth'
import AuthModal from './AuthModal'
import { LogOut, User, X, Settings } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

const MotionLink = motion.create(Link)

const links = [
  { id: 'hero', label: 'Home' },
  { id: 'gallery', label: 'Collections' },
  { id: 'archive', label: 'Drops' },
  { id: 'releases', label: 'Next Drop' },
]

export default function Navigation({ activeSection }) {
  const lenisRef = useLenis()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('hero')
  const [user, setUser] = useState(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

  const handleSearchClick = () => {
    navigate('/marketplace?focus=true');
  }

  const handleProfileClick = () => {
    if (user) {
      setIsProfileDropdownOpen(prev => !prev)
    } else {
      setIsAuthModalOpen(true)
    }
  }

  const handleLogout = async () => {
    await signOutCognito()
    window.location.href = '/account'
  }

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Hash Scroll Effect for single-page cross-navigation
  useEffect(() => {
    if (window.location.hash) {
      const hashId = window.location.hash.substring(1)
      setTimeout(() => {
        const element = document.getElementById(hashId)
        if (element) {
          if (lenisRef && lenisRef.current) {
            lenisRef.current.scrollTo(element)
          } else {
            element.scrollIntoView({ behavior: 'smooth' })
          }
        }
      }, 500)
    }
  }, [window.location.hash, lenisRef])

  const handleNavClick = (id) => {
    setIsOpen(false)
    setActiveTab(id)
    if (window.location.pathname !== '/') {
      navigate(`/#${id}`)
    } else {
      scrollToSection(lenisRef, id)
    }
  }

  return (
    <>
      <motion.header
        className="fixed top-0 right-0 left-0 z-[70] bg-[#090909]/85 backdrop-blur-md border-b border-white/5 py-1 pointer-events-none"
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-2 md:px-12 pointer-events-auto">
          {/* Logo Brand */}
          <button
            type="button"
            onClick={() => handleNavClick('hero')}
            className="flex shrink-0 items-center gap-3 relative z-[80]"
          >
            <img
              src="/brand-logo.png"
              alt={BRAND.name}
              className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover ring-1 ring-gk-yellow/30 shadow-[0_0_15px_rgba(216,198,163,0.15)]"
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
                      activeTab === link.id || activeSection === link.id
                        ? 'text-[var(--color-gk-orange)] border-[var(--color-gk-orange)]'
                        : 'text-white/70 border-transparent hover:text-white'
                    }`}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              <li>
                <Link
                  to="/marketplace"
                  className="whitespace-nowrap text-xs font-black uppercase tracking-[0.15em] transition-colors duration-300 text-white/70 hover:text-white py-1.5 px-0.5 border-b-2 border-transparent"
                >
                  Marketplace
                </Link>
              </li>
            </ul>
          </nav>

          {/* Header Quick Actions Icons */}
          <div className="hidden md:flex items-center gap-3 relative z-[80]">
            <div className="relative">
              <button 
                type="button"
                onClick={handleProfileClick}
                className={`p-2.5 rounded-xl bg-white/5 border hover:border-[var(--color-gk-orange)]/30 hover:bg-[var(--color-gk-orange)]/5 hover:text-white transition-all cursor-pointer group ${user ? 'border-gk-yellow/40 text-gk-yellow' : 'border-white/5 text-white/80'}`}
                title={user ? `Collector Menu (${user.displayName || user.email})` : "Collector Profile"}
              >
                <svg className="w-4.5 h-4.5 group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {/* Profile dropdown menu */}
              <AnimatePresence>
                {isProfileDropdownOpen && user && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsProfileDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#0a0a0d] border border-white/10 p-2 shadow-2xl z-40 text-left"
                    >
                      <div className="px-3 py-2 border-b border-white/5 mb-1.5">
                        <p className="text-[9px] uppercase tracking-widest text-white/30 font-black">Logged In As</p>
                        <p className="text-xs font-bold text-white truncate" title={user.displayName || user.email}>{user.displayName || user.email}</p>
                        <p className="text-[10px] text-white/50 truncate mt-0.5">{user.email}</p>
                      </div>
                      <Link 
                        to="/account" 
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <User size={14} className="text-gk-yellow" />
                        <span>My Account</span>
                      </Link>
                      {(user.roles?.includes('admin') || user.roles?.includes('owner')) && (
                        <Link 
                          to="/admin" 
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all"
                        >
                          <Settings size={14} className="text-purple-400" />
                          <span>Admin Console</span>
                        </Link>
                      )}
                      <button 
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-left cursor-pointer bg-transparent border-none"
                      >
                        <LogOut size={14} />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            
            {user && (
              <button 
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-[var(--color-gk-orange)]/30 hover:bg-[var(--color-gk-orange)]/5 text-white/80 hover:text-white transition-all cursor-pointer group relative"
                title="Your Cart"
              >
                <svg className="w-4.5 h-4.5 group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </button>
            )}
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
                    activeSection === link.id ? 'text-[var(--color-gk-orange)]' : 'text-white/40 group-hover:text-white'
                  }`}>
                    {link.label}
                  </span>
                </motion.button>
              ))}
              
              <MotionLink
                to="/marketplace"
                onClick={() => setIsOpen(false)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4, delay: links.length * 0.04 + 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-2 text-3xl font-black uppercase tracking-tighter text-white/40 hover:text-white transition-colors"
              >
                Marketplace
              </MotionLink>

              {user ? (
                <>
                  <MotionLink
                    to="/account"
                    onClick={() => setIsOpen(false)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.4, delay: (links.length + 1) * 0.04 + 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-2 text-3xl font-black uppercase tracking-tighter text-gk-yellow hover:text-yellow-400 transition-colors"
                  >
                    My Account
                  </MotionLink>
                  
                  {(user.roles?.includes('admin') || user.roles?.includes('owner')) && (
                    <MotionLink
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.4, delay: (links.length + 1.5) * 0.04 + 0.1, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-center gap-2 text-3xl font-black uppercase tracking-tighter text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Admin Console
                    </MotionLink>
                  )}
                  
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
              activeTab === 'hero' ? 'text-[var(--color-gk-orange)]' : 'hover:text-white'
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
              activeTab === 'vault' ? 'text-[var(--color-gk-orange)]' : 'hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-wider">Shop</span>
          </button>

          <button 
            onClick={() => {
              if (user) {
                navigate('/account');
              } else {
                setIsAuthModalOpen(true);
              }
            }}
            className={`flex flex-col items-center gap-1 flex-1 py-1 transition-colors cursor-pointer ${
              activeTab === 'account' ? 'text-[var(--color-gk-orange)]' : 'hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-wider">Account</span>
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

      {/* 🛒 Collector Cart Modal Overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-end bg-black/85 backdrop-blur-md pointer-events-auto"
            onClick={() => setIsCartOpen(false)}
          >
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md h-full bg-[#0a0a0d] border-l border-white/10 p-6 sm:p-8 flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.9)] relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black italic tracking-wider uppercase text-white font-grotesk">Your Vault Queue</h3>
                  <button 
                    onClick={() => setIsCartOpen(false)} 
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Empty State */}
                <div className="flex flex-col items-center text-center py-20">
                  <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold text-white mb-2 uppercase tracking-wide">Acquisition Queue Empty</h4>
                  <p className="text-xs text-white/40 max-w-xs leading-relaxed font-medium">
                    You currently have no castings reserved in your cart. Active drops can be secured instantly via direct checkout on the marketplace.
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-6 border-t border-white/5 space-y-3">
                <Link 
                  to="/marketplace" 
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-4 rounded-xl bg-[var(--color-gk-orange)] hover:bg-gk-orange/90 hover:shadow-[0_0_30px_rgba(225,91,44,0.3)] text-center text-white font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Explore Marketplace
                </Link>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Continue Browsing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
