import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const features = [
  {
    title: 'Verified Listings',
    desc: 'Every diecast listed by users is vetted by Garage Kings curators for seal integrity and bubble condition.'
  },
  {
    title: 'Instant Checkout',
    desc: 'Direct buy-it-now transactions. Lock down your target casting in seconds before other collectors secure it.'
  },
  {
    title: 'Secure Transactions',
    desc: 'All trades are secured via local escrows. Castings are held until both parties confirm delivery state.'
  },
  {
    title: 'Collector Reputation',
    desc: 'Built-in seller profiles showing collection level, grading precision, and transaction history.'
  }
]

const MarketplacePreview = forwardRef(function MarketplacePreview(_props, ref) {
  return (
    <section ref={ref} id="marketplace-preview" className="py-28 md:py-36 relative overflow-hidden bg-[#050505] border-t border-[#2A2A2A]">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4AF37]/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#E10600]/3 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Side: Content Branding */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.25em] mb-8 font-grotesk"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              WHERE LEGENDS CHANGE HANDS
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6.5xl font-black italic tracking-tighter leading-[0.9] text-white uppercase font-grotesk mb-8"
            >
              The Collector <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-white to-[#D4AF37]/60 drop-shadow-[0_0_20px_rgba(212,175,55,0.15)]">Marketplace</span>
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-[#A1A1AA] leading-relaxed mb-10 max-w-md text-sm md:text-base font-inter"
            >
              No DM-for-price games. No unverified listings. A transparent, high-stakes trade house engineered specifically for verified collectors.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4 w-full sm:w-auto"
            >
              <Link to="/marketplace" className="px-8 py-4 rounded-xl bg-white text-black font-black uppercase tracking-wider text-xs transition-colors hover:bg-white/95 cursor-pointer">
                Enter Marketplace
              </Link>
            </motion.div>
          </div>

          {/* Right Side: Bento Features List (taking all 7 columns) */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {features.map((item, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-3xl border border-[#2A2A2A] bg-[#111111] hover:border-[#D4AF37]/30 transition-colors duration-500 flex flex-col gap-2"
              >
                <h3 className="text-lg font-black italic uppercase tracking-wider text-white font-grotesk">{item.title}</h3>
                <p className="text-xs leading-relaxed text-[#A1A1AA] font-inter">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
})

export default MarketplacePreview
