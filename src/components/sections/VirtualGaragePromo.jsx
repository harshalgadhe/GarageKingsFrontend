import { forwardRef, useState } from 'react'
import { motion } from 'framer-motion'

const mockAchievements = [
  { label: 'Grail Hunter', icon: '🏆', desc: 'Own 3 or more RLC/STH castings' },
  { label: 'JDM Shogun', icon: '🇯🇵', desc: 'Complete the JDM legends lane' },
  { label: 'Mint Master', icon: '📦', desc: 'Hold 20+ MIB/Blister Mint conditions' }
]

const VirtualGaragePromo = forwardRef(function VirtualGaragePromo(_props, ref) {
  const [selectedAchievement, setSelectedAchievement] = useState(0)

  return (
    <section ref={ref} id="garage" className="py-28 md:py-36 relative overflow-hidden bg-[#050505] border-t border-[#2A2A2A]">
      {/* Background glow highlights */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,6,0,0.025)_0%,transparent_75%)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-[#E10600]/3 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Side: Mock Interactive Collector Dashboard Panel */}
          <div className="lg:col-span-7 w-full flex justify-center">
            <div className="relative w-full max-w-[550px] rounded-[2.5rem] border border-[#2A2A2A] bg-[#111111] p-8 md:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.95)] overflow-hidden">
              {/* Glossy reflection bar */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#E10600]/40 to-transparent" />
              
              {/* User profile header inside mockup */}
              <div className="flex justify-between items-center pb-6 border-b border-[#2A2A2A] mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#E10600] to-[#FFB300] flex items-center justify-center font-black text-black text-sm shadow-[0_0_15px_rgba(225,6,0,0.3)] font-grotesk">
                    GK
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-black italic uppercase tracking-wider text-white font-grotesk">@grail_hunter99</h4>
                    <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest">Collector Rank: Gold V</span>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#D4AF37] px-2.5 py-1 rounded bg-[#D4AF37]/5 border border-[#D4AF37]/20 font-grotesk">
                  PREMIUM GARAGE
                </span>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 gap-6 mb-8 text-left">
                <div className="p-5 rounded-2xl bg-[#181818] border border-[#2A2A2A]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
                    Total Castings
                  </span>
                  <div className="text-3xl font-black text-white font-sora mt-2 tracking-tight">
                    148
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#181818] border border-[#2A2A2A] relative overflow-hidden group">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
                    Collection Value
                  </span>
                  <div className="text-3xl font-black text-[#D4AF37] font-sora mt-2 tracking-tight">
                    ₹1,24,500
                  </div>
                </div>
              </div>

              {/* Completion Progress Bar */}
              <div className="p-5 rounded-2xl bg-[#181818] border border-[#2A2A2A] mb-8 text-left">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
                    2024 STH Collection Progress
                  </span>
                  <span className="text-xs font-black text-white font-sora">68%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#050505] overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-[#E10600] to-[#FFB300] rounded-full" style={{ width: '68%' }} />
                </div>
                <span className="block text-[9px] text-[#A1A1AA] mt-2 font-bold uppercase tracking-wider">Remaining to grail unlock: 4 castings</span>
              </div>

              {/* Achievements widget inside mockup */}
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#A1A1AA] block mb-3.5">
                  Garage Achievements
                </span>
                <div className="flex gap-3 mb-4">
                  {mockAchievements.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedAchievement(idx)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        selectedAchievement === idx
                          ? 'bg-[#E10600]/10 border-[#E10600]/40 text-[#E10600]'
                          : 'bg-[#181818] border-[#2A2A2A] text-white/50 hover:text-white'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
                <div className="p-4 rounded-xl bg-[#181818] border border-[#2A2A2A] text-xs text-[#A1A1AA] leading-relaxed">
                  {mockAchievements[selectedAchievement].desc}
                </div>
              </div>

            </div>
          </div>

          {/* Right Side: Headline and pitch */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-[#E10600]/10 border border-[#E10600]/20 text-[#E10600] text-[10px] font-black uppercase tracking-[0.25em] mb-8 font-grotesk"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#E10600] animate-pulse" />
              INTRODUCING OWNERSHIP METRICS
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6.5xl font-black italic tracking-tighter leading-[0.9] text-white uppercase font-grotesk mb-8"
            >
              Track Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E10600] via-white to-[#E10600]/60 drop-shadow-[0_0_20px_rgba(225,6,0,0.15)]">Collection</span>
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-[#A1A1AA] leading-relaxed mb-10 max-w-md text-sm md:text-base font-inter"
            >
              GarageKings is more than a store. Catalog your imports, track historical market valuations, complete standard casting checklists, and showcase your dream shelves to a curated clubhouse of collector peers.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <button 
                type="button"
                onClick={() => { window.location.href = '/admin'; }}
                className="px-10 py-5 rounded-xl bg-[#E10600] hover:bg-[#FF2A1A] text-white font-black uppercase tracking-wider text-xs transition-all shadow-[0_0_35px_rgba(225,6,0,0.35)] hover:shadow-[0_0_45px_rgba(255,42,26,0.6)] cursor-pointer"
              >
                Create Your Garage
              </button>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
})

export default VirtualGaragePromo
