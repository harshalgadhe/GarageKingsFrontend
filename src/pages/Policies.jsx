import React, { useState } from 'react';
import { Shield, FileText, Scale, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export default function Policies() {
  const [activeTab, setActiveTab] = useState('terms'); // 'terms' or 'privacy'

  return (
    <div className="relative min-h-[100svh] overflow-x-hidden bg-[#050505] pt-16 text-[#F4F1EC] selection:bg-[#E1BD65] selection:text-black">
      {/* Background Grid Floor effect */}
      <div className="pointer-events-none absolute inset-0 opacity-20 gk-grid-floor" />
      
      {/* Top soft glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[460px] w-full max-w-6xl -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(225,189,101,0.08)_0%,transparent_65%)]" />

      <Navigation activeSection="" />

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-8 md:pb-28 md:pt-16">
        
        {/* Back Link */}
        <div className="mb-12 md:mb-16">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#77736D] transition-colors hover:text-[#F4F1EC]"
          >
            <ArrowLeft size={14} />
            Back to Home
          </Link>
        </div>

        {/* Hero Header */}
        <div className="mb-10 border-b border-white/[0.08] pb-10 text-left md:mb-12 md:pb-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D8BC78]">
            GarageKings policies
          </span>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[0.96] tracking-[-0.045em] text-[#F4F1EC] sm:text-5xl md:text-6xl">
            Clear information,<br /><span className="text-[#E1BD65]">without the fine-print theatre.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[#99958E] md:text-base">
            How enquiries, arrangements and personal information are handled when you interact with GarageKings.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="mb-10 flex md:mb-12">
          <div className="flex w-full gap-2 rounded-2xl border border-white/[0.08] bg-[#0A0A0A]/90 p-1.5 sm:w-auto">
            <button
              onClick={() => setActiveTab('terms')}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-semibold transition-all sm:flex-none ${
                activeTab === 'terms'
                  ? 'bg-[#F4F1EC] text-black shadow-[0_8px_24px_rgba(0,0,0,.3)]'
                  : 'text-[#85817A] hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <FileText size={14} />
              Terms of Service
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-semibold transition-all sm:flex-none ${
                activeTab === 'privacy'
                  ? 'bg-[#F4F1EC] text-black shadow-[0_8px_24px_rgba(0,0,0,.3)]'
                  : 'text-[#85817A] hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <Shield size={14} />
              Privacy Policy
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="relative overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#0B0B0A]/80 p-6 shadow-[0_30px_90px_rgba(0,0,0,.36)] sm:p-10 md:p-12">
          {activeTab === 'terms' ? (
            // Terms of Service Content
            <div className="space-y-8">
              <div>
                <h2 className="flex items-center gap-3 text-2xl font-semibold tracking-[-0.025em] text-[#F4F1EC] md:text-3xl">
                  <Scale className="h-5 w-5 text-[#D8BC78]" />
                  Terms of Service
                </h2>
              </div>

              <div className="text-sm leading-relaxed text-[#A6A19A] [&>section]:border-t [&>section]:border-white/[0.065] [&>section]:py-6 [&>section:first-child]:border-t-0 [&>section:first-child]:pt-1 [&_h3]:mb-2 [&_h3]:text-[11px] [&_h3]:font-bold [&_h3]:uppercase [&_h3]:tracking-[0.12em] [&_h3]:text-[#E8E4DD] [&_li]:marker:text-[#D8BC78]">
                <section className="space-y-2">
                  <h3 className="text-white font-bold uppercase tracking-wider text-xs md:text-sm">1. Acceptance of Terms</h3>
                  <p>
                    By accessing GarageKings, browsing the collection, creating an account, or contacting us through a linked channel, you agree to these terms. The website displays models and supports enquiries; it does not provide an online cart or checkout.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-white font-bold uppercase tracking-wider text-xs md:text-sm">2. Model Details & Availability</h3>
                  <p>
                    Product pages show the information available to us at the time of publication. Availability, condition, packaging, price and delivery or collection options must be confirmed directly with GarageKings. Opening a product page or sending an enquiry does not reserve a model.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-white font-bold uppercase tracking-wider text-xs md:text-sm">3. Pricing & Direct Arrangements</h3>
                  <p>
                    Prices are displayed in Indian Rupees unless stated otherwise and may be corrected if product information is inaccurate. Any purchase, pre-booking, payment, delivery or collection arrangement is discussed and confirmed directly through our official WhatsApp or Instagram channels. The website does not collect payments or payment screenshots from customers.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-white font-bold uppercase tracking-wider text-xs md:text-sm">4. Shipping & Packaging</h3>
                  <p>
                    Shipping, collection, packing method, charges and estimated timing are confirmed for each arrangement through the chosen contact channel. Packaging condition matters to collectors, so customers should request any additional card, blister, sleeve or box details before deciding.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-white font-bold uppercase tracking-wider text-xs md:text-sm">5. Cancellations, Returns & Refunds</h3>
                  <p>
                    Because transactions are agreed directly rather than completed on this website, the cancellation, return, refund and transit-damage terms applicable to a purchase will be communicated before that arrangement is finalized. Ask for those terms if they are important to your decision and retain the written conversation relating to the arrangement.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-white font-bold uppercase tracking-wider text-xs md:text-sm">6. User Accounts</h3>
                  <p>
                  Customer sign-in uses Google authentication. You are responsible for the security of your Google account and for keeping profile information accurate. Contact GarageKings if you believe your GarageKings session or profile has been used without permission.
                </p>
                </section>
              </div>
            </div>
          ) : (
            // Privacy Policy Content
            <div className="space-y-8">
              <div>
                <h2 className="flex items-center gap-3 text-2xl font-semibold tracking-[-0.025em] text-[#F4F1EC] md:text-3xl">
                  <Shield className="h-5 w-5 text-[#D8BC78]" />
                  Privacy Policy
                </h2>
              </div>

              <div className="text-sm leading-relaxed text-[#A6A19A] [&>section]:border-t [&>section]:border-white/[0.065] [&>section]:py-6 [&>section:first-child]:border-t-0 [&>section:first-child]:pt-1 [&_h3]:mb-2 [&_h3]:text-[11px] [&_h3]:font-bold [&_h3]:uppercase [&_h3]:tracking-[0.12em] [&_h3]:text-[#E8E4DD] [&_li]:marker:text-[#D8BC78]">
                <section className="space-y-2">
                  <h3 className="text-white font-bold uppercase tracking-wider text-xs md:text-sm">1. Data We Collect</h3>
                  <p>
                    Depending on how you use GarageKings, we may collect:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
                    <li>Google-authenticated account identifiers, email address and display name.</li>
                    <li>Profile details you choose to provide, such as phone number, Instagram handle and address.</li>
                    <li>Model searches, enquiry context and basic website usage information.</li>
                    <li>Security, diagnostic and performance information, including IP address, browser details and request identifiers used to investigate errors.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h3 className="text-white font-bold uppercase tracking-wider text-xs md:text-sm">2. How We Use Your Data</h3>
                  <p>
                    We use this information to:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
                    <li>Provide and secure your account and saved profile.</li>
                    <li>Respond to product, availability and support enquiries.</li>
                    <li>Improve search, product information, reliability and performance.</li>
                    <li>Detect abuse, investigate errors and protect GarageKings systems.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h3 className="text-white font-bold uppercase tracking-wider text-xs md:text-sm">3. Data Sharing & Hosting</h3>
                  <p>
                    We do not sell personal information. Data may be processed by service providers needed to operate the website, including cloud hosting, authentication, monitoring and database providers. WhatsApp, Instagram and Google process information under their own terms when you use those services.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-white font-bold uppercase tracking-wider text-xs md:text-sm">4. Cookies</h3>
                  <p>
                    We use necessary cookies to maintain secure authentication sessions. We do not use those session cookies to build cross-site advertising profiles.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-white font-bold uppercase tracking-wider text-xs md:text-sm">5. Contact Information</h3>
                  <p>
                    For privacy questions, profile corrections or account-data deletion requests, contact GarageKings through the official WhatsApp or Instagram links shown on this website.
                  </p>
                </section>
              </div>
            </div>
          )}
        </div>

        {/* Customer Support Notice */}
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.018] p-4 text-xs text-[#85817A]">
          <AlertCircle size={16} className="shrink-0 text-[#D8BC78]" />
          <span>Need clarification? Visit the <Link to="/help" className="font-semibold text-[#F4F1EC] underline decoration-[#D8BC78]/50 underline-offset-4 hover:text-[#E1BD65]">Help Center</Link>.</span>
        </div>

      </main>

      <Footer />
    </div>
  );
}
