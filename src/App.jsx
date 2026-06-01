import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { SmoothScrollProvider } from './providers/SmoothScroll'
import Home from './pages/Home'
import Admin from './pages/Admin'
import Marketplace from './pages/Marketplace'
import Auctions from './pages/Auctions'

export default function App() {
  return (
    <Router>
      <SmoothScrollProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/auctions" element={<Auctions />} />
        </Routes>
      </SmoothScrollProvider>
    </Router>
  )
}
