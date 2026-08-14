import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import { SmoothScrollProvider } from './providers/SmoothScroll'
import { LoadingProvider } from './providers/LoadingProvider'
import Home from './pages/Home'
import Marketplace from './pages/Marketplace'
import BrandsIndex from './pages/BrandsIndex'

const STALE_CHUNK_RELOAD_KEY = 'gk-stale-chunk-reload'

function lazyWithDeploymentRecovery(importPage) {
  return lazy(async () => {
    try {
      const page = await importPage()
      sessionStorage.removeItem(STALE_CHUNK_RELOAD_KEY)
      return page
    } catch (error) {
      const message = String(error?.message || error)
      const staleChunk = /dynamically imported module|module script|importing a module script/i.test(message)
      const lastReload = Number(sessionStorage.getItem(STALE_CHUNK_RELOAD_KEY) || 0)

      if (staleChunk && Date.now() - lastReload > 60_000) {
        sessionStorage.setItem(STALE_CHUNK_RELOAD_KEY, String(Date.now()))
        window.location.reload()
        return new Promise(() => {})
      }

      throw error
    }
  })
}

// Lazy-loaded page routes keep the initial JS bundle smaller
// and defers parsing of heavy admin/account/product pages until needed.
// Primary navigation destinations ship with the app shell so moving between
// Home, Brands and Garage never blanks the page while a route chunk downloads.
const ProductDetail = lazyWithDeploymentRecovery(() => import('./pages/ProductDetail'))
const Cart       = lazyWithDeploymentRecovery(() => import('./pages/Cart'))
const Account    = lazyWithDeploymentRecovery(() => import('./pages/Account'))
const Admin      = lazyWithDeploymentRecovery(() => import('./pages/Admin'))
const Help       = lazyWithDeploymentRecovery(() => import('./pages/Help'))
const Policies   = lazyWithDeploymentRecovery(() => import('./pages/Policies'))
const BrandPage  = lazyWithDeploymentRecovery(() => import('./pages/BrandPage'))
const NotFound   = lazyWithDeploymentRecovery(() => import('./pages/NotFound'))

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
        background: '#050505',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: 180, textAlign: 'center' }}>
        <div style={{ color: '#C8AE7D', fontSize: 10, fontWeight: 700, letterSpacing: '.24em', textTransform: 'uppercase' }}>GarageKings</div>
        <div style={{ height: 1, marginTop: 14, overflow: 'hidden', background: 'rgba(255,255,255,.08)' }}><div style={{ width: '45%', height: '100%', background: '#C8AE7D', animation: 'gk-load 1.15s ease-in-out infinite' }} /></div>
      </div>
      <style>{`@keyframes gk-load{0%{transform:translateX(-110%)}100%{transform:translateX(330%)}}`}</style>
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
