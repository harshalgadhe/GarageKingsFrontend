import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getProduct, getCars, getGlobalSettings } from '../lib/db'
import { logError } from '../lib/telemetry'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import { ShoppingBag, ArrowLeft, Plus, Check } from 'lucide-react'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [bestSellers, setBestSellers] = useState([])
  const [settings, setSettings] = useState({ showPrices: false })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [addedToCart, setAddedToCart] = useState(false)

  // Cart helper functions
  const addToCartLocal = (prod) => {
    const saved = localStorage.getItem('gk_cart')
    const cart = saved ? JSON.parse(saved) : []
    const existingIndex = cart.findIndex(item => item.id === prod.id)
    let newCart
    if (existingIndex > -1) {
      newCart = cart.map((item, idx) => 
        idx === existingIndex 
          ? { ...item, quantity: (item.quantity || 1) + 1 }
          : item
      )
    } else {
      newCart = [...cart, { ...prod, quantity: 1 }]
    }
    localStorage.setItem('gk_cart', JSON.stringify(newCart))
    window.dispatchEvent(new CustomEvent('gk_cart_updated', { detail: { open: false } }))
  }

  useEffect(() => {
    async function loadProductData() {
      setIsLoading(true)
      try {
        const [prodData, allCars, settingsData] = await Promise.all([
          getProduct(id),
          getCars(),
          getGlobalSettings()
        ])

        if (!prodData) {
          setError('The requested casting could not be located in our archives.')
          return
        }

        setProduct(prodData)
        setSettings({ showPrices: settingsData?.showPrices === true })

        // Filter out current product, sort by sold_stock descending to get top 5 best sellers
        const otherCars = allCars
          .filter(c => c.id !== id && c.status === 'Published')
          .sort((a, b) => Number(b.soldStock || 0) - Number(a.soldStock || 0))
          .slice(0, 5)
        
        setBestSellers(otherCars)
      } catch (err) {
        setError('Connection interrupted. Unable to load vault entry.')
        logError(err.message || 'Product Detail Load Failed', err.stack)
      } finally {
        setIsLoading(false)
      }
    }
    loadProductData()
  }, [id])

  const handleAddToCart = () => {
    if (!product) return
    addToCartLocal(product)
    setAddedToCart(true)
    setTimeout(() => {
      navigate('/cart')
    }, 800)
  }

  const handleBuyNow = () => {
    if (!product) return
    navigate(`/checkout?product=${product.id}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-[100svh] bg-gk-black text-white flex flex-col pt-16">
        <Navigation activeSection="vault" />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 rounded-full border-4 border-gk-orange/30 border-t-gk-orange animate-spin mb-4" />
          <div className="text-sm font-bold uppercase tracking-widest text-gk-orange animate-pulse">Scanning Archives...</div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-[100svh] bg-gk-black text-white flex flex-col pt-16">
        <Navigation activeSection="vault" />
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-8 rounded-2xl max-w-lg shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Vault Search Failed</h3>
            <p className="text-sm text-white/60 mb-6">{error || 'Vault entry not found.'}</p>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gk-orange hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider transition-all"
            >
              <ArrowLeft size={14} /> Back to Marketplace
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const isSoldOut = product.availableStock !== undefined 
    ? product.availableStock <= 0 
    : (Number(product.totalStock || 0) - Number(product.soldStock || 0) <= 0)

  return (
    <div className="min-h-[100svh] bg-gk-black text-white selection:bg-gk-yellow selection:text-black pt-16 flex flex-col">
      <Navigation activeSection="vault" />

      {/* Main product wrapper */}
      <div className="flex-1 max-w-7xl mx-auto px-6 py-8 md:py-16 w-full">
        {/* Back Link */}
        <Link 
          to="/marketplace" 
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-xs font-bold uppercase tracking-widest mb-8 md:mb-12 group transition-colors"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Vault
        </Link>

        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start mb-20">
          {/* Left Column: Product Image */}
          <div className="lg:col-span-7 aspect-[4/3] w-full rounded-3xl bg-white/[0.02] border border-white/10 overflow-hidden relative shadow-2xl shadow-black/80">
            <img 
              src={product.image || '/brand-logo.png'} 
              alt={product.name}
              onError={(e) => {
                e.target.src = '/brand-logo.png';
                e.target.className = "w-full h-full object-contain p-12 bg-zinc-950/80 pointer-events-none select-none";
              }}
              className={product.image ? "w-full h-full object-cover pointer-events-none select-none" : "w-full h-full object-contain p-12 bg-zinc-950/80 pointer-events-none select-none"}
              style={{ WebkitUserDrag: 'none' }}
              onContextMenu={(e) => e.preventDefault()}
            />
            {isSoldOut && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center pointer-events-none z-10">
                <span className="px-6 py-3 border border-red-500/40 bg-red-950/30 rounded-2xl text-red-500 font-black text-sm uppercase tracking-[0.25em] shadow-2xl">
                  Sold Out
                </span>
              </div>
            )}
            <div className="absolute top-6 right-6 z-20 px-4 py-1.5 rounded-full bg-black/90 backdrop-blur-md border border-white/10 text-xs font-black uppercase tracking-widest text-gk-yellow pointer-events-none shadow-xl">
              {product.lane}
            </div>
          </div>

          {/* Right Column: Metadata & Actions */}
          <div className="lg:col-span-5 flex flex-col h-full justify-center">
            {/* Headers */}
            <div className="mb-6">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-2">
                {product.grade} • {product.scale || '1:64'}
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-2">
                {product.name}
              </h2>
              {(product.brand || product.carBrand) && (
                <div className="text-sm font-black uppercase tracking-widest text-gk-orange">
                  {product.carBrand ? `${product.brand} • ${product.carBrand}` : product.brand}
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm md:text-base text-white/60 leading-relaxed mb-8 border-b border-white/5 pb-8">
                {product.description}
              </p>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8 text-xs font-bold uppercase tracking-wider">
              {product.sku && (
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5">
                  <div className="text-[9px] text-white/30 mb-0.5">SKU ID</div>
                  <div className="font-mono text-white/80">{product.sku}</div>
                </div>
              )}
              {product.series && product.series !== 'NA' && (
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5">
                  <div className="text-[9px] text-white/30 mb-0.5">Series</div>
                  <div className="text-white/80">{product.series}</div>
                </div>
              )}
              {product.category && (
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5">
                  <div className="text-[9px] text-white/30 mb-0.5">Category</div>
                  <div className="text-white/80">{product.category}</div>
                </div>
              )}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5">
                <div className="text-[9px] text-white/30 mb-0.5">Availability</div>
                <div className={isSoldOut ? 'text-red-500' : 'text-green-400'}>
                  {isSoldOut ? 'Out of Stock' : `${product.availableStock || 1} Units Available`}
                </div>
              </div>
            </div>

            {/* Price Display */}
            <div className="mb-8 flex items-center justify-between border-t border-white/5 pt-8">
              {settings.showPrices === true ? (
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Total Valuation</div>
                  <div className="font-mono text-3xl font-black text-white">₹{product.price}</div>
                </div>
              ) : (
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Pricing Option</div>
                  <div className="text-lg font-black text-gk-orange uppercase tracking-wider">Direct Message for Pricing</div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              {isSoldOut ? (
                <button
                  disabled
                  className="w-full py-4.5 rounded-2xl bg-zinc-900 border border-white/5 text-zinc-600 font-black text-sm uppercase tracking-widest cursor-not-allowed text-center"
                >
                  Sold Out
                </button>
              ) : settings.showPrices === true ? (
                <>
                  <button
                    onClick={handleAddToCart}
                    disabled={addedToCart}
                    className="flex-1 py-4.5 rounded-2xl border border-white/10 hover:border-gk-orange/30 hover:bg-gk-orange/5 text-white font-black text-xs uppercase tracking-widest transition-all cursor-pointer text-center flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {addedToCart ? (
                      <>
                        <Check size={14} className="text-green-400 animate-bounce" /> Added to Cart
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> Add to Cart
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 py-4.5 rounded-2xl bg-gk-orange hover:bg-orange-500 text-white font-black text-xs uppercase tracking-widest transition-all hover:shadow-[0_0_30px_rgba(225,6,0,0.4)] cursor-pointer text-center active:scale-[0.98]"
                  >
                    Buy Now
                  </button>
                </>
              ) : (
                <button
                  onClick={handleBuyNow}
                  className="w-full py-4.5 rounded-2xl bg-white/5 border border-white/10 hover:border-gk-orange/30 hover:bg-gk-orange/5 text-white font-black text-xs uppercase tracking-widest transition-all cursor-pointer text-center active:scale-[0.98]"
                >
                  Inquire Now
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Carousel: Top 5 Best Sellers */}
        {bestSellers.length > 0 && (
          <div className="border-t border-white/5 pt-16 mt-8">
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-wider mb-8 italic">
              Best Sellers <span className="text-gk-orange font-normal">/ Top Vault Releases</span>
            </h3>
            
            {/* Horizontal Flex Carousel Container */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {bestSellers.map((car) => {
                const isCarSoldOut = car.availableStock !== undefined 
                  ? car.availableStock <= 0 
                  : (Number(car.totalStock || 0) - Number(car.soldStock || 0) <= 0)

                return (
                  <Link
                    key={car.id}
                    to={`/product/${car.id}`}
                    className="group relative flex flex-col rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 p-3 transition-all duration-300 shadow-xl"
                  >
                    {/* Image Aspect ratio */}
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black/30 mb-3 relative">
                      <img 
                        src={car.image || '/brand-logo.png'} 
                        alt={car.name} 
                        onError={(e) => {
                          e.target.src = '/brand-logo.png';
                          e.target.className = "w-full h-full object-contain p-4 bg-zinc-950/80 pointer-events-none select-none";
                        }}
                        className={car.image ? "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-[0.16,1,0.3,1]" : "w-full h-full object-contain p-4 bg-zinc-950/80"}
                      />
                      {isCarSoldOut && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1.5px] flex items-center justify-center pointer-events-none z-10">
                          <span className="px-2 py-1 bg-red-950/50 text-red-500 font-black text-[8px] uppercase tracking-wider rounded border border-red-500/20">
                            Sold Out
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Meta */}
                    <div className="text-[8px] font-black uppercase tracking-widest text-gk-orange mb-0.5 truncate">
                      {car.brand}
                    </div>
                    <h4 className="text-[11px] font-bold text-white/80 truncate group-hover:text-white transition-colors mb-2">
                      {car.name}
                    </h4>
                    
                    <div className="mt-auto flex justify-between items-center text-[10px]">
                      {settings.showPrices === true && !isCarSoldOut ? (
                        <span className="font-mono font-bold text-white">₹{car.price}</span>
                      ) : (
                        <span className="text-[8px] uppercase tracking-wider text-gk-orange font-bold">
                          {isCarSoldOut ? 'Sold Out' : 'DM For Price'}
                        </span>
                      )}
                      <span className="text-[8px] font-black uppercase tracking-wider text-white/30 group-hover:text-gk-orange transition-colors">
                        View Details →
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
