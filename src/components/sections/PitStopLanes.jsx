import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { pitStopLanes } from '../../data/content'

const PitStopLanes = forwardRef(function PitStopLanes(_props, ref) {
  return (
    <section ref={ref} id="lanes" className="relative z-20 min-h-[100svh] py-36 md:py-48 bg-[#050505] gk-checkered-flag overflow-hidden">
      {/* Blending Gradients */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#050505] to-transparent z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#050505] to-transparent z-0 pointer-events-none" />

      {/* The Hot Wheels Track Line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-4 md:w-6 -translate-x-1/2 gk-hotwheels-track hidden md:block z-0 opacity-70" />

      <div className="relative px-6 md:px-12 lg:px-16 max-w-5xl mx-auto z-10">
        
        {/* Header Stack */}
        <motion.div
          className="text-center mb-24 relative z-10 flex justify-center"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-block bg-[#111111]/95 backdrop-blur-md px-10 py-10 rounded-[2rem] border border-[#2A2A2A] shadow-[0_30px_70px_rgba(0,0,0,0.9)]">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#E10600] font-grotesk">
              Inventory Lanes
            </p>
            <h2 className="mt-5 text-4xl sm:text-5xl font-black italic tracking-tighter text-white md:text-6xl uppercase font-grotesk">
              <span className="bg-[#FFB300] text-black px-6 py-2 inline-block shadow-[0_0_30px_rgba(255,179,0,0.3)]">
                The Pit Stops
              </span>
            </h2>
            <p className="mt-5 max-w-xl mx-auto text-sm text-[#A1A1AA] leading-relaxed">
              Four specialized lanes curated to complete your dream garage. One vault. Find your niche.
            </p>
          </div>
        </motion.div>

        {/* Lanes Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-x-24 md:gap-y-16 items-start mt-8">
          {pitStopLanes.map((lane, i) => {
            const isEven = i % 2 === 0;
            return (
              <motion.div
                key={lane.id}
                className={`relative group rounded-[2.2rem] border border-[#2A2A2A] bg-[#181818]/90 backdrop-blur-md p-10 transition-all duration-500 hover:border-[#E10600]/60 hover:bg-[#050505] hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(225,6,0,0.15)] ${
                  !isEven ? 'md:mt-32' : 'md:-mt-16'
                }`}
                initial={{ opacity: 0, x: isEven ? -45 : 45 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8, delay: (i % 2) * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Connector line to the main track (desktop only) */}
                <div className={`absolute top-1/2 -translate-y-1/2 w-12 h-2 gk-hotwheels-track hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isEven ? '-right-12' : '-left-12'}`} />
                
                <div className="mb-6 h-1.5 w-16 bg-[#E10600] transform -skew-x-12" />
                <h3 className="text-2xl font-black italic uppercase tracking-wider text-white group-hover:text-[#E10600] transition-colors font-grotesk">
                  {lane.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-[#A1A1AA] group-hover:text-white/80 transition-colors">{lane.body}</p>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
})

export default PitStopLanes
