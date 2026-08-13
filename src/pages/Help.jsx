import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Check, ChevronDown, CircleHelp, Compass, MessageCircle, PackageSearch, ShieldCheck } from 'lucide-react'
import { SiInstagram, SiWhatsapp } from 'react-icons/si'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import { CONTACT, WHATSAPP_URL } from '../data/content'

function FAQItem({ question, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/[0.07] last:border-0">
      <button onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-5 py-5 text-left text-sm font-semibold text-[#F4F1EC] transition hover:text-[#E1BD65] md:text-base" aria-expanded={open}>
        {question}<motion.span animate={{ rotate: open ? 180 : 0 }}><ChevronDown size={17} className="text-[#77736D]" /></motion.span>
      </button>
      <AnimatePresence initial={false}>{open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="max-w-2xl pb-5 text-sm leading-6 text-[#99958E]">{children}</div></motion.div>}</AnimatePresence>
    </div>
  )
}

const enquirySteps = [
  'Browse the Garage or search by model, brand or reference number',
  'Open the model page and review its available details',
  'Use WhatsApp or Instagram to ask about the model',
  'Confirm availability, condition, price and arrangements directly',
]

export default function Help() {
  return (
    <div className="relative min-h-[100svh] overflow-x-hidden bg-[#050505] pt-16 text-[#F4F1EC]">
      <Navigation activeSection="" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_at_top,rgba(225,189,101,.08),transparent_62%)]" />
      <main className="relative mx-auto max-w-5xl space-y-16 px-5 py-14 sm:px-8 md:py-24">
        <header className="max-w-3xl">
          <div className="text-[10px] font-bold uppercase tracking-[.24em] text-[#D8BC78]">GarageKings support</div>
          <h1 className="mt-4 text-5xl font-semibold leading-[.94] tracking-[-.05em] sm:text-7xl">Find the model.<br /><span className="text-[#E1BD65]">Ask a collector.</span></h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-[#99958E] md:text-base">GarageKings is a searchable collector catalogue. There is no website cart or checkout; enquiries and any later arrangements are handled directly through our official WhatsApp or Instagram channels.</p>
        </header>

        <section className="grid gap-6 rounded-[28px] border border-white/[0.09] bg-[#0B0B0A]/80 p-6 md:grid-cols-2 md:p-9">
          <div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#D8BC78]"><Compass size={15} /> How enquiries work</div><h2 className="mt-3 text-2xl font-semibold tracking-[-.03em]">From catalogue to conversation</h2></div>
          <ol className="space-y-3">{enquirySteps.map((step, index) => <li key={step} className="flex gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 text-sm text-[#B7B2AA]"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#D8BC78]/10 font-mono text-[10px] text-[#D8BC78]">{index + 1}</span>{step}</li>)}</ol>
        </section>

        <section>
          <div className="mb-6"><div className="text-[10px] font-bold uppercase tracking-[.2em] text-[#D8BC78]">Common questions</div><h2 className="mt-2 text-3xl font-semibold tracking-[-.035em]">Before you enquire</h2></div>
          <div className="rounded-[24px] border border-white/[0.09] bg-[#0A0A0A]/80 px-5 sm:px-7">
            <FAQItem question="Can I buy or reserve a model on the website?">No. The website does not currently provide a cart, checkout or online reservation. Contact us from the product page to confirm whether a model is still available and discuss the next steps.</FAQItem>
            <FAQItem question="What should I include in my enquiry?">The product enquiry link prepares the model name, reference and product-page link. You can also mention the packaging or condition details you want us to confirm.</FAQItem>
            <FAQItem question="Can I enquire about a sold-out model?">Yes. Sold-out product pages include an enquiry option so you can ask about a restock, another edition or a similar model.</FAQItem>
            <FAQItem question="Are prices and availability final?">Catalogue information reflects the latest data available to us, but price, availability, condition and packaging should always be confirmed directly before making a decision.</FAQItem>
            <FAQItem question="How are payments, delivery and collection handled?">They are not processed through this website. If an enquiry progresses, the applicable payment, delivery or collection details and terms will be agreed directly through the official contact channel.</FAQItem>
            <FAQItem question="Do I need an account to browse or enquire?">No. Browsing, search and product enquiries are public. Google sign-in is available for profile features but is not required to explore the catalogue.</FAQItem>
            <FAQItem question="What if product photographs or details are missing?">Ask us for additional photographs, packaging information or condition details before deciding. “Photography pending” means the catalogue entry exists while its images are still being prepared.</FAQItem>
            <FAQItem question="How do I request a correction or deletion of my profile data?">Contact GarageKings through the official WhatsApp or Instagram links and identify the Google email associated with your profile. Never send passwords, sign-in codes or private account details.</FAQItem>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            [PackageSearch, 'Start with the collection', 'Search by model, brand or reference number and review the available product information.'],
            [MessageCircle, 'Direct confirmation', 'Availability and arrangements are confirmed by a person through official channels.'],
            [ShieldCheck, 'No website payment', 'GarageKings does not request payment or receipt uploads through the public website.'],
          ].map(([Icon, title, copy]) => <div key={title} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5"><Icon size={18} className="text-[#D8BC78]" /><h3 className="mt-4 text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-[#85817A]">{copy}</p></div>)}
        </section>

        <section className="border-t border-white/[0.08] pt-12 text-center">
          <CircleHelp size={22} className="mx-auto text-[#D8BC78]" /><h2 className="mt-4 text-2xl font-semibold">Still need help?</h2><p className="mt-2 text-sm text-[#85817A]">Send the model link or describe what you are looking for.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <a href={`${WHATSAPP_URL}?text=${encodeURIComponent('Hi GarageKings, I would like help finding a collectible.')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-xs font-bold text-white"><SiWhatsapp size={17} /> WhatsApp <ArrowUpRight size={13} /></a>
            <a href={CONTACT.instagramUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.035] px-6 py-3 text-xs font-bold text-white"><SiInstagram size={16} className="text-[#E1306C]" /> Instagram <ArrowUpRight size={13} /></a>
          </div>
        </section>
        <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[.14em] text-[#5F5C57]"><Check size={12} /> Content reviewed for the current catalogue and enquiry experience · August 2026</div>
      </main>
      <Footer />
    </div>
  )
}
