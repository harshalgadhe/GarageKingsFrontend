export const BRAND = {
  name: 'Garage Kings',
  tagline: "Scale diecast models for collectors",
  pillars: 'Authenticated. Graded (by Condition). Delivered.',
}

export const CONTACT = {
  whatsappNumber: '919251240424',
  instagramUrl: 'https://www.instagram.com/garagekingsindia/',
  communityUrl: 'https://chat.whatsapp.com/EX1NbXHU63ZCQ4qhFVCubb',
}

export const WHATSAPP_URL = `https://wa.me/${CONTACT.whatsappNumber}`

export function createProductEnquiryUrl(
  product,
  archiveId,
  pageUrl = `${window.location.origin}/product/${product?.id || ''}`
) {
  const name = [product?.brand, product?.name].filter(Boolean).join(' ')
  const price = Number(product?.price ?? product?.sellingPrice)
  const deposit = Number(product?.poAmount ?? product?.prebookDepositAmount)
  const isUnavailable = Boolean(product?.isSoldOut || product?.availability === 'Unavailable')
  const isPreBooking = Boolean(product?.isPrebook || product?.status === 'Pre-Order')
  const availability = isUnavailable ? 'Unavailable / sourcing enquiry' : isPreBooking ? 'Pre-booking' : 'Available'
  const packaging = product?.casingType || product?.casing || product?.packaging
  const productUrl = pageUrl.split('#')[0]

  const lines = [
    'Hello GarageKings,',
    '',
    'I would like to enquire about this model:',
    `*${name || 'GarageKings collectible'}*`,
    '',
    archiveId ? `Reference: ${archiveId}` : null,
    product?.sku ? `SKU: ${product.sku}` : null,
    product?.scale ? `Scale: ${product.scale}` : null,
    packaging ? `Packaging: ${packaging}` : null,
    `Availability: ${availability}`,
    Number.isFinite(price) && price > 0 ? `Displayed price: ₹${price.toLocaleString('en-IN')}` : null,
    isPreBooking && Number.isFinite(deposit) && deposit > 0 ? `Displayed deposit: ₹${deposit.toLocaleString('en-IN')}` : null,
    '',
    `Product page: ${productUrl}`,
    '',
    isUnavailable
      ? 'Please let me know if this model can be restocked or sourced, along with the expected price and timeline.'
      : 'Please confirm its current availability, condition, final price and delivery or collection options.'
  ].filter((line) => line !== null)

  const message = lines.join('\n')

  return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`
}


/** Real product shots */
export const vaultProducts = [
  {
    id: 'sth-2024',
    name: 'Nissan Skyline GT-R',
    lane: 'The Grail Room',
    grade: 'MIB · Short Card',
    price: '₹4,999',
    image: '/vault-1.png',
  },
  {
    id: 'gtr-liberty-content',
    name: 'Nissan GT-R Liberty Walk',
    lane: 'The Grail Room',
    grade: 'Blister Mint',
    price: '₹1,500',
    image: '/vault-2.png',
  },
  {
    id: 'exotic-supercar',
    name: 'Silver Supercar',
    lane: 'Premium Rack',
    grade: 'MIB · Long Card',
    price: '₹1,899',
    image: '/vault-3.png',
  },
  {
    id: 'gt3-porsche',
    name: 'Porsche 934 Turbo RSR',
    lane: 'JDM & Euro',
    grade: 'Sealed · Mint',
    price: '₹2,499',
    image: '/vault-4.png',
  },
  {
    id: 'bronco-offroad',
    name: "'83 Chevy Silverado",
    lane: 'Mud & Muscle',
    grade: 'Pristine Card',
    price: '₹1,299',
    image: '/vault-5.png',
  },
  {
    id: 'camaro-1969',
    name: "'69 Ford Mustang Boss 302",
    lane: 'Nostalgia Lane',
    grade: 'Vintage Grade 9',
    price: '₹5,500',
    image: '/vault-6.png',
  },
  {
    id: 'mclaren-p1',
    name: 'Lamborghini Countach Pace Car',
    lane: 'The Premium Rack',
    grade: 'Factory Sealed',
    price: '₹3,200',
    image: '/vault-7.png',
  },
  {
    id: 's15-drift',
    name: 'Nissan Skyline H/T 2000GT-X',
    lane: 'JDM Legends',
    grade: 'Chase Edition',
    price: '₹8,999',
    image: '/vault-8.png',
  },
]

export const standardPoints = [
  {
    title: 'Source Verification',
    body: 'Every piece is sourced from trusted global and local networks.',
  },
  {
    title: 'Condition Check',
    body: 'We inspect every card for soft corners, vein marks, or bubble cracks. You get exactly what you see.',
  },
  {
    title: 'Tamper Check',
    body: 'We ensure factory seals are intact so you never receive a "re-sealed" fake.',
  },
  {
    title: 'Double-Box Shipping',
    body: 'Indian couriers are rough. We ship every car in a protector or double-layered corrugated box to ensure it reaches you in "Mint" state.',
  },
]

export const pitStopLanes = [
  {
    id: 'jdm',
    title: 'JDM Legends',
    body: 'From R34s to Supras, these are the icons of Japanese car culture.',
  },
  {
    id: 'nostalgia',
    title: 'Nostalgia Lane',
    body: 'The classic Mainlines that defined your childhood.',
  },
  {
    id: 'premium',
    title: 'The Premium Rack',
    body: 'Metal/Metal bases and Real Riders for the serious shelf.',
  },
  {
    id: 'grail',
    title: 'The Grail Room',
    body: 'Rare RLC (Red Line Club) and Super Treasure Hunts (STH).',
  },
]

export const footerCopy = {
  transparency: 'Price Transparent. No "DM for Price" games here.',
  returns:
    "Damaged in transit? Send us an unboxing video, and we'll replace it or refund it. No questions asked.",
}
