import { forwardRef } from 'react'
import { motion } from 'framer-motion'

const mockPosts = [
  {
    image: '/vault-1.png',
    handle: '@diecast_delhi',
    rank: 'Elite Curator',
    title: 'Skyline GTR R34 STH',
    likes: '1,240',
    description: 'Finally secured the STH grail to complete my R34 shelf.'
  },
  {
    image: '/vault-2.png',
    handle: '@grail_hunter99',
    rank: 'Gold V',
    title: 'RLC Purple Mustang',
    likes: '890',
    description: 'Factory sealed package arrived. Paint finish under sunlight is next-level.'
  },
  {
    image: '/vault-8.png',
    handle: '@hotwheels_mumbai',
    rank: 'Pro Collector',
    title: 'Skyline H/T 2000GT-X',
    likes: '1,560',
    description: 'Mint card condition checked by Garage Kings curators. Pristine base.'
  },
  {
    image: '/vault-5.png',
    handle: '@diecast_grailz',
    rank: 'Silver IV',
    title: "'83 Chevy Silverado Chase",
    likes: '420',
    description: 'Double-box packaging protected this beauty flawlessly during shipping.'
  }
]

const CommunityShowcase = forwardRef(function CommunityShowcase(_props, ref) {
  return (
    <section ref={ref} id="community" className="py-28 md:py-36 relative overflow-hidden bg-[#050505] border-t border-[#2A2A2A]">
      {/* Background glow elements */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#E10600]/3 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#FFB300]/3 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Title stack */}
        <div className="text-center mb-20">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-[0.35em] text-[#E10600]"
          >
            Enthusiast Showcase
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mt-4 text-4xl sm:text-5xl font-black italic tracking-tighter text-white md:text-6xl uppercase font-grotesk"
          >
            Community Garages
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-4 max-w-xl mx-auto text-base text-[#A1A1AA] leading-relaxed"
          >
            See what collectors across India are importing, unboxing, and displaying in their virtual garages.
          </motion.p>
        </div>

        {/* Pinterest / Instagram Style Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockPosts.map((post, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group rounded-3xl border border-[#2A2A2A] bg-[#111111]/90 overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.6)] hover:border-[#E10600]/30 hover:shadow-[0_25px_50px_rgba(225,6,0,0.1)] transition-all duration-500"
            >
              {/* Product Visual Container */}
              <div className="w-full h-56 bg-[#050505]/40 flex items-center justify-center p-6 relative overflow-hidden">
                {/* Spotlight background effect */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_0%,transparent_60%)]" />
                <img
                  src={post.image}
                  alt={post.title}
                  className="max-h-full max-w-full object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.6)] transform group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Collector post footer details */}
              <div className="p-6 text-left border-t border-[#2A2A2A]">
                {/* User profile identifier row */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-black italic uppercase tracking-wider text-white font-grotesk">{post.handle}</span>
                    <span className="text-[9px] font-bold text-[#A1A1AA] uppercase tracking-widest mt-0.5">{post.rank}</span>
                  </div>
                  {/* Heart like counter */}
                  <span className="text-[10px] font-bold text-white/50 hover:text-[#E10600] flex items-center gap-1.5 transition-colors">
                    <svg className="w-3.5 h-3.5 fill-[#E10600]/20 stroke-[#E10600]" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {post.likes}
                  </span>
                </div>

                <h4 className="text-sm font-black italic uppercase tracking-wider text-[#FFB300] font-grotesk truncate mb-2">{post.title}</h4>
                <p className="text-xs leading-relaxed text-[#A1A1AA] line-clamp-2 font-inter">{post.description}</p>
              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
})

export default CommunityShowcase
