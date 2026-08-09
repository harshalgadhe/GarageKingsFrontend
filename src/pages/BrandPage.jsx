import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Gauge, Layers3, Search, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import VaultModuleCard from '../components/common/VaultModuleCard'
import { getBrands, getCars } from '../lib/db'
import { buildBrandTheme } from '../data/brandThemes'

function BrandMark({ theme }) {
  if (theme.logo) {
    return <img src={theme.logo} alt={`${theme.name} logo`} className={`h-auto w-[72%] max-h-[44%] object-contain drop-shadow-[0_18px_50px_rgba(0,0,0,.35)] ${theme.logoClass || ''}`} />
  }

  return (
    <div className={`text-center font-black uppercase leading-[.72] tracking-[-.07em] ${theme.mode === 'neon' ? 'italic' : ''}`} style={{ color: theme.secondary, fontSize: 'clamp(4rem, 10vw, 9rem)', textShadow: `0 0 45px ${theme.accent}50` }}>
      {theme.name.split(' ').map((word) => <span key={word} className="block">{word}</span>)}
    </div>
  )
}

export default function BrandPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const [theme, setTheme] = useState(null)
  const [brandLoading, setBrandLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    let active = true
    setBrandLoading(true)
    getBrands()
      .then((records) => {
        const record = (Array.isArray(records) ? records : []).find((brand) => brand.slug === slug)
        if (active) setTheme(buildBrandTheme(record))
      })
      .catch(() => active && setTheme(null))
      .finally(() => active && setBrandLoading(false))
    return () => { active = false }
  }, [slug])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (!theme) return
    setLoading(true)
    getCars({ page, limit: 24, paginated: true, brand: theme.catalogBrand || theme.name, search: debouncedSearch || undefined })
      .then((result) => {
        setProducts(result?.products || [])
        setTotal(result?.total || 0)
        setTotalPages(result?.totalPages || 1)
      })
      .finally(() => setLoading(false))
  }, [theme?.name, debouncedSearch, page])

  if (brandLoading) return <div className="grid min-h-screen place-items-center bg-black text-sm text-white/45">Loading brand...</div>
  if (!theme) return <div className="grid min-h-screen place-items-center bg-black text-white"><button onClick={() => navigate('/brands')} className="rounded-full border border-white/15 px-6 py-3">Return to brands</button></div>

  const velocity = theme.mode === 'velocity'
  const race = theme.mode === 'race'
  const neon = theme.mode === 'neon'
  const precision = theme.mode === 'precision'
  const street = theme.mode === 'street'
  const telemetry = theme.mode === 'telemetry'

  return (
    <div className={`min-h-screen overflow-hidden text-[#F5F5F7] brand-${theme.mode}`} style={{ backgroundColor: theme.background }}>
      <Navigation activeSection="brands" />

      <div className="h-[calc(100dvh-64px-env(safe-area-inset-bottom))] min-h-[620px] overflow-hidden lg:h-[100dvh]">
      <header className="relative h-[calc(100%-96px)] overflow-hidden border-b border-white/[0.08] pt-16 sm:h-[calc(100%-112px)]" style={{ backgroundImage: theme.motif, backgroundSize: theme.mode === 'street' ? '48px 48px' : undefined }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 72% 35%, ${theme.accent}18, transparent 34%), linear-gradient(90deg, ${theme.background} 0%, transparent 62%)` }} />
        {velocity && <><div className="pointer-events-none absolute -right-40 top-[18%] h-14 w-[72%] -rotate-6 rounded-full opacity-75" style={{ backgroundColor: theme.highlight }} /><div className="pointer-events-none absolute -right-24 top-[27%] h-3 w-[61%] -rotate-6 rounded-full" style={{ backgroundColor: theme.accent, opacity: .9 }} /></>}
        {race && <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-20" style={{ backgroundImage: 'linear-gradient(45deg,#fff 25%,transparent 25%),linear-gradient(-45deg,#fff 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#fff 75%),linear-gradient(-45deg,transparent 75%,#fff 75%)', backgroundSize: '28px 28px', backgroundPosition: '0 0,0 14px,14px -14px,-14px 0' }} />}
        {neon && <div className="pointer-events-none absolute right-[8%] top-[15%] h-72 w-72 rounded-full border blur-[1px]" style={{ borderColor: `${theme.accent}55`, boxShadow: `0 0 90px ${theme.accent}45, inset 0 0 70px ${theme.accent}25` }} />}
        {precision && <div className="pointer-events-none absolute inset-y-0 right-0 w-[54%] opacity-25" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px)', backgroundSize: '56px 56px', maskImage: 'linear-gradient(90deg,transparent,#000 28%)' }} />}
        {street && <><div className="pointer-events-none absolute bottom-[12%] right-[5%] h-px w-[48%]" style={{ backgroundColor: `${theme.accent}88`, boxShadow: `0 -32px 80px ${theme.accent}35` }} /><div className="pointer-events-none absolute bottom-0 right-0 h-[42%] w-[58%] opacity-25" style={{ backgroundImage: `linear-gradient(${theme.accent}35 1px,transparent 1px),linear-gradient(90deg,${theme.accent}35 1px,transparent 1px)`, backgroundSize: '42px 42px', transform: 'perspective(360px) rotateX(58deg)', transformOrigin: 'bottom' }} /></>}
        {telemetry && <><div className="pointer-events-none absolute right-[6%] top-[18%] h-64 w-64 rounded-full border border-dashed opacity-35" style={{ borderColor: theme.accent }} /><div className="pointer-events-none absolute right-[calc(6%+7.9rem)] top-[14%] h-72 w-px opacity-30" style={{ backgroundColor: theme.accent }} /><div className="pointer-events-none absolute right-[2%] top-[calc(18%+7.9rem)] h-px w-80 opacity-30" style={{ backgroundColor: theme.accent }} /></>}

        <div className="relative mx-auto grid h-full max-w-[1500px] grid-cols-1 items-center gap-6 px-5 py-5 sm:px-8 sm:py-7 lg:px-16 xl:grid-cols-12 xl:gap-10 xl:py-9">
          <motion.div initial={reduceMotion ? false : { opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .7 }} className="z-20 max-w-3xl xl:col-span-6">
            <button onClick={() => navigate('/brands')} className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-white/45 transition hover:text-white xl:mb-8"><ArrowLeft size={14} /> Brand index</button>
            {theme.logo && <img src={theme.logo} alt={`${theme.name} logo`} className={`mb-5 max-h-12 w-36 object-contain object-left xl:hidden ${theme.logoClass || ''}`} />}
            <div className="mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.24em]" style={{ color: theme.accent }}><span className="h-px w-10" style={{ backgroundColor: theme.accent }} />{theme.kicker}</div>
            {!theme.logo && <div className={`font-black uppercase leading-[.76] tracking-[-.07em] ${velocity ? '-skew-x-6 italic' : ''}`} style={{ fontSize: 'clamp(4.5rem, 12vw, 10.5rem)' }}>{theme.name}</div>}
            <h1 className={`${theme.logo ? 'mt-3 text-5xl sm:text-7xl xl:text-[5.2rem]' : 'mt-7 text-3xl sm:text-5xl xl:text-6xl'} max-w-2xl font-semibold leading-[.92] tracking-[-.055em]`}>{theme.headline}</h1>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">{theme.description}</p>
            <div className="mt-9 flex flex-wrap gap-3"><button onClick={() => document.getElementById('brand-collection')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })} className="flex items-center gap-2 rounded-full px-6 py-3 text-xs font-black uppercase tracking-[.12em] text-black transition hover:-translate-y-0.5" style={{ backgroundColor: theme.secondary }}>Explore the collection <ArrowRight size={14} /></button><span className="rounded-full border border-white/15 px-5 py-3 text-xs text-white/55">{total} catalogued</span></div>
          </motion.div>

          <motion.div initial={reduceMotion ? false : { opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: .85, ease: [0.16, 1, 0.3, 1] }} className="relative hidden xl:col-span-6 xl:block">
            <div className={`relative mx-auto grid aspect-[4/3] max-w-3xl place-items-center overflow-hidden border border-white/10 bg-white/[.025] ${race || precision || telemetry ? 'rounded-none' : neon ? 'rounded-[4rem_1rem_4rem_1rem]' : 'rounded-[2rem]'}`} style={{ boxShadow: `0 40px 120px ${theme.accent}14` }}>
              <div className="absolute inset-5 border border-white/[.06]" />
              <div className="absolute -left-20 top-1/2 h-36 w-[130%] -translate-y-1/2 -rotate-6 opacity-10" style={{ backgroundColor: theme.highlight || theme.accent }} />
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: theme.motif }} />
              <div className="relative z-10 grid h-full w-full place-items-center p-12"><BrandMark theme={theme} /></div>
              <div className="absolute bottom-6 left-6 text-[9px] font-bold uppercase tracking-[.22em] text-white/35">Marque identity</div>
              <div className="absolute bottom-6 right-6 font-mono text-[9px] uppercase tracking-[.18em]" style={{ color: theme.accent }}>{theme.origin}</div>
            </div>
          </motion.div>
        </div>
      </header>

      <section className="h-24 border-b border-white/[0.08] bg-black/20 sm:h-28"><div className="mx-auto grid h-full max-w-7xl grid-cols-3 divide-x divide-white/[0.08] px-2 sm:px-8">{[[Layers3, 'Catalogued models', total], [Gauge, 'Collector focus', theme.style], [Gauge, 'Primary scale', '1:64']].map(([Icon, label, value]) => <div key={label} className="flex h-full min-w-0 flex-col justify-center px-2 sm:px-8"><Icon size={15} style={{ color: theme.accent }} /><div className="mt-2 truncate text-[7px] uppercase tracking-[.12em] text-white/35 sm:text-[9px] sm:tracking-[.16em]">{label}</div><strong className="mt-1 truncate text-xs sm:text-base">{value}</strong></div>)}</div></section>
      </div>

      <main id="brand-collection" className="mx-auto max-w-[1500px] scroll-mt-16 px-4 py-16 sm:px-8 lg:px-16 lg:py-24">
        <div className="mb-8 grid gap-6 border-b border-white/[0.08] pb-8 md:grid-cols-2 md:items-end"><div><div className="text-[9px] font-bold uppercase tracking-[.22em]" style={{ color: theme.accent }}>The GarageKings edit</div><h2 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-6xl">Selected {theme.name}</h2></div><p className="max-w-lg text-sm leading-relaxed text-white/45 md:justify-self-end">Search the complete {theme.name} catalog by model name or SKU. Results come directly from the collection database.</p></div>
        <div className="relative mb-10 max-w-xl"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: theme.accent }} /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={`Search ${theme.name} models or SKU`} className="w-full rounded-full border border-white/10 bg-white/[.035] py-3.5 pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/25" />{searchQuery && <button onClick={() => setSearchQuery('')} aria-label="Clear search" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"><X size={15} /></button>}</div>
        {loading ? <div className="py-24 text-center text-sm text-white/40">Loading collection...</div> : products.length ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((product) => <VaultModuleCard key={product.id} car={product} onClick={() => navigate(`/product/${product.id}`)} />)}</div> : <div className="rounded-3xl border border-white/[0.08] p-10 text-center text-white/45">No models match this search.</div>}
        {totalPages > 1 && <div className="mt-10 flex items-center justify-center gap-4"><button disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-full border border-white/10 px-5 py-2.5 text-xs disabled:opacity-30">Previous</button><span className="font-mono text-[10px] text-white/40">{page} / {totalPages}</span><button disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-full border border-white/10 px-5 py-2.5 text-xs disabled:opacity-30">Next</button></div>}
        <div className="mt-16 flex flex-col items-center border-t border-white/[0.08] pt-10 text-center"><div className="text-sm text-white/45">Want to search across every marque?</div><button onClick={() => navigate(`/marketplace?brand=${encodeURIComponent(theme.name)}`)} className="mt-5 flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-xs font-bold uppercase tracking-[.12em] transition hover:border-white/40">Open filtered marketplace <ArrowRight size={14} /></button></div>
      </main>
      <Footer />
    </div>
  )
}
