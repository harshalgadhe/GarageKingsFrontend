import Navigation from '../components/Navigation'
import VaultScrollJourney from '../components/VaultScrollJourney'
import TechnicalArchive from '../components/lookbook/TechnicalArchive'
import LookbookGallery from '../components/lookbook/LookbookGallery'
import CollectorStandardTrust from '../components/common/CollectorStandardTrust'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#F4F1EC]">
      <Navigation activeSection="hero" />
      <main>
        <VaultScrollJourney />
        <TechnicalArchive />
        <LookbookGallery />
        <CollectorStandardTrust />
      </main>
      <Footer />
    </div>
  )
}
