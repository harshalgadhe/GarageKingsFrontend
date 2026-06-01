import { forwardRef } from 'react'
import { motion } from 'framer-motion'

const features = [
  {
    title: 'Curated Collections',
    description: 'We do not sell kids toys. Every listing is a collector-grade casting—inspected, verified, and protected in physical double-box shipments.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#E10600]">
        <circle cx="12" cy="8" r="7" />
        <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
      </svg>
    ),
    isWide: true
  },
  {
    title: 'Collector Marketplace',
    description: 'A dedicated platform where legends change hands. Secure direct trades with top-rated collectors, backed by real reputations.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
        <path d="M16 3h5v5" />
        <path d="M8 21H3v-5" />
        <path d="M12 20v-8" />
        <path d="M21 3l-9 9" />
        <path d="M3 21l9-9" />
      </svg>
    ),
    isWide: false
  },
  {
    title: 'Limited Drops',
    description: 'Weekly drops of ultra-rare castings. Experience the rush of securing raw chases and RLC releases before they disappear.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
    isWide: false
  },
  {
    title: 'Virtual Garage',
    description: 'Build, organize, and showcase your collection values. Track historical diecast valuations, completion milestones, and unlock achievements.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#E10600]">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 17v-5a3 3 0 0 1 6 0v5" />
      </svg>
    ),
    isWide: true
  }
]

const WhyGarageKings = forwardRef(function WhyGarageKings(_props, ref) {
  return (
    <section
      ref={ref}
      id="why-gk"
      className="relative py-28 md:py-36 bg-[#050505] border-t border-[#2A2A2A]"
    >
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(225,6,0,0.02)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative px-6 md:px-12 lg:px-16 max-w-6xl mx-auto z-10">
        
        {/* Title Stack */}
        <div className="text-center mb-20">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-[0.35em] text-[#E10600]"
          >
            The collector difference
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mt-4 text-4xl sm:text-5xl font-black italic tracking-tighter text-white uppercase font-grotesk"
          >
            Why Garage Kings
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-4 max-w-xl mx-auto text-base text-[#A1A1AA] leading-relaxed"
          >
            We built a platform engineered for real enthusiasts. We value rarity, authentication, and collection tracking over standard commercial lists.
          </motion.p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 lg:gap-8">
          {features.map((item, idx) => (
            <motion.article
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={`relative group rounded-[2rem] border border-[#2A2A2A] bg-[#111111]/60 p-8 overflow-hidden backdrop-blur-xl transition-all duration-500 hover:border-[#E10600]/30 hover:bg-[#181818] ${
                item.isWide ? 'md:col-span-3 lg:col-span-4' : 'md:col-span-3 lg:col-span-2'
              }`}
            >
              {/* Subtle hover gradient inside card */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#E10600]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              {/* Icon Container */}
              <div className="mb-8 inline-flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 p-3.5 group-hover:border-[#E10600]/30 group-hover:scale-105 transition-all duration-500">
                {item.icon}
              </div>

              {/* Text details */}
              <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-wider text-white mb-3 font-grotesk group-hover:text-[#E10600] transition-colors">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-[#A1A1AA] group-hover:text-white/80 transition-colors">
                {item.description}
              </p>

              {/* Numeric indicator */}
              <span className="absolute top-8 right-8 font-mono font-black text-white/5 group-hover:text-[#E10600]/10 transition-colors text-5xl tracking-tighter">
                0{idx + 1}
              </span>
            </motion.article>
          ))}
        </div>

      </div>
    </section>
  )
})

export default WhyGarageKings
