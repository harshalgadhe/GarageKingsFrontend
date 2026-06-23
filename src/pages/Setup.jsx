import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSetupStatus, setupOwner } from '../lib/auth';

export default function Setup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkStatus() {
      const status = await getSetupStatus();
      if (status && !status.isSetupRequired) {
        navigate('/garage');
      }
    }
    checkStatus();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await setupOwner(email, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/garage');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Owner account initialization failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090909] text-white flex flex-col justify-center items-center px-4 font-sans selection:bg-[#ff5500] selection:text-black">
      {/* Background visual accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,85,0,0.03)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="w-full max-w-md bg-[#111111]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-8 relative overflow-hidden shadow-[0_0_50px_-12px_rgba(255,85,0,0.1)]">
        {/* Decorative orange top line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#ff5500] to-transparent" />

        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#ff5500]/10 border border-[#ff5500]/20 text-[#ff5500] mb-4 text-xl font-bold tracking-wider">
            GK
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            INITIALIZE OPERATING SYSTEM
          </h1>
          <p className="text-xs text-[#888888] mt-1 uppercase tracking-widest">
            First Startup Owner Registration
          </p>
        </div>

        {success ? (
          <div className="space-y-4 text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-2xl mb-2">
              ✓
            </div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Setup Complete</h2>
            <p className="text-sm text-[#888888]">
              Owner credentials initialized. Redirecting to auth portal...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium tracking-wide uppercase">
                Error: {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">
                Owner Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@garagekings.in"
                className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-[#444444] focus:outline-none focus:border-[#ff5500]/40 transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">
                Secure Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-[#444444] focus:outline-none focus:border-[#ff5500]/40 transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-[#444444] focus:outline-none focus:border-[#ff5500]/40 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff5500] hover:bg-[#ff6611] active:bg-[#e64d00] disabled:bg-[#ff5500]/50 text-black font-extrabold text-sm py-3.5 px-4 rounded-xl transition-all duration-200 uppercase tracking-wider mt-2 shadow-[0_4px_20px_-4px_rgba(255,85,0,0.3)] hover:shadow-[0_4px_24px_-2px_rgba(255,85,0,0.4)]"
            >
              {loading ? 'Bootstrapping...' : 'Initialize Owner Account'}
            </button>
          </form>
        )}
      </div>

      <div className="mt-8 text-center text-[10px] text-[#444444] tracking-widest uppercase">
        GarageKings Operating System • Secure Presentational Sandbox
      </div>
    </div>
  );
}
