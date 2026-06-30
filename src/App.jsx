import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import { SmoothScrollProvider } from './providers/SmoothScroll'
import Home from './pages/Home'
import Admin from './pages/Admin'
import Account from './pages/Account'
import Marketplace from './pages/Marketplace'
import Help from './pages/Help'
import Policies from './pages/Policies'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Router>
      <SmoothScrollProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/account" element={<Account />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/help" element={<Help />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SmoothScrollProvider>
      <SpeedInsights />
      <Analytics />
    </Router>
  )
}
