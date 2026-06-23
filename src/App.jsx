import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { SmoothScrollProvider } from './providers/SmoothScroll'
import Home from './pages/Home'
import Admin from './pages/Admin'
import Account from './pages/Account'
import Marketplace from './pages/Marketplace'
import Setup from './pages/Setup'
import Help from './pages/Help'
import Policies from './pages/Policies'

export default function App() {
  return (
    <Router>
      <SmoothScrollProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/account" element={<Account />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/help" element={<Help />} />
          <Route path="/policies" element={<Policies />} />
        </Routes>
      </SmoothScrollProvider>
    </Router>
  )
}
