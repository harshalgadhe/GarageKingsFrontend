import { forwardRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'

const auctionPulls = [
  {
    id: 'rlc-skyline',
    name: 'Nissan Skyline GT-R R34 RLC',
    currentBid: 14500,
    bidsCount: 18,
    timeLeft: '02h 45m 12s',
    image: '/vault-1.png'
  },
  {
    id: 'sth-mustang',
    name: "'69 Ford Mustang Boss 302 STH",
    currentBid: 5800,
    bidsCount: 11,
    timeLeft: '05h 12m 44s',
    image: '/vault-6.png'
  }
]

const features = [
  {
    title: 'Verified Listings',
    desc: 'Every diecast listed by users is vetted by Garage Kings curators for seal integrity and bubble condition.'
  },
  {
    title: 'Real-Time Bidding',
    desc: 'Instant, lag-free bidding engines. Witness live competition for high-end collector grails.'
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
  const [auctions, setAuctions] = useState(auctionPulls)

  // Simulate real-time bid updates for dynamic premium interaction!
  useEffect(() => {
    const interval = setInterval(() => {
      setAuctions(prev => prev.map((auc, idx) => {
        if (Math.random() > 0.6) {
          const increase = Math.floor(Math.random() * 200) + 100
          return {
            ...auc,
            currentBid: auc.currentBid + increase,
            bidsCount: auc.bidsCount + 1
          }
        }
        return auc
      }))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

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
              <Link to="/auctions" className="px-8 py-4 rounded-xl bg-[#111111] border border-[#2A2A2A] hover:border-white/20 text-white font-black uppercase tracking-wider text-xs transition-colors cursor-pointer">
                Browse Auctions
              </Link>
            </motion.div>
          </div>

          {/* Right Side: Live Bidding Widget & Bento Features */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            
            {/* Live Auctions Card */}
            <div className="md:col-span-2 flex flex-col gap-4 rounded-3xl border border-[#2A2A2A] bg-[#111111] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 blur-2xl rounded-full pointer-events-none" />
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] font-grotesk flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E10600] animate-ping" />
                  Live Auctions
                </span>
                <span className="text-[9px] font-bold text-[#A1A1AA] uppercase">Real-Time updates</span>
              </div>

              <div className="divide-y divide-[#2A2A2A] flex flex-col gap-4">
                {auctions.map((auc) => (
                  <div key={auc.id} className="flex justify-between items-center pt-4 first:pt-0 gap-4">
                    <div className="flex items-center gap-3">
                      <img src={auc.image} alt={auc.name} className="w-12 h-12 rounded-lg object-contain bg-white/5 border border-white/5" />
                      <div>
                        <h4 className="text-sm font-black italic uppercase tracking-wider text-white truncate max-w-[180px] sm:max-w-xs font-grotesk">{auc.name}</h4>
                        <span className="text-[10px] text-[#A1A1AA] font-semibold">{auc.bidsCount} bids submitted</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <AnimatePresence mode="wait">
                        <motion.div 
                          key={auc.currentBid}
                          initial={{ scale: 1.1, color: '#D4AF37' }}
                          animate={{ scale: 1, color: '#ffffff' }}
                          transition={{ duration: 0.4 }}
                          className="text-base font-black font-sora tracking-tight"
                        >
                          ₹{auc.currentBid.toLocaleString('en-IN')}
                        </motion.div>
                      </AnimatePresence>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1 justify-end mt-0.5">
                        <svg className="w-3 h-3 text-[#E10600] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                        </svg>
                        {auc.timeLeft}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features list */}
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
