import { forwardRef, useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ImageOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { buildBrandTheme } from '../../data/brandThemes'
import { getBrands, getCars, getHomepageProducts } from '../../lib/db'

const brandKey = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
const canRepresentBrand = (model) => Boolean(
  model?.image
  && model?.isSoldOut !== true
  && (model?.availableStock === undefined || Number(model.availableStock) > 0)
)

const TechnicalArchive = forwardRef(function TechnicalArchive(props, ref) {
  const reduceMotion = useReducedMotion()
  const navigate = useNavigate()
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)

  const featuredBrands = useMemo(() => {
    const brandsWithLogos = brands
      .map((brand) => ({
        ...brand,
        model: models.find((model) => brandKey(model.brand) === brandKey(brand.name) && canRepresentBrand(model)) || null,
      }))
      .filter((brand) => Boolean(brand.logo))
    const shuffled = [...brandsWithLogos]
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1))
      ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
    }
    return shuffled.slice(0, 6)
  }, [brands, models])

  useEffect(() => {
    let active = true
    Promise.all([getBrands(), getCars({ page: 1, limit: 100 }), getHomepageProducts()])
      .then(([records, products, homepage]) => {
        if (!active) return
        setBrands((Array.isArray(records) ? records : []).map(buildBrandTheme).filter(Boolean))
        setModels([
          homepage?.featured,
          ...(homepage?.recent || []),
          ...(Array.isArray(products) ? products : []),
        ].filter(canRepresentBrand))
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <div ref={ref} id="brands" className="w-full scroll-mt-16 bg-[#070706]">
      <section className="relative w-full overflow-hidden border-t border-white/[0.07] px-4 py-20 sm:px-6 md:px-12 md:py-28 lg:px-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(225,189,101,.08),transparent_30%),radial-gradient(circle_at_88%_70%,rgba(255,255,255,.045),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.018)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.018)_1px,transparent_1px)] bg-[size:5rem_5rem] opacity-40" />

        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <header className="mb-10 flex flex-col gap-6 border-b border-white/[0.08] pb-8 md:mb-14 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.22em] text-[#D8BC78]">Explore by brand</span>
              <h2 className="max-w-3xl text-4xl font-semibold leading-[0.96] tracking-[-0.04em] text-[#F4F1EC] sm:text-5xl md:text-6xl">
                Recognisable names.<br /><span className="text-[#E1BD65]">Distinct collections.</span>
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-[#8E8981] md:text-right">Start with a maker you know, then explore the models currently available at GarageKings.</p>
          </header>

          {loading ? (
            <div className="grid animate-pulse grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => <div key={index} className={`h-[360px] rounded-[28px] bg-white/[0.035] ${index >= 3 ? 'hidden md:block' : ''}`} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featuredBrands.map((brand, index) => (
                <motion.button
                  type="button"
                  key={brand.slug}
                  initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.12 }}
                  transition={{ duration: 0.55, delay: index * 0.045, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => navigate(`/brands/${brand.slug}`)}
                  className={`group relative min-h-[360px] overflow-hidden rounded-[28px] border border-white/[0.1] bg-[#10100F] text-left shadow-[0_24px_70px_rgba(0,0,0,.34)] transition duration-500 hover:-translate-y-1 hover:border-white/[0.22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8BC78]/60 ${index >= 3 ? 'hidden md:block' : 'block'}`}
                >
                  <div className="absolute inset-0 opacity-75 transition duration-700 group-hover:opacity-100" style={{ backgroundImage: `radial-gradient(circle at 74% 26%, ${brand.accent}36, transparent 42%), ${brand.motif}` }} />

                  <div className="absolute inset-0 overflow-hidden">
                    {(brand.coverImage || brand.model?.image) ? (
                      <img src={brand.coverImage || brand.model.image} alt={`${brand.name} collection`} loading="lazy" className="h-full w-full scale-[1.12] object-cover object-center transition duration-700 ease-out group-hover:scale-[1.18]" />
                    ) : (
                      brand.logo
                        ? <img src={brand.logo} alt={`${brand.name} brand artwork`} loading="lazy" className={`h-full w-full object-cover object-center transition duration-700 ease-out group-hover:scale-[1.04] ${brand.logoClass}`} />
                        : <div className="flex h-full items-center justify-center p-10"><span className="text-6xl font-semibold tracking-[-0.06em] text-white/[0.13]">{brand.name}</span></div>
                    )}
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.12)_0%,rgba(0,0,0,.02)_40%,rgba(6,6,5,.34)_62%,rgba(6,6,5,.94)_100%)]" />
                    <div className="absolute inset-0 opacity-40 mix-blend-color" style={{ background: `linear-gradient(145deg, transparent 42%, ${brand.accent}55)` }} />
                  </div>

                  <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-5">
                    <span className="rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/70 backdrop-blur-md">{brand.productCount > 0 ? `${brand.productCount} models` : 'View collection'}</span>
                    {brand.logo && (brand.coverImage || brand.model?.image) && <span className="grid min-h-10 min-w-16 max-w-28 place-items-center rounded-xl border border-white/10 bg-white/[0.92] px-3 py-2 shadow-lg"><img src={brand.logo} alt="" loading="lazy" className={`max-h-6 max-w-full object-contain ${brand.logoClass}`} /></span>}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 z-20 px-6 pb-6 pt-20">
                    <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: brand.accent }}>{brand.style}</div>
                    <div className="flex items-end justify-between gap-4">
                      <div className="min-w-0"><h3 className="truncate text-2xl font-semibold tracking-[-0.03em] text-[#F4F1EC]">{brand.name}</h3><p className="mt-1 truncate text-xs text-[#8E8981]">{brand.model?.name || `Explore ${brand.name} models`}</p></div>
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#F4F1EC] text-black transition-transform duration-300 group-hover:translate-x-1"><ArrowRight size={17} /></span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {!loading && featuredBrands.length === 0 && <div className="rounded-[28px] border border-dashed border-white/10 py-20 text-center text-sm text-[#77736D]"><ImageOff size={22} className="mx-auto mb-3" />Brand collections are being prepared.</div>}
          {brands.length > 0 && <div className="mt-10 flex justify-center"><button type="button" onClick={() => navigate('/brands')} className="group flex items-center gap-3 rounded-full border border-white/[0.12] bg-white/[0.035] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70 transition hover:border-[#D8BC78]/45 hover:bg-[#D8BC78]/[0.07] hover:text-[#E8D098]">View every brand <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></button></div>}
        </div>
      </section>
    </div>
  )
})

export default TechnicalArchive
