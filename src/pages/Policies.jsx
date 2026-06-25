import React, { useState } from 'react';
import { Shield, FileText, Scale, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export default function Policies() {
  const [activeTab, setActiveTab] = useState('terms'); // 'terms' or 'privacy'

  return (
    <div className="min-h-[100svh] bg-gk-black text-white selection:bg-gk-yellow selection:text-black pt-16 relative overflow-x-hidden">
      {/* Background Grid Floor effect */}
      <div className="absolute inset-0 gk-grid-floor opacity-40 pointer-events-none" />
      
      {/* Top soft glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(225,91,44,0.06)_0%,transparent_65%)] pointer-events-none" />

      <Navigation activeSection="" />

      {/* Main Content Area */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-24">
        
        {/* Back Link */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors uppercase font-mono tracking-wider font-bold"
          >
            <ArrowLeft size={14} />
            Back to Home
          </Link>
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-3 mb-12">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gk-orange">
            Legal & Trust
          </span>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase font-grotesk">
            Terms & Privacy
          </h1>
          <p className="text-zinc-500 text-xs md:text-sm max-w-md mx-auto font-medium leading-relaxed">
            Our guidelines, terms of service, and privacy safeguards.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/[0.02] border border-white/5 p-1 rounded-2xl flex max-w-xs w-full backdrop-blur-md">
            <button
              onClick={() => setActiveTab('terms')}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-gk-orange text-white shadow-[0_0_20px_rgba(225,91,44,0.25)]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <FileText size={14} />
              Terms of Service
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-gk-orange text-white shadow-[0_0_20px_rgba(225,91,44,0.25)]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Shield size={14} />
              Privacy Policy
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="bg-[#0b0b0d]/50 border border-white/5 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
          {activeTab === 'terms' ? (
            // Terms of Service Content
            <div className="space-y-8">
              <div>
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-white flex items-center gap-3">
                  <Scale className="text-gk-orange w-5 h-5" />
                  Terms of Service
                </h2>
              </div>

              <div className="space-y-6 text-zinc-400 text-xs md:text-sm font-medium leading-relaxed">
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
                    We ship to pin codes across India. As scale collectors, we recognize the value of card/blister condition. While we pack all shipments securely using premium bubble wrap and sturdy outer boxes, we cannot guarantee box condition upon transit delivery and are not responsible for delivery partner delays or minor card creases.
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
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-white flex items-center gap-3">
                  <Shield className="text-gk-orange w-5 h-5" />
                  Privacy Policy
                </h2>
              </div>

              <div className="space-y-6 text-zinc-400 text-xs md:text-sm font-medium leading-relaxed">
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
        <div className="mt-8 text-center bg-white/[0.01] border border-white/5 p-4 rounded-2xl flex items-center justify-center gap-3 text-xs text-zinc-500 font-medium max-w-lg mx-auto">
          <AlertCircle size={16} className="text-gk-orange shrink-0" />
          <span>Need further clarification? Check out our <Link to="/help" className="text-white hover:text-gk-orange underline font-bold">Help Center</Link>.</span>
        </div>

      </main>

      <Footer />
    </div>
  );
}
