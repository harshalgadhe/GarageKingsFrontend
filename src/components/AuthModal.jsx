import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, ShieldAlert, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'
import { signInCognito, signUpCognito, confirmSignUpCognito, signInWithGoogleProfile, autoConfirmUserBackend, parseJwt } from '../lib/auth'

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

  useEffect(() => {
    if (isOpen && mode === 'login') {
      const initGoogleOAuth = () => {
        if (window.google && window.google.accounts) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '818913587248-1jgrq7f5d4g3d8a1c9h8t2s1p0c0o0p0.apps.googleusercontent.com',
            callback: (response) => {
              if (response.credential) {
                try {
                  const payload = parseJwt(response.credential);
                  if (payload && payload.email) {
                    handleSelectGoogleAccount(payload.email);
                  }
                } catch (e) {
                  console.error("Failed to parse Google ID Token:", e);
                  setError("Google authentication parsing failed.");
                }
              }
            }
          });

          const btnContainer = document.getElementById('google-signin-btn-container');
          if (btnContainer) {
            window.google.accounts.id.renderButton(
              btnContainer,
              { 
                theme: 'filled_black', 
                size: 'large', 
                text: 'signin_with', 
                width: '380',
                shape: 'pill'
              }
            );
          }
        } else {
          setTimeout(initGoogleOAuth, 150);
        }
      };

      initGoogleOAuth();
    }
  }, [isOpen, mode]);

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

                {/* Real native browser Google OAuth Sign-in Button */}
                <div className="w-full flex justify-center py-1">
                  <div id="google-signin-btn-container" className="w-full flex justify-center"></div>
                </div>

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
