import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getProduct, getCars } from '../lib/db'
import { getCurrentUser } from '../lib/auth'
import { readCart, writeCart, notifyCartUpdated } from '../lib/cart'
import { logError } from '../lib/telemetry'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import CollectorStandardTrust from '../components/common/CollectorStandardTrust'
import VaultModuleCard from '../components/common/VaultModuleCard'
import { ProductDetailSkeleton } from '../components/Skeletons'
import { ArrowLeft, ShoppingBag, Check, ShieldCheck, Package, RotateCcw, ChevronDown, MessageSquare } from 'lucide-react'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [bestSellers, setBestSellers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState(null)
  const [addedToCart, setAddedToCart] = useState(false)
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)

  const caseVariants = React.useMemo(() => {
    if (Array.isArray(product?.caseVariants) && product.caseVariants.length > 0) {
      return product.caseVariants;
    }
    if (Array.isArray(product?.variants) && product.variants.length > 0) {
      return product.variants;
    }
    return [{
      casingType: product?.casingType || product?.casing || 'Box',
      price: product?.price ?? product?.sellingPrice ?? 0,
      poAmount: product?.poAmount || product?.prebookDepositAmount || 0,
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

        const otherCars = (allCars?.products || allCars || [])
          .filter(c => c.id !== id)
          .slice(0, 4)
        
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

  if (isLoading) {
    return (
      <div className="min-h-[100svh] bg-[#050505] text-[#F4F1EC] pt-16 flex flex-col justify-between">
        <Navigation activeSection="vault" />
        <ProductDetailSkeleton />
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[100svh] bg-[#050505] text-[#F4F1EC] pt-16 flex flex-col justify-between">
        <Navigation activeSection="vault" />
        <div className="max-w-xl mx-auto my-24 p-8 bg-[#0D0D0D] border border-white/[0.06] rounded-xl text-center space-y-4 font-mono">
          <div className="text-xs uppercase tracking-widest text-[#E86A2F]">Vault Inspection Notice</div>
          <h2 className="text-xl font-bold text-[#F4F1EC]">Entry Not Found</h2>
          <p className="text-xs text-[#A9A49C]">{error || 'This collectible entry does not exist or has been archived.'}</p>
          <button onClick={() => navigate('/marketplace')} className="px-5 py-2.5 rounded-lg bg-[#E86A2F] text-black font-bold text-xs uppercase tracking-wider cursor-pointer">
            Return to Vault Catalog
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const isSoldOut = product.isSoldOut !== undefined
    ? product.isSoldOut
    : (product.availableStock !== undefined ? Number(product.availableStock) <= 0 : false);

  const isPrebook = Boolean(product.isPrebook || product.status === 'Pre-Order');
  const totalPrice = Number(currentVariant.price || product.price || product.sellingPrice || 0);
  const depositAmount = Number(currentVariant.poAmount || product.poAmount || product.prebookDepositAmount || 0);
  const remainingBalance = Math.max(0, totalPrice - depositAmount);

  const shortHash = String(product.id || '').replace(/-/g, '').substring(0, 4).toUpperCase();
  const vaultIndex = `GK-2026-${shortHash}`;

  const handleAddToCart = () => {
    const cartItem = {
      id: product.id,
      variantId: currentVariant.id || product.id,
      name: product.name,
      brand: product.brand,
      casing: currentVariant.casingType || product.casing || 'Box',
      price: totalPrice,
      poAmount: depositAmount,
      isPrebook: isPrebook,
      image: activeImage || product.image,
      quantity: 1
    };

    const currentCart = readCart();
    const existingIdx = currentCart.findIndex(it => it.id === cartItem.id && it.variantId === cartItem.variantId);
    let newCart;
    if (existingIdx >= 0) {
      newCart = currentCart.map((it, idx) => idx === existingIdx ? { ...it, quantity: it.quantity + 1 } : it);
    } else {
      newCart = [...currentCart, cartItem];
    }

    writeCart(newCart);
    notifyCartUpdated();
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const handleWhatsAppInquiry = () => {
    const text = `Hello GarageKings! I am inspecting collectible "${product.brand} ${product.name}" (Ref: ${vaultIndex}). I would like to confirm acquisition details.`;
    window.open(`https://wa.me/917300240424?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-[100svh] bg-[#050505] text-[#F4F1EC] pt-16">
      <Navigation activeSection="vault" />

      {/* ── Inspection Room Top Bar ── */}
      <div className="border-b border-white/[0.06] bg-[#090909] py-3.5 px-6 font-mono text-xs text-[#74716B]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/marketplace')}
            className="flex items-center gap-2 text-[#A9A49C] hover:text-[#F4F1EC] transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Return to Vault Index</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8AE7D]" />
            <span>INSPECTION ROOM: <strong className="text-[#F4F1EC]">{vaultIndex}</strong></span>
          </div>
        </div>
      </div>

      {/* ── Main Inspection Layout (60/40 Split) ── */}
      <main className="max-w-7xl mx-auto px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* ── LEFT: 60% IMMERSIVE GALLERY & INSPECTION RAIL ── */}
          <div className="lg:col-span-7 space-y-4">
            {/* Primary Media Stage */}
            <div className="aspect-[4/3] w-full bg-[#080808] artifact-stage-light border border-white/[0.06] rounded-xl relative overflow-hidden flex items-center justify-center p-6">
              <div className="absolute bottom-6 inset-x-16 h-6 rounded-full bg-black/90 blur-lg pointer-events-none" />

              <img
                src={activeImage || product.image || '/brand-logo.png'}
                alt={product.name}
                className="max-h-full max-w-full object-contain relative z-10 select-none pointer-events-none transition-opacity duration-200"
              />

              {/* Status Badge Overlay */}
              <div className="absolute top-4 left-4 z-20 font-mono">
                {isSoldOut ? (
                  <span className="px-2.5 py-1 rounded bg-[#B85C5C]/15 border border-[#B85C5C]/30 text-[#B85C5C] text-[10px] font-bold tracking-wider uppercase">
                    ARCHIVED / SOLD OUT
                  </span>
                ) : isPrebook ? (
                  <span className="px-2.5 py-1 rounded bg-[#C99652]/15 border border-[#C99652]/30 text-[#C99652] text-[10px] font-bold tracking-wider uppercase">
                    INCOMING PRE-ORDER
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded bg-[#5E9F78]/15 border border-[#5E9F78]/30 text-[#5E9F78] text-[10px] font-bold tracking-wider uppercase">
                    AVAILABLE IN VAULT
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Inspection Rail */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {allImages.map((img, idx) => {
                  const isActive = activeImage === img;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`w-20 h-20 rounded-lg bg-[#0D0D0D] border overflow-hidden shrink-0 relative transition-all cursor-pointer ${
                        isActive
                          ? 'border-[#E86A2F] ring-1 ring-[#E86A2F]'
                          : 'border-white/[0.08] opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-contain p-1.5" />
                      {isActive && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#E86A2F]" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Factual Description / Collector Notes */}
            {product.description && (
              <div className="pt-6 border-t border-white/[0.06] space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-widest text-[#74716B] font-bold">COLLECTOR NOTES</h4>
                <p className="text-xs md:text-sm text-[#A9A49C] leading-relaxed font-sans">{product.description}</p>
              </div>
            )}

            {/* Technical Data Definition List */}
            <div className="pt-6 border-t border-white/[0.06] space-y-3 font-mono">
              <h4 className="text-xs uppercase tracking-widest text-[#74716B] font-bold">TECHNICAL SPECIFICATIONS</h4>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[#0D0D0D] border border-white/[0.06] p-4 rounded-xl">
                <div>
                  <dt className="text-[10px] text-[#74716B] uppercase">BRAND</dt>
                  <dd className="font-bold text-[#F4F1EC] mt-0.5">{product.brand || 'Mini GT'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-[#74716B] uppercase">SCALE</dt>
                  <dd className="font-bold text-[#F4F1EC] mt-0.5">{product.scale || '1:64'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-[#74716B] uppercase">CASING TYPE</dt>
                  <dd className="font-bold text-[#F4F1EC] mt-0.5">{currentVariant.casingType || product.casing || 'Box'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-[#74716B] uppercase">RELEASE</dt>
                  <dd className="font-bold text-[#F4F1EC] mt-0.5">{isPrebook ? 'Pre-Order' : 'Standard'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-[#74716B] uppercase">SKU</dt>
                  <dd className="font-bold text-[#F4F1EC] mt-0.5">{product.sku || vaultIndex}</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-[#74716B] uppercase">CONDITION</dt>
                  <dd className="font-bold text-[#5E9F78] mt-0.5">Mint Sealed</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* ── RIGHT: 40% STICKY ACQUISITION PANEL ── */}
          <div className="lg:col-span-5 bg-[#0D0D0D] border border-white/[0.06] rounded-xl p-6 md:p-8 space-y-6 sticky top-24">
            
            {/* Identity Header */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2 font-mono text-xs">
                <span className="text-[#E86A2F] font-bold uppercase tracking-widest">{product.brand || 'Mini GT'}</span>
                <span className="text-[#74716B]">{vaultIndex}</span>
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold text-[#F4F1EC] leading-snug">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 mt-2 font-mono text-xs text-[#74716B]">
                <span>{product.scale || '1:64'}</span>
                <span>•</span>
                <span>{currentVariant.casingType || product.casing || 'Box'}</span>
                <span>•</span>
                <span>2026 Edition</span>
              </div>
            </div>

            {/* Multiple Casing Variant Selector if present */}
            {caseVariants.length > 1 && (
              <div className="space-y-2 pt-2 border-t border-white/[0.06] font-mono">
                <label className="text-[10px] uppercase tracking-widest text-[#74716B] font-bold block">
                  Select Packaging Option:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {caseVariants.map((v, idx) => {
                    const isSelected = selectedVariantIndex === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedVariantIndex(idx)}
                        className={`p-3 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#E86A2F]/10 border-[#E86A2F] text-[#F4F1EC]'
                            : 'bg-[#050505] border-white/[0.08] text-[#A9A49C] hover:border-white/[0.16]'
                        }`}
                      >
                        <div className="font-bold uppercase">{v.casingType || v.casing || `Option ${idx+1}`}</div>
                        <div className="text-[11px] text-[#74716B] font-mono mt-0.5">₹{Number(v.price || 0).toLocaleString('en-IN')}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Financial Breakdown Panel */}
            <div className="p-4 bg-[#050505] border border-white/[0.06] rounded-xl space-y-3 font-mono">
              {isPrebook ? (
                <>
                  <div className="flex justify-between items-center text-xs text-[#A9A49C]">
                    <span>Pay Today (Pre-Order Deposit):</span>
                    <strong className="text-base text-[#E86A2F]">₹{depositAmount.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs text-[#74716B] pt-2 border-t border-white/[0.04]">
                    <span>Remaining Balance (Due at dispatch):</span>
                    <span>₹{remainingBalance.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-[#F4F1EC] pt-2 border-t border-white/[0.06] font-bold">
                    <span>Total Item Price:</span>
                    <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#74716B] uppercase font-bold">Total Acquisition Price:</span>
                  <strong className="text-xl md:text-2xl text-[#F4F1EC]">₹{totalPrice.toLocaleString('en-IN')}</strong>
                </div>
              )}

              {product.customerEta && (
                <div className="text-[10px] text-[#C99652] pt-2 border-t border-white/[0.04] flex items-center justify-between">
                  <span>Estimated Vault Arrival:</span>
                  <strong className="font-bold">{product.customerEta}</strong>
                </div>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-3 pt-2 font-mono">
              {isSoldOut ? (
                <button disabled className="w-full py-4 rounded-lg bg-[#56524D]/20 border border-[#56524D]/30 text-[#56524D] text-xs uppercase font-bold tracking-widest cursor-not-allowed">
                  Archived / Sold Out
                </button>
              ) : (
                <>
                  <button
                    onClick={handleAddToCart}
                    className={`w-full py-4 rounded-lg text-xs uppercase font-black tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      addedToCart
                        ? 'bg-[#5E9F78] text-black shadow-lg'
                        : 'bg-[#E86A2F] hover:bg-[#F2793F] text-black shadow-[0_0_24px_rgba(232,106,47,0.3)]'
                    }`}
                  >
                    {addedToCart ? (
                      <>
                        <Check size={16} /> Added to Acquisition Queue
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={16} /> {isPrebook ? 'Secure Pre-Order' : 'Begin Acquisition'}
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleWhatsAppInquiry}
                    className="w-full py-3.5 rounded-lg bg-[#050505] hover:bg-white/[0.04] border border-white/[0.08] text-xs font-bold text-[#A9A49C] hover:text-[#F4F1EC] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={14} className="text-[#5E9F78]" />
                    <span>Inquire via WhatsApp Collector Desk</span>
                  </button>
                </>
              )}
            </div>

            {/* Trust Accordions */}
            <div className="pt-6 border-t border-white/[0.06] space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#A9A49C]">
                <ShieldCheck size={14} className="text-[#5E9F78]" />
                <span>100% Genuine Authenticity Guaranteed</span>
              </div>
              <div className="flex items-center gap-2 text-[#A9A49C]">
                <Package size={14} className="text-[#C8AE7D]" />
                <span>5-Ply Heavy Armor Packaging Protection</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── Related Collection Entries ── */}
        {bestSellers.length > 0 && (
          <section className="mt-20 pt-12 border-t border-white/[0.06] space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#E86A2F] mb-1">RELATED RELEASES</div>
                <h3 className="text-xl md:text-2xl font-bold text-[#F4F1EC]">Complete the Collection</h3>
              </div>
              <Link to="/marketplace" className="text-xs font-mono text-[#C8AE7D] hover:text-white uppercase font-bold">
                View All Vault →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestSellers.map(car => (
                <VaultModuleCard key={car.id} car={car} onClick={() => navigate(`/product/${car.id}`)} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
