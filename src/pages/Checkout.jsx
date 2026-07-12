import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import PaymentInstructions from '../components/checkout/PaymentInstructions'
import ScreenshotUploader from '../components/checkout/ScreenshotUploader'
import { getCurrentUser } from '../lib/auth'
import { getProduct, getPublicSettings } from '../lib/db'
import { logError } from '../lib/telemetry'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import { ArrowLeft, Check, ShieldAlert } from 'lucide-react'

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export default function Checkout() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const singleProductId = searchParams.get('product')
  const purchaseCasingType = searchParams.get('casing')
  const urlQty = Math.max(1, parseInt(searchParams.get('qty') || '1', 10))

  const [user, setUser] = useState(null)
  const [product, setProduct] = useState(null)
  const [cartItems, setCartItems] = useState([])
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [idempotencyKey, setIdempotencyKey] = useState('')
  const [isPreOrder, setIsPreOrder] = useState(false)
  const [advancePercent, setAdvancePercent] = useState(50)
  
  const [orderId, setOrderId] = useState('')
  const [orderMeta, setOrderMeta] = useState({ bookingType: 'standard', advanceAmount: 0, remainingAmount: 0 })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCart, setIsCart] = useState(false)
  const [step, setStep] = useState(1) // 1 = Details, 2 = Pay, 3 = Upload, 4 = Complete

  const [settings, setSettings] = useState({
    companyUpiId: 'garagekings@upi',
    upiQrImage: '/upi-qr.png',
    showPrices: true
  })

  const API_BASE_URL = import.meta.env.PROD 
    ? '/api/v1' 
    : (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1')

  useEffect(() => {
    setIdempotencyKey(generateUUID())

    async function loadData() {
      setLoading(true)
      try {
        const [settingsData, prodData] = await Promise.all([
          getPublicSettings(),
          singleProductId ? getProduct(singleProductId) : Promise.resolve(null)
        ])

        if (settingsData) {
          setSettings(prev => ({
            ...prev,
            ...settingsData,
            showPrices: true
          }))
        }

        if (singleProductId) {
          if (prodData) {
            setProduct(prodData)
            setIsCart(false)
          } else {
            setError('Could not locate the specified casting vault entry.')
          }
        } else {
          const saved = localStorage.getItem('gk_cart')
          const items = saved ? JSON.parse(saved) : []
          if (items.length === 0) {
            setError('Your queue is empty. Add castings to your cart before checking out.')
          } else {
            setCartItems(items)
            setIsCart(true)
          }
        }

        // Prefill profile information
        const user = getCurrentUser()
        if (!user) {
          // Force login
          window.location.href = `/account?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`
          return
        }
        
        setEmail(user.email || '')
        setFullName(user.displayName || '')

        const res = await fetch(`${API_BASE_URL}/profile/my`)
        if (res.ok) {
          const prof = await res.json()
          if (prof) {
            if (prof.fullName) setFullName(prof.fullName)
            if (prof.phone && !prof.phone.startsWith('unknown_')) setPhone(prof.phone)
            if (prof.address) setAddress(prof.address)
          }
        }
      } catch (e) {
        logError("Failed to initialize checkout page data", e.stack)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [singleProductId])

  const [calculation, setCalculation] = useState({
    subtotal: 0,
    shippingFee: 0,
    totalPrice: 0,
    advanceAmount: 0,
    remainingAmount: 0,
    items: []
  })
  const [calculating, setCalculating] = useState(false)

  const canPreOrder = isCart 
    ? cartItems.some(item => item.isPrebook === true || item.is_prebook === true)
    : !!(product && (product.isPrebook === true || product.is_prebook === true))

  useEffect(() => {
    if (!canPreOrder) {
      setIsPreOrder(false)
    }
  }, [canPreOrder])

  useEffect(() => {
    async function performCalculation() {
      if (isCart && cartItems.length === 0) return
      if (!isCart && !product) return

      setCalculating(true)
      try {
        const payload = {
          bookingType: isPreOrder ? 'pre_order' : 'standard',
          items: isCart ? cartItems.map(item => ({
            productId: item.id,
            qty: item.quantity || 1
          })) : [{
            productId: product.id,
            qty: urlQty
          }]
        }

        if (isPreOrder) {
          const estSubtotal = isCart 
            ? cartItems.reduce((sum, item) => sum + Number(item.price || 0) * (item.quantity || 1), 0)
            : Number(product?.price || 0) * urlQty
          payload.advanceAmount = Math.round(estSubtotal * advancePercent / 100)
        }

        const token = localStorage.getItem('gk_token')
        const res = await fetch(`${API_BASE_URL}/products/calculate-checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          const data = await res.json()
          setCalculation(data)
        }
      } catch (e) {
        console.error("Calculation failed", e)
      } finally {
        setCalculating(false)
      }
    }
    performCalculation()
  }, [isCart, cartItems, product, urlQty, isPreOrder, advancePercent])

  const totalPrice = calculation.totalPrice
  const advanceAmount = calculation.advanceAmount

  const handleReserve = async (e) => {
    e.preventDefault()
    if (!name || !email || !phone || !address) {
      setError('Please fill in all checkout fields.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const endpoint = isCart ? `${API_BASE_URL}/products/reserve-cart` : `${API_BASE_URL}/products/reserve`
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
        qty: urlQty,
        idempotencyKey,
        bookingType: isPreOrder ? 'pre_order' : 'standard',
        advanceAmount: advanceAmount
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Reservation booking failed.')
      }

      setOrderId(data.orderId)
      setOrderMeta({
        bookingType: data.bookingType || 'standard',
        advanceAmount: data.advanceAmount || advanceAmount,
        remainingAmount: data.remainingAmount || 0
      })
      setStep(2)

      // If cart reservation succeeded, clear cart
      if (isCart) {
        localStorage.removeItem('gk_cart')
        window.dispatchEvent(new CustomEvent('gk_cart_updated', { detail: { open: false } }))
      }
    } catch (err) {
      const isNetworkOrJsError = err instanceof TypeError || err.message?.includes('Failed to fetch') || !err.message
      const friendlyMsg = isNetworkOrJsError 
        ? 'A database synchronization error occurred. Please verify your connection and try again.' 
        : err.message
      setError(friendlyMsg)
      logError(err.message || 'Checkout Submission Failed', err.stack)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100svh] bg-gk-black text-white selection:bg-gk-yellow selection:text-black pt-16 flex flex-col">
      <Navigation activeSection="vault" />

      <div className="flex-1 max-w-3xl mx-auto px-6 py-8 md:py-16 w-full">
        {/* Back Link */}
        {step < 4 && (
          <Link 
            to={isCart ? "/cart" : `/product/${singleProductId}`} 
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-xs font-bold uppercase tracking-widest mb-8 md:mb-12 group transition-colors"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Queue
          </Link>
        )}

        {/* Stepper Progress Bar */}
        <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 flex items-center justify-between text-[9px] font-black uppercase tracking-widest select-none mb-10 shadow-xl">
          <div className="flex items-center gap-1.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] transition-all duration-300 ${step === 1 ? 'bg-gk-orange text-black font-black' : step > 1 ? 'bg-gk-orange/20 text-gk-orange border border-gk-orange/30' : 'bg-white/5 text-white/40 border border-white/10'}`}>
              {step > 1 ? '✓' : '1'}
            </div>
            <span className={step === 1 ? 'text-white font-bold' : step > 1 ? 'text-gk-orange' : 'text-white/30'}>Shipping</span>
          </div>
          
          <div className={`h-[1px] grow mx-3 transition-colors duration-300 ${step > 1 ? 'bg-gk-orange/30' : 'bg-white/5'}`} />
          
          <div className="flex items-center gap-1.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] transition-all duration-300 ${step === 2 ? 'bg-gk-orange text-black font-black' : step > 2 ? 'bg-gk-orange/20 text-gk-orange border border-gk-orange/30' : 'bg-white/5 text-white/40 border border-white/10'}`}>
              {step > 2 ? '✓' : '2'}
            </div>
            <span className={step === 2 ? 'text-white font-bold' : step > 2 ? 'text-gk-orange' : 'text-white/30'}>UPI Pay</span>
          </div>
          
          <div className={`h-[1px] grow mx-3 transition-colors duration-300 ${step > 2 ? 'bg-gk-orange/30' : 'bg-white/5'}`} />
          
          <div className="flex items-center gap-1.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] transition-all duration-300 ${step === 3 ? 'bg-gk-orange text-black font-black' : step > 3 ? 'bg-gk-orange/20 text-gk-orange border border-gk-orange/30' : 'bg-white/5 text-white/40 border border-white/10'}`}>
              {step > 3 ? '✓' : '3'}
            </div>
            <span className={step === 3 ? 'text-white font-bold' : step > 3 ? 'text-gk-orange' : 'text-white/30'}>Upload</span>
          </div>
          
          <div className={`h-[1px] grow mx-3 transition-colors duration-300 ${step > 3 ? 'bg-gk-orange/30' : 'bg-white/5'}`} />
          
          <div className="flex items-center gap-1.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] transition-all duration-300 ${step === 4 ? 'bg-gk-orange text-black font-black' : 'bg-white/5 text-white/40 border border-white/10'}`}>
              4
            </div>
            <span className={step === 4 ? 'text-white font-bold' : 'text-white/30'}>Complete</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md">
          {step === 1 && (
            <form onSubmit={handleReserve} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-bold uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Items List Summary card */}
              <div className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-3">
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">Casting Order Summary</div>
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-2" data-lenis-prevent>
                  {isCart ? (
                    cartItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-xs">
                        <span className="text-white/80 truncate max-w-[350px]">{item.brand} {item.name} {item.quantity > 1 ? `x${item.quantity}` : ''}</span>
                        {settings.showPrices && (
                          <span className="font-mono text-white/60">₹{Number(item.price) * (item.quantity || 1)}</span>
                        )}
                      </div>
                    ))
                  ) : (
                    product && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/80 truncate">
                          {product.brand} {product.name}
                          {urlQty > 1 && (
                            <span className="ml-2 px-1.5 py-0.5 rounded-md bg-gk-orange/20 text-gk-orange font-black text-[9px]">×{urlQty}</span>
                          )}
                        </span>
                        {settings.showPrices && (
                          <span className="font-mono text-white/60">₹{(Number(product.price) * urlQty).toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    )
                  )}
                </div>
                
                {settings.showPrices && (
                  <div className="border-t border-white/5 pt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-white/40">
                      <span>Subtotal</span>
                      <span className="font-mono text-white/80">₹{calculation.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    {calculation.shippingFee > 0 && (
                      <div className="flex justify-between items-center text-white/40">
                        <span>Flat Shipping</span>
                        <span className="font-mono text-white/80">₹{calculation.shippingFee}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center font-black pt-1.5 border-t border-white/5">
                      <span className="text-white/40 uppercase tracking-wider">Total price</span>
                      <span className="font-mono text-gk-orange text-sm">₹{calculation.totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Input fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-gk-orange transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-gk-orange transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block">
                  Phone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-gk-orange transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block">
                  Complete Shipping Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street details, Locality, City, State, ZIP code"
                  rows="3"
                  className="w-full bg-[#080808] border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-gk-orange transition-colors resize-none"
                  required
                />
              </div>



              <button
                type="submit"
                disabled={loading}
                className="w-full py-4.5 rounded-xl bg-gk-orange hover:bg-orange-500 disabled:bg-gk-orange/50 text-black hover:text-white font-black text-xs uppercase tracking-widest transition-all duration-200 hover:shadow-[0_0_30px_rgba(255,85,0,0.35)] cursor-pointer active:scale-[0.98]"
              >
                {loading ? 'Processing...' : isPreOrder ? 'Secure Pre-Order & Proceed to Pay' : 'Secure Order & Proceed to Pay'}
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {isPreOrder && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Pre-Order Activated</div>
                  <div className="text-[10px] text-amber-300/70 mt-1">
                    Pay only the advance amount now. The remaining balance of ₹{calculation.remainingAmount} will be due before dispatch.
                  </div>
                </div>
              )}
              
              <PaymentInstructions 
                upiId={settings.companyUpiId}
                upiQrImage={settings.upiQrImage}
                price={settings.showPrices ? (isPreOrder ? advanceAmount : totalPrice) : 0}
              />
              
              <button
                onClick={() => setStep(3)}
                className="w-full py-4 rounded-xl bg-gk-orange hover:bg-orange-500 text-black hover:text-white font-black text-xs uppercase tracking-widest transition-all hover:shadow-[0_0_30px_rgba(255,85,0,0.35)] cursor-pointer active:scale-[0.98]"
              >
                {settings.showPrices 
                  ? `I've Transferred ₹${isPreOrder ? advanceAmount : totalPrice} — Upload Proof`
                  : 'I Have Paid, Proceed to Upload Screenshot'
                }
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-2">
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">Order Verification Summary</div>
                {settings.showPrices && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">{isPreOrder ? 'Advance to Transfer:' : 'Total to Transfer:'}</span>
                    <span className="font-mono text-gk-orange font-bold">₹{isPreOrder ? advanceAmount : totalPrice}</span>
                  </div>
                )}
                {isPreOrder && settings.showPrices && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Remaining balance due later:</span>
                    <span className="font-mono text-amber-400">₹{calculation.remainingAmount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/60">Assigned Order ID:</span>
                  <span className="font-mono text-white/80">{orderId}</span>
                </div>
              </div>

              <ScreenshotUploader 
                orderId={orderId} 
                onUploadSuccess={() => setStep(4)}
              />

              <button
                onClick={() => setStep(2)}
                className="w-full bg-transparent hover:bg-white/5 text-white/60 hover:text-white border border-white/10 font-bold text-xs py-3.5 rounded-xl transition-colors uppercase tracking-wider text-center cursor-pointer"
              >
                ← Back to UPI Payment
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-6 space-y-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gk-orange/10 border border-gk-orange/20 text-gk-orange text-3xl animate-bounce">
                ✓
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-white uppercase tracking-wider">
                  {isPreOrder ? 'Pre-Order Secured!' : 'Order Secured!'}
                </h3>
                <p className="text-xs text-white/40 leading-relaxed max-w-md mx-auto font-medium">
                  {isPreOrder
                    ? `Your advance payment proof is uploaded. We will verify and lock in your prebooking. We'll contact you to transfer the remaining ₹${calculation.remainingAmount} once stock is ready.`
                    : 'Your payment screenshot is uploaded and pending verification by the Garage Kings team. We process entries on a first-come, first-served basis and will confirm shortly.'}
                </p>
              </div>

              <div className="bg-[#080808] border border-white/10 rounded-2xl p-5 max-w-md mx-auto text-left space-y-2.5 font-mono text-[10px] text-white/50">
                <div><span className="text-white">ORDER ID:</span> {orderId}</div>
                {isPreOrder && (
                  <>
                    <div><span className="text-amber-400">TYPE:</span> PRE-ORDER</div>
                    {settings.showPrices && (
                      <>
                        <div><span className="text-white">ADVANCE TRANSFER:</span> ₹{advanceAmount}</div>
                        <div><span className="text-amber-400">REMAINING DUE:</span> ₹{calculation.remainingAmount}</div>
                      </>
                    )}
                  </>
                )}
                
                {isCart ? (
                  <div>
                    <span className="text-white">ITEMS RESERVED:</span>
                    <ul className="list-disc list-inside mt-1.5 space-y-1">
                      {cartItems.map(item => (
                        <li key={item.id} className="truncate">{item.brand} {item.name} {item.quantity > 1 ? `x${item.quantity}` : ''}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  product && (
                    <div><span className="text-white">CASTING RESERVED:</span> {product.brand} {product.name}</div>
                  )
                )}
                {settings.showPrices && (
                  <div><span className="text-white">TOTAL VALUATION:</span> ₹{totalPrice}</div>
                )}
                <div><span className="text-white">STATUS:</span> {isPreOrder ? 'PRE-ORDER - ADVANCE PENDING VERIFICATION' : 'VERIFICATION PENDING'}</div>
              </div>

              <button
                onClick={() => navigate('/marketplace')}
                className="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gk-orange/30 text-white hover:text-gk-orange font-black text-xs uppercase tracking-wider transition-colors cursor-pointer active:scale-[0.98]"
              >
                Return to Marketplace
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
