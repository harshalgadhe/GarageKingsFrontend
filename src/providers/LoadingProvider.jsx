import { createContext, useContext, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LoadingContext = createContext(null)

export function LoadingProvider({ children }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

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

  const showLoader = (msg = '') => {
    setMessage(msg)
    setLoading(true)
  }

  const hideLoader = () => {
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
            exit={{ opacity: 0 }}
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

              {/* Loader typography */}
              <div className="text-center space-y-1.5">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-xs font-black uppercase tracking-[0.25em] text-white"
                >
                  {message || 'Securing Vault Connection'}
                </motion.div>
                <div className="text-[9px] font-medium text-white/40 uppercase tracking-widest">
                  Please hold on • Secure Transaction
                </div>
              </div>
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
