import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getProduct, getCars } from '../lib/db'
import { getCurrentUser } from '../lib/auth'
import { readCart, writeCart, notifyCartUpdated } from '../lib/cart'
import { logError } from '../lib/telemetry'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import { ShoppingBag, ArrowLeft, Plus, Minus, Check, LogIn } from 'lucide-react'
import { ProductDetailSkeleton } from '../components/Skeletons'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [bestSellers, setBestSellers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState(null)
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)

  const caseVariants = React.useMemo(() => {
    if (Array.isArray(product?.caseVariants) && product.caseVariants.length > 0) {
      return product.caseVariants;
    }
    if (Array.isArray(product?.variants) && product.variants.length > 0) {
      return product.variants;
    }
    return [{
      casingType: product?.casingType || product?.casing || 'Blister',
      price: product?.price ?? product?.sellingPrice ?? 0,
      poAmount: product?.poAmount || product?.prebookDepositAmount || 0,
      pendingBalance: product?.pendingBalance || 0,
      availableStock: product?.availableStock ?? product?.totalStock ?? 10,
      images: Array.isArray(product?.images) ? product.images : (product?.image ? [product.image] : [])
    }];
  }, [product]);

  const currentVariant = caseVariants[selectedVariantIndex] || caseVariants[0] || {};

  const allImages = React.useMemo(() => {
    const list = [];
    if (product?.image) {
      const url = typeof product.image === 'string' ? product.image : (product.image?.fullUrl || product.image?.url);
      if (url && !list.includes(url)) list.push(url);
    }
    const varImages = currentVariant.images || [];
    if (Array.isArray(varImages)) {
      varImages.forEach(img => {
        const url = typeof img === 'string' ? img : (img?.fullUrl || img?.thumbnailUrl || img?.url || img?.src);
        if (url && !list.includes(url)) list.push(url);
      });
    }
    if (Array.isArray(product?.images)) {
      product.images.forEach(img => {
        const url = typeof img === 'string' ? img : (img?.fullUrl || img?.thumbnailUrl || img?.url || img?.src);
        if (url && !list.includes(url)) list.push(url);
      });
    }
    return list;
  }, [product, currentVariant]);

  useEffect(() => {
    if (allImages.length > 0) {
      setActiveImage(allImages[0]);
    }
  }, [allImages]);

  useEffect(() => {
    async function loadProductData() {
      setIsLoading(true)
      try {
        const [prodData, allCars] = await Promise.all([
          getProduct(id),
          getCars()
        ])

        if (!prodData) {
          setError('The requested casting could not be located in our archives.')
          return
        }

        setProduct(prodData)
        setSelectedVariantIndex(0)
        if (prodData.image) setActiveImage(prodData.image)

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

  const handleReachOutToPurchase = () => {
    if (!product) return;
    const priceText = product.price != null && Number(product.price) > 0 
      ? `Price: ₹${Number(product.price).toLocaleString('en-IN')}` 
      : 'Price on Inquiry';
    const message = `Hi GarageKings team, I am interested in purchasing:\n\n📌 Model: ${product.name}\n🏷️ Brand: ${product.brand || product.carBrand || 'N/A'}\n📦 Scale: ${product.scale || '1:64'}\n🔢 SKU: ${product.sku || product.id}\n💰 ${priceText}\n\nPlease share availability and order steps.`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleInstagramInquiry = () => {
    window.open('https://www.instagram.com/garagekingsindia/', '_blank');
  };

  // Keep nav+footer always mounted. Render skeleton inside the shell during load.
  if (isLoading) {
    return (
      <div className="min-h-[100svh] bg-gk-black text-white flex flex-col pt-16">
        <Navigation activeSection="vault" />
        <ProductDetailSkeleton />
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-[100svh] bg-gk-black text-white selection:bg-gk-yellow selection:text-black pt-16 flex flex-col"
    >
      <Navigation activeSection="vault" />

      {/* Main product wrapper */}
      <div className="flex-1 max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 w-full">
        {/* Back Link */}
        <Link 
          to="/marketplace" 
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-xs font-bold uppercase tracking-widest mb-6 group transition-colors"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Marketplace
        </Link>

        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start mb-16">
          {/* Left Column: Product Image & Gallery */}
          <div className="lg:col-span-6 space-y-3">
            <div className="aspect-[4/3] max-h-[380px] w-full rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden relative shadow-xl shadow-black/80">
              <img 
                src={activeImage || product.image || '/brand-logo.png'} 
                alt={product.name}
                onError={(e) => {
                  e.target.src = '/brand-logo.png';
                  e.target.className = "w-full h-full object-contain p-8 bg-zinc-950/80 pointer-events-none select-none";
                }}
                className="w-full h-full object-contain p-4 pointer-events-none select-none transition-all duration-300"
                style={{ WebkitUserDrag: 'none' }}
                onContextMenu={(e) => e.preventDefault()}
              />
              {isSoldOut && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center pointer-events-none z-10">
                  <span className="px-5 py-2.5 border border-red-500/40 bg-red-950/30 rounded-xl text-red-500 font-black text-xs uppercase tracking-[0.2em] shadow-2xl">
                    Sold Out
                  </span>
                </div>
              )}
              {product.lane && !['standard', 'standard edition', 'none', ''].includes(String(product.lane).trim().toLowerCase()) && (
                <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-black/90 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-gk-yellow pointer-events-none shadow-xl">
                  {product.lane}
                </div>
              )}
            </div>

            {/* Thumbnail Gallery (if multiple images) */}
            {allImages.length > 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(imgUrl)}
                    className={`w-14 h-14 rounded-xl border overflow-hidden p-1 bg-black/40 transition-all cursor-pointer ${
                      (activeImage || product.image) === imgUrl
                        ? 'border-gk-orange ring-1 ring-gk-orange'
                        : 'border-white/10 hover:border-white/30 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Metadata & Actions */}
          <div className="lg:col-span-6 flex flex-col h-full justify-center">
            {/* Headers */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#ff5500]">
                  {product.brand || product.carBrand || 'Mini GT'}
                </span>
                <span className="text-white/30">•</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 bg-white/5 px-2 py-0.5 rounded">
                  {product.scale || '1:64'}
                </span>
                {product.sku && (
                  <span className="text-[10px] font-mono font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded">
                    SKU: {product.sku}
                  </span>
                )}
                {(() => {
                  const rawTags = Array.isArray(product.tags) && product.tags.length > 0
                    ? product.tags
                    : [product.tag || product.grade].filter(Boolean);
                  const validTags = rawTags.filter(t => {
                    if (!t) return false;
                    const s = String(t).trim().toLowerCase();
                    return s !== 'none' && s !== '';
                  });
                  return validTags.map((t, idx) => (
                    <span key={idx} className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                      {t}
                    </span>
                  ));
                })()}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight mb-3">
                {product.name}
              </h1>

              {product.isPrebook && (
                <div className="inline-flex mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border bg-[#ff5500]/15 text-[#ff5500] border-[#ff5500]/30 shadow-[0_0_10px_rgba(255,85,0,0.15)] animate-pulse">
                    Pre-Booking Release (PO)
                  </span>
                </div>
              )}
            </div>

            {/* CASE TYPE VARIANT SELECTOR */}
            {caseVariants.length > 1 && (
              <div className="mb-5 bg-white/[0.02] border border-white/5 p-3 rounded-xl space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">
                  Select Packaging / Case Type:
                </label>
                <div className="flex flex-wrap gap-2">
                  {caseVariants.map((v, vIdx) => {
                    const isSelected = selectedVariantIndex === vIdx;
                    return (
                      <button
                        key={vIdx}
                        onClick={() => setSelectedVariantIndex(vIdx)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'bg-[#ff5500] text-black shadow-[0_0_15px_rgba(255,85,0,0.3)]'
                            : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                        }`}
                      >
                        <span>{v.casingType || v.casing}</span>
                        <span className="font-mono text-[11px] opacity-80">₹{Number(v.price || v.sellingPrice || 0).toLocaleString('en-IN')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <p className="text-xs md:text-sm text-white/60 leading-relaxed mb-6 border-b border-white/5 pb-5">
                {product.description}
              </p>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6 text-xs font-bold uppercase tracking-wider">
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                <div className="text-[8px] text-white/30 mb-0.5">Scale</div>
                <div className="text-white/80 text-[11px]">{product.scale || '1:64'}</div>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                <div className="text-[8px] text-white/30 mb-0.5">Case Type</div>
                <div className="text-white/80 text-[11px]">{currentVariant.casingType || currentVariant.casing || product.casingType || 'Blister'}</div>
              </div>

              {product.isPrebook && (
                <>
                  <div className="bg-[#ff5500]/5 border border-[#ff5500]/20 rounded-xl p-3">
                    <div className="text-[8px] text-[#ff5500]/70 mb-0.5">PO Advance Deposit</div>
                    <div className="font-mono text-[#ff5500] text-[12px] font-black">
                      ₹{Number(currentVariant.poAmount || currentVariant.prebookDepositAmount || product.poAmount || 0).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                    <div className="text-[8px] text-amber-400/70 mb-0.5">Pending Balance Due</div>
                    <div className="font-mono text-amber-400 text-[12px] font-black">
                      ₹{Number(currentVariant.pendingBalance || product.pendingBalance || (Number(currentVariant.price || product.price || 0) - Number(currentVariant.poAmount || product.poAmount || 0))).toLocaleString('en-IN')}
                    </div>
                  </div>
                </>
              )}

              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 col-span-2">
                <div className="text-[8px] text-white/30 mb-0.5">Availability</div>
                <div className={isSoldOut ? 'text-red-500 font-bold text-[11px]' : product.isPrebook ? 'text-[#ff5500] font-bold text-[11px]' : 'text-green-400 font-bold text-[11px]'}>
                  {isSoldOut ? 'Out of Stock' : product.isPrebook ? `Pre-Booking Order ${product.arrivalDate ? `(ETA: ${product.arrivalDate})` : ''}` : 'In Stock'}
                </div>
              </div>
            </div>

            {/* Price Display */}
            <div className="mb-6 flex items-center justify-between border-t border-white/5 pt-5">
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-0.5">
                  {product.isPrebook ? 'Total Item Price' : 'Price'} ({currentVariant.casingType || 'Selected Case'})
                </div>
                <div className="font-mono text-2xl md:text-3xl font-black text-white">
                  {(currentVariant.price != null && Number(currentVariant.price) > 0)
                    ? `₹${Number(currentVariant.price).toLocaleString('en-IN')}`
                    : (product.price != null && Number(product.price) > 0)
                      ? `₹${Number(product.price).toLocaleString('en-IN')}`
                      : 'Price on Inquiry'}
                </div>
              </div>
            </div>

            {/* Inquiry Actions: WhatsApp & Instagram Buttons */}
            <div className="space-y-3">
              {isSoldOut ? (
                <button
                  disabled
                  className="w-full py-3.5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-600 font-black text-xs uppercase tracking-widest cursor-not-allowed text-center"
                >
                  Sold Out
                </button>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleReachOutToPurchase}
                    className="py-3.5 px-5 rounded-xl bg-[#ff5500] hover:bg-[#ff661a] text-white font-black text-xs uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(255,85,0,0.25)] hover:shadow-[0_4px_28px_rgba(255,85,0,0.4)] cursor-pointer text-center active:scale-[0.98] flex items-center justify-center gap-2.5"
                  >
                    <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                    </svg>
                    <span>Inquire via WhatsApp</span>
                  </button>
                  <button
                    onClick={handleInstagramInquiry}
                    className="py-3.5 px-5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white font-black text-xs uppercase tracking-widest transition-all cursor-pointer text-center active:scale-[0.98] flex items-center justify-center gap-2.5"
                  >
                    <svg className="w-4 h-4 fill-current text-white/80" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span>Inquire via Instagram</span>
                  </button>
                </div>
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
                        className="w-full h-full object-contain p-2 group-hover:scale-103 transition-transform duration-500 ease-[0.16,1,0.3,1]"
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
                      {!isCarSoldOut ? (
                        <span className="font-mono font-bold text-white">₹{car.price}</span>
                      ) : (
                        <span className="text-[8px] uppercase tracking-wider text-gk-orange font-bold">
                          Sold Out
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
    </motion.div>
  )
}
