import { useMemo, useRef, useEffect } from 'react'
import { useActiveSection } from '../hooks/useScrollJourney'
import Navigation from '../components/Navigation'
import AmbientScene from '../components/AmbientScene'

import LookbookCover from '../components/lookbook/LookbookCover'
import LookbookGallery from '../components/lookbook/LookbookGallery'
import TechnicalArchive from '../components/lookbook/TechnicalArchive'
import ReleaseBoard from '../components/lookbook/ReleaseBoard'
import { scrollToSection, useLenis } from '../providers/SmoothScroll'

export default function Home() {
  const lenisRef = useLenis()
  
  // Section refs for active scroll journey tracking
  const coverRef = useRef(null)
  const galleryRef = useRef(null)
  const archiveRef = useRef(null)
  const releasesRef = useRef(null)

  // Listen to incoming hashes from other subpages (like marketplace) and scroll smoothly
  useEffect(() => {
    if (window.location.hash) {
      const targetId = window.location.hash.substring(1)
      setTimeout(() => {
        scrollToSection(lenisRef, targetId)
      }, 600)
    }
  }, [lenisRef])

  // Storyteller refs array for intersection scroll hooks
  const lookbookRefs = useMemo(
    () => [coverRef, galleryRef, archiveRef, releasesRef],
    [],
  )

  const activeSectionIndex = useActiveSection(lookbookRefs)
  
  // Resolve navigation item highlights
  const activeSection = useMemo(() => {
    const map = ['hero', 'gallery', 'archive', 'releases']
    return map[activeSectionIndex] || 'hero'
  }, [activeSectionIndex])

  return (
    <div className="relative bg-[#09090b] text-white">
      {/* Background ambient lighting */}
      <AmbientScene />
      
      <Navigation activeSection={activeSection} />

      {/* Magazine Spreads */}
      <main className="relative z-10 w-full">
        <LookbookCover ref={coverRef} />
        <LookbookGallery ref={galleryRef} />
        <TechnicalArchive ref={archiveRef} />
        <ReleaseBoard ref={releasesRef} />
      </main>
    </div>
  )
}
