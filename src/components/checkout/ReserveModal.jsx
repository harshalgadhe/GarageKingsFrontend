import React, { useState, useEffect } from 'react';
import PaymentInstructions from './PaymentInstructions';
import ScreenshotUploader from './ScreenshotUploader';
import { getCurrentUser } from '../../lib/auth';
import { logError } from '../../lib/telemetry';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function ReserveModal({ product, cartItems, onClose }) {
  const [step, setStep] = useState(1); // 1 = Shipping details, 2 = UPI Pay instructions, 3 = Receipt upload, 4 = Complete
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [isPreOrder, setIsPreOrder] = useState(false);
  const [advancePercent, setAdvancePercent] = useState(50); // % of total as advance
  
  const [orderId, setOrderId] = useState('');
  const [orderMeta, setOrderMeta] = useState({ bookingType: 'standard', advanceAmount: 0, remainingAmount: 0 });
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [settings, setSettings] = useState({
    companyUpiId: 'garagekings@upi',
    upiQrImage: '/upi-qr.png'
  });

  const API_BASE_URL = import.meta.env.PROD 
    ? '/api/v1' 
    : (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1');

  const isCart = !!cartItems;
  const [calculation, setCalculation] = useState({
    subtotal: 0,
    shippingFee: 0,
    totalPrice: 0,
    advanceAmount: 0,
    remainingAmount: 0,
    items: []
  });
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    async function performCalculation() {
      if (isCart && cartItems.length === 0) return;
      if (!isCart && !product) return;

      setCalculating(true);
      try {
        const payload = {
          bookingType: isPreOrder ? 'pre_order' : 'standard',
          items: isCart ? cartItems.map(item => ({
            productId: item.id,
            qty: item.quantity || 1
          })) : [{
            productId: product.id,
            qty: 1
          }]
        };

        if (isPreOrder) {
          const estSubtotal = isCart 
            ? cartItems.reduce((sum, item) => sum + Number(item.price || 0) * (item.quantity || 1), 0)
            : Number(product?.price || 0);
          payload.advanceAmount = Math.round(estSubtotal * advancePercent / 100);
        }

        const token = localStorage.getItem('gk_token');
        const res = await fetch(`${API_BASE_URL}/products/calculate-checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          setCalculation(data);
        }
      } catch (e) {
        console.error("Calculation failed", e);
      } finally {
        setCalculating(false);
      }
    }
    performCalculation();
  }, [isCart, cartItems, product, isPreOrder, advancePercent, API_BASE_URL]);

  const totalPrice = calculation.totalPrice;
  const advanceAmount = calculation.advanceAmount;

  // Generate unique idempotency key once per modal mount and lock/unlock body scroll
  useEffect(() => {
    setIdempotencyKey(generateUUID());

    // Lock background scroll
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    // Fetch upi details from settings
    async function fetchSettings() {
      try {
        const res = await fetch(`${API_BASE_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (e) {
        logError("Failed to fetch UPI payment settings", e.stack);
      }
    }
    fetchSettings();

    // Pre-fill user profile details if logged in
    const user = getCurrentUser();
    if (user) {
      setEmail(user.email || '');
      setName(user.displayName || '');

      async function loadProfile() {
        try {
          const res = await fetch(`${API_BASE_URL}/profile/my`);
          if (res.ok) {
            const prof = await res.json();
            if (prof) {
              if (prof.fullName) setName(prof.fullName);
              if (prof.phone && !prof.phone.startsWith('unknown_')) setPhone(prof.phone);
              if (prof.address) setAddress(prof.address);
            }
          }
        } catch (e) {
          logError("Failed to load user profile for checkout prefill: " + e.message, e.stack, 'warning');
        }
      }
      loadProfile();
    }

    return () => {
      // Re-enable background scroll
      document.body.style.overflow = originalStyle || 'unset';
    };
  }, [API_BASE_URL]);

  const handleReserve = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !address) {
      setError('Please fill in all details.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = isCart ? `${API_BASE_URL}/products/reserve-cart` : `${API_BASE_URL}/products/reserve`;
      const body = isCart ? {
        items: cartItems.flatMap(item => 
          Array.from({ length: item.quantity || 1 }, () => ({ productId: item.id, price: item.price }))
        ),
        name,
        email,
        phone,
        address,
        instagram: '',
        idempotencyKey,
        bookingType: isPreOrder ? 'pre_order' : 'standard',
        advanceAmount: advanceAmount
      } : {
        productId: product.id,
        name,
        email,
        phone,
        address,
        price: product.price,
        idempotencyKey,
        bookingType: isPreOrder ? 'pre_order' : 'standard',
        advanceAmount: advanceAmount
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        let errorMsg = 'Checkout failed.';
        try {
          const data = await response.json();
          errorMsg = data.message || errorMsg;
        } catch (e) {
          try {
            const text = await response.text();
            if (text) errorMsg = text;
          } catch (_) {}
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();

      setOrderId(data.orderId);
      setOrderMeta({
        bookingType: data.bookingType || 'standard',
        advanceAmount: data.advanceAmount || advanceAmount,
        remainingAmount: data.remainingAmount || 0
      });
      setStep(2);
    } catch (err) {
      const isNetworkOrJsError = err instanceof TypeError || err.message?.includes('Failed to fetch') || !err.message;
      const friendlyMsg = isNetworkOrJsError 
        ? 'An unexpected network error occurred while securing your reservation. Please verify your connection and try again.' 
        : err.message;
      setError(friendlyMsg);
      logError(err.message || 'Order Placement Failed', err.stack);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-hidden">
      {/* Modal box */}
      <div className="w-full max-w-lg bg-[#0f0f0f] border border-white/5 rounded-2xl relative flex flex-col max-h-[90vh] shadow-[0_0_80px_-15px_rgba(255,85,0,0.2)]">
        {/* Top orange bar */}
        <div className="h-[2px] bg-gradient-to-r from-[#ff5500]/20 via-[#ff5500] to-[#ff5500]/20 flex-shrink-0" />
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between flex-shrink-0">
          <div>
            <span className="text-[9px] font-black text-[#ff5500] uppercase tracking-widest bg-[#ff5500]/10 border border-[#ff5500]/20 px-2 py-0.5 rounded">
              Checkout
            </span>
            <h2 className="text-base font-extrabold text-white mt-2 uppercase tracking-wide truncate max-w-[280px]">
              {isCart ? `Checkout Cart (${cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)} items)` : `Checkout: ${product?.brand} ${product?.name}`}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/15 text-[#888888] hover:text-white flex items-center justify-center text-sm transition-colors border border-white/5"
          >
            ✕
          </button>
        </div>
        
        {/* Stepper progress indicator */}
        <div className="px-6 py-4 bg-white/[0.01] border-b border-white/5 flex items-center justify-between text-[9px] font-black uppercase tracking-widest select-none flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] transition-all duration-300 ${step === 1 ? 'bg-[#ff5500] text-black font-black' : step > 1 ? 'bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/30' : 'bg-white/5 text-white/40 border border-white/10'}`}>
              {step > 1 ? '✓' : '1'}
            </div>
            <span className={`hidden sm:inline ${step === 1 ? 'text-white font-bold' : step > 1 ? 'text-[#ff5500]' : 'text-white/30'}`}>Shipping</span>
          </div>
          
          <div className={`h-[1px] grow mx-3 transition-colors duration-300 ${step > 1 ? 'bg-[#ff5500]/30' : 'bg-white/5'}`} />
          
          <div className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] transition-all duration-300 ${step === 2 ? 'bg-[#ff5500] text-black font-black' : step > 2 ? 'bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/30' : 'bg-white/5 text-white/40 border border-white/10'}`}>
              {step > 2 ? '✓' : '2'}
            </div>
            <span className={`hidden sm:inline ${step === 2 ? 'text-white font-bold' : step > 2 ? 'text-[#ff5500]' : 'text-white/30'}`}>UPI Pay</span>
          </div>
          
          <div className={`h-[1px] grow mx-3 transition-colors duration-300 ${step > 2 ? 'bg-[#ff5500]/30' : 'bg-white/5'}`} />
          
          <div className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] transition-all duration-300 ${step === 3 ? 'bg-[#ff5500] text-black font-black' : step > 3 ? 'bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/30' : 'bg-white/5 text-white/40 border border-white/10'}`}>
              {step > 3 ? '✓' : '3'}
            </div>
            <span className={`hidden sm:inline ${step === 3 ? 'text-white font-bold' : step > 3 ? 'text-[#ff5500]' : 'text-white/30'}`}>Upload</span>
          </div>
          
          <div className={`h-[1px] grow mx-3 transition-colors duration-300 ${step > 3 ? 'bg-[#ff5500]/30' : 'bg-white/5'}`} />
          
          <div className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] transition-all duration-300 ${step === 4 ? 'bg-[#ff5500] text-black font-black' : 'bg-white/5 text-white/40 border border-white/10'}`}>
              4
            </div>
            <span className={`hidden sm:inline ${step === 4 ? 'text-white font-bold' : 'text-white/30'}`}>Complete</span>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0 max-h-[65vh]" data-lenis-prevent>
          {step === 1 && (
            <form onSubmit={handleReserve} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-semibold tracking-wide uppercase">
                  {error}
                </div>
              )}

              {isCart && (
                <div className="bg-[#141414] border border-white/5 rounded-xl p-4 space-y-2">
                  <div className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Items in Cart</div>
                  <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-2" data-lenis-prevent>
                    {cartItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-xs">
                        <span className="text-white truncate max-w-[200px]">{item.brand} {item.name} {item.quantity > 1 ? `x${item.quantity}` : ''}</span>
                        <span className="font-mono text-white/60">₹{Number(item.price) * (item.quantity || 1)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/5 pt-2 space-y-1 text-xs">
                    <div className="flex justify-between items-center text-white/40">
                      <span>Subtotal</span>
                      <span className="font-mono text-white/80">₹{calculation.subtotal}</span>
                    </div>
                    {calculation.shippingFee > 0 && (
                      <div className="flex justify-between items-center text-white/40">
                        <span>Flat Shipping</span>
                        <span className="font-mono text-white/80">₹{calculation.shippingFee}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center font-bold pt-1 border-t border-white/5">
                      <span className="text-[#888888] uppercase tracking-wider">Aggregated Total</span>
                      <span className="font-mono text-[#ff5500]">₹{calculation.totalPrice}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-[#444444] focus:outline-none focus:border-[#ff5500]/40 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-[#444444] focus:outline-none focus:border-[#ff5500]/40 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">
                  Phone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-[#444444] focus:outline-none focus:border-[#ff5500]/40 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">
                  Complete Shipping Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street details, Locality, City, State, ZIP code"
                  rows="3"
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-[#444444] focus:outline-none focus:border-[#ff5500]/40 transition-colors resize-none"
                  required
                />
              </div>

              {/* Pre-order toggle */}
              <div className="bg-[#141414] border border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Pre-Order Booking</div>
                    <div className="text-[10px] text-white/40 mt-0.5">Pay a partial amount now, rest when stock arrives</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPreOrder(v => !v)}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${isPreOrder ? 'bg-[#ff5500]' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${isPreOrder ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {isPreOrder && (
                  <div className="space-y-2 pt-1 border-t border-white/5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-white/60">Advance amount to pay now</span>
                      <span className="text-[#ff5500] font-bold font-mono">₹{advanceAmount}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-white/40 flex-shrink-0">25%</span>
                      <input
                        type="range"
                        min={25}
                        max={75}
                        step={5}
                        value={advancePercent}
                        onChange={(e) => setAdvancePercent(Number(e.target.value))}
                        className="flex-1 accent-[#ff5500]"
                      />
                      <span className="text-[10px] text-white/40 flex-shrink-0">75%</span>
                    </div>
                    <div className="text-[9px] text-white/30 text-center">
                      Remaining ₹{calculation.remainingAmount} due before dispatch
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ff5500] hover:bg-[#ff6611] active:bg-[#e64d00] disabled:bg-[#ff5500]/50 text-black font-extrabold text-xs py-3.5 px-4 rounded-xl transition-all duration-200 uppercase tracking-wider mt-2 shadow-[0_4px_20px_-4px_rgba(255,85,0,0.3)] cursor-pointer"
              >
                {loading ? 'Processing...' : isPreOrder ? 'Place Pre-Order & Go to Pay' : 'Place Order & Go to Pay'}
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {/* Pre-order notice */}
              {isPreOrder && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Pre-Order Mode</div>
                  <div className="text-[10px] text-amber-300/70 mt-0.5">
                    Pay only the advance amount now. The remaining ₹{calculation.remainingAmount} will be collected before dispatch.
                  </div>
                </div>
              )}
              <PaymentInstructions 
                upiId={settings.companyUpiId}
                upiQrImage={settings.upiQrImage}
                price={isPreOrder ? advanceAmount : totalPrice}
              />
              <button
                onClick={() => setStep(3)}
                className="w-full bg-[#ff5500] hover:bg-[#ff6611] active:bg-[#e64d00] text-black font-extrabold text-xs py-3.5 px-4 rounded-xl transition-all duration-200 uppercase tracking-wider mt-2 shadow-[0_4px_20px_-4px_rgba(255,85,0,0.3)] cursor-pointer"
              >
                {isPreOrder ? `I've Paid ₹${advanceAmount} Advance. Upload Receipt` : 'I Have Paid, Proceed to Upload Receipt'}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="bg-[#141414] border border-white/5 rounded-xl p-4 space-y-2">
                <div className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Order Summary</div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/60">{isPreOrder ? 'Advance to Transfer:' : 'Amount to Transfer:'}</span>
                  <span className="font-mono text-[#ff5500] font-bold">₹{isPreOrder ? advanceAmount : totalPrice}</span>
                </div>
                {isPreOrder && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Remaining (due later):</span>
                    <span className="font-mono text-amber-400/80">₹{calculation.remainingAmount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/60">Order ID:</span>
                  <span className="font-mono text-white/80">{orderId}</span>
                </div>
              </div>

              <ScreenshotUploader 
                orderId={orderId} 
                onUploadSuccess={() => setStep(4)}
              />

              <button
                onClick={() => setStep(2)}
                className="w-full bg-transparent hover:bg-white/5 text-white/60 hover:text-white border border-white/10 font-bold text-xs py-2.5 px-4 rounded-xl transition-colors uppercase tracking-wider text-center cursor-pointer"
              >
                ← Back to QR Code
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-8 space-y-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#ff5500]/10 border border-[#ff5500]/20 text-[#ff5500] text-3xl animate-bounce">
                ✓
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  {isPreOrder ? 'Pre-Order Placed!' : 'Order Placed'}
                </h3>
                <p className="text-xs text-[#888888] leading-relaxed max-w-sm mx-auto">
                  {isPreOrder
                    ? `Your advance payment screenshot is uploaded. We will verify and reserve your item. You'll be notified to pay the remaining ₹${calculation.remainingAmount} when stock is ready to ship.`
                    : 'Your UPI screenshot is uploaded and pending verification by our founders. We will verify it on a first-come, first-saved basis. We will notify you once verified.'}
                </p>
              </div>

              <div className="bg-[#141414] border border-white/5 rounded-xl p-4 max-w-sm mx-auto text-left space-y-2 font-mono text-[10px] text-[#888888]">
                <div><span className="text-white">ORDER ID:</span> {orderId}</div>
                {isPreOrder && (
                  <>
                    <div><span className="text-amber-400">TYPE:</span> PRE-ORDER</div>
                    <div><span className="text-white">ADVANCE PAID:</span> ₹{advanceAmount}</div>
                    <div><span className="text-amber-400">REMAINING DUE:</span> ₹{calculation.remainingAmount}</div>
                  </>
                )}
                {isCart ? (
                  <div>
                    <span className="text-white">ITEMS:</span>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {cartItems.map(item => (
                        <li key={item.id} className="truncate">{item.brand} {item.name} {item.quantity > 1 ? `x${item.quantity}` : ''}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div><span className="text-white">CASTING:</span> {product?.brand} {product?.name}</div>
                )}
                <div><span className="text-white">TOTAL PRICE:</span> ₹{totalPrice}</div>
                <div><span className="text-white">STATUS:</span> {isPreOrder ? 'PRE-ORDER - ADVANCE PENDING VERIFICATION' : 'VERIFICATION PENDING'}</div>
              </div>

              <button
                onClick={onClose}
                className="bg-white/5 hover:bg-white/10 text-white font-extrabold text-xs px-6 py-3 rounded-xl border border-white/10 uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close Portal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
