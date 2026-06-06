import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { SmoothScrollProvider } from './providers/SmoothScroll'
import Home from './pages/Home'
import Admin from './pages/Admin'
import Marketplace from './pages/Marketplace'

export default function App() {
  return (
    <Router>
      <SmoothScrollProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/garage" element={<Admin />} />
          <Route path="/marketplace" element={<Marketplace />} />
        </Routes>
      </SmoothScrollProvider>
    </Router>
  )
}
