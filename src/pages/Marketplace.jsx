import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { getCars, getBrands } from '../lib/db'
import { logError } from '../lib/telemetry'
import Navigation from '../components/Navigation'
import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'
import { MarketplaceGridSkeleton } from '../components/Skeletons'
import VaultModuleCard from '../components/common/VaultModuleCard'
import CommandBar from '../components/common/CommandBar'

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
      <header className="py-8 md:py-12 bg-[#090909] border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#E86A2F] mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E86A2F]" />
              GARAGEKINGS VAULT ARCHIVE
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#F4F1EC] tracking-tight">
              The Vault.
            </h1>
            <p className="text-xs md:text-sm text-[#A9A49C] max-w-xl mt-1 leading-relaxed">
              Curated automotive diecast inventory, strictly cataloged and condition-verified.
            </p>
          </div>

          <div className="text-xs font-mono text-[#74716B] bg-[#050505] border border-white/[0.06] px-4 py-2 rounded-lg shrink-0">
            Vault Index Status: <strong className="text-[#F4F1EC]">{totalItems} entries cataloged</strong>
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
      <main className="max-w-7xl mx-auto px-6 py-8 md:py-12">
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
              No collectibles in the vault match your active inspection parameters.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cars.map((car, index) => (
                <motion.div
                  key={car.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index % 12) * 0.03, duration: 0.26 }}
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
