import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentUser, signOutCognito } from '../lib/auth';
import { getCustomerOrders, getCustomerProfile, updateCustomerProfile } from '../lib/db';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import AuthModal from '../components/AuthModal';
import { User, FileText, Clock, Settings, LogOut, Package, ExternalLink, Calendar, MapPin, AlertCircle, Shield } from 'lucide-react';
import { ProfileSkeleton, OrderSkeleton } from '../components/Skeletons';
import { SiInstagram, SiWhatsapp } from 'react-icons/si';

export default function Account() {
  const [user, setUser] = useState(null);
  const [dbOrders, setDbOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile'
  const [error, setError] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
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
    const instagram = profile.instagram.trim().replace(/^@/, '');
    const address = profile.address.trim();
    setProfileLoading(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      const updated = await updateCustomerProfile({ ...profile, instagram, address });
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
      <div className="min-h-screen bg-[#050505] text-[#F4F1EC] font-sans flex flex-col justify-between">
        <Navigation activeSection="account" />
        
        <div className="flex-1 flex items-center justify-center px-4 py-24">
          <div className="w-full max-w-md bg-[#0B0B0B] border border-white/[0.08] rounded-[28px] p-8 sm:p-10 text-center shadow-[0_32px_90px_rgba(0,0,0,.55)] relative overflow-hidden">
            <div className="absolute top-0 inset-x-14 h-px bg-gradient-to-r from-transparent via-[#C8AE7D]/80 to-transparent" />
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-[#C8AE7D]/[0.07] border border-[#C8AE7D]/25 flex items-center justify-center text-[#D7C59D]">
                <User size={26} strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C8AE7D] mb-3">Your GarageKings account</p>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] mb-3 text-[#F4F1EC]">Your details, in one place.</h1>
            <p className="text-sm text-[#8C8881] leading-6 mb-8 max-w-sm mx-auto">
              Sign in to manage your profile, contact information, and delivery details.
            </p>
            <button 
              onClick={() => setAuthOpen(true)}
              className="w-full bg-[#F2EEE7] hover:bg-white text-[#11100E] font-bold text-[11px] py-4 px-6 rounded-full uppercase tracking-[0.16em] transition-all cursor-pointer active:scale-[0.98]"
            >
              Sign In to Account
            </button>
          </div>
        </div>

        <AuthModal
          isOpen={authOpen}
          onClose={() => setAuthOpen(false)}
          onAuthSuccess={(signedInUser) => {
            setUser(signedInUser)
            setAuthOpen(false)
            window.location.reload()
          }}
        />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#F4F1EC] font-sans flex flex-col selection:bg-[#C8AE7D] selection:text-black">
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
        <div className="flex-1 max-w-6xl w-full mx-auto px-5 md:px-8 pt-24 pb-28 md:py-32 flex flex-col lg:flex-row gap-7 lg:gap-10">
          
          {/* Left Sidebar */}
          <aside className="lg:w-72 flex-shrink-0 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 bg-[#0B0B0B] border border-white/[0.08] rounded-[24px] p-3 h-fit lg:sticky lg:top-24 scrollbar-none shadow-[0_24px_70px_rgba(0,0,0,.25)]">
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap lg:w-full cursor-pointer border bg-[#C8AE7D]/[0.07] border-[#C8AE7D]/20 text-[#DDCBA3]"
            >
              <User size={16} />
              <span className="flex-1 text-left">Profile</span>
            </button>
            
            {(user?.role?.toLowerCase() === 'owner' || user?.role?.toLowerCase() === 'admin' || user?.roles?.includes('owner') || user?.roles?.includes('admin')) && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-medium text-[#8C8881] hover:bg-white/[0.03] hover:border-white/[0.07] hover:text-[#F4F1EC] border border-transparent transition-all lg:w-full cursor-pointer whitespace-nowrap"
              >
                <Shield size={16} />
                <span className="flex-1 text-left">Admin Console</span>
              </button>
            )}
            
            <div className="hidden lg:block border-t border-white/5 my-3" />
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-medium text-[#8C8881] hover:text-[#F4F1EC] hover:bg-white/[0.03] border border-transparent transition-all lg:w-full cursor-pointer whitespace-nowrap"
            >
              <LogOut size={16} className="text-[#77736C]" />
              <span>Sign Out</span>
            </button>
          </aside>

          {/* Right Content Area */}
          <main className="flex-1 min-w-0 bg-[#0B0B0B] border border-white/[0.08] rounded-[24px] p-5 sm:p-7 md:p-8 relative shadow-[0_24px_70px_rgba(0,0,0,.28)]">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
              <div>
                <p className="text-[10px] font-semibold text-[#C8AE7D] uppercase tracking-[0.22em]">
                  Your account
                </p>
                <h1 className="text-3xl font-semibold tracking-[-0.035em] text-[#F4F1EC] mt-2">
                  Profile details
                </h1>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-[#B97967]/[0.08] border border-[#B97967]/25 rounded-2xl text-xs text-[#D9A797] font-medium mb-6 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Profile Form */}
            {user && (
              <div className="space-y-6 text-left">
                <form onSubmit={handleProfileSave} className="space-y-6">
                  <div className="bg-[#080808] border border-white/[0.07] rounded-2xl p-5 sm:p-6 space-y-6">
                    <div>
                      <h3 className="text-base font-semibold text-[#F4F1EC]">Contact and delivery</h3>
                      <p className="text-xs text-[#77736C] mt-1 leading-5">
                        Manage your contact details and delivery address.
                      </p>
                    </div>

                    {profileSuccess && (
                      <div className="p-3 bg-[#6F9C7A]/[0.08] border border-[#6F9C7A]/25 rounded-xl text-xs text-[#9CC5A5] font-medium">
                        {profileSuccess}
                      </div>
                    )}

                    {profileError && (
                      <div className="p-3 bg-[#B97967]/[0.08] border border-[#B97967]/25 rounded-xl text-xs text-[#D9A797] font-medium">
                        Error: {profileError}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-[#817D76] uppercase tracking-[0.17em] block">Full name</label>
                        <input 
                          type="text" 
                          value={profile.fullName} 
                          onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                          placeholder="Enter full name"
                          className="w-full bg-[#0D0D0D] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-[#F4F1EC] placeholder-[#57534D] focus:outline-none focus:border-[#C8AE7D]/55 focus:shadow-[0_0_0_3px_rgba(200,174,125,.07)] transition"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="flex items-center gap-2 text-[10px] font-semibold text-[#817D76] uppercase tracking-[0.17em]"><SiWhatsapp size={13} className="text-[#25D366]" /> Phone / WhatsApp</label>
                        <input 
                          type="text" 
                          value={profile.phone} 
                          onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="For delivery updates"
                          className="w-full bg-[#0D0D0D] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-[#F4F1EC] placeholder-[#57534D] focus:outline-none focus:border-[#C8AE7D]/55 focus:shadow-[0_0_0_3px_rgba(200,174,125,.07)] transition"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="flex items-center gap-2 text-[10px] font-semibold text-[#817D76] uppercase tracking-[0.17em]"><SiInstagram size={13} className="text-[#E1306C]" /> Instagram handle <span className="normal-case tracking-normal text-[#57534D]">Optional</span></label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-[#444444] text-xs">@</span>
                          <input 
                            type="text" 
                            value={profile.instagram} 
                            onChange={(e) => setProfile(prev => ({ ...prev, instagram: e.target.value }))}
                            placeholder="instagram_handle"
                            className="w-full bg-[#0D0D0D] border border-white/[0.08] rounded-xl pl-8 pr-4 py-3.5 text-sm text-[#F4F1EC] placeholder-[#57534D] focus:outline-none focus:border-[#C8AE7D]/55 focus:shadow-[0_0_0_3px_rgba(200,174,125,.07)] transition"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-[#817D76] uppercase tracking-[0.17em] block">Email address</label>
                        <input 
                          type="text" 
                          value={user.email} 
                          disabled 
                          className="w-full bg-[#0A0A0A] border border-white/[0.06] rounded-xl px-4 py-3.5 text-sm text-[#67635D] focus:outline-none cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-[#817D76] uppercase tracking-[0.17em] block">Delivery or collection address <span className="normal-case tracking-normal text-[#57534D]">Optional</span></label>
                      <textarea 
                        value={profile.address} 
                        onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Street address, building, city, state, pincode"
                        rows="3"
                        className="w-full bg-[#0D0D0D] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-[#F4F1EC] placeholder-[#57534D] focus:outline-none focus:border-[#C8AE7D]/55 focus:shadow-[0_0_0_3px_rgba(200,174,125,.07)] transition resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="w-full sm:w-auto bg-[#F2EEE7] hover:bg-white disabled:opacity-50 text-[#11100E] font-bold text-[11px] py-3.5 px-7 rounded-full uppercase tracking-[0.15em] transition cursor-pointer active:scale-[0.98]"
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
