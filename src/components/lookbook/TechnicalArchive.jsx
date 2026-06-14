import { useState, useEffect, useRef, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { vaultProducts } from '../../data/content'

const TechnicalArchive = forwardRef(function TechnicalArchive(props, ref) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeBrand, setActiveBrand] = useState('All')
  const [hoveredProduct, setHoveredProduct] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHoverable, setIsHoverable] = useState(false)

  const tableRef = useRef(null)

  useEffect(() => {
    // Enable tooltip only for devices with a mouse/trackpad pointer
    setIsHoverable(window.matchMedia('(pointer: fine)').matches)
  }, [])

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  // Filter products based on search query and active brand tab
  const filteredProducts = vaultProducts.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.lane.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesBrand = activeBrand === 'All' || 
                         (activeBrand === 'MINI GT' && item.image.includes('vault-1')) ||
                         (activeBrand === 'INNO64' && item.image.includes('vault-4')) ||
                         (activeBrand === 'HOT WHEELS RLC' && (item.image.includes('vault-2') || item.image.includes('vault-5'))) ||
                         (activeBrand === 'OTHERS' && (!item.image.includes('vault-1') && !item.image.includes('vault-4') && !item.image.includes('vault-2') && !item.image.includes('vault-5')))
    
    return matchesSearch && matchesBrand
  })

  const getCastingBrandName = (item) => {
    if (item.image.includes('vault-1') || item.image.includes('vault-8')) return 'MINI GT'
    if (item.image.includes('vault-4')) return 'INNO64'
    if (item.image.includes('vault-2') || item.image.includes('vault-5')) return 'HOT WHEELS RLC'
    return 'HOT WHEELS PREMIUM'
  }

  const getCastingRarity = (item) => {
    if (item.image.includes('vault-1') || item.image.includes('vault-8')) return 'Chase'
    if (item.image.includes('vault-2')) return 'Grail STH'
    return 'Limited'
  }

  return (
    <section
      ref={ref}
      id="archive"
      className="relative min-h-[100dvh] w-full py-28 md:py-36 px-6 md:px-12 lg:px-16 bg-transparent border-t border-zinc-800"
    >
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col justify-start">
        
        {/* Header Block */}
        <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="text-left">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 mb-2 block">
              SPREAD 03 // DATA ARCHIVE
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black italic tracking-tighter text-white uppercase font-grotesk leading-none pb-2">
              Casting <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-400 to-white/30">Index</span>
            </h2>
          </div>
          
          {/* Real-time search query box */}
          <div className="w-full max-w-sm">
            <input
              type="text"
              placeholder="Search castings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-white/20 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none transition-colors font-mono"
            />
          </div>
        </div>

        {/* Brand filters tabs */}
        <div className="flex flex-wrap gap-2.5 mb-8 border-b border-zinc-800 pb-6">
          {['All', 'HOT WHEELS RLC', 'MINI GT', 'INNO64', 'OTHERS'].map((brand) => (
            <button
              key={brand}
              onClick={() => setActiveBrand(brand)}
              className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest border transition-all cursor-pointer ${
                activeBrand === brand 
                  ? 'bg-white border-white text-zinc-950 font-bold' 
                  : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>

        {/* The Casting database Table */}
        <div className="w-full overflow-x-auto" ref={tableRef} onMouseMove={handleMouseMove}>
          <table className="w-full border-collapse text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                <th className="py-4 font-normal">Casting Model</th>
                <th className="py-4 font-normal">Brand</th>
                <th className="py-4 font-normal">Rarity Deck</th>
                <th className="py-4 font-normal">Package Grade</th>
                <th className="py-4 font-normal text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((item) => (
                <tr
                  key={item.id}
                  onMouseEnter={() => setHoveredProduct(item)}
                  onMouseLeave={() => setHoveredProduct(null)}
                  onClick={() => alert(`Opening purchase queue for ${item.name}`)}
                  className="border-b border-zinc-900 hover:bg-white/[0.015] hover:border-zinc-800 transition-colors cursor-pointer group text-xs text-zinc-300"
                >
                  <td className="py-5 font-black uppercase text-white font-grotesk tracking-wide group-hover:text-gk-bronze transition-colors">
                    {item.name}
                  </td>
                  <td className="py-5 font-mono text-zinc-400">
                    {getCastingBrandName(item)}
                  </td>
                  <td className="py-5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                      getCastingRarity(item) === 'Grail STH' 
                        ? 'bg-gk-bronze/10 text-gk-bronze border border-gk-bronze/20'
                        : 'bg-zinc-800/30 text-zinc-400 border border-zinc-700/20'
                    }`}>
                      {getCastingRarity(item)}
                    </span>
                  </td>
                  <td className="py-5 text-zinc-500 italic">
                    {item.grade}
                  </td>
                  <td className="py-5 font-sora font-semibold text-right text-white">
                    {item.price}
                  </td>
                </tr>
              ))}
              
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-zinc-600 font-mono text-xs uppercase tracking-widest">
                    No castings match search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Cursor-following Hover Image Tooltip */}
        <AnimatePresence>
          {hoveredProduct && (
            <motion.div
              style={{
                position: 'fixed',
                left: mousePos.x + 24,
                top: mousePos.y + 24,
                pointerEvents: 'none',
                zIndex: 100,
              }}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-52 h-36 rounded-2xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-xl p-4 flex flex-col items-center justify-center shadow-[0_25px_50px_rgba(0,0,0,0.95)]"
            >
              <div className="absolute top-2 left-3 text-[7px] font-mono text-zinc-500 uppercase tracking-widest">
                Condition Preview
              </div>
              <img
                src={hoveredProduct.image}
                alt={hoveredProduct.name}
                className="max-h-[85%] max-w-[85%] object-contain filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.75)]"
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  )
})

export default TechnicalArchive
