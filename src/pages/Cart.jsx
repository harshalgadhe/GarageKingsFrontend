import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, ShoppingCart, ArrowLeft, ArrowRight, Plus, Minus } from 'lucide-react'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'

export default function Cart() {
  const navigate = useNavigate()
  // Cart is in localStorage — initialize synchronously to avoid any loading flash
  const [cartItems, setCartItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gk_cart') || '[]') } catch { return [] }
  })

  // Keep cart in sync with updates from other components
  useEffect(() => {
    const sync = () => {
      try { setCartItems(JSON.parse(localStorage.getItem('gk_cart') || '[]')) } catch {}
    }
    window.addEventListener('gk_cart_updated', sync)
    return () => window.removeEventListener('gk_cart_updated', sync)
  }, [])

  const saveCart = (newCart) => {
    setCartItems(newCart)
    localStorage.setItem('gk_cart', JSON.stringify(newCart))
    window.dispatchEvent(new CustomEvent('gk_cart_updated', { detail: { open: false } }))
  }

  const updateQuantity = (id, change) => {
    const newCart = cartItems.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, (item.quantity || 1) + change)
        return { ...item, quantity: newQty }
      }
      return item
    })
    saveCart(newCart)
  }

  const removeItem = (id) => {
    const newCart = cartItems.filter(item => item.id !== id)
    saveCart(newCart)
  }

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + Number(item.price || 0) * (item.quantity || 1), 0)
  }


  return (
    <div className="min-h-[100svh] bg-gk-black text-white selection:bg-gk-yellow selection:text-black pt-16 flex flex-col">
      <Navigation activeSection="vault" />

      <div className="flex-1 max-w-7xl mx-auto px-6 py-8 md:py-16 w-full">
        {/* Breadcrumb / Back Link */}
        <Link 
          to="/marketplace" 
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-xs font-bold uppercase tracking-widest mb-8 md:mb-12 group transition-colors"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Vault
        </Link>

        <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-wider mb-8 md:mb-12">
          Your Vault <span className="text-gk-orange">Queue.</span>
        </h1>

        {cartItems.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center mb-6">
              <ShoppingCart className="w-8 h-8 text-white/30" />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-wider mb-3">Queue is Empty</h2>
            <p className="text-sm text-white/40 max-w-md leading-relaxed mb-8">
              You currently have no castings reserved in your cart. Check out the latest hot drops on the marketplace to start collecting.
            </p>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-gk-orange hover:bg-orange-500 text-white font-black text-xs uppercase tracking-widest transition-all hover:shadow-[0_0_30px_rgba(255,85,0,0.35)] active:scale-[0.98]"
            >
              Explore Marketplace <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          /* Cart Details Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Side: Items list */}
            <div className="lg:col-span-8 space-y-4">
              {cartItems.map((item) => (
                <div 
                  key={item.id} 
                  className="flex flex-col sm:flex-row gap-4 p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl transition-all items-center justify-between"
                >
                  {/* Product Info Group */}
                  <div className="flex gap-4 items-center w-full sm:w-auto">
                    {/* Image */}
                    <div className="w-18 h-18 rounded-xl overflow-hidden bg-black/25 flex-shrink-0 border border-white/5 relative">
                      <img 
                        src={item.image || '/brand-logo.png'} 
                        alt={item.name} 
                        onError={(e) => {
                          e.target.src = '/brand-logo.png';
                          e.target.className = "w-full h-full object-contain p-3 bg-zinc-950/80 pointer-events-none select-none";
                        }}
                        className={item.image ? "w-full h-full object-cover pointer-events-none select-none" : "w-full h-full object-contain p-3 bg-zinc-950/80 pointer-events-none select-none"}
                      />
                    </div>
                    {/* Text metadata */}
                    <div className="min-w-0">
                      <div className="text-[9px] font-black uppercase tracking-widest text-gk-orange">
                        {item.brand}
                      </div>
                      <Link 
                        to={`/product/${item.id}`} 
                        className="block text-sm font-bold text-white hover:text-gk-orange transition-colors truncate mt-0.5"
                      >
                        {item.name}
                      </Link>
                      {item.scale && (
                        <div className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mt-0.5">
                          Scale: {item.scale}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Price controls Group */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                    {/* Pricing */}
                      <div className="text-left sm:text-right">
                        <div className="text-[8px] uppercase tracking-widest text-white/30 mb-0.5">Valuation</div>
                        <div className="font-mono text-sm font-bold text-white">
                          ₹{Number(item.price) * (item.quantity || 1)}
                        </div>
                      </div>

                    {/* Quantity adjuster */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-white/10 rounded-xl bg-black/30 overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="px-2.5 py-1.5 text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-xs font-bold"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="px-2 text-xs font-mono font-bold text-white text-center min-w-[20px]">
                          {item.quantity || 1}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="px-2.5 py-1.5 text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-xs font-bold"
                        >
                          <Plus size={10} />
                        </button>
                      </div>

                      {/* Remove item */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-white/40 hover:text-red-400 p-2 border border-white/5 hover:border-red-500/20 rounded-xl bg-white/[0.01] hover:bg-red-500/5 transition-all cursor-pointer"
                        title="Remove casting from queue"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Side: Order Summary */}
            <div className="lg:col-span-4 bg-white/[0.01] border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
              <h3 className="text-lg font-black uppercase tracking-wider mb-6 border-b border-white/5 pb-4">
                Summary
              </h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-white/50">
                  <span>Castings Queue</span>
                  <span className="text-white font-mono font-bold">
                    {cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)} items
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-white/50 border-b border-white/5 pb-4">
                  <span>Shipping & Handling</span>
                  <span className="text-white/80 lowercase italic font-medium">calculated at checkout</span>
                </div>

                <div className="flex justify-between items-end pt-2">
                  <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Order Total</span>
                    <span className="font-mono text-2xl font-black text-gk-orange">
                      ₹{getSubtotal()}
                    </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-4 rounded-xl bg-gk-orange hover:bg-orange-500 text-black hover:text-white font-black text-sm uppercase tracking-widest transition-all duration-200 hover:shadow-[0_0_30px_rgba(255,85,0,0.35)] cursor-pointer active:scale-[0.98]"
              >
                Proceed to Checkout
              </button>

              <Link
                to="/marketplace"
                className="w-full block text-center py-3 rounded-xl border border-white/10 hover:border-white/20 text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer mt-3"
              >
                Continue Browsing
              </Link>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
