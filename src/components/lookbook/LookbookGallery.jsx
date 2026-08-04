import { forwardRef, useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ImageOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getCars } from '../../lib/db'

function formatPrice(value) {
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0
    ? `₹${amount.toLocaleString('en-IN')}`
    : 'Ask for price'
}

const LookbookGallery = forwardRef(function LookbookGallery(props, ref) {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    getCars({ limit: 8 })
      .then((cars) => {
        if (!active) return
        setModels((cars || []).slice(0, 8).map((car) => ({
          ...car,
          priceLabel: formatPrice(car.sellingPrice ?? car.price),
        })))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  const featured = useMemo(() => models.find((model) => Boolean(model.image)) || null, [models])
  const recent = useMemo(() => models.filter((model) => model.id !== featured?.id).slice(0, 6), [featured, models])

  const openModel = (id) => navigate(id ? `/product/${id}` : '/marketplace')

  return (
    <section ref={ref} id="collections" className="relative scroll-mt-20 overflow-hidden border-t border-white/[0.08] bg-black px-4 py-20 sm:px-6 md:px-12 md:py-28 lg:px-16">
      <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-white/[0.035] blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#E1BD65]/[0.07] blur-[130px]" />

      <div className="relative mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col gap-6 border-b border-white/[0.08] pb-8 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D8BC78]">Current collection</span>
            <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-[0.95] tracking-[-0.04em] text-[#F4F1EC] sm:text-5xl md:text-6xl">
              A closer look at<br /><span className="text-[#E1BD65]">what’s here now.</span>
            </h2>
          </div>
          <button onClick={() => navigate('/marketplace')} className="group flex w-fit items-center gap-3 text-xs font-bold text-[#A1A1A6] transition hover:text-white">
            Browse all models <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
        </header>

        {loading ? (
          <div className="grid min-h-[520px] animate-pulse gap-5 lg:grid-cols-12">
            <div className="rounded-3xl bg-white/[0.035] lg:col-span-7" />
            <div className="space-y-3 lg:col-span-5">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[76px] rounded-2xl bg-white/[0.035]" />)}</div>
          </div>
        ) : models.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 py-20 text-center text-sm text-[#77736D]">No models are available to preview yet.</div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-12 lg:items-stretch">
            {featured && (
              <motion.button
                type="button"
                onClick={() => openModel(featured.id)}
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="group relative min-h-[500px] overflow-hidden rounded-[28px] border border-white/[0.1] bg-[#101010] text-left shadow-[0_28px_80px_rgba(0,0,0,.5)] lg:col-span-7 lg:min-h-[620px]"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_38%,rgba(255,255,255,.11),transparent_38%),linear-gradient(145deg,rgba(255,255,255,.04),transparent_42%)]" />
                <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-5 sm:p-7">
                  <span className="rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#E1BD65] backdrop-blur-md">Featured model</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#918C84]">{featured.scale || '1:64'}</span>
                </div>

                <div className="absolute inset-x-4 bottom-32 top-16 flex items-center justify-center sm:inset-x-8 sm:bottom-28">
                  <img
                    src={featured.image}
                    alt={`${featured.brand || ''} ${featured.name}`}
                    className="h-full w-full object-contain drop-shadow-[0_28px_38px_rgba(0,0,0,.72)] transition duration-700 ease-out group-hover:scale-[1.025]"
                  />
                </div>

                <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/95 to-transparent px-5 pb-6 pt-20 sm:px-7 sm:pb-7">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#D8BC78]">{featured.brand}</div>
                  <div className="flex items-end justify-between gap-5">
                    <div>
                      <h3 className="text-2xl font-semibold leading-tight tracking-[-0.025em] text-white sm:text-3xl">{featured.name}</h3>
                      <p className="mt-2 font-mono text-sm text-[#E1BD65]">{featured.priceLabel}</p>
                    </div>
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#F5F5F7] text-black transition-transform group-hover:translate-x-1"><ArrowRight size={18} /></span>
                  </div>
                </div>
              </motion.button>
            )}

            <div className={`${featured ? 'lg:col-span-5' : 'lg:col-span-12'} overflow-hidden rounded-[28px] border border-white/[0.09] bg-[linear-gradient(155deg,rgba(19,18,16,.96),rgba(9,9,9,.98)_48%)] shadow-[0_28px_80px_rgba(0,0,0,.36)]`}>
              <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6">
                <h3 className="text-sm font-semibold text-[#F4F1EC]">Recently added</h3>
                <span className="text-[10px] text-[#77736D]">{models.length} models</span>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {recent.map((model, index) => (
                  <motion.button
                    type="button"
                    key={model.id}
                    onClick={() => openModel(model.id)}
                    initial={reduceMotion ? false : { opacity: 0, x: 18 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.42, delay: reduceMotion ? 0 : index * 0.045 }}
                    className="group grid w-full grid-cols-[34px_1fr_auto] items-center gap-3 px-4 py-4 text-left transition hover:bg-white/[0.045] sm:grid-cols-[42px_1fr_auto] sm:px-6 sm:py-[18px]"
                  >
                    <span className="font-mono text-[10px] text-[#5E5A54]">{String(index + 1).padStart(2, '0')}</span>
                    <span className="min-w-0">
                      <span className="block text-[9px] font-bold uppercase tracking-[0.15em] text-[#D8BC78]">{model.brand || 'GarageKings'} · {model.scale || '1:64'}</span>
                      <span className="mt-1 block truncate text-sm font-semibold text-[#E8E4DD] transition group-hover:text-white">{model.name}</span>
                    </span>
                    <span className="flex items-center gap-3 pl-2">
                      {!model.image && <ImageOff size={13} className="hidden text-[#55514B] sm:block" aria-label="Photography coming soon" />}
                      <span className="font-mono text-xs text-[#D7C189]">{model.priceLabel}</span>
                      <ArrowRight size={14} className="hidden text-[#6F6A63] transition group-hover:translate-x-1 group-hover:text-white sm:block" />
                    </span>
                  </motion.button>
                ))}
              </div>

              <div className="border-t border-white/[0.07] p-4 sm:p-5">
                <button onClick={() => navigate('/marketplace')} className="flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.14] bg-white/[0.04] py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#D2D2D7] transition hover:bg-white hover:text-black">
                  View the full collection <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
})

export default LookbookGallery
