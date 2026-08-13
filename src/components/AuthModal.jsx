import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Loader2, ShieldAlert, X } from 'lucide-react'
import { signInWithGoogleProfile } from '../lib/auth'

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const isGoogleAvailable = Boolean(clientId && !clientId.includes('dummy'))

  useEffect(() => {
    if (!isOpen) return
    setError('')
    setLoading(false)
    setSuccessMessage('')
    if (!isGoogleAvailable) return

    const waitForGoogle = () => {
      if (window.google?.accounts) {
        window.google.accounts.id.disableAutoSelect()
        return
      }
      window.setTimeout(waitForGoogle, 150)
    }
    waitForGoogle()
  }, [isGoogleAvailable, isOpen])

  if (!isOpen) return null

  const triggerGoogleAccountPicker = () => {
    if (!isGoogleAvailable) {
      setError('Google sign-in is not configured for this environment.')
      return
    }
    if (!window.google?.accounts?.oauth2) {
      setError('Google sign-in is still loading. Please try again in a moment.')
      return
    }

    setError('')
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      prompt: 'select_account',
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          setError('Google sign-in was cancelled or could not be completed.')
          return
        }
        try {
          setLoading(true)
          const user = await signInWithGoogleProfile(tokenResponse.access_token)
          setSuccessMessage(`Signed in as ${user.email || 'Google user'}`)
          window.setTimeout(() => {
            if (onAuthSuccess) onAuthSuccess(user)
            else window.location.reload()
            onClose()
          }, 900)
        } catch (err) {
          setError(err.status >= 500
            ? 'Google sign-in is temporarily unavailable. Please try again shortly.'
            : (err.message || 'Google sign-in could not be completed.'))
          setLoading(false)
        }
      },
    })
    tokenClient.requestAccessToken()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }}
        transition={{ type: 'spring', damping: 26, stiffness: 350 }}
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0B0B0B] p-7 shadow-[0_28px_80px_rgba(0,0,0,0.75)] sm:p-9"
        onClick={(event) => event.stopPropagation()}>
        <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-[#C8AE7D]/80 to-transparent" />
        <button type="button" onClick={onClose} aria-label="Close sign-in"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/40 transition-colors hover:text-white">
          <X size={16} />
        </button>

        {successMessage ? (
          <div className="py-10 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
              <CheckCircle2 size={32} className="text-emerald-400" />
            </motion.div>
            <h3 className="mb-2 text-xl font-semibold text-white">Welcome back</h3>
            <p className="text-sm text-white/50">{successMessage}</p>
          </div>
        ) : (
          <>
            <div className="mb-8 pr-8">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C8AE7D]">GarageKings account</p>
              <h3 className="font-grotesk text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#F4F1EC]">Continue with Google</h3>
              <p className="mt-3 text-sm font-medium leading-relaxed text-[#9A968F]">
                One secure sign-in for your profile, contact information and delivery details. No password to remember.
              </p>
            </div>

            {error && <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-300">
              <ShieldAlert size={16} className="mt-0.5 shrink-0 text-red-400" /><span>{error}</span>
            </div>}

            <button type="button" disabled={loading || !isGoogleAvailable} onClick={triggerGoogleAccountPicker}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-[#F2EEE7] px-5 py-4 text-sm font-bold text-[#11100E] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45">
              {loading ? <Loader2 size={20} className="animate-spin" /> : (
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 15.02 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.92-2.75 3.49-4.51 6.76-4.51z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.71 2.88c2.17-2 3.72-4.94 3.72-8.56z" />
                  <path fill="#FBBC05" d="M5.24 10.55c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3L1.39 2.96C.5 4.77 0 6.81 0 8.95s.5 4.18 1.39 5.99l3.85-2.99z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.71-2.88c-1.03.69-2.35 1.1-4.25 1.1-3.27 0-5.84-1.76-6.76-4.51l-3.85 2.99C3.37 20.33 7.35 23 12 23z" />
                </svg>
              )}
              <span>{loading ? 'Connecting securely...' : 'Continue with Google'}</span>
            </button>

            {!isGoogleAvailable && <p className="mt-4 text-center text-xs text-white/35">Google sign-in is unavailable in this environment.</p>}
            <p className="mt-5 text-center text-[11px] leading-relaxed text-white/30">
              GarageKings only receives your name, email address and Google profile identity.
            </p>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
