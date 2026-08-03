import React from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../data/content';

export default function Footer() {
  return (
    <footer className="bg-gk-black border-t border-white/5 py-12 px-6 md:px-12 text-zinc-400 font-sans relative z-10 w-full">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-left">
        
        {/* Brand/About Brief */}
        <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/brand-logo.png"
              alt={BRAND.name}
              className="h-10 w-10 object-contain"
            />
            <div>
              <span className="block text-sm font-black tracking-tight text-white">{BRAND.name}</span>
              <span className="block text-[8px] font-bold uppercase tracking-widest text-gk-orange mt-0.5">
                Scale Collectibles
              </span>
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed max-w-xs mt-2">
            Providing high-quality scale diecast cars for collectors. Verified condition, direct sourcing, and secure packaging.
          </p>
        </div>

        {/* Column 1: Explore */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-500 mb-1">Explore</span>
          <Link to="/" className="text-xs hover:text-white transition-colors py-0.5">Home</Link>
          <Link to="/marketplace" className="text-xs hover:text-white transition-colors py-0.5">Marketplace</Link>
          <Link to="/help" className="text-xs hover:text-white transition-colors py-0.5">Help & FAQ</Link>
        </div>

        {/* Column 2: Support & Contact */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-500 mb-1">Reach Out</span>
          <a 
            href="https://chat.whatsapp.com/EX1NbXHU63ZCQ4qhFVCubb" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs text-gk-orange hover:text-white transition-colors py-0.5 font-bold"
          >
            WhatsApp Support
          </a>
          <a 
            href="https://www.instagram.com/garagekingsindia/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs hover:text-white transition-colors py-0.5"
          >
            Instagram
          </a>
        </div>

        {/* Column 3: Legal & Account */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-500 mb-1">Portal</span>
          <Link to="/account" className="text-xs hover:text-white transition-colors py-0.5">My Account</Link>
          <Link to="/policies" className="text-xs hover:text-white transition-colors py-0.5">Privacy & Policies</Link>
        </div>

      </div>

      {/* Divider */}
      <div className="max-w-6xl mx-auto border-t border-white/5 my-8" />

      {/* Bottom copyright */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono text-zinc-600">
        <div>
          © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
        </div>
        <div className="sm:text-right font-medium">
          Curated diecast collectibles.
        </div>
      </div>
    </footer>
  );
}
