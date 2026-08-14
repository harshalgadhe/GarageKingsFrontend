import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initTelemetry } from './lib/telemetry.js'
import './lib/db.js'
import './index.css'
import App from './App.jsx'

// Helper to calculate SHA-256 hash of any request body payload
async function calculateSHA256(body) {
  if (!body) {
    return 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // Hash of empty string
  }

  try {
    let dataBuffer;
    if (typeof body === 'string') {
      dataBuffer = new TextEncoder().encode(body);
    } else if (body instanceof URLSearchParams) {
      dataBuffer = new TextEncoder().encode(body.toString());
    } else if (body instanceof Blob) {
      dataBuffer = await body.arrayBuffer();
    } else if (body instanceof ArrayBuffer) {
      dataBuffer = body;
    } else if (ArrayBuffer.isView(body)) {
      dataBuffer = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
    } else if (body instanceof FormData) {
      // Serialize FormData to a Blob to extract the raw body binary payload
      const tempResponse = new Response(body);
      const blob = await tempResponse.blob();
      dataBuffer = await blob.arrayBuffer();
    } else {
      dataBuffer = new TextEncoder().encode(JSON.stringify(body));
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error('Error calculating request body SHA-256 hash:', err);
    return 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  }
}

// Global fetch interceptor to support AWS SigV4 payload signing through CloudFront OAC
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
    const existingHeaders = new Headers(config.headers || {});
    const hasPayloadHash = existingHeaders.has('x-amz-content-sha256');
    
    // AWS SigV4 requires x-amz-content-sha256 header containing the SHA-256 of the request body
    // Skip if body is FormData to prevent browser form boundaries serialization mismatch
    // and preserve hashes calculated by deterministic upload helpers.
    if (hasPayloadHash || (config.body && config.body instanceof FormData)) {
      // Do not inject x-amz-content-sha256 for multipart uploads
    } else {
      const payloadHash = await calculateSHA256(config.body);
      config.headers = config.headers || {};
      if (config.headers instanceof Headers) {
        config.headers.set('x-amz-content-sha256', payloadHash);
      } else if (Array.isArray(config.headers)) {
        const idx = config.headers.findIndex(h => h[0].toLowerCase() === 'x-amz-content-sha256');
        if (idx !== -1) {
          config.headers[idx][1] = payloadHash;
        } else {
          config.headers.push(['x-amz-content-sha256', payloadHash]);
        }
      } else {
        config.headers['x-amz-content-sha256'] = payloadHash;
      }
    }
  }
  return originalFetch.call(this, resource, config);
};

initTelemetry()

// Vite emits this when an open tab references a chunk removed by a newer
// deployment. Reload once so the browser receives the current asset manifest.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  const key = 'gk-stale-chunk-reload'
  const lastReload = Number(sessionStorage.getItem(key) || 0)
  if (Date.now() - lastReload > 60_000) {
    sessionStorage.setItem(key, String(Date.now()))
    window.location.reload()
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
