import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initTelemetry } from './lib/telemetry.js'
import './lib/db.js'
import './index.css'
import App from './App.jsx'

initTelemetry()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
