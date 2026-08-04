import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

const LoadingContext = createContext(null)

export function LoadingProvider({ children }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const location = useLocation()
  // Track whether this is a programmatic loader (showLoader call) vs route transition
  const programmaticRef = useRef(false)
  // Prevent re-entrance: track if a route-transition overlay is already active
  const routeTimerRef = useRef(null)

  // Disable body scroll when loading is active
  useEffect(() => {
    if (loading) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [loading])

  // Route transition bridge: show the overlay briefly on every navigation
  // This masks the unmount/mount seam between pages
  useEffect(() => {
    // Don't interrupt programmatic loaders (Checkout, Auth, etc.)
    if (programmaticRef.current) return

    // Clear any pending route timer
    if (routeTimerRef.current) {
      clearTimeout(routeTimerRef.current)
    }

    // Show overlay immediately on route change
    setMessage('')
    setLoading(true)

    // Hide after a short bridge delay, long enough for new page to render its shell
    routeTimerRef.current = setTimeout(() => {
      if (!programmaticRef.current) {
        setLoading(false)
      }
    }, 120)

    return () => {
      if (routeTimerRef.current) {
        clearTimeout(routeTimerRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const showLoader = (msg = '') => {
    programmaticRef.current = true
    // Cancel any pending route transition timer
    if (routeTimerRef.current) {
      clearTimeout(routeTimerRef.current)
    }
    setMessage(msg)
    setLoading(true)
  }

  const hideLoader = () => {
    programmaticRef.current = false
    setLoading(false)
    setMessage('')
  }

  return (
    <LoadingContext.Provider value={{ loading, showLoader, hideLoader }}>
      {children}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-[9999] bg-[#050505]/95 backdrop-blur-lg flex flex-col items-center justify-center pointer-events-auto select-none"
          >
            <div className="relative flex flex-col items-center gap-6">
              {/* Premium branding animations */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Outer spinning ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-gk-orange border-r-gk-orange/30"
                />
                {/* Inner counter-rotating ring */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute w-16 h-16 rounded-full border-2 border-transparent border-b-gk-yellow border-l-gk-yellow/20"
                />
                {/* Glowing center hub */}
                <div className="w-8 h-8 rounded-full bg-gk-orange/20 border border-gk-orange/40 flex items-center justify-center shadow-[0_0_20px_rgba(225,6,0,0.4)]">
                  <span className="text-[10px] font-black text-gk-orange">GK</span>
                </div>
              </div>

              {/* Loader typography, only shown for programmatic (non-route-transition) loads */}
              {message && (
                <div className="text-center space-y-1.5">
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="text-xs font-black uppercase tracking-[0.25em] text-white"
                  >
                    {message}
                  </motion.div>
                  <div className="text-[9px] font-medium text-white/40 uppercase tracking-widest">
                    Please hold on • Secure Transaction
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}
export default LoadingProvider;
