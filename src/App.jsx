import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import { SmoothScrollProvider } from './providers/SmoothScroll'
import { LoadingProvider } from './providers/LoadingProvider'

// Lazy-loaded page routes — allows the initial JS bundle to be smaller
// and defers parsing of heavy admin/account/product pages until needed.
// Frequently-visited routes (Home, Marketplace) are imported first so
// the bundler places them in higher-priority chunks.
const Home       = lazy(() => import('./pages/Home'))
const Marketplace = lazy(() => import('./pages/Marketplace'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Cart       = lazy(() => import('./pages/Cart'))
const Checkout   = lazy(() => import('./pages/Checkout'))
const Account    = lazy(() => import('./pages/Account'))
const Admin      = lazy(() => import('./pages/Admin'))
const Help       = lazy(() => import('./pages/Help'))
const Policies   = lazy(() => import('./pages/Policies'))
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
      {/* Minimal branded indicator — same spinner style as the rest of the app */}
      <div style={{ position: 'relative', width: 48, height: 48 }}>
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: '#E15B2C',
          animation: 'spin 1.2s linear infinite',
        }} />
      </div>
      {/* Inline keyframe — avoids dependency on the CSS bundle being loaded */}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <SmoothScrollProvider>
        <LoadingProvider>
          {/* Suspense must be inside LoadingProvider so lazy pages can call useLoading() */}
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/"            element={<Home />} />
              <Route path="/admin"       element={<Admin />} />
              <Route path="/account"     element={<Account />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/help"        element={<Help />} />
              <Route path="/policies"    element={<Policies />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart"        element={<Cart />} />
              <Route path="/checkout"    element={<Checkout />} />
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
