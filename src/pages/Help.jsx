import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowUpRight, Check, ShoppingBag, CreditCard, RefreshCw, AlertCircle, FileText, Compass } from 'lucide-react';
import { SiInstagram, SiWhatsapp } from 'react-icons/si';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

function FAQAccordionItem({ question, answer, children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 py-4 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left font-black text-sm md:text-base text-white hover:text-gk-orange transition-colors duration-200 cursor-pointer select-none"
      >
        <span>{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="shrink-0 ml-4"
        >
          <ChevronDown size={18} className="text-zinc-500" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-3 pb-2 text-xs md:text-sm text-zinc-400 leading-relaxed font-medium">
              {answer}
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Help() {
  const orderSteps = [
    "Browse the marketplace",
    "Reserve your model",
    "Complete UPI payment",
    "Upload payment screenshot",
    "Wait for verification",
    "Order confirmed"
  ];

  return (
    <div className="min-h-[100svh] bg-gk-black text-white selection:bg-gk-yellow selection:text-black pt-16 relative overflow-x-hidden">
      {/* Background Grid Floor effect */}
      <div className="absolute inset-0 gk-grid-floor opacity-40 pointer-events-none" />
      
      {/* Top soft glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(225,91,44,0.06)_0%,transparent_65%)] pointer-events-none" />

      <Navigation activeSection="" />

      {/* Main Content Area */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-24 space-y-16">
        
        {/* Section 1: Hero */}
        <div className="text-center space-y-3">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gk-orange">
            Support Center
          </span>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase font-grotesk">
            Help Center
          </h1>
          <p className="text-zinc-500 text-xs md:text-sm max-w-md mx-auto font-medium leading-relaxed">
            Everything you need to know before placing an order.
          </p>
        </div>

        {/* Section 2: Before You DM Us Checklist */}
        <div className="bg-[#0e0e11]/90 backdrop-blur-sm border border-white/5 rounded-2xl p-6 sm:p-8 max-w-xl mx-auto shadow-2xl relative overflow-hidden group hover:border-gk-orange/20 transition-all duration-300">
          <div className="absolute top-0 left-0 w-[2px] h-full bg-gk-orange" />
          
          <h3 className="text-base font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <AlertCircle size={16} className="text-gk-orange" />
            Before You DM Us
          </h3>
          
          <ul className="space-y-3">
            {[
              "Check the Help Center FAQs below",
              "Keep your Instagram username ready",
              "Keep your order ID ready",
              "Keep your payment screenshot ready"
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-xs md:text-sm text-zinc-400 font-medium leading-relaxed">
                <span className="w-4 h-4 rounded-full bg-gk-orange/10 border border-gk-orange/20 flex items-center justify-center text-gk-orange shrink-0 mt-0.5">
                  <Check size={10} strokeWidth={3} />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Section 3: FAQ Accordions */}
        <div className="space-y-6">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-lg md:text-xl font-black uppercase tracking-wider text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="bg-[#0b0b0d]/50 border border-white/5 rounded-2xl p-4 sm:p-6 divide-y divide-white/5 shadow-xl">
            
            <FAQAccordionItem question="How do I place an order?" answer="">
              <div className="flex flex-col gap-2.5 mt-4 max-w-xs mx-auto bg-white/[0.01] border border-white/5 rounded-2xl p-5 text-center">
                {orderSteps.map((step, idx, arr) => (
                  <div key={step}>
                    <div className="text-[10px] font-black text-white uppercase tracking-wider bg-white/5 border border-white/5 py-2.5 px-4 rounded-xl">
                      {step}
                    </div>
                    {idx < arr.length - 1 && (
                      <div className="text-gk-orange font-bold text-base my-0.5">↓</div>
                    )}
                  </div>
                ))}
              </div>
            </FAQAccordionItem>

            <FAQAccordionItem question="Do you offer Cash on Delivery (COD)?" answer="No. GarageKings currently does not support Cash on Delivery. All orders must be settled via online UPI payment prior to dispatch." />

            <FAQAccordionItem question="Where do you ship?" answer="We currently ship across India. All packages are securely packed to prevent any in-transit damage to the collectibles." />

            <FAQAccordionItem question="How long does delivery take?" answer="Usually 3-7 business days after payment verification has been completed. Tracking coordinates will be shared with you once dispatched." />

            <FAQAccordionItem question="Are these products authentic?" answer="Yes. All products sold on GarageKings are authentic collectibles sourced from trusted distributors and sellers. We inspect every model before shipping." />

            <FAQAccordionItem question="Can I cancel my order?" answer="Orders may only be cancelled before payment verification. Once payment has been verified and processed for dispatch, cancellations cannot be accommodated." />

            <FAQAccordionItem question="Can I return my order?" answer="Returns are generally not accepted once an order has been confirmed and packaged. Please ensure you are certain of the casting before placing your reservation." />

            <FAQAccordionItem question="Can I get a refund?" answer="Refunds are generally not available after payment verification except under exceptional circumstances determined solely by GarageKings." />

            <FAQAccordionItem question="What if my product arrives damaged?" answer="Contact us immediately via Instagram and provide an uninterrupted unboxing video, supporting photos, and your order ID. We will inspect and resolve it on a priority basis." />

          </div>
        </div>

        {/* Section 4: Policies Section */}
        <div className="space-y-6">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-lg md:text-xl font-black uppercase tracking-wider text-white">
              Store Policies
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Ordering Card */}
            <div className="bg-[#0c0c0f] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors shadow-lg">
              <h3 className="text-xs font-black uppercase tracking-wider text-gk-orange flex items-center gap-2 mb-2.5">
                <ShoppingBag size={14} />
                Ordering
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                Orders are confirmed only after payment verification. Models must be reserved through our marketplace system before completing checkout.
              </p>
            </div>

            {/* Payments Card */}
            <div className="bg-[#0c0c0f] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors shadow-lg">
              <h3 className="text-xs font-black uppercase tracking-wider text-gk-orange flex items-center gap-2 mb-2.5">
                <CreditCard size={14} />
                Payments
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                Cash on Delivery (COD) is unavailable. We accept UPI payments. Payment verification requires a valid screenshot upload showing transaction ID and amount.
              </p>
            </div>

            {/* Returns Card */}
            <div className="bg-[#0c0c0f] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors shadow-lg">
              <h3 className="text-xs font-black uppercase tracking-wider text-gk-orange flex items-center gap-2 mb-2.5">
                <RefreshCw size={14} />
                Returns
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                Returns are not accepted once orders are confirmed and prepared for dispatch, given the collector-grade nature of our inventory.
              </p>
            </div>

            {/* Refunds Card */}
            <div className="bg-[#0c0c0f] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors shadow-lg">
              <h3 className="text-xs font-black uppercase tracking-wider text-gk-orange flex items-center gap-2 mb-2.5">
                <AlertCircle size={14} />
                Refunds
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                Refunds are not available except under exceptional circumstances (e.g. stock out of service) determined by team administration.
              </p>
            </div>

            {/* Reservations Card */}
            <div className="bg-[#0c0c0f] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors shadow-lg">
              <h3 className="text-xs font-black uppercase tracking-wider text-gk-orange flex items-center gap-2 mb-2.5">
                <FileText size={14} />
                Order Placement
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                Orders are processed on a first-come, first-served basis. Payment and screenshot upload must occur promptly. Stock is only secured once payment is verified.
              </p>
            </div>

            {/* Damaged Products Card */}
            <div className="bg-[#0c0c0f] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors shadow-lg col-span-1 md:col-span-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-gk-orange flex items-center gap-2 mb-2.5">
                <Compass size={14} />
                Damaged Products
              </h3>
              <div className="text-xs text-zinc-400 leading-relaxed font-medium space-y-2">
                <p>To report a damaged item, please provide the following details within 24 hours of package delivery:</p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                  <li>An uninterrupted unboxing video (capturing shipping label details and unpacking process)</li>
                  <li>Supporting high-resolution images of the package box and damaged item</li>
                  <li>Your system-generated Order ID</li>
                </ul>
              </div>
            </div>

          </div>

          {/* Section 5: Last Updated */}
          <div className="text-right pt-2">
            <span className="text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-wider">
              Policies last updated: June 2026
            </span>
          </div>
        </div>

        {/* Section 6: Need More Help Section */}
        <div className="text-center space-y-6 pt-8 border-t border-white/5">
          <div>
            <h2 className="text-lg md:text-xl font-black uppercase tracking-wider text-white">
              Still Need Help?
            </h2>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              Reach out directly, we are online.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/account"
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
            >
              Track My Order
              <ArrowUpRight size={13} className="text-zinc-500" />
            </a>

            <a
              href="https://www.instagram.com/garagekingsindia/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gk-orange hover:bg-gk-orange/90 text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-gk-orange/10"
            >
              <SiInstagram size={16} />
              Instagram DM
            </a>

            <a
              href="https://chat.whatsapp.com/EX1NbXHU63ZCQ4qhFVCubb"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-emerald-600/10"
            >
              <SiWhatsapp size={17} />
              WhatsApp Community
            </a>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
