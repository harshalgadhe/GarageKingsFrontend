import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import { SmoothScrollProvider } from './providers/SmoothScroll'
import { LoadingProvider } from './providers/LoadingProvider'

// Lazy-loaded page routes keep the initial JS bundle smaller
// and defers parsing of heavy admin/account/product pages until needed.
// Frequently-visited routes (Home, Marketplace) are imported first so
// the bundler places them in higher-priority chunks.
const Home       = lazy(() => import('./pages/Home'))
const Marketplace = lazy(() => import('./pages/Marketplace'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Cart       = lazy(() => import('./pages/Cart'))
const Account    = lazy(() => import('./pages/Account'))
const Admin      = lazy(() => import('./pages/Admin'))
const Help       = lazy(() => import('./pages/Help'))
const Policies   = lazy(() => import('./pages/Policies'))
const BrandPage  = lazy(() => import('./pages/BrandPage'))
const BrandsIndex = lazy(() => import('./pages/BrandsIndex'))
const NotFound   = lazy(() => import('./pages/NotFound'))

/**
 * Dark-themed fallback shown while a lazy chunk loads.
 * Matches the app background exactly so no white flash occurs
 * even on the very first chunk fetch on a cold connection.
 */
function PageFallback() {
  return (
    <div
      aria-hidden="true"
      style={{
        minHeight: '100dvh',
        background: '#090909',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Minimal branded indicator using the same spinner style as the rest of the app */}
      <div style={{ position: 'relative', width: 48, height: 48 }}>
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: '#E15B2C',
          animation: 'spin 1.2s linear infinite',
        }} />
      </div>
      {/* Inline keyframe avoids dependency on the CSS bundle being loaded */}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function LegacyHashRedirect() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (location.pathname !== '/' || !location.hash) return
    const cleanRoute = { '#brands': '/brands', '#collections': '/marketplace', '#archive': '/marketplace', '#hero': '/' }[location.hash]
    if (cleanRoute) navigate(cleanRoute, { replace: true })
  }, [location.hash, location.pathname, navigate])

  return null
}

export default function App() {
  return (
    <Router>
      <LegacyHashRedirect />
      <SmoothScrollProvider>
        <LoadingProvider>
          {/* Suspense must be inside LoadingProvider so lazy pages can call useLoading() */}
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/"            element={<Home />} />
              <Route path="/admin"       element={<Admin />} />
              <Route path="/account"     element={<Account />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/brands" element={<BrandsIndex />} />
              <Route path="/brands/:slug" element={<BrandPage />} />
              <Route path="/collections" element={<Navigate to="/marketplace" replace />} />
              <Route path="/help"        element={<Help />} />
              <Route path="/policies"    element={<Policies />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart"        element={<Navigate to="/marketplace" replace />} />
              <Route path="/checkout"    element={<Navigate to="/marketplace" replace />} />
              <Route path="*"            element={<NotFound />} />
            </Routes>
          </Suspense>
        </LoadingProvider>
      </SmoothScrollProvider>
      <SpeedInsights />
      <Analytics />
    </Router>
  )
}
