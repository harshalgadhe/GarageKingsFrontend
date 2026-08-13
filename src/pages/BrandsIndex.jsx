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
              <p className="max-w-md text-sm leading-relaxed text-white/50">Browse every brand available in the GarageKings collection, then search by model or reference number.</p>
              <form onSubmit={searchCollection} className="relative mt-6">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search brands, models or reference number" className="w-full rounded-full border border-white/10 bg-white/[.035] py-3.5 pl-11 pr-28 text-sm outline-none transition placeholder:text-white/30 focus:border-[#C8AE7D]/55" />
                <button className="absolute bottom-1.5 right-1.5 top-1.5 rounded-full bg-[#F4F1EC] px-4 text-[10px] font-black uppercase tracking-[.12em] text-black">Search all</button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-8 lg:px-12 lg:py-14">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleBrands.map((brand, index) => (
            <button key={brand.slug} onClick={() => navigate(`/brands/${brand.slug}`)} className="group relative min-h-[28rem] overflow-hidden rounded-[2rem] border border-white/[0.09] p-7 text-left transition duration-500 hover:-translate-y-1 hover:border-white/25 sm:p-9" style={{ backgroundColor: brand.background, backgroundImage: brand.motif, backgroundSize: brand.mode === 'street' ? '42px 42px' : undefined }}>
              <div className="absolute inset-0 opacity-60" style={{ background: `radial-gradient(circle at 78% 24%, ${brand.accent}35, transparent 34%)` }} />
              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[.2em]" style={{ color: brand.accent }}><span>{String(index + 1).padStart(2, '0')}</span><span>{brand.kicker}</span></div>
                <div className="flex min-h-52 flex-1 items-center justify-center py-9">
                  {brand.logo ? (
                    <img src={brand.logo} alt={`${brand.name} logo`} className={`h-auto w-[72%] object-contain drop-shadow-[0_14px_32px_rgba(0,0,0,.34)] ${brand.logoClass || ''} ${brand.logoScale || 'max-w-[15rem]'}`} />
                  ) : (
                    <div className="text-center">
                      <div className="text-[clamp(3rem,6vw,5rem)] font-semibold uppercase leading-none tracking-[-.055em]">{brand.name}</div>
                      <div className="mx-auto mt-4 h-px w-16" style={{ backgroundColor: brand.accent }} />
                    </div>
                  )}
                </div>
                <div className="mt-auto border-t border-white/10 pt-6">
                  <div className="text-[9px] font-bold uppercase tracking-[.2em] text-white/45">{brand.style}</div>
                  <h2 className="mt-3 max-w-md text-2xl font-semibold leading-tight tracking-[-.035em]">{brand.headline}</h2>
                  <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5 text-xs text-white/45"><span>{brand.productCount} {brand.productCount === 1 ? 'model' : 'models'}</span><span className="grid h-10 w-10 place-items-center rounded-full border border-white/15 transition group-hover:bg-white group-hover:text-black"><ArrowRight size={15} /></span></div>
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
