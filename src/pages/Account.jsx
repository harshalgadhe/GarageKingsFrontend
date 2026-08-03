import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentUser, signOutCognito } from '../lib/auth';
import { getCustomerOrders, getCustomerProfile, updateCustomerProfile } from '../lib/db';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { User, FileText, Clock, Settings, LogOut, Package, ExternalLink, Calendar, MapPin, AlertCircle, Shield } from 'lucide-react';
import { ProfileSkeleton, OrderSkeleton } from '../components/Skeletons';

export default function Account() {
  const [user, setUser] = useState(null);
  const [dbOrders, setDbOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile'
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Shipping Profile State
  const [profile, setProfile] = useState({ fullName: '', phone: '', instagram: '', address: '', city: 'Unknown' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Remaining Payment Upload State
  const [uploadingOrderId, setUploadingOrderId] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      // Redirect or let user see log in screen
      setLoading(false);
      return;
    }
    setUser(currentUser);

    // Handle returnTo redirect if logged in
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('returnTo');
    if (returnTo) {
      navigate(returnTo);
      return;
    }

    async function loadOrdersAndProfile() {
      try {
        const [data, prof] = await Promise.all([
          getCustomerOrders(),
          getCustomerProfile()
        ]);
        if (!getCurrentUser()) {
          setUser(null);
          setLoading(false);
          return;
        }
        setDbOrders(data || []);
        if (prof) {
          const displayPhone = (prof.phone && prof.phone.startsWith('unknown_')) ? '' : (prof.phone || '');
          setProfile({
            fullName: prof.fullName || '',
            phone: displayPhone,
            instagram: prof.instagram || '',
            address: prof.address || '',
            city: prof.city || 'Unknown'
          });
          if (prof.fullName && prof.fullName !== currentUser.displayName) {
            currentUser.displayName = prof.fullName;
            localStorage.setItem('gk_user', JSON.stringify(currentUser));
            setUser(currentUser);
            window.dispatchEvent(new Event('gk_user_updated'));
          }
        }
      } catch (err) {
        console.error("Failed to load customer details:", err);
        if (!getCurrentUser()) {
          setUser(null);
        } else {
          setError("Unable to retrieve account details.");
        }
      } finally {
        setLoading(false);
      }
    }
    loadOrdersAndProfile();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      const updated = await updateCustomerProfile(profile);
      if (updated) {
        const displayPhone = (updated.phone && updated.phone.startsWith('unknown_')) ? '' : (updated.phone || '');
        setProfile({
          fullName: updated.fullName || '',
          phone: displayPhone,
          instagram: updated.instagram || '',
          address: updated.address || '',
          city: updated.city || 'Unknown'
        });
        const currentUser = getCurrentUser();
        if (currentUser && updated.fullName && updated.fullName !== currentUser.displayName) {
          currentUser.displayName = updated.fullName;
          localStorage.setItem('gk_user', JSON.stringify(currentUser));
          setUser(currentUser);
          window.dispatchEvent(new Event('gk_user_updated'));
        }
      }
      setProfileSuccess('Shipping profile updated successfully!');
    } catch (err) {
      if (!getCurrentUser()) {
        setUser(null);
      } else {
        setProfileError(err.message || 'Failed to update profile.');
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUploadRemainingPayment = async (orderId) => {
    if (!uploadFile) {
      setUploadError('Please select a payment receipt image first.');
      return;
    }
    setUploadLoading(true);
    setUploadError('');
    setUploadSuccess('');

    const formData = new FormData();
    formData.append('file', uploadFile);

    const API_BASE_URL = import.meta.env.PROD 
      ? '/api/v1' 
      : (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1');

    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/submit-remaining-payment`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!res.ok) {
        let errorMsg = 'Failed to submit remaining payment.';
        try {
          const errJson = await res.json();
          errorMsg = errJson.message || errorMsg;
        } catch (_) {
          try {
            const text = await res.text();
            if (text) errorMsg = text;
          } catch (__) {}
        }
        throw new Error(errorMsg);
      }

      setUploadSuccess('Remaining payment screenshot submitted successfully! Admin will verify shortly.');
      setUploadFile(null);
      setUploadingOrderId(null);

      // Reload orders
      const updatedOrders = await getCustomerOrders();
      setDbOrders(updatedOrders || []);
    } catch (err) {
      setUploadError(err.message || 'Error uploading receipt.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOutCognito();
    window.location.href = '/account';
  };

  // Group items by Order ID
  const groupedOrders = useMemo(() => {
    const groups = {};
    dbOrders.forEach(item => {
      if (!groups[item.id]) {
        groups[item.id] = {
          id: item.id,
          status: item.status,
          totalPrice: item.totalPrice,
          shippingAddress: item.shippingAddress,
          trackingNumber: item.trackingNumber,
          createdAt: item.createdAt,
          expiresAt: item.expiresAt,
          screenshotUrl: item.screenshotUrl,
          bookingType: item.bookingType,
          advanceAmount: item.advanceAmount,
          remainingAmount: item.remainingAmount,
          items: []
        };
      }
      groups[item.id].items.push({
        name: item.productName,
        brand: item.productBrand,
        priceAtPurchase: item.priceAtPurchase,
        qty: item.qty
      });
    });
    return Object.values(groups);
  }, [dbOrders]);

  const orders = useMemo(() => {
    return groupedOrders;
  }, [groupedOrders]);

  // Expiration Checker
  const checkIsExpired = (expiresAt) => {
    if (!expiresAt) return true;
    return new Date(expiresAt) <= new Date();
  };

  // Render Login Prompt if Not Authenticated
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-gk-black text-white font-sans flex flex-col justify-between">
        <Navigation activeSection="account" />
        
        <div className="flex-1 flex items-center justify-center px-4 py-24">
          <div className="w-full max-w-md bg-[#111111] border border-white/5 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gk-orange" />
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-gk-orange/10 border border-gk-orange/20 flex items-center justify-center text-gk-orange">
                <User size={32} />
              </div>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-wide mb-3 text-white">Profile</h1>
            <p className="text-xs text-zinc-500 leading-relaxed mb-8 max-w-sm mx-auto">
              Sign in to manage your profile, contact information, and delivery details.
            </p>
            <button 
              onClick={() => {
                // Trigger navigation profile click which prompts login modal
                const btn = document.querySelector('[title="Collector Profile"]');
                if (btn) btn.click();
              }}
              className="w-full bg-gk-orange hover:bg-orange-500 text-white font-black text-xs py-4 px-6 rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(255,85,0,0.2)]"
            >
              Sign In to Account
            </button>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gk-black text-white font-sans flex flex-col selection:bg-gk-orange selection:text-black">
      <Navigation activeSection="account" />

      {loading ? (
        <div className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-24 md:py-32">
          <ProfileSkeleton />
          <div className="mt-8 space-y-4">
            <OrderSkeleton />
            <OrderSkeleton />
            <OrderSkeleton />
          </div>
        </div>
      ) : (
        <div className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-24 md:py-32 flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar */}
          <aside className="lg:w-64 flex-shrink-0 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 bg-[#111111] border border-white/5 rounded-2xl p-3 h-fit lg:sticky lg:top-24 scrollbar-none">
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap lg:w-full cursor-pointer border bg-gk-orange/10 border-gk-orange/30 text-gk-orange shadow-[0_0_15px_-5px_rgba(255,85,0,0.15)]"
            >
              <User size={16} />
              <span className="flex-1 text-left">Profile</span>
            </button>
            
            {(user?.role?.toLowerCase() === 'owner' || user?.role?.toLowerCase() === 'admin' || user?.roles?.includes('owner') || user?.roles?.includes('admin')) && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/20 border border-transparent transition-all lg:w-full cursor-pointer whitespace-nowrap"
              >
                <Shield size={16} />
                <span className="flex-1 text-left">Admin Console</span>
              </button>
            )}
            
            <div className="hidden lg:block border-t border-white/5 my-3" />
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-medium uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent transition-all lg:w-full cursor-pointer whitespace-nowrap"
            >
              <LogOut size={16} className="text-zinc-500" />
              <span>Sign Out</span>
            </button>
          </aside>

          {/* Right Content Area */}
          <main className="flex-1 min-w-0 bg-[#111111]/40 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
              <div>
                <p className="text-[10px] font-bold text-gk-orange uppercase tracking-widest">
                  Account Dashboard • Profile
                </p>
                <h1 className="text-2xl font-black uppercase tracking-wide text-white mt-1">
                  Profile
                </h1>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400 font-semibold tracking-wide uppercase mb-6 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Profile Form */}
            {user && (
              <div className="space-y-6 text-left">
                <form onSubmit={handleProfileSave} className="space-y-6">
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white">Profile Details</h3>
                      <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">
                        Manage your contact details and delivery address.
                      </p>
                    </div>

                    {profileSuccess && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                        {profileSuccess}
                      </div>
                    )}

                    {profileError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-400 font-bold uppercase tracking-wider">
                        Error: {profileError}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Recipient Name</label>
                        <input 
                          type="text" 
                          value={profile.fullName} 
                          onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                          placeholder="Enter full name"
                          className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-[#444444] focus:outline-none focus:border-gk-orange/40 transition-colors"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Phone / WhatsApp</label>
                        <input 
                          type="text" 
                          value={profile.phone} 
                          onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="For delivery updates"
                          className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-[#444444] focus:outline-none focus:border-gk-orange/40 transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Instagram Handle</label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-[#444444] text-xs">@</span>
                          <input 
                            type="text" 
                            value={profile.instagram} 
                            onChange={(e) => setProfile(prev => ({ ...prev, instagram: e.target.value }))}
                            placeholder="instagram_handle"
                            className="w-full bg-[#141414] border border-white/5 rounded-xl pl-8 pr-4 py-3 text-xs text-white placeholder-[#444444] focus:outline-none focus:border-gk-orange/40 transition-colors"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Email Address</label>
                        <input 
                          type="text" 
                          value={user.email} 
                          disabled 
                          className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-500 focus:outline-none cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Address</label>
                      <textarea 
                        value={profile.address} 
                        onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Street address, building, city, state, pincode"
                        rows="3"
                        className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-[#444444] focus:outline-none focus:border-gk-orange/40 transition-colors resize-none"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="bg-gk-orange hover:bg-orange-500 disabled:bg-gk-orange/50 text-white font-black text-xs py-3.5 px-6 rounded-xl uppercase tracking-wider transition-colors cursor-pointer shadow-[0_0_15px_rgba(255,85,0,0.1)]"
                    >
                      {profileLoading ? 'Saving Profile...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </main>
        </div>
      )}

      <Footer />
    </div>
  );
}
