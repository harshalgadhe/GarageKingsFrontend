import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { SiInstagram, SiWhatsapp } from 'react-icons/si'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import VaultModuleCard from '../components/common/VaultModuleCard'
import { ProductDetailSkeleton } from '../components/Skeletons'
import { CONTACT, createProductEnquiryUrl } from '../data/content'
import { getCars, getProduct } from '../lib/db'
import { logError } from '../lib/telemetry'

function imageUrl(image) {
  if (typeof image === 'string') return image
  return image?.fullUrl || image?.thumbnailUrl || image?.url || image?.src || null
}

function money(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? `₹${number.toLocaleString('en-IN')}` : 'Ask for price'
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState(null)
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    Promise.all([getProduct(id), getCars({ page: 1, limit: 8, paginated: true })])
      .then(([productData, cars]) => {
        if (!active) return
        if (!productData) {
          setError('This model could not be found.')
          return
        }
        setProduct(productData)
        setSelectedVariantIndex(0)
        const others = (cars?.products || [])
          .filter((car) => car.id !== id)
          .slice(0, 4)
        setRelated(others)
      })
      .catch((err) => {
        if (!active) return
        setError('We could not load this model right now.')
        logError(err.message || 'Product detail load failed', err.stack)
      })
      .finally(() => active && setLoading(false))

    return () => { active = false }
  }, [id])

  const variants = useMemo(() => {
    if (product?.caseVariants?.length) return product.caseVariants
    if (product?.variants?.length) return product.variants
    return [{
      casingType: product?.casingType || product?.casing || 'Box',
      price: product?.price ?? product?.sellingPrice ?? 0,
      poAmount: product?.poAmount || product?.prebookDepositAmount || 0,
      availableStock: product?.availableStock ?? product?.totalStock,
      images: product?.images || (product?.image ? [product.image] : []),
    }]
  }, [product])

  const variant = variants[selectedVariantIndex] || variants[0] || {}

  const images = useMemo(() => {
    const result = []
    const add = (value) => {
      const url = imageUrl(value)
      if (url && !result.includes(url)) result.push(url)
    }
    add(product?.image)
    ;(variant.images || []).forEach(add)
    ;(product?.images || []).forEach(add)
    return result
  }, [product, variant])

  useEffect(() => setActiveImage(images[0] || null), [images])

  if (loading) {
    return <div className="flex min-h-[100svh] flex-col justify-between bg-black pt-16 text-[#F5F5F7]"><Navigation activeSection="vault" /><ProductDetailSkeleton /><Footer /></div>
  }

  if (error || !product) {
    return (
      <div className="flex min-h-[100svh] flex-col justify-between bg-black pt-16 text-[#F5F5F7]">
        <Navigation activeSection="vault" />
        <main className="mx-auto my-24 max-w-lg px-6 text-center">
          <p className="text-sm text-[#86868B]">{error || 'This model is no longer available.'}</p>
          <button onClick={() => navigate('/marketplace')} className="mt-6 rounded-full bg-white px-6 py-3 text-xs font-bold text-black">Return to collection</button>
        </main>
        <Footer />
      </div>
    )
  }

  const selectedAvailableStock = variant.availableStock ?? variant.stock ?? product.availableStock ?? product.stock ?? product.totalStock
  const soldOut = product.isSoldOut !== undefined
    ? Boolean(product.isSoldOut)
    : (selectedAvailableStock !== undefined ? Number(selectedAvailableStock) <= 0 : false)
  const preOrder = Boolean(product.isPrebook || product.status === 'Pre-Order')
  const total = Number(variant.price || product.price || product.sellingPrice || 0)
  const deposit = Number(variant.poAmount || product.poAmount || product.prebookDepositAmount || 0)
  const balance = Math.max(0, total - deposit)
  const reference = `GK-${String(product.id || '').replace(/-/g, '').slice(0, 8).toUpperCase()}`
  const condition = product.condition || product.packagingCondition || 'Ask to confirm'

  const enquire = () => window.open(
    createProductEnquiryUrl({
      ...product,
      price: total,
      poAmount: deposit,
      casingType: variant.casingType || product.casing,
      availability: soldOut ? 'Sold out' : preOrder ? 'Pre-booking' : 'Available',
      isSoldOut: soldOut,
    }, reference),
    '_blank',
    'noopener,noreferrer',
  )

  const facts = [
    ['Brand', product.brand || 'Not specified'],
    ['Scale', product.scale || 'Not specified'],
    ['Packaging', variant.casingType || product.casing || 'Not specified'],
    ['Condition', condition],
    ['Reference number', product.sku || reference],
    ['Availability', soldOut ? 'Sold out' : preOrder ? 'Pre-booking' : 'Available'],
  ]

  return (
    <div className="min-h-[100svh] bg-black pt-16 text-[#F5F5F7]">
      <Navigation activeSection="vault" />

      <div className="border-b border-white/[0.08]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 sm:px-6 lg:px-12">
          <button onClick={() => navigate('/marketplace')} className="flex items-center gap-2 text-xs font-semibold text-[#A1A1A6] transition hover:text-white"><ArrowLeft size={15} /> Back to collection</button>
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#6E6E73]">{reference}</span>
        </div>
      </div>

      <main>
        <section className="mx-auto grid max-w-[1440px] gap-8 px-4 pb-12 pt-6 sm:px-6 md:pt-8 lg:min-h-[calc(100svh-121px)] lg:grid-cols-12 lg:items-center lg:gap-12 lg:px-12 lg:pb-5 lg:pt-5">
          <motion.div initial={reduceMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }} className="relative lg:col-span-7">
            <div className="relative flex min-h-[500px] flex-col overflow-hidden rounded-[26px] border border-white/[0.09] bg-[#0C0C0C] p-5 sm:min-h-[600px] sm:p-10 lg:h-[calc(100svh-166px)] lg:min-h-[500px] lg:max-h-[680px] lg:pl-24">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,.11),transparent_34%),linear-gradient(145deg,rgba(255,255,255,.025),transparent_45%)]" />
              {(soldOut || preOrder) && (
                <div className="relative z-20 flex w-full shrink-0 pb-4">
                  <span className={`rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] ${soldOut ? 'bg-[#FF453A]/12 text-[#FF6961]' : 'bg-[#E1BD65]/12 text-[#E1BD65]'}`}>
                    {soldOut ? 'Sold out' : 'Pre-booking'}
                  </span>
                </div>
              )}

              <div className="relative z-10 flex min-h-0 w-full flex-1 items-center justify-center">
                {activeImage ? (
                  <img src={activeImage} alt={`${product.brand || ''} ${product.name}`} className="max-h-full max-w-full object-contain drop-shadow-[0_35px_42px_rgba(0,0,0,.72)]" />
                ) : (
                  <div className="text-center text-sm text-[#6E6E73]">Photography coming soon</div>
                )}
              </div>
            </div>

            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2 lg:absolute lg:left-5 lg:top-1/2 lg:z-30 lg:mt-0 lg:max-h-[calc(100%-40px)] lg:-translate-y-1/2 lg:flex-col lg:overflow-y-auto lg:rounded-2xl lg:bg-black/45 lg:p-2 lg:backdrop-blur-md">
                {images.map((image, index) => (
                  <button key={image} onClick={() => setActiveImage(image)} className={`h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-[#101010] p-1.5 transition lg:h-16 lg:w-16 ${activeImage === image ? 'border-[#E1BD65]' : 'border-white/[0.08] opacity-60 hover:opacity-100'}`} aria-label={`View image ${index + 1}`}>
                    <img src={image} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          <motion.aside initial={reduceMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.08 }} className="self-start lg:col-span-5 lg:self-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D8BC78]">{product.brand || 'GarageKings'}</div>
            <h1 className="mt-3 text-4xl font-semibold leading-[0.96] tracking-[-0.045em] text-white sm:text-5xl lg:text-5xl">{product.name}</h1>

            <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-semibold text-[#A1A1A6]">
              <span className="rounded-full border border-white/[0.1] px-3 py-1.5">{product.scale || 'Scale not specified'}</span>
              <span className="rounded-full border border-white/[0.1] px-3 py-1.5">{variant.casingType || product.casing || 'Packaging not specified'}</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-0 border-y border-white/[0.08] py-2">
              {facts.map(([label, value]) => (
                <div key={label} className="flex min-w-0 items-center justify-between gap-3 border-b border-white/[0.055] py-2.5 [&:nth-last-child(-n+2)]:border-b-0">
                  <div className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#68655F]">{label}</div>
                  <div className="truncate text-[10px] font-semibold text-[#C9C6C0]" title={String(value)}>{value}</div>
                </div>
              ))}
            </div>

            {variants.length > 1 && (
              <div className="mt-5">
                <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#86868B]">Choose packaging</div>
                <div className="grid grid-cols-2 gap-2">
                  {variants.map((option, index) => (
                    <button key={index} onClick={() => setSelectedVariantIndex(index)} className={`rounded-2xl border p-3 text-left transition ${selectedVariantIndex === index ? 'border-white bg-white text-black' : 'border-white/[0.1] bg-[#0A0A0A] text-[#D2D2D7] hover:border-white/25'}`}>
                      <span className="flex items-center justify-between text-xs font-semibold">{option.casingType || option.casing || `Option ${index + 1}`}{selectedVariantIndex === index && <Check size={14} />}</span>
                      <span className={`mt-1 block font-mono text-[10px] ${selectedVariantIndex === index ? 'text-black/60' : 'text-[#86868B]'}`}>{money(option.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 border-y border-white/[0.09] py-4">
              {preOrder && deposit > 0 ? (
                <div>
                  <div className="flex items-end justify-between gap-4">
                    <div><div className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#D8BC78]">Pre-booking</div><span className="mt-1 block text-sm text-[#A1A1A6]">Total model price</span></div>
                    <strong className="text-3xl font-semibold text-white">{money(total)}</strong>
                  </div>
                  <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.025]">
                    <div className="border-r border-white/[0.09] p-3.5">
                      <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#8B8984]">PO amount · pay now</div>
                      <div className="mt-1.5 text-lg font-semibold text-[#F5F5F7]">{money(deposit)}</div>
                    </div>
                    <div className="p-3.5">
                      <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#8B8984]">Balance · pay later</div>
                      <div className="mt-1.5 text-lg font-semibold text-[#C9C6C0]">{money(balance)}</div>
                    </div>
                  </div>
                  <p className="mt-2.5 text-[10px] leading-relaxed text-[#77746E]">The PO amount reserves the model and is included in the total price. The balance is payable when the model arrives.</p>
                </div>
              ) : (
                <div className="flex items-end justify-between gap-4"><span className="text-sm text-[#A1A1A6]">Listed price</span><strong className="text-3xl font-semibold text-white">{money(total)}</strong></div>
              )}
              <p className="mt-3 text-[10px] leading-relaxed text-[#6E6E73]">Contact us to confirm current availability, price and delivery or collection details.</p>
            </div>

            <div className="mt-4">
              <div className="mb-3">
                <div className="text-sm font-semibold text-[#F5F5F7]">{soldOut ? 'Ask about this model' : 'Interested in this model?'}</div>
                <p className="mt-1 text-[11px] leading-relaxed text-[#6E6E73]">{soldOut ? 'Ask about a restock, another edition, or a similar model from the collection.' : 'Choose how you would like to contact GarageKings.'}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <button onClick={enquire} className="flex items-center justify-center gap-2 rounded-full border border-white/[0.11] bg-white/[0.045] px-5 py-3 text-xs font-semibold text-[#E8E8ED] transition hover:bg-white hover:text-black"><SiWhatsapp size={18} className="text-[#25D366]" /> {soldOut ? 'Ask about restock' : 'WhatsApp'}</button>
                <a href={CONTACT.instagramUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-full border border-white/[0.11] bg-white/[0.045] px-5 py-3 text-xs font-semibold text-[#E8E8ED] transition hover:bg-white hover:text-black"><SiInstagram size={17} className="text-[#E1306C]" /> Instagram</a>
              </div>
            </div>

            <p className="mt-2 px-2 text-center text-[9px] leading-relaxed text-[#5F5D58]">Availability and arrangements are confirmed directly.</p>
          </motion.aside>
        </section>

        {product.description && product.description.trim().toLowerCase() !== product.name?.trim().toLowerCase() && (
          <section className="mx-auto max-w-4xl px-6 py-14 text-left md:py-18">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D8BC78]">About this model</div>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed tracking-[-0.015em] text-[#B8B5AF] md:text-xl">{product.description}</p>
          </section>
        )}

        {related.length > 0 && (
          <section className="mx-auto max-w-[1440px] border-t border-white/[0.08] px-4 py-16 sm:px-6 lg:px-12 lg:py-24">
            <div className="mb-9 flex items-end justify-between">
              <div><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D8BC78]">You may also like</span><h2 className="mt-2 text-3xl font-semibold tracking-tight">More from the collection</h2></div>
              <Link to="/marketplace" className="hidden items-center gap-2 text-xs font-semibold text-[#A1A1A6] hover:text-white sm:flex">View all <ArrowRight size={15} /></Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map((car) => <VaultModuleCard key={car.id} car={car} onClick={() => navigate(`/product/${car.id}`)} />)}</div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
