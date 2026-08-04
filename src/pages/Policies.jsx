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
                    By accessing and purchasing from GarageKings, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use the website.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-white font-bold uppercase tracking-wider text-xs md:text-sm">2. Order Placement & Availability</h3>
                  <p>
                    Adding items to your cart does not reserve the models. Orders are processed on a first-come, first-served basis. You must complete checkout, process the payment, and upload the payment receipt promptly. Stock is only secured and deducted once your payment screenshot is approved by the administrators.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-white font-bold uppercase tracking-wider text-xs md:text-sm">3. Pricing & Payments</h3>
                  <p>
                    All prices are in Indian Rupees (INR) unless specified otherwise. We accept payments exclusively via UPI. We reserve the right to correct pricing errors, cancel orders, or refuse service. Orders are only verified and scheduled for dispatch once the payment screenshot is approved by the system administrators.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-white font-bold uppercase tracking-wider text-xs md:text-sm">4. Shipping & Packaging</h3>
                  <p>
                    Delivery or collection availability, packing method, charges and timing are confirmed directly with the Collector Desk before an arrangement is finalized. Please ask about card, blister or box condition if packaging condition is important to you.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-white font-bold uppercase tracking-wider text-xs md:text-sm">5. Cancellations, Returns & Refunds</h3>
                  <p>
                    Due to the highly collectible and limited nature of our scale models, all sales are final once payment is verified and packaging has commenced. Cancellations are only permitted prior to payment verification. Refer to our Help Center for reporting goods damaged in transit (requires an uninterrupted unboxing video).
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-white font-bold uppercase tracking-wider text-xs md:text-sm">6. User Accounts</h3>
                  <p>
                  You are responsible for maintaining the confidentiality of your account credentials. Any actions taken under your account are your sole responsibility.
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
                    We collect essential information to verify and ship your orders:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
                    <li>Account credentials and profiles (email, full name, username).</li>
                    <li>Shipping and billing addresses.</li>
                    <li>UPI transaction screenshots uploaded during payment verification.</li>
                    <li>Order history and logs of your active vault queue.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h3 className="text-white font-bold uppercase tracking-wider text-xs md:text-sm">2. How We Use Your Data</h3>
                  <p>
                    Your data is used strictly for processing operations:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
                    <li>Verifying UPI payments against screenshots.</li>
                    <li>Addressing order fulfillments and tracking coordinate shipments.</li>
                    <li>Handling support requests via Instagram and WhatsApp.</li>
                    <li>Securing and maintaining your active account sessions.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h3 className="text-white font-bold uppercase tracking-wider text-xs md:text-sm">3. Data Sharing & Hosting</h3>
                  <p>
                    We value your privacy. We do not sell or lease your database files to any advertising networks. Your data is stored securely using industry-standard encrypted cloud servers and databases.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-white font-bold uppercase tracking-wider text-xs md:text-sm">4. Cookies</h3>
                  <p>
                    We use cookies to maintain user authentication sessions. These cookies do not track cross-site behaviors or build external marketing profiles.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-white font-bold uppercase tracking-wider text-xs md:text-sm">5. Contact Information</h3>
                  <p>
                    If you have questions regarding your data privacy or wish to request data erasure, connect with the administrative team via our official Instagram handle or support community.
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
