import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, ShieldAlert, CheckCircle2, ArrowRight, ArrowLeft, Loader2, User } from 'lucide-react'
import { signInCognito, signUpCognito, confirmSignUpCognito, signInWithGoogleProfile, autoConfirmUserBackend, parseJwt } from '../lib/auth'

export default function AuthModal({ isOpen, onClose, themeColor = 'purple', onAuthSuccess }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'verify'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isGoogleSelectOpen, setIsGoogleSelectOpen] = useState(false)
  const [customGoogleEmail, setCustomGoogleEmail] = useState('')

  useEffect(() => {
    if (!isOpen || mode !== 'login') return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId.includes('dummy') || clientId === '818913587248-1jgrq7f5d4g3d8a1c9h8t2s1p0c0o0p0.apps.googleusercontent.com') {
      return;
    }

    // Pre-initialize the token client so it's ready when the button is clicked.
    // We intentionally do NOT call prompt() here — the user must click the button.
    // Using initCodeClient with select_account ensures the account picker always appears.
    const waitForGIS = () => {
      if (window.google && window.google.accounts) {
        // Disable One Tap auto-prompt entirely so it never silently signs in
        window.google.accounts.id.disableAutoSelect();
      } else {
        setTimeout(waitForGIS, 150);
      }
    };
    waitForGIS();
  }, [isOpen, mode]);

  // Trigger Google account picker popup when user clicks our custom button
  const triggerGoogleAccountPicker = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google?.accounts?.oauth2) return;

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      prompt: 'select_account', // Always show account picker, never auto-pick
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          setError('Google sign-in was cancelled or failed.');
          return;
        }
        // Fetch the user info using the access token to get the ID token equivalent
        try {
          const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
          });
          const userInfo = await userInfoRes.json();
          if (!userInfo.email) throw new Error('Could not retrieve email from Google.');
          // Pass email directly to our backend (sandbox bypass mode)
          await handleSelectGoogleAccount(userInfo.email);
        } catch (err) {
          setError(err.message || 'Failed to retrieve Google account info.');
          setLoading(false);
        }
      }
    });
    tokenClient.requestAccessToken();
  };


  if (!isOpen) return null;

  const accentClass = themeColor === 'orange' ? 'text-gk-orange border-gk-orange bg-gk-orange/10' : 'text-purple-400 border-purple-500/40 bg-purple-500/10';
  const buttonClass = themeColor === 'orange' 
    ? 'bg-gk-orange hover:bg-orange-500 hover:shadow-[0_0_30px_rgba(225,6,0,0.5)]' 
    : 'bg-purple-600 hover:bg-purple-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]';

  const handleGoogleSignIn = () => {
    setError('');
    setIsGoogleSelectOpen(true);
  };

  const handleSelectGoogleAccount = async (tokenOrEmail) => {
    setIsGoogleSelectOpen(false);
    setLoading(true);
    setError('');
    try {
      const user = await signInWithGoogleProfile(tokenOrEmail);
      let displayEmail = tokenOrEmail;
      if (tokenOrEmail.includes('.')) {
        try {
          const payload = parseJwt(tokenOrEmail);
          if (payload && payload.email) {
            displayEmail = payload.email;
          }
        } catch (e) {
          console.error("Failed to parse Google ID Token for display:", e);
        }
      }
      setSuccessMessage(`Signed in as Google User: ${displayEmail}!`);
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
      await signUpCognito(email, password, fullName);
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
            <div className="mb-8 text-center sm:text-left">
              <h3 className="text-2xl font-black italic tracking-tight text-white leading-tight uppercase font-grotesk">
                {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Join the Vault' : 'Account Verification'}
              </h3>
              <p className="text-white/40 text-xs mt-2.5 font-medium leading-relaxed">
                {mode === 'login' 
                  ? 'Sign in to access your custom garage, secure exclusive drops, and track your orders.' 
                  : mode === 'signup' 
                    ? 'Create a profile to begin collecting, tracking, and unlocking exclusive premium drops.' 
                    : 'A 6-digit verification code has been dispatched to ' + email}
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-300 text-xs p-3.5 rounded-xl flex items-start gap-2">
                <ShieldAlert size={16} className="shrink-0 text-red-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-5">
                <Loader2 size={40} className={`animate-spin ${themeColor === 'orange' ? 'text-gk-orange' : 'text-purple-500'}`} />
                <p className="text-white/60 text-sm font-medium animate-pulse text-center">
                  {mode === 'login' 
                    ? 'Accessing exclusive secure vault...' 
                    : mode === 'signup' 
                      ? 'Creating collector profile...' 
                      : 'Verifying credentials...'}
                </p>
              </div>
            ) : (
              <>
                {mode === 'login' && (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                      <input 
                        required 
                        type="email" 
                        disabled={loading}
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
                        disabled={loading}
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        placeholder="Password"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors text-sm" 
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      className={`w-full py-4 rounded-xl text-white font-black text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2.5 relative overflow-hidden ${buttonClass}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Sign In</span>
                        <ArrowRight size={14} />
                      </div>
                    </button>

                    {/* Google Sign In option */}
                    <div className="relative flex py-3 items-center">
                      <div className="flex-grow border-t border-white/5"></div>
                      <span className="flex-shrink mx-4 text-white/20 text-[9px] font-bold uppercase tracking-widest">Or Continue With</span>
                      <div className="flex-grow border-t border-white/5"></div>
                    </div>

                    {/* Google Sign In — always shows account picker popup */}
                    <div className="w-full py-1">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
                          const isSandbox = !clientId || clientId.includes('dummy');
                          if (isSandbox) {
                            handleSelectGoogleAccount('harshalgadhe123@gmail.com');
                          } else {
                            triggerGoogleAccountPicker();
                          }
                        }}
                        className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white text-black hover:bg-white/90 font-bold text-sm transition-all cursor-pointer shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                          <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 15.02 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.92-2.75 3.49-4.51 6.76-4.51z"/>
                          <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.71 2.88c2.17-2 3.72-4.94 3.72-8.56z"/>
                          <path fill="#FBBC05" d="M5.24 10.55c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3L1.39 2.96C.5 4.77 0 6.81 0 8.95s.5 4.18 1.39 5.99l3.85-2.99z"/>
                          <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.71-2.88c-1.03.69-2.35 1.1-4.25 1.1-3.27 0-5.84-1.76-6.76-4.51l-3.85 2.99C3.37 20.33 7.35 23 12 23z"/>
                        </svg>
                        <span>Continue with Google</span>
                      </button>
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
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                      <input 
                        required 
                        type="text" 
                        disabled={loading}
                        value={fullName} 
                        onChange={e => setFullName(e.target.value)} 
                        placeholder="Full Name"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors text-sm" 
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                      <input 
                        required 
                        type="email" 
                        disabled={loading}
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
                        disabled={loading}
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
                        disabled={loading}
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)} 
                        placeholder="Confirm Password"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors text-sm" 
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      className={`w-full py-4 rounded-xl text-white font-black text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2.5 relative overflow-hidden ${buttonClass}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Create Account</span>
                        <ArrowRight size={14} />
                      </div>
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
                        disabled={loading}
                        value={verificationCode} 
                        onChange={e => setVerificationCode(e.target.value)} 
                        placeholder="6-Digit Verification Code"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors text-sm font-mono text-center tracking-widest" 
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      className={`w-full py-4 rounded-xl text-white font-black text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2.5 relative overflow-hidden ${buttonClass}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Confirm Registration</span>
                        <ArrowRight size={14} />
                      </div>
                    </button>

                    <div className="text-center pt-2 mt-4">
                      <button 
                        type="button"
                        onClick={handleSandboxBypass}
                        className="text-[10px] text-white/30 hover:text-white/60 transition-colors cursor-pointer bg-transparent border-none"
                      >
                        Auto-confirm sandbox account
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
