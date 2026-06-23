import React, { useState, useEffect } from 'react';
import ReservationTimer from './ReservationTimer';
import PaymentInstructions from './PaymentInstructions';
import ScreenshotUploader from './ScreenshotUploader';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function ReserveModal({ product, cartItems, onClose }) {
  const [step, setStep] = useState(1); // 1 = Details, 2 = Payment, 3 = Complete
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  
  const [orderId, setOrderId] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [settings, setSettings] = useState({
    companyUpiId: 'garagekings@upi',
    upiQrImage: '/upi-qr.png'
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

  const isCart = !!cartItems;
  const totalPrice = isCart 
    ? cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0)
    : Number(product?.price || 0);

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
        console.error("Error fetching UPI settings:", e);
      }
    }
    fetchSettings();

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
        items: cartItems.map(item => ({ productId: item.id, price: item.price })),
        name,
        email,
        phone,
        address,
        instagram: '',
        idempotencyKey
      } : {
        productId: product.id,
        name,
        email,
        phone,
        address,
        price: product.price,
        idempotencyKey
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Stock reservation failed.');
      }

      setOrderId(data.orderId);
      setExpiresAt(data.expiresAt);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to lock stock.');
    } finally {
      setLoading(false);
    }
  };

  const handleExpire = () => {
    setError('Your reservation has expired and the stock has been released.');
    setStep(1);
    // Refresh idempotency key so they can try again
    setIdempotencyKey(generateUUID());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-hidden">
      {/* Modal box */}
      <div className="w-full max-w-lg bg-[#0f0f0f] border border-white/5 rounded-2xl relative flex flex-col max-h-[90vh] shadow-[0_0_80px_-15px_rgba(255,85,0,0.2)]">
        {/* Top orange bar */}
        <div className="h-[2px] bg-gradient-to-r from-[#ff5500]/20 via-[#ff5500] to-[#ff5500]/20 flex-shrink-0" />
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between flex-shrink-0">
          <div>
            <span className="text-[9px] font-black text-[#ff5500] uppercase tracking-widest bg-[#ff5500]/10 border border-[#ff5500]/20 px-2 py-0.5 rounded">
              Secure Checkout
            </span>
            <h2 className="text-base font-extrabold text-white mt-2 uppercase tracking-wide truncate max-w-[280px]">
              {isCart ? `Reserve Cart (${cartItems.length} items)` : `Reserve: ${product?.brand} ${product?.name}`}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/15 text-[#888888] hover:text-white flex items-center justify-center text-sm transition-colors border border-white/5"
          >
            ✕
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
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
                  <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-2">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-xs">
                        <span className="text-white truncate max-w-[200px]">{item.brand} {item.name}</span>
                        <span className="font-mono text-white/60">₹{item.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/5 pt-2 flex justify-between items-center text-xs font-bold">
                    <span className="text-[#888888] uppercase tracking-wider">Aggregated Total</span>
                    <span className="font-mono text-[#ff5500]">₹{totalPrice}</span>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ff5500] hover:bg-[#ff6611] active:bg-[#e64d00] disabled:bg-[#ff5500]/50 text-black font-extrabold text-xs py-3.5 px-4 rounded-xl transition-all duration-200 uppercase tracking-wider mt-2 shadow-[0_4px_20px_-4px_rgba(255,85,0,0.3)]"
              >
                {loading ? 'Locking Stock...' : 'Lock Stock & Go to Pay'}
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex justify-center">
                <ReservationTimer expiresAt={expiresAt} onExpire={handleExpire} />
              </div>

              <PaymentInstructions 
                upiId={settings.companyUpiId}
                upiQrImage={settings.upiQrImage}
                price={totalPrice}
              />

              <ScreenshotUploader 
                orderId={orderId} 
                onUploadSuccess={() => setStep(3)}
              />
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8 space-y-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#ff5500]/10 border border-[#ff5500]/20 text-[#ff5500] text-3xl animate-bounce">
                ✓
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  Reservation Logged
                </h3>
                <p className="text-xs text-[#888888] leading-relaxed max-w-sm mx-auto">
                  Your UPI screenshot is uploaded and pending verification by our founders. We will notify you via email or WhatsApp once verified.
                </p>
              </div>

              <div className="bg-[#141414] border border-white/5 rounded-xl p-4 max-w-sm mx-auto text-left space-y-2 font-mono text-[10px] text-[#888888]">
                <div><span className="text-white">ORDER ID:</span> {orderId}</div>
                {isCart ? (
                  <div>
                    <span className="text-white">ITEMS:</span>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {cartItems.map(item => (
                        <li key={item.id} className="truncate">{item.brand} {item.name}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div><span className="text-white">CASTING:</span> {product?.brand} {product?.name}</div>
                )}
                <div><span className="text-white">TOTAL PRICE:</span> ₹{totalPrice}</div>
                <div><span className="text-white">STATUS:</span> VERIFICATION PENDING</div>
              </div>

              <button
                onClick={onClose}
                className="bg-white/5 hover:bg-white/10 text-white font-extrabold text-xs px-6 py-3 rounded-xl border border-white/10 uppercase tracking-wider transition-colors"
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
