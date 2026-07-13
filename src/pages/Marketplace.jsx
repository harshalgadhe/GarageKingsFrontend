import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCars, isFirebaseConfigured, getBrands } from '../lib/db'
import { logError } from '../lib/telemetry'
import Navigation from '../components/Navigation'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import ReserveModal from '../components/checkout/ReserveModal'
import Footer from '../components/Footer'
import { MarketplaceGridSkeleton } from '../components/Skeletons'

export default function Marketplace() {
  const [cars, setCars] = useState([])
  const [backendBrands, setBackendBrands] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  
  // Pagination & Filtering States
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [brandFilter, setBrandFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('brand') || 'All';
  })
  const [scaleFilter, setScaleFilter] = useState('All')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [preBookingOnly, setPreBookingOnly] = useState(false)

  const [isMobile, setIsMobile] = useState(false)

  // AbortController ref for request deduplication
  const abortControllerRef = useRef(null)
  // Lock flag to prevent concurrent infinite scroll fetches
  const isFetchingRef = useRef(false)

  const navigate = useNavigate()

  // Track mobile view
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load brands from backend on mount
  useEffect(() => {
    getBrands()
      .then(data => setBackendBrands(data || []))
      .catch(err => console.error("Error loading brands from backend:", err));
  }, []);

  // Debounce search — only activate if query is empty (clear) or >= 3 chars
  useEffect(() => {
    const trimmed = searchQuery.trim()
    if (trimmed.length > 0 && trimmed.length < 3) return // Suppress short queries
    const timer = setTimeout(() => {
      setDebouncedSearch(trimmed)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    async function load() {
      // Cancel any in-flight request before starting a new one
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      const controller = new AbortController()
      abortControllerRef.current = controller
      isFetchingRef.current = true
      setIsLoading(true)

      try {
        const isFirstPage = page === 1;
        const currentLimit = isMobile 
          ? (isFirstPage ? 12 : 5) 
          : 12;
        const currentOffset = isMobile 
          ? (isFirstPage ? 0 : 12 + (page - 2) * 5) 
          : undefined;

        const params = {
          page: isMobile ? undefined : page,
          limit: currentLimit,
          offset: currentOffset,
          paginated: true,
          brand: brandFilter !== 'All' ? brandFilter : undefined,
          scale: scaleFilter !== 'All' ? scaleFilter : undefined,
          search: debouncedSearch || undefined,
          inStock: inStockOnly ? true : undefined,
          preBooking: preBookingOnly ? true : undefined,
          signal: controller.signal
        }
        const carData = await getCars(params)

        // Bail out silently if request was aborted mid-flight
        if (controller.signal.aborted) return

        const newProducts = (carData.products || []).map(p => ({
          ...p,
          // Normalize price: the paginated endpoint returns sellingPrice, not price
          price: p.sellingPrice ?? p.price,
          // Normalize lane: the paginated endpoint returns grade, not lane
          lane: p.lane ?? p.grade ?? p.manufacturer,
        }))
        
        if (isMobile) {
          setCars(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const filteredNew = newProducts.filter(p => !existingIds.has(p.id));
            return isFirstPage ? newProducts : [...prev, ...filteredNew];
          });
        } else {
          setCars(newProducts)
        }

        setTotalPages(carData.totalPages || 1)
        setTotalItems(carData.total || 0)
      } catch (err) {
        if (err?.name === 'AbortError') return // Expected — not an error
        setError("Unable to retrieve catalog listings. Please verify your connection or try again shortly.")
        logError(err.message || 'Catalog Load Failed', err.stack);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
          setIsFirstLoad(false)
          isFetchingRef.current = false
        }
      }
    }
    load()
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [page, brandFilter, scaleFilter, debouncedSearch, inStockOnly, preBookingOnly, isMobile])

  // Handle infinite scroll on mobile
  useEffect(() => {
    if (!isMobile) return;
    
    const handleScroll = () => {
      const threshold = 300;
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      
      if (scrollHeight - scrollTop - clientHeight < threshold) {
        // Guard: never trigger if already fetching or all items loaded
        if (!isFetchingRef.current && cars.length < totalItems) {
          setPage(prev => prev + 1);
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, cars.length, totalItems]);

  useEffect(() => {
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
        
        {/* Horizontal Brand Selector (Pills) */}
        {!error && (
          <div className="flex flex-wrap gap-2 justify-center items-center mb-8 bg-white/[0.02] border border-white/5 p-2 rounded-2xl max-w-4xl mx-auto backdrop-blur-md">
            {[
              { label: 'All Brands', value: 'All' },
              ...backendBrands.map(b => ({ label: b.name, value: b.name }))
            ].map(brand => {
              const isActive = brandFilter === brand.value;
              return (
                <button
                  key={brand.value}
                  onClick={() => { setBrandFilter(brand.value); setPage(1); }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer active:scale-95 ${
                    isActive 
                      ? 'bg-gk-orange text-white shadow-[0_0_20px_rgba(225,6,0,0.35)] border border-gk-orange' 
                      : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {brand.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Sub-Filters: Scale, Availability & Pre-Booking */}
        {!error && (
          <div className="flex flex-wrap gap-6 items-center justify-center mb-10 bg-white/[0.01] border border-white/5 p-4 rounded-2xl max-w-2xl mx-auto backdrop-blur-md">
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-black">Scale:</label>
              <select 
                value={scaleFilter}
                onChange={(e) => { setScaleFilter(e.target.value); setPage(1); }}
                className="bg-[#090909] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-gk-orange transition-all min-w-[100px] cursor-pointer"
              >
                <option value="All">All Scales</option>
                <option value="1:64">1:64</option>
                <option value="1:32">1:32</option>
              </select>
            </div>

            <div 
              className="flex items-center gap-2 select-none cursor-pointer" 
              onClick={() => { setInStockOnly(!inStockOnly); setPage(1); }}
            >
              <input 
                type="checkbox" 
                checked={inStockOnly} 
                onChange={() => {}} 
                className="accent-gk-orange cursor-pointer w-4 h-4"
              />
              <span className="text-xs font-bold text-white/70">In Stock Only</span>
            </div>

            <div 
              className="flex items-center gap-2 select-none cursor-pointer" 
              onClick={() => { setPreBookingOnly(!preBookingOnly); setPage(1); }}
            >
              <input 
                type="checkbox" 
                checked={preBookingOnly} 
                onChange={() => {}} 
                className="accent-gk-orange cursor-pointer w-4 h-4"
              />
              <span className="text-xs font-bold text-white/70">Pre-Booking Only</span>
            </div>
          </div>
        )}

        {error ? (
          <div className="text-center py-20 md:py-32">
            <div className="inline-block bg-red-500/20 border border-red-500/50 text-red-200 p-6 rounded-2xl max-w-lg">
              <h3 className="font-bold mb-2">Vault Connection Failed</h3>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : (isFirstLoad && isLoading) ? (
          <MarketplaceGridSkeleton count={isMobile ? 6 : 12} />
        ) : cars.length === 0 ? (
          <div className="text-center py-20 md:py-32 text-white/50">No items found matching your filters.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cars.map((car, index) => {
                const isSoldOut = car.availableStock !== undefined 
                  ? car.availableStock <= 0 
                  : (Number(car.totalStock || 0) - Number(car.soldStock || 0) <= 0);

                return (
                  <motion.div
                    key={car.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (index % 12) * 0.05 }}
                    onClick={() => navigate(`/product/${car.id}`)}
                    className="group relative flex flex-col rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden hover:bg-white/10 transition-colors duration-500 cursor-pointer"
                  >
                    {/* Image */}
                    <div className="aspect-[4/3] bg-black/10 overflow-hidden relative" onContextMenu={(e) => e.preventDefault()}>
                      <div className="absolute inset-0 z-30" />
                      <img
                        src={car.image || '/brand-logo.png'}
                        alt={car.name}
                        onError={(e) => {
                          e.target.src = '/brand-logo.png';
                          e.target.className = "w-full h-full object-contain p-6 bg-zinc-950/80 transition-transform duration-700 ease-[0.22,1,0.36,1] pointer-events-none select-none";
                        }}
                        className="w-full h-full object-contain p-3 group-hover:scale-103 transition-transform duration-700 ease-[0.22,1,0.36,1] pointer-events-none select-none"
                        style={{ WebkitUserDrag: 'none' }}
                      />
                      {isSoldOut && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1.5px] z-25 flex items-center justify-center pointer-events-none">
                          <span className="px-4 py-2 border border-red-500/40 bg-red-950/20 rounded-xl text-red-500 font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-red-500/5 select-none">
                            Sold Out
                          </span>
                        </div>
                      )}
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
                      
                      {(car.isPrebook || (car.tags && car.tags.length > 0)) && (
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                          {car.isPrebook && (
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border bg-gk-orange/15 text-gk-orange border-gk-orange/30 shadow-[0_0_10px_rgba(225,6,0,0.15)] animate-pulse">
                              Pre-Booking
                            </span>
                          )}
                          {car.tags && (() => {
                            const seen = new Set();
                            if (car.isPrebook) {
                              seen.add('pre-booking');
                              seen.add('prebooking');
                              seen.add('pre booking');
                              seen.add('pre-order');
                              seen.add('preorder');
                              seen.add('pre order');
                            }
                            return car.tags
                              .map(tag => tag.trim())
                              .filter(tag => {
                                const lower = tag.toLowerCase();
                                if (!lower || seen.has(lower)) return false;
                                seen.add(lower);
                                return true;
                              })
                              .map(tag => {
                                let colorClass = 'bg-white/10 text-white/70 border-white/10';
                                const lower = tag.toLowerCase();
                                if (lower === 'hot') colorClass = 'bg-[#E10600]/15 text-[#E10600] border-[#E10600]/30 shadow-[0_0_10px_rgba(225,6,0,0.15)]';
                                if (lower === 'trending') colorClass = 'bg-purple-500/15 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)]';
                                if (lower === 'rare') colorClass = 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]';
                                
                                const displayTag = tag.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                                return (
                                  <span key={tag} className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${colorClass}`}>
                                    {displayTag}
                                  </span>
                                );
                              });
                          })()}
                        </div>
                      )}
                      
                      <h3 className="text-xl font-bold leading-tight mb-3 group-hover:text-gk-orange transition-colors">{car.name}</h3>
                      
                      <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between w-full">
                        {isSoldOut ? (
                          <div className="text-red-500 font-bold text-xs uppercase tracking-wider">
                            Sold Out
                          </div>
                        ) : (
                          <div>
                            <div className="text-[9px] uppercase tracking-wider text-white/40 mb-0.5">Price</div>
                            {(car.price != null && Number(car.price) > 0) ? (
                              <div className="font-mono text-base text-white font-bold">{car.currency || '₹'}{Number(car.price).toLocaleString('en-IN')}</div>
                            ) : (
                              <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Contact Us</div>
                            )}
                          </div>
                        )}
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider group-hover:text-gk-orange transition-colors">
                          View Details →
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Mobile Loading Spinner */}
            {isMobile && isLoading && (
              <div className="flex justify-center mt-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-3 border-gk-orange/30 border-t-gk-orange animate-spin" />
                  <div className="text-[10px] font-black uppercase tracking-widest text-gk-orange animate-pulse">Loading More...</div>
                </div>
              </div>
            )}

            {/* Pagination Controls (Desktop Only) */}
            {!isMobile && totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12 bg-white/[0.01] border border-white/5 p-3 rounded-2xl max-w-md mx-auto backdrop-blur-md">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  className="px-3.5 py-2.5 rounded-xl border border-white/10 hover:border-gk-orange/30 bg-white/5 hover:bg-gk-orange/5 text-white font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  ← Prev
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                    const isActive = page === p;
                    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-gk-orange text-white font-black shadow-[0_0_15px_rgba(225,6,0,0.3)] border border-gk-orange' 
                              : 'text-white/50 hover:text-white hover:bg-white/5 border border-white/5'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    }
                    if (p === 2 || p === totalPages - 1) {
                      return (
                        <span key={p} className="text-white/30 text-xs px-1 font-mono">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3.5 py-2.5 rounded-xl border border-white/10 hover:border-gk-orange/30 bg-white/5 hover:bg-gk-orange/5 text-white font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
