import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BRAND } from '../data/content'
import { scrollToSection, useLenis } from '../providers/SmoothScroll'
import { getCurrentUser, signOutCognito } from '../lib/auth'
import { readCart, writeCart, clearCart as clearUserCart, notifyCartUpdated } from '../lib/cart'
import AuthModal from './AuthModal'
import { LogOut, User, X, Settings, Trash2, ShoppingBag, ShoppingCart, Home } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import ReserveModal from './checkout/ReserveModal'

const MotionLink = motion.create(Link)

const links = [
  { id: 'hero', label: 'Home' },
  { id: 'archive', label: 'Brands' },
  { id: 'gallery', label: 'Collections' },
]

const mobileLinks = [
  { id: 'hero', label: 'Home', type: 'anchor' },
  { id: 'archive', label: 'Brands', type: 'anchor' },
  { id: 'gallery', label: 'Collections', type: 'anchor' },
  { id: 'marketplace', label: 'Marketplace', type: 'route', path: '/marketplace' },
]

export default function Navigation({ activeSection }) {
  const lenisRef = useLenis()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('hero')
  // Initialize synchronously from the user-scoped cart key to prevent flash
  const [user, setUser] = useState(() => getCurrentUser())
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  // readCart() uses the current user's scoped key — empty if unauthenticated
  const [cart, setCart] = useState(() => readCart())

  useEffect(() => {
    const handleUserUpdate = () => {
      const nextUser = getCurrentUser()
      setUser(nextUser)
      // Re-read cart from the new user's scoped key immediately
      setCart(readCart())
    }
    handleUserUpdate()
    window.addEventListener('gk_user_updated', handleUserUpdate)
    return () => window.removeEventListener('gk_user_updated', handleUserUpdate)
  }, [])

  // Sync cart state with localStorage across components and browser tabs
  useEffect(() => {
    const loadCart = (e) => {
      setCart(readCart())
      if (e?.detail?.open) {
        navigate('/cart')
      }
    }
    loadCart()
    window.addEventListener('gk_cart_updated', loadCart)
    return () => window.removeEventListener('gk_cart_updated', loadCart)
  }, [])

  const removeFromCart = (id) => {
    const currentCart = readCart()
    const newCart = currentCart.filter(item => item.id !== id)
    writeCart(newCart)
    notifyCartUpdated()
  }

  const updateCartItemQty = (id, newQty) => {
    const currentCart = readCart()
    let newCart
    if (newQty <= 0) {
      newCart = currentCart.filter(item => item.id !== id)
    } else {
      newCart = currentCart.map(item =>
        item.id === id ? { ...item, quantity: newQty } : item
      )
    }
    writeCart(newCart)
    notifyCartUpdated()
  }

  const clearCart = () => {
    clearUserCart()
  }

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
              className="h-10 w-10 md:h-12 md:w-12 object-contain"
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

          <div className="hidden lg:flex items-center gap-2 sm:gap-3 relative z-[80]">
            <div className="relative hidden lg:block">
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
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-left cursor-pointer bg-transparent border-none"
                      >
                        <LogOut size={14} className="text-zinc-500" />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
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
            className="fixed inset-0 z-[60] bg-[#050505]/98 flex flex-col justify-between"
          >
            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto px-6 pt-24 pb-8 flex flex-col justify-between min-h-0" data-lenis-prevent="true">
              <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-8">
                {/* Explore Navigation */}
                <div className="flex flex-col gap-4 w-full">
                  <div className="text-[10px] font-mono tracking-[0.25em] text-[var(--color-gk-orange)]/60 uppercase pl-1 font-bold">
                    EXPLORE VAULT
                  </div>
                  <nav className="flex flex-col gap-3 w-full">
                    {mobileLinks.map((link, i) => {
                      const isActive = link.type === 'anchor' 
                        ? activeSection === link.id 
                        : window.location.pathname === link.path;
                      
                      return (
                        <motion.div
                          key={link.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.35, delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              if (link.type === 'anchor') {
                                handleNavClick(link.id);
                              } else {
                                navigate(link.path);
                              }
                            }}
                            className="flex items-baseline gap-4 w-full text-left group cursor-pointer py-1.5"
                          >
                            <span className="font-mono text-xs text-[var(--color-gk-orange)]/50 group-hover:text-[var(--color-gk-orange)] transition-colors">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <span className={`text-2xl font-black uppercase tracking-wider transition-colors duration-300 ${
                              isActive ? 'text-[var(--color-gk-orange)]' : 'text-white/60 group-hover:text-white'
                            }`}>
                              {link.label}
                            </span>
                          </button>
                        </motion.div>
                      );
                    })}
                  </nav>
                </div>

                {/* Collector Portal */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.4, delay: 0.25, ease: [0.23, 1, 0.32, 1] }}
                  className="w-full p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md"
                >
                  <div className="text-[9px] font-mono tracking-[0.25em] text-white/30 uppercase mb-4 font-bold">
                    COLLECTOR PORTAL
                  </div>
                  {user ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gk-yellow/10 border border-gk-yellow/20 flex items-center justify-center text-gk-yellow shrink-0">
                          <User size={18} strokeWidth={2.2} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{user.displayName || user.email}</p>
                          <p className="text-[10px] text-white/40 truncate">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-white/5">
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            navigate('/account');
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-wider text-white transition-all cursor-pointer border border-white/5 active:scale-[0.98]"
                        >
                          <User size={12} className="text-gk-yellow" />
                          Account
                        </button>
                      </div>
                      
                      {(user.roles?.includes('admin') || user.roles?.includes('owner')) && (
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            navigate('/admin');
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[10px] font-black uppercase tracking-wider text-purple-400 hover:bg-purple-500/20 transition-all cursor-pointer active:scale-[0.98]"
                        >
                          <Settings size={12} />
                          Admin Console
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsOpen(false);
                          handleLogout();
                        }}
                        className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer text-center active:scale-[0.98]"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-[11px] text-white/50 leading-relaxed font-medium">
                        Sign in to access your reserved castings, check drops, and manage your collection details.
                      </p>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          setIsAuthModalOpen(true);
                        }}
                        className="w-full py-3.5 rounded-xl bg-[var(--color-gk-orange)] hover:bg-gk-orange/90 text-white font-black text-xs uppercase tracking-widest transition-all cursor-pointer hover:shadow-[0_0_25px_rgba(255,85,0,0.25)] text-center border-none active:scale-[0.98]"
                      >
                        Log In to Vault
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
              
              {/* Footer Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
                className="max-w-md mx-auto w-full flex items-center justify-between border-t border-white/5 pt-5 mt-8 shrink-0"
              >
                <span className="text-[9px] font-mono tracking-widest text-white/30 uppercase">
                  © 2026 {BRAND.name}
                </span>
                <div className="flex gap-4">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] font-mono tracking-wider uppercase text-white/40 hover:text-white transition-colors"
                  >
                    Instagram
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] font-mono tracking-wider uppercase text-white/40 hover:text-white transition-colors"
                  >
                    Twitter
                  </a>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

       {/* 📱 Persistent Glassmorphic Mobile Bottom Navigation */}
      {createPortal(
        <div className="md:hidden no-print print:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111111]/90 backdrop-blur-xl border-t border-[#222222] px-2 py-2.5 flex justify-between items-center text-white/50 shadow-[0_-10px_35px_rgba(0,0,0,0.9)] pb-[calc(10px+env(safe-area-inset-bottom))]">
          <button 
            onClick={() => handleNavClick('hero')} 
            className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all cursor-pointer active:scale-90 ${
              window.location.pathname === '/' ? 'text-[var(--color-gk-orange)]' : 'hover:text-white'
            }`}
          >
            <Home className="w-5 h-5" strokeWidth={2.2} />
            <span className="text-[9px] font-black uppercase tracking-wider">Home</span>
          </button>
          
          <button 
            onClick={() => navigate('/marketplace')} 
            className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all cursor-pointer active:scale-90 ${
              window.location.pathname === '/marketplace' ? 'text-[var(--color-gk-orange)]' : 'hover:text-white'
            }`}
          >
            <ShoppingBag className="w-5 h-5" strokeWidth={2.2} />
            <span className="text-[9px] font-black uppercase tracking-wider">Shop</span>
          </button>

          <button 
            onClick={() => {
              if (user) {
                navigate('/account');
              } else {
                setIsAuthModalOpen(true);
              }
            }}
            className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all cursor-pointer active:scale-90 ${
              window.location.pathname === '/account' || window.location.pathname === '/admin' ? 'text-[var(--color-gk-orange)]' : 'hover:text-white'
            }`}
          >
            <User className="w-5 h-5" strokeWidth={2.2} />
            <span className="text-[9px] font-black uppercase tracking-wider">Account</span>
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
