import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, ShieldAlert, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'
import { signInCognito, signUpCognito, confirmSignUpCognito, signInWithGoogleProfile, autoConfirmUserBackend } from '../lib/auth'

export default function AuthModal({ isOpen, onClose, themeColor = 'purple', onAuthSuccess }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'verify'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isGoogleSelectOpen, setIsGoogleSelectOpen] = useState(false)
  const [customGoogleEmail, setCustomGoogleEmail] = useState('')

  if (!isOpen) return null;

  const accentClass = themeColor === 'orange' ? 'text-gk-orange border-gk-orange bg-gk-orange/10' : 'text-purple-400 border-purple-500/40 bg-purple-500/10';
  const buttonClass = themeColor === 'orange' 
    ? 'bg-gk-orange hover:bg-orange-500 hover:shadow-[0_0_30px_rgba(225,6,0,0.5)]' 
    : 'bg-purple-600 hover:bg-purple-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]';

  const handleGoogleSignIn = () => {
    setError('');
    setIsGoogleSelectOpen(true);
  };

  const handleSelectGoogleAccount = async (selectedEmail) => {
    setIsGoogleSelectOpen(false);
    setLoading(true);
    setError('');
    try {
      const user = await signInWithGoogleProfile(selectedEmail);
      setSuccessMessage(`Signed in as Google User: ${selectedEmail}!`);
      if (onAuthSuccess) {
        setTimeout(() => {
          onAuthSuccess(user);
          onClose();
        }, 1500);
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Google Profile Authentication failed.');
      setLoading(false);
    }
  };

  const handleSandboxBypass = async () => {
    if (!email) {
      setError('Please input your registered email address first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      setSuccessMessage('Sandbox bypass triggered! Verifying email on AWS Cognito...');
      await autoConfirmUserBackend(email);
      setSuccessMessage('Account verified! Auto-signing you in...');
      
      // Auto login
      const user = await signInCognito(email, password);
      if (onAuthSuccess) {
        setTimeout(() => {
          onAuthSuccess(user);
          onClose();
        }, 1500);
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Sandbox bypass failed. Please confirm the account manually.');
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await signInCognito(email, password);
      setSuccessMessage('Successfully signed in! Accessing secure vault...');
      if (onAuthSuccess) {
        setTimeout(() => {
          onAuthSuccess(user);
          onClose();
        }, 1500);
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to authenticate.');
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setLoading(true);
    try {
      await signUpCognito(email, password);
      setSuccessMessage('Account registered! Verification code sent to email.');
      setTimeout(() => {
        setSuccessMessage('');
        setMode('verify');
        setLoading(false);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Registration failed.');
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await confirmSignUpCognito(email, verificationCode);
      setSuccessMessage('Email verified! Auto-signing you in...');
      
      // Auto login after email verification
      const user = await signInCognito(email, password);
      if (onAuthSuccess) {
        setTimeout(() => {
          onAuthSuccess(user);
          onClose();
        }, 1500);
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Invalid validation code.');
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, y: 15 }} 
        animate={{ scale: 1, y: 0 }} 
        exit={{ scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="w-full max-w-md bg-[#0a0a0d] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Top brand lightbar */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${themeColor === 'orange' ? 'from-gk-orange to-transparent' : 'from-purple-500 to-transparent'}`} />

        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {successMessage ? (
          <div className="text-center py-10">
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ type: 'spring', damping: 12 }} 
              className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 size={32} className="text-emerald-400" />
            </motion.div>
            <h3 className="text-xl font-black text-white mb-2">Success!</h3>
            <p className="text-white/50 text-sm">{successMessage}</p>
          </div>
        ) : isGoogleSelectOpen ? (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <button 
                onClick={() => setIsGoogleSelectOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
              </button>
              <h3 className="text-xl font-black text-white leading-tight">Sign in with Google</h3>
            </div>
            
            <p className="text-white/40 text-xs mb-6 font-inter leading-relaxed">
              Select a Google account to securely access your collection and order history instantly:
            </p>
            
            <div className="space-y-3">
              {[
                { email: 'harshalgadhe123@gmail.com', name: 'Harshal Gadhe', initials: 'HG', badge: 'Active Collector' },
                { email: '2019068@iiitdmj.ac.in', name: 'IIITDMJ Account', initials: 'II', badge: 'Institutional' }
              ].map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleSelectGoogleAccount(acc.email)}
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/[0.08] transition-all text-left flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black text-xs text-white group-hover:bg-white/20 transition-colors">
                      {acc.initials}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm font-grotesk">{acc.name}</div>
                      <div className="text-white/40 text-xs font-mono">{acc.email}</div>
                    </div>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 px-2 py-0.5 rounded-full font-grotesk">
                    {acc.badge}
                  </span>
                </button>
              ))}
              
              <div className="relative flex py-3 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-3 text-white/20 text-[9px] font-bold uppercase tracking-widest font-grotesk">Or Use Custom Email</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customGoogleEmail.trim()) {
                    handleSelectGoogleAccount(customGoogleEmail.trim());
                  }
                }}
                className="space-y-3"
              >
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input 
                    required 
                    type="email" 
                    value={customGoogleEmail} 
                    onChange={e => setCustomGoogleEmail(e.target.value)} 
                    placeholder="Enter other Google Email..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors text-sm" 
                  />
                </div>
                <button 
                  type="submit"
                  className={`w-full py-3.5 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5`}
                >
                  Connect Custom Profile
                  <ArrowRight size={12} />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-3 ${accentClass}`}>
                <Lock size={9} />
                Secure Portal
              </div>
              <h3 className="text-2xl font-black tracking-tight text-white leading-tight">
                {mode === 'login' ? 'Access Your Collection' : mode === 'signup' ? 'Create Collector Profile' : 'Verify Your Email'}
              </h3>
              <p className="text-white/40 text-xs mt-1">
                {mode === 'login' ? 'Authentication required to place bids and checkout orders.' : mode === 'signup' ? 'Join Garage Kings to build your vault and participate in live drops.' : 'We\'ve sent a confirmation code to ' + email}
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-300 text-xs p-3.5 rounded-xl flex items-start gap-2">
                <ShieldAlert size={16} className="shrink-0 text-red-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input 
                    required 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="Email Address"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors text-sm" 
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input 
                    required 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors text-sm" 
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full py-4 rounded-xl text-white font-black text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${buttonClass}`}
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                  {!loading && <ArrowRight size={14} />}
                </button>

                {/* Google Sign In option */}
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink mx-4 text-white/25 text-[10px] font-black uppercase tracking-wider">Or Continue With</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button 
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-3.5 rounded-xl bg-white text-black font-black text-sm uppercase tracking-wider transition-all border border-white/10 hover:bg-neutral-100 flex items-center justify-center gap-3 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Google Profile
                </button>

                <div className="text-center text-xs mt-4 text-white/40">
                  New collector?{' '}
                  <button 
                    type="button" 
                    onClick={() => setMode('signup')} 
                    className="text-white font-bold hover:underline cursor-pointer"
                  >
                    Register Here
                  </button>
                </div>
              </form>
            )}

            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input 
                    required 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="Email Address"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors text-sm" 
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input 
                    required 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Password (Min 8 Characters)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors text-sm" 
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input 
                    required 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    placeholder="Confirm Password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors text-sm" 
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full py-4 rounded-xl text-white font-black text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${buttonClass}`}
                >
                  {loading ? 'Creating Profile...' : 'Create Account'}
                  {!loading && <ArrowRight size={14} />}
                </button>

                <div className="text-center text-xs mt-4 text-white/40">
                  Already registered?{' '}
                  <button 
                    type="button" 
                    onClick={() => setMode('login')} 
                    className="text-white font-bold hover:underline cursor-pointer"
                  >
                    Log In
                  </button>
                </div>
              </form>
            )}

            {mode === 'verify' && (
              <form onSubmit={handleVerify} className="space-y-4">
                <p className="text-xs text-[#E10600] font-black uppercase tracking-wider mb-2 font-grotesk">Check Your Inbox</p>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input 
                    required 
                    type="text" 
                    value={verificationCode} 
                    onChange={e => setVerificationCode(e.target.value)} 
                    placeholder="6-Digit Verification Code"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors text-sm font-mono text-center tracking-widest" 
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full py-4 rounded-xl text-white font-black text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${buttonClass}`}
                >
                  {loading ? 'Verifying Code...' : 'Confirm Registration'}
                  {!loading && <ArrowRight size={14} />}
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/5"></div>
                  <span className="flex-shrink mx-4 text-white/15 text-[9px] font-black uppercase tracking-widest">Sandbox Dev Bypass</span>
                  <div className="flex-grow border-t border-white/5"></div>
                </div>

                <div className="bg-[#E10600]/5 border border-[#E10600]/25 rounded-2xl p-4 text-center">
                  <p className="text-white/40 text-[10px] leading-relaxed mb-3">
                    Cognito Sandbox email delivery might be delayed or filtered out in local testing.
                  </p>
                  <button 
                    type="button"
                    onClick={handleSandboxBypass}
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg bg-[#E10600]/15 hover:bg-[#E10600]/30 border border-[#E10600]/35 text-[#E10600] text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    {loading ? 'Confirming User...' : 'Auto-Confirm Account'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
