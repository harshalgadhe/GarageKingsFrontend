import { useMemo, useRef, useEffect } from 'react'
import { useActiveSection } from '../hooks/useScrollJourney'
import Navigation from '../components/Navigation'
import AmbientScene from '../components/AmbientScene'
import Footer from '../components/Footer'
import FloatingSupport from '../components/FloatingSupport'
import LiveSignalRail from '../components/common/LiveSignalRail'
import CollectorStandardTrust from '../components/common/CollectorStandardTrust'

import LookbookCover from '../components/lookbook/LookbookCover'
import LookbookGallery from '../components/lookbook/LookbookGallery'
import TechnicalArchive from '../components/lookbook/TechnicalArchive'
import { scrollToSection, useLenis } from '../providers/SmoothScroll'

export default function Home() {
  const lenisRef = useLenis()
  
  const coverRef = useRef(null)
  const archiveRef = useRef(null)
  const galleryRef = useRef(null)

  useEffect(() => {
    if (window.location.hash) {
      const targetId = window.location.hash.substring(1)
      setTimeout(() => {
        scrollToSection(lenisRef, targetId)
      }, 600)
    }
  }, [lenisRef])

  const lookbookRefs = useMemo(
    () => [coverRef, archiveRef, galleryRef],
    [],
  )

  const activeSectionIndex = useActiveSection(lookbookRefs)
  
  const activeSection = useMemo(() => {
    const map = ['hero', 'archive', 'gallery']
    return map[activeSectionIndex] || 'hero'
  }, [activeSectionIndex])

  return (
    <div className="relative bg-[#050505] text-[#F4F1EC] pt-16">
      <AmbientScene />
      <Navigation activeSection={activeSection} />

      <main className="relative z-10 w-full">
        {/* Vault Entrance Hero */}
        <LookbookCover ref={coverRef} />

        {/* Live Operational Ticker Bar */}
        <LiveSignalRail totalEntries={215} latestBrand="Mini GT Kaido House" />

        {/* Technical Archive & Brand Wall */}
        <TechnicalArchive ref={archiveRef} />

        {/* Curated Gallery / Latest Arrivals */}
        <LookbookGallery ref={galleryRef} />

        {/* Collector Guarantee & Trust Section */}
        <CollectorStandardTrust />
      </main>

      <Footer />
      <FloatingSupport />
    </div>
  )
}
