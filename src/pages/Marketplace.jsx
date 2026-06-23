import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCars, isFirebaseConfigured, getGlobalSettings } from '../lib/db'
import Navigation from '../components/Navigation'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import ReserveModal from '../components/checkout/ReserveModal'
import Footer from '../components/Footer'
import FloatingSupport from '../components/FloatingSupport'

export default function Marketplace() {
  const [cars, setCars] = useState([])
  const [settings, setSettings] = useState({ showPrices: false })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [checkoutCar, setCheckoutCar] = useState(null)
  const navigate = useNavigate()

  const handleBuyClick = (car) => {
    setCheckoutCar(car);
  }

  useEffect(() => {
    async function load() {
      try {
        const [carData, settingsData] = await Promise.all([getCars(), getGlobalSettings()])
        setCars(carData)
        setSettings({ showPrices: settingsData?.showPrices === true })
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    load()

    // Autofocus the search bar if requested via navigation
    if (window.location.search.includes('focus=true')) {
      setTimeout(() => {
        const input = document.getElementById('marketplace-search-input');
        if (input) {
          input.focus();
        }
      }, 350);
    }
  }, [])

  const filteredCars = useMemo(() => {
    let result = cars;
    
    // Apply tag filter
    if (activeFilter !== 'All') {
      result = result.filter(car => car.tags && car.tags.includes(activeFilter));
    }
    
    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(car =>
        (car.name && car.name.toLowerCase().includes(query)) ||
        (car.brand && car.brand.toLowerCase().includes(query)) ||
        (car.carBrand && car.carBrand.toLowerCase().includes(query)) ||
        (car.lane && car.lane.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [cars, activeFilter, searchQuery])

  return (
    <div className="min-h-[100svh] bg-gk-black text-white selection:bg-gk-yellow selection:text-black pt-16">
      <Navigation activeSection="vault" />

      {/* Hero */}
      <div className="relative py-16 md:py-24 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,51,0,0.1)_0%,transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-4">
            The <span className="text-gk-orange">Marketplace.</span>
          </h1>
          <p className="text-base md:text-lg text-white/50 max-w-xl mx-auto mb-8 md:mb-10">
            Exclusive die-cast inventory, curated and strictly graded. Secure your piece of the vault.
          </p>
          <div className="max-w-md mx-auto relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-gk-yellow transition-colors">
              <Search size={20} />
            </div>
            <input 
              id="marketplace-search-input"
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, brand, or category..."
              className="w-full bg-black/50 border border-white/20 rounded-full py-3.5 md:py-4 pl-12 pr-6 text-sm md:text-base text-white placeholder-white/30 focus:outline-none focus:border-gk-yellow focus:ring-1 focus:ring-gk-yellow transition-all"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        
        {/* Horizontal Tags Filter Bar */}
        {!error && !isLoading && cars.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center items-center mb-10 bg-white/[0.02] border border-white/5 p-2 rounded-2xl max-w-2xl mx-auto backdrop-blur-md">
            {['All', 'Hot', 'Trending', 'Rare', 'New Release', 'Exclusive'].map(filter => {
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
                    isActive 
                      ? 'bg-gk-orange text-white shadow-[0_0_20px_rgba(225,6,0,0.3)]' 
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        )}

        {error ? (
          <div className="text-center py-20 md:py-32">
            <div className="inline-block bg-red-500/20 border border-red-500/50 text-red-200 p-6 rounded-2xl max-w-lg">
              <h3 className="font-bold mb-2">Vault Connection Failed</h3>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-20 md:py-32">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-gk-orange/30 border-t-gk-orange animate-spin" />
              <div className="text-sm font-bold uppercase tracking-widest text-gk-orange animate-pulse">Unlocking Vault...</div>
            </div>
          </div>
        ) : cars.length === 0 ? (
          <div className="text-center py-20 md:py-32 text-white/50">The marketplace is currently empty.</div>
        ) : filteredCars.length === 0 ? (
          <div className="text-center py-20 md:py-32 text-white/50">No items found matching "{searchQuery}".</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCars.map((car, index) => (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative flex flex-col rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden hover:bg-white/10 transition-colors duration-500"
              >
                {/* Image */}
                <div className="aspect-[4/3] bg-black/10 overflow-hidden relative" onContextMenu={(e) => e.preventDefault()}>
                  <div className="absolute inset-0 z-30" />
                  <img
                    src={car.image || '/vault-1.png'}
                    alt={car.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[0.22,1,0.36,1] pointer-events-none select-none"
                    style={{ WebkitUserDrag: 'none' }}
                  />
                  <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-gk-yellow pointer-events-none shadow-xl">
                    {car.lane}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col grow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/40">{car.grade}</div>
                    {car.scale && <div className="text-[10px] font-bold uppercase tracking-wider text-white/30 bg-white/5 px-2 py-0.5 rounded">{car.scale}</div>}
                  </div>
                  
                  {(car.brand || car.carBrand) && (
                    <div className="text-[10px] font-black uppercase tracking-widest text-gk-orange mb-1">
                      {car.carBrand ? `${car.brand} • ${car.carBrand}` : car.brand}
                    </div>
                  )}
                  
                  {car.tags && car.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {car.tags.map(tag => {
                        let colorClass = 'bg-white/10 text-white/70 border-white/10';
                        if (tag === 'Hot') colorClass = 'bg-[#E10600]/15 text-[#E10600] border-[#E10600]/30 shadow-[0_0_10px_rgba(225,6,0,0.15)]';
                        if (tag === 'Trending') colorClass = 'bg-purple-500/15 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)]';
                        if (tag === 'Rare') colorClass = 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]';
                        return (
                          <span key={tag} className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${colorClass}`}>
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold leading-tight mb-3 group-hover:text-gk-orange transition-colors">{car.name}</h3>

                  {car.description && (
                    <p className="text-sm text-white/50 line-clamp-3 mb-4">{car.description}</p>
                  )}
                  
                  <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                    {settings.showPrices === true ? (
                      <>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Vault Price</div>
                          <div className="font-mono text-xl text-white font-medium">{car.currency || '₹'}{car.price}</div>
                        </div>
                        <button
                          onClick={() => handleBuyClick(car)}
                          className="px-4 py-2 rounded-xl bg-gk-orange hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider transition-all hover:shadow-[0_0_20px_rgba(225,6,0,0.4)] active:scale-[0.98] cursor-pointer"
                        >
                          Buy Now
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="text-xs uppercase tracking-wider text-gk-orange font-bold">DM for Price</div>
                        <button
                          onClick={() => handleBuyClick(car)}
                          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-gk-orange/30 hover:bg-gk-orange/5 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Inquire
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <AnimatePresence>
        {checkoutCar && <ReserveModal product={checkoutCar} onClose={() => setCheckoutCar(null)} />}
      </AnimatePresence>
      <Footer />
      <FloatingSupport />
    </div>
  )
}
