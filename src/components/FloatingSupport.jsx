import React, { useState } from 'react';
import { MessageSquare, X, ArrowUpRight, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SiInstagram, SiWhatsapp } from 'react-icons/si';

export default function FloatingSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);

  React.useEffect(() => {
    // Initial check
    setShouldHide(document.body.style.overflow === 'hidden');

    const observer = new MutationObserver(() => {
      setShouldHide(document.body.style.overflow === 'hidden');
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style']
    });

    return () => observer.disconnect();
  }, []);

  if (shouldHide) return null;

  return (
    <div className="fixed bottom-20 right-6 z-[150] hidden font-sans text-left md:block md:bottom-6">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Click-out backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            
            {/* Support Box */}
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-16 right-0 w-56 bg-[#0c0c0e]/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-20"
            >
              <div className="border-b border-white/5 pb-2 mb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-white">Need help?</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Connect with the founders</p>
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  to="/help"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-white/[0.02] hover:bg-gk-orange/10 border border-white/5 hover:border-gk-orange/20 transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gk-orange" />
                    FAQ & Policies
                  </span>
                  <ArrowUpRight size={12} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>

                <a
                  href="https://chat.whatsapp.com/EX1NbXHU63ZCQ4qhFVCubb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-white/[0.02] hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/20 transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <SiWhatsapp size={14} className="text-[#25D366]" />
                    WhatsApp Community
                  </span>
                  <ArrowUpRight size={12} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>

                <a
                  href="https://www.instagram.com/garagekingsindia/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-white/[0.02] hover:bg-gk-orange/10 border border-white/5 hover:border-gk-orange/20 transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <SiInstagram size={14} className="text-[#E1306C]" />
                    Instagram DM
                  </span>
                  <ArrowUpRight size={12} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-full border bg-[#0a0a0c]/90 backdrop-blur-md text-white shadow-2xl transition-all duration-300 cursor-pointer select-none group relative z-20 ${
          isOpen 
            ? 'border-white/20 text-white' 
            : 'border-white/5 hover:border-gk-orange/30 hover:bg-gk-orange/[0.02]'
        }`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gk-orange opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-gk-orange"></span>
        </span>
        
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-hover:text-white transition-colors">
          Need help?
        </span>

        {isOpen ? (
          <X size={14} className="text-zinc-400 group-hover:text-white transition-colors" />
        ) : (
          <HelpCircle size={14} className="text-zinc-400 group-hover:text-white transition-colors" />
        )}
      </button>
    </div>
  );
}
