import { useState, useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { getCars, getBrands } from '../lib/db'
import { logError } from '../lib/telemetry'
import Navigation from '../components/Navigation'
import { useLocation, useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'
import { MarketplaceGridSkeleton } from '../components/Skeletons'
import VaultModuleCard from '../components/common/VaultModuleCard'
import CommandBar from '../components/common/CommandBar'

export default function Marketplace() {
  const reduceMotion = useReducedMotion()
  const [cars, setCars] = useState([])
  const [backendBrands, setBackendBrands] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [error, setError] = useState('')
  const initialSearch = new URLSearchParams(window.location.search).get('search') || ''
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch)
  
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
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const nextSearch = params.get('search') || ''
    setSearchQuery(nextSearch)
    setDebouncedSearch(nextSearch)
    setBrandFilter(params.get('brand') || 'All')
    setPage(1)
  }, [location.search])

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
      .catch(() => setBackendBrands([]));
  }, []);

  // Debounce search
  useEffect(() => {
    const trimmed = searchQuery.trim()
    if (trimmed.length > 0 && trimmed.length < 3) return
    const timer = setTimeout(() => {
      setDebouncedSearch(trimmed)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    async function load() {
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

        if (controller.signal.aborted) return

        const rawProducts = (carData.products || []).map(p => ({
          ...p,
          price: p.sellingPrice ?? p.price,
          lane: p.lane ?? p.grade ?? p.manufacturer,
        }))

        // Helper to push sold out items to the end of the list
        const sortSoldOutLast = (list) => {
          return list.slice().sort((a, b) => {
            const aSoldOut = a.isSoldOut !== undefined
              ? a.isSoldOut
              : (a.availableStock !== undefined ? Number(a.availableStock) <= 0 : (Number(a.totalStock || 0) - Number(a.soldStock || 0) <= 0));
            const bSoldOut = b.isSoldOut !== undefined
              ? b.isSoldOut
              : (b.availableStock !== undefined ? Number(b.availableStock) <= 0 : (Number(b.totalStock || 0) - Number(b.soldStock || 0) <= 0));

            if (aSoldOut && !bSoldOut) return 1;
            if (!aSoldOut && bSoldOut) return -1;
            return 0;
          });
        };

        const newProducts = sortSoldOutLast(rawProducts);
        
        if (isMobile) {
          setCars(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const filteredNew = newProducts.filter(p => !existingIds.has(p.id));
            const combined = isFirstPage ? newProducts : [...prev, ...filteredNew];
            return sortSoldOutLast(combined);
          });
        } else {
          setCars(newProducts)
        }

        setTotalPages(carData.totalPages || 1)
        setTotalItems(carData.total || 0)
      } catch (err) {
        if (err?.name === 'AbortError') return
        setError("Unable to retrieve vault listings. Please verify connection.")
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
        if (!isFetchingRef.current && cars.length < totalItems) {
          setPage(prev => prev + 1);
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, cars.length, totalItems]);

  const handleResetFilters = () => {
    setBrandFilter('All');
    setScaleFilter('All');
    setInStockOnly(false);
    setPreBookingOnly(false);
    setSearchQuery('');
    setDebouncedSearch('');
    setPage(1);
  };

  return (
    <div className="min-h-[100svh] bg-[#050505] text-[#F4F1EC] pt-16">
      <Navigation activeSection="vault" />

      {/* ── Compact Editorial Vault Header ── */}
      <header className="gk-vault-entrance relative overflow-hidden border-b border-white/[0.07] bg-black py-10 md:py-14">
        <div className="pointer-events-none absolute -right-6 -top-20 select-none font-mono text-[15rem] font-black leading-none text-white/[0.014] md:text-[21rem]">V</div>
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-7 px-6 md:grid-cols-12 md:items-end">
          <motion.div className="md:col-span-8" initial={reduceMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#D8BC78] mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E1BD65]" />
              THE GARAGEKINGS COLLECTION
            </div>
            <h1 className="mt-3 max-w-3xl text-5xl font-semibold leading-[0.94] tracking-[-0.045em] text-[#F4F1EC] md:text-6xl lg:text-7xl">
              Every model has<br /><span className="text-[#E1BD65]">a reason to be here.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#A9A49C]">
              A considered selection of automotive miniatures, photographed, catalogued and presented by one collector-led team.
            </p>
          </motion.div>

          <div className="md:col-span-4 md:border-l md:border-white/[0.08] md:pl-8">
            <div className="text-[10px] uppercase tracking-[0.16em] text-[#74716B]">Current collection</div>
            <div className="mt-2 flex items-baseline gap-3"><strong className="font-mono text-3xl text-[#F4F1EC]">{totalItems}</strong><span className="text-xs text-[#74716B]">models</span></div>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-[#74716B]">Select a model to view its photos and current details.</p>
          </div>
        </div>
      </header>

      {/* ── Sticky CommandBar ── */}
      <CommandBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        brandFilter={brandFilter}
        setBrandFilter={setBrandFilter}
        scaleFilter={scaleFilter}
        setScaleFilter={setScaleFilter}
        inStockOnly={inStockOnly}
        setInStockOnly={setInStockOnly}
        preBookingOnly={preBookingOnly}
        setPreBookingOnly={setPreBookingOnly}
        backendBrands={backendBrands}
        totalItems={totalItems}
        onResetFilters={handleResetFilters}
      />

      {/* ── Grid Container ── */}
      <main className="max-w-7xl mx-auto px-4 py-7 sm:px-6 md:py-12">
        {error ? (
          <div className="text-center py-20">
            <div className="inline-block bg-[#B85C5C]/10 border border-[#B85C5C]/30 text-[#F4F1EC] p-6 rounded-xl max-w-lg font-mono">
              <h3 className="font-bold mb-1 text-[#B85C5C]">The Vault Could Not Be Opened</h3>
              <p className="text-xs text-[#A9A49C]">{error}</p>
              <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 rounded bg-[#B85C5C] text-black font-bold text-xs">
                Retry Connection
              </button>
            </div>
          </div>
        ) : (isFirstLoad && isLoading) ? (
          <MarketplaceGridSkeleton count={isMobile ? 6 : 12} />
        ) : cars.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/[0.08] rounded-xl bg-[#0D0D0D] p-8 max-w-xl mx-auto space-y-4">
            <div className="text-xs font-mono uppercase tracking-widest text-[#E86A2F]">No Vault Entries Found</div>
            <p className="text-sm text-[#A9A49C]">
              No models match the filters you selected.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-lg bg-[#E86A2F] text-black font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8 flex items-end justify-between border-b border-white/[0.06] pb-5">
              <div><span className="text-[9px] uppercase tracking-[0.2em] text-[#D8BC78]">Browse models</span><h2 className="mt-1 text-2xl font-semibold tracking-tight">Available and pre-booking</h2></div>
              <span className="hidden font-mono text-[10px] uppercase tracking-widest text-[#74716B] md:block">No checkout / direct collector enquiry</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {cars.map((car, index) => (
                <motion.div
                  key={car.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : Math.min(index % 12, 5) * 0.045, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                >
                  <VaultModuleCard car={car} onClick={() => navigate(`/product/${car.id}`)} />
                </motion.div>
              ))}
            </div>

            {/* Pagination Controls */}
            {!isMobile && totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12 pt-8 border-t border-white/[0.06] font-mono">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  className="px-4 py-2 rounded-lg border border-white/[0.08] hover:border-[#E86A2F] text-xs font-bold uppercase disabled:opacity-30 cursor-pointer"
                >
                  ← Prev Page
                </button>
                <span className="text-xs text-[#74716B] px-4">
                  Page <strong className="text-[#F4F1EC]">{page}</strong> of <strong className="text-[#F4F1EC]">{totalPages}</strong>
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-4 py-2 rounded-lg border border-white/[0.08] hover:border-[#E86A2F] text-xs font-bold uppercase disabled:opacity-30 cursor-pointer"
                >
                  Next Page →
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
