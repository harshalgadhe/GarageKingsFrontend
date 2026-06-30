import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initTelemetry } from './lib/telemetry.js'
import './lib/db.js'
import './index.css'
import App from './App.jsx'

// Global fetch interceptor to support AWS SigV4 unsigned payload requests through CloudFront OAC
const originalFetch = window.fetch;
window.fetch = async function (resource, config) {
  let url = '';
  if (typeof resource === 'string') {
    url = resource;
  } else if (resource instanceof Request) {
    url = resource.url;
  } else if (resource && typeof resource.toString === 'function') {
    url = resource.toString();
  }

  if (url.includes('/api/v1/')) {
    config = config || {};
    const method = (config.method || 'GET').toUpperCase();
    if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
      config.headers = config.headers || {};
      if (config.headers instanceof Headers) {
        config.headers.set('x-amz-content-sha256', 'UNSIGNED-PAYLOAD');
      } else if (Array.isArray(config.headers)) {
        const hasHeader = config.headers.some(h => h[0].toLowerCase() === 'x-amz-content-sha256');
        if (!hasHeader) {
          config.headers.push(['x-amz-content-sha256', 'UNSIGNED-PAYLOAD']);
        }
      } else {
        config.headers['x-amz-content-sha256'] = 'UNSIGNED-PAYLOAD';
      }
    }
  }
  return originalFetch.call(this, resource, config);
};

initTelemetry()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
