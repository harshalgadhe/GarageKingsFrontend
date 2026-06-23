import { useMemo, useRef, useEffect } from 'react'
import { useActiveSection } from '../hooks/useScrollJourney'
import Navigation from '../components/Navigation'
import AmbientScene from '../components/AmbientScene'
import Footer from '../components/Footer'
import FloatingSupport from '../components/FloatingSupport'

import LookbookCover from '../components/lookbook/LookbookCover'
import LookbookGallery from '../components/lookbook/LookbookGallery'
import TechnicalArchive from '../components/lookbook/TechnicalArchive'
import ReleaseBoard from '../components/lookbook/ReleaseBoard'
import { scrollToSection, useLenis } from '../providers/SmoothScroll'

export default function Home() {
  const lenisRef = useLenis()
  
  // Section refs for active scroll journey tracking in order
  const coverRef = useRef(null)
  const archiveRef = useRef(null)
  const galleryRef = useRef(null)
  const releasesRef = useRef(null)

  // Listen to incoming hashes from other subpages and scroll smoothly
  useEffect(() => {
    if (window.location.hash) {
      const targetId = window.location.hash.substring(1)
      setTimeout(() => {
        scrollToSection(lenisRef, targetId)
      }, 600)
    }
  }, [lenisRef])

  // Storyteller refs array in chronological layout order
  const lookbookRefs = useMemo(
    () => [coverRef, archiveRef, galleryRef, releasesRef],
    [],
  )

  const activeSectionIndex = useActiveSection(lookbookRefs)
  
  // Resolve navigation item highlights based on layout order
  const activeSection = useMemo(() => {
    const map = ['hero', 'archive', 'gallery', 'releases']
    return map[activeSectionIndex] || 'hero'
  }, [activeSectionIndex])

  return (
    <div className="relative bg-gk-black text-white">
      {/* Background ambient lighting */}
      <AmbientScene />
      
      <Navigation activeSection={activeSection} />

      {/* Magazine Spreads in correct order */}
      <main className="relative z-10 w-full">
        <LookbookCover ref={coverRef} />
        <TechnicalArchive ref={archiveRef} />
        <LookbookGallery ref={galleryRef} />
        <ReleaseBoard ref={releasesRef} />
      </main>

      <Footer />
      <FloatingSupport />
    </div>
  )
}
