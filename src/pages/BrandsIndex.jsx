import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import { buildBrandTheme } from '../data/brandThemes'
import { getBrands } from '../lib/db'

export default function BrandsIndex() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let active = true
    getBrands()
      .then((records) => {
        if (active) setBrands((Array.isArray(records) ? records : []).map(buildBrandTheme).filter(Boolean))
      })
      .catch(() => active && setLoadError(true))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const visibleBrands = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return brands
    return brands.filter((brand) => `${brand.name} ${brand.origin} ${brand.style}`.toLowerCase().includes(value))
  }, [brands, query])

  const searchCollection = (event) => {
    event.preventDefault()
    const value = query.trim()
    navigate(value ? `/marketplace?search=${encodeURIComponent(value)}` : '/marketplace')
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#F4F1EC] pt-16">
      <Navigation activeSection="brands" />
      <header className="border-b border-white/[0.08] px-5 py-14 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="text-[10px] font-bold uppercase tracking-[.22em] text-[#C8AE7D]">Browse by brand</div>
          <div className="mt-5 grid gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="max-w-4xl text-5xl font-semibold leading-[.9] tracking-[-.055em] sm:text-7xl lg:col-span-8 lg:text-8xl">Choose a brand.<br /><span className="text-[#C8AE7D]">See its models.</span></h1>
            <div className="lg:col-span-4">
              <p className="max-w-md text-sm leading-relaxed text-white/50">Browse every brand available in the GarageKings collection, then search by brand or model name.</p>
              <form onSubmit={searchCollection} className="relative mt-6 min-w-0 overflow-hidden rounded-full">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search brands or models" className="min-w-0 w-full text-ellipsis rounded-full border border-white/10 bg-white/[.035] py-3.5 pl-11 pr-36 text-sm outline-none transition placeholder:text-white/30 focus:border-[#C8AE7D]/55 sm:pr-40" />
                <button className="absolute bottom-1.5 right-1.5 top-1.5 max-w-[8.5rem] shrink-0 rounded-full bg-[#F4F1EC] px-4 text-[10px] font-black uppercase tracking-[.12em] text-black">Search all</button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-8 lg:px-12 lg:py-14">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleBrands.map((brand, index) => (
            <button key={brand.slug} onClick={() => navigate(`/brands/${brand.slug}`)} className="group relative min-h-[28rem] overflow-hidden rounded-[2rem] border border-white/[0.1] bg-[#10100F] text-left shadow-[0_24px_70px_rgba(0,0,0,.3)] transition duration-500 hover:-translate-y-1 hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8BC78]/60">
              <div className="absolute inset-0 opacity-75" style={{ backgroundColor: brand.background, backgroundImage: `radial-gradient(circle at 78% 24%, ${brand.accent}35, transparent 36%), ${brand.motif}` }} />
              <div className="absolute inset-0 overflow-hidden">
                {(brand.coverImage || brand.logo) ? (
                  <img src={brand.coverImage || brand.logo} alt={`${brand.name} brand artwork`} loading="lazy" className={`h-full w-full object-cover object-center transition duration-700 ease-out group-hover:scale-[1.04] ${!brand.coverImage ? brand.logoClass || '' : ''}`} />
                ) : (
                  <div className="flex h-full items-center justify-center p-10 text-center"><span className="text-[clamp(3rem,6vw,5rem)] font-semibold uppercase leading-none tracking-[-.055em] text-white/20">{brand.name}</span></div>
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.08)_0%,rgba(0,0,0,.02)_42%,rgba(5,5,5,.38)_63%,rgba(5,5,5,.96)_100%)]" />
                <div className="absolute inset-0 opacity-35 mix-blend-color" style={{ background: `linear-gradient(145deg, transparent 42%, ${brand.accent}55)` }} />
              </div>
              <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-6">
                <span className="rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.16em] text-white/70 backdrop-blur-md">{brand.productCount} {brand.productCount === 1 ? 'model' : 'models'}</span>
                {brand.coverImage && brand.logo && <span className="grid min-h-11 min-w-20 max-w-32 place-items-center rounded-xl border border-white/10 bg-white/[.92] px-3 py-2 shadow-lg"><img src={brand.logo} alt="" className={`max-h-7 max-w-full object-contain ${brand.logoClass || ''}`} /></span>}
              </div>
              <div className="absolute inset-x-0 bottom-0 z-20 px-7 pb-7 pt-24 sm:px-9 sm:pb-9">
                <div className="text-[9px] font-bold uppercase tracking-[.2em]" style={{ color: brand.accent }}>{brand.style}</div>
                <div className="mt-3 flex items-end justify-between gap-5">
                  <div className="min-w-0"><h2 className="truncate text-3xl font-semibold leading-tight tracking-[-.04em] text-[#F4F1EC]">{brand.name}</h2><p className="mt-1 line-clamp-2 max-w-md text-sm leading-relaxed text-white/50">{brand.headline}</p></div>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#F4F1EC] text-black transition-transform group-hover:translate-x-1"><ArrowRight size={17} /></span>
                </div>
              </div>
            </button>
          ))}
          {!loading && visibleBrands.length === 0 && <div className="col-span-full rounded-[2rem] border border-white/[0.08] px-8 py-20 text-center text-sm text-white/45">{loadError ? 'The brand collection could not be loaded.' : 'No visible brands match this search.'}</div>}
          {loading && [0, 1, 2].map((item) => <div key={item} className="min-h-[28rem] animate-pulse rounded-[2rem] border border-white/[0.06] bg-white/[0.025]" />)}
        </div>
      </main>
      <Footer />
    </div>
  )
}
