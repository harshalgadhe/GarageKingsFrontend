import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentUser, signOutCognito } from '../lib/auth';
import { getCustomerOrders, getCustomerProfile, updateCustomerProfile } from '../lib/db';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { User, FileText, Clock, Settings, LogOut, Package, ExternalLink, Calendar, MapPin, AlertCircle, Shield } from 'lucide-react';

export default function Account() {
  const [user, setUser] = useState(null);
  const [dbOrders, setDbOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'settings'
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Shipping Profile State
  const [profile, setProfile] = useState({ fullName: '', phone: '', instagram: '', address: '', city: 'Unknown' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      // Redirect or let user see log in screen
      setLoading(false);
      return;
    }
    setUser(currentUser);

    async function loadOrdersAndProfile() {
      try {
        const [data, prof] = await Promise.all([
          getCustomerOrders(),
          getCustomerProfile()
        ]);
        setDbOrders(data || []);
        if (prof) {
          setProfile({
            fullName: prof.fullName || '',
            phone: prof.phone || '',
            instagram: prof.instagram || '',
            address: prof.address || '',
            city: prof.city || 'Unknown'
          });
        }
      } catch (err) {
        console.error("Failed to load customer details:", err);
        setError("Unable to retrieve account details.");
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
        setProfile({
          fullName: updated.fullName || '',
          phone: updated.phone || '',
          instagram: updated.instagram || '',
          address: updated.address || '',
          city: updated.city || 'Unknown'
        });
      }
      setProfileSuccess('Shipping profile updated successfully!');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
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
            <h1 className="text-2xl font-black uppercase tracking-wide mb-3 text-white">Collector Space</h1>
            <p className="text-xs text-zinc-500 leading-relaxed mb-8 max-w-sm mx-auto">
              Access your personal dashboard to track reserved castings, check purchase history, and manage your collector details.
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
        <div className="flex-1 flex flex-col items-center justify-center py-32">
          <div className="w-12 h-12 rounded-full border-4 border-gk-orange/20 border-t-gk-orange animate-spin mb-4" />
          <div className="text-xs uppercase tracking-widest text-gk-orange font-black animate-pulse">Accessing Vault Profile...</div>
        </div>
      ) : (
        <div className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-24 md:py-32 flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar */}
          <aside className="lg:w-64 flex-shrink-0 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 bg-[#111111] border border-white/5 rounded-2xl p-3 h-fit lg:sticky lg:top-24 scrollbar-none">
            {[
              { id: 'orders', label: 'My Orders', icon: Package, count: orders.length },
              { id: 'settings', label: 'Account Settings', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap lg:w-full cursor-pointer border ${
                    active 
                      ? 'bg-gk-orange/10 border-gk-orange/30 text-gk-orange shadow-[0_0_15px_-5px_rgba(255,85,0,0.15)]' 
                      : 'border-transparent text-zinc-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} />
                  <span className="flex-1 text-left">{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="bg-gk-orange text-black font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
            
            {(user.role?.toLowerCase() === 'owner' || user.role?.toLowerCase() === 'admin' || user.roles?.includes('owner') || user.roles?.includes('admin')) && (
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
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider text-red-400 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all lg:w-full cursor-pointer whitespace-nowrap"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </aside>

          {/* Right Content Area */}
          <main className="flex-1 min-w-0 bg-[#111111]/40 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
              <div>
                <p className="text-[10px] font-bold text-gk-orange uppercase tracking-widest">
                  Account Dashboard • {activeTab}
                </p>
                <h1 className="text-2xl font-black uppercase tracking-wide text-white mt-1">
                  Collector Vault
                </h1>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gk-orange animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                  ACTIVE SESSION
                </span>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400 font-semibold tracking-wide uppercase mb-6 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-6 text-left">
                {orders.length === 0 ? (
                  <div className="text-center py-16 text-zinc-500 text-xs uppercase tracking-wider">
                    You have no active orders.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map(order => (
                      <div key={order.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 md:p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/5">
                          <div>
                            <span className="text-[9px] font-mono text-zinc-500 block">ORDER ID</span>
                            <span className="text-xs font-bold text-white font-mono uppercase">{order.id}</span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
                              order.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              order.status === 'Shipped' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              order.status === 'Delivered' ? 'bg-zinc-800 text-zinc-300 border-white/10' :
                              order.status === 'Verification Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              'bg-zinc-800 text-zinc-400 border-white/5'
                            }`}>
                              {order.status}
                            </span>
                            
                            {order.trackingNumber && (
                              <span className="text-[10px] font-mono bg-white/5 text-zinc-300 border border-white/10 px-2.5 py-1 rounded-lg">
                                Track: {order.trackingNumber}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center gap-4 text-xs">
                              <div>
                                <span className="font-bold text-white">{item.brand} {item.name}</span>
                                <span className="text-[10px] text-zinc-500 block">QTY: {item.qty}</span>
                              </div>
                              <span className="font-mono text-zinc-400">₹{parseFloat(item.priceAtPurchase).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-white/5 text-xs">
                          <span className="text-zinc-500 font-mono flex items-center gap-1.5">
                            <Calendar size={14} />
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <div>
                            <span className="text-zinc-500 mr-2">Total Paid</span>
                            <span className="font-bold text-gk-orange font-mono text-sm">₹{parseFloat(order.totalPrice).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Account Settings Tab */}
            {activeTab === 'settings' && user && (
              <div className="space-y-6 text-left">
                {/* Shipping Profile Form */}
                <form onSubmit={handleProfileSave} className="space-y-6">
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white">Shipping Profile</h3>
                      <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">
                        These details are used automatically to populate fields when securing drops.
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
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Email Address (Read-only)</label>
                        <input 
                          type="text" 
                          value={user.email} 
                          disabled 
                          className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-500 focus:outline-none cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Shipping Address</label>
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
                      {profileLoading ? 'Saving Profile...' : 'Save Shipping Profile'}
                    </button>
                  </div>
                </form>

                {/* Guidelines */}
                <div className="bg-[#141417]/30 border border-white/5 rounded-2xl p-6 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">Collector Guidelines</h4>
                  <ul className="space-y-2.5 text-xs text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="text-gk-orange font-bold">•</span>
                      <span>Reserved items are locked exclusively in your account name for a limited duration.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gk-orange font-bold">•</span>
                      <span>Payment screenshots must be uploaded before the lock countdown expires to ensure verification.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gk-orange font-bold">•</span>
                      <span>Confirmed orders will show updated tracking information under the Orders tab.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

          </main>
        </div>
      )}

      <Footer />
    </div>
  );
}
