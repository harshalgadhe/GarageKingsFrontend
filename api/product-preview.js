const SITE_ORIGIN = 'https://www.garagekingsindia.com';
const API_ORIGIN = process.env.GARAGEKINGS_API_ORIGIN || 'https://d2ibhhn5bex55q.cloudfront.net';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function absoluteUrl(value) {
  if (!value) return `${SITE_ORIGIN}/brand-logo.png`;
  try {
    const parsed = new URL(value, SITE_ORIGIN);
    if (['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) {
      return new URL(`${parsed.pathname}${parsed.search}`, SITE_ORIGIN).toString();
    }
    return parsed.toString();
  } catch {
    return `${SITE_ORIGIN}/brand-logo.png`;
  }
}

function firstImage(product) {
  const candidates = [product?.image, ...(Array.isArray(product?.images) ? product.images : [])];
  for (const candidate of candidates) {
    const value = typeof candidate === 'string'
      ? candidate
      : candidate?.fullUrl || candidate?.full_url || candidate?.mediumUrl || candidate?.medium_url
        || candidate?.thumbnailUrl || candidate?.thumbnail_url || candidate?.url || candidate?.src;
    if (value) return absoluteUrl(value);
  }
  return `${SITE_ORIGIN}/brand-logo.png`;
}

function pageHtml(product, id) {
  const canonicalUrl = `${SITE_ORIGIN}/product/${encodeURIComponent(id)}`;
  const productName = product?.name || 'Collectible model';
  const brandName = product?.brand?.trim() || '';
  const displayName = brandName && !productName.toLowerCase().startsWith(brandName.toLowerCase())
    ? `${brandName} ${productName}`
    : productName;
  const title = `${displayName} | Garage Kings`;
  const modelId = product?.sku ? ` Model ID: ${product.sku}.` : '';
  const description = (product?.description?.trim()
    || `View ${displayName} in the Garage Kings collection.${modelId}`
  ).slice(0, 220);
  const image = firstImage(product);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
    <meta property="og:type" content="product">
    <meta property="og:site_name" content="Garage Kings">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    <meta property="og:image" content="${escapeHtml(image)}">
    <meta property="og:image:secure_url" content="${escapeHtml(image)}">
    <meta property="og:image:alt" content="${escapeHtml(displayName)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(image)}">
  </head>
  <body style="margin:0;background:#090909;color:#f5f5f5;font-family:Arial,sans-serif">
    <main style="max-width:720px;margin:64px auto;padding:24px">
      <h1>${escapeHtml(displayName)}</h1>
      <p>${escapeHtml(description)}</p>
      <a href="${escapeHtml(canonicalUrl)}" style="color:#e1bd65">View on Garage Kings</a>
    </main>
  </body>
</html>`;
}

export default {
  async fetch(request) {
    const requestUrl = new URL(request.url);
    const id = String(requestUrl.searchParams.get('id') || '').trim();
    if (!id) return new Response('Product ID is required.', { status: 400 });

    let product = null;
    try {
      const response = await fetch(`${API_ORIGIN}/api/v1/products/${encodeURIComponent(id)}`, {
        headers: { accept: 'application/json' },
      });
      if (response.ok) product = await response.json();
    } catch {
      // A branded preview remains available if the catalogue API is temporarily unavailable.
    }

    return new Response(pageHtml(product, id), {
      status: product ? 200 : 404,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, s-maxage=300, stale-while-revalidate=86400',
        'x-robots-tag': product ? 'index, follow' : 'noindex',
      },
    });
  },
};
