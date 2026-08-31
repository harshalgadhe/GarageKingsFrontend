const MOTIFS = {
  archive: (accent) => `radial-gradient(circle at 78% 24%, ${accent}22, transparent 34%), linear-gradient(135deg, transparent 48%, rgba(255,255,255,.035) 48% 49%, transparent 49%)`,
  velocity: (accent) => `radial-gradient(circle at 82% 25%, ${accent}28, transparent 30%), linear-gradient(118deg, transparent 54%, rgba(255,255,255,.10) 54% 63%, transparent 63%)`,
  precision: (accent) => `linear-gradient(135deg, transparent 0 46%, ${accent}24 46% 50%, transparent 50% 100%)`,
  race: (accent) => `linear-gradient(135deg, rgba(255,255,255,.08) 0 1px, transparent 1px 18px), radial-gradient(circle at 82% 18%, ${accent}30, transparent 38%)`,
  grid: (accent) => `linear-gradient(90deg, ${accent}16 1px, transparent 1px), linear-gradient(${accent}16 1px, transparent 1px)`,
  neon: (accent) => `radial-gradient(circle at 80% 20%, ${accent}36, transparent 30%)`,
}

const COLOR_PATTERN = /^#[0-9a-f]{6}$/i
const safeColor = (value, fallback) => COLOR_PATTERN.test(String(value || '')) ? value : fallback
const plainBrandCopy = (value) => String(value || '')
  .replace(/\bmarques?\b/gi, 'brands')
  .replace(/\bcurated\b/gi, 'selected')
  .replace(/\bcatalogued\b/gi, 'listed')
  .replace(/\bcollector-led\b/gi, 'chosen by collectors')
  .replace(/\bprovenance\b/gi, 'history')
  .replace(/\barchive\b/gi, 'collection')
  .replace(/\bselected with intent\b/gi, 'models available through GarageKings')

export function buildBrandTheme(brand) {
  if (!brand) return null
  const value = (camelKey, snakeKey) => brand[camelKey] ?? brand[snakeKey]
  const accent = safeColor(value('accentColor', 'accent_color'), '#C8AE7D')
  const secondary = safeColor(value('secondaryColor', 'secondary_color'), '#F4F1EC')
  const background = safeColor(value('backgroundColor', 'background_color'), '#080706')
  const themeVariant = value('themeVariant', 'theme_variant')
  const mode = MOTIFS[themeVariant] ? themeVariant : 'archive'

  return {
    name: brand.name,
    slug: brand.slug,
    logo: value('logoUrl', 'logo_url') || null,
    coverImage: value('coverImageUrl', 'cover_image_url') || null,
    logoClass: value('logoTreatment', 'logo_treatment') === 'invert' ? 'invert' : '',
    origin: value('originLabel', 'origin_label') || 'GarageKings collection',
    style: plainBrandCopy(value('styleLabel', 'style_label')) || 'Scale models',
    kicker: plainBrandCopy(brand.kicker) || 'Featured brand',
    headline: plainBrandCopy(brand.headline) || `${brand.name} at GarageKings.`,
    description: plainBrandCopy(brand.description) || `Browse ${brand.name} models available through GarageKings, with current photos and product details.`,
    mode,
    accent,
    secondary,
    background,
    motif: MOTIFS[mode](accent),
    productCount: Number(value('productCount', 'product_count') || 0),
    website: brand.website || null,
  }
}
