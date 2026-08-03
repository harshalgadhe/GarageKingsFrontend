import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

const API_BASE_URL = import.meta.env.PROD 
  ? '/api/v1' 
  : (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1');

/**
 * Reusable Product Typeahead Component
 * Triggers API search ONLY when 3 or more characters are entered (400ms debounced).
 */
export default function ProductTypeahead({ onSelectProduct, placeholder = "Type 3+ letters to search catalog..." }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced API fetch: Only triggers when query length >= 3
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/products?page=1&limit=15&search=${encodeURIComponent(trimmed)}`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          const items = data.products || data.items || data.data || (Array.isArray(data) ? data : []);
          setSuggestions(items);
        }
      } catch (err) {
        console.error("Typeahead product search error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div ref={containerRef} className="relative w-full sm:w-72">
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          className="w-full bg-[#111116] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
      </div>

      {isOpen && query.trim().length >= 3 && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-full sm:w-80 bg-[#18181b] border border-white/15 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-center text-xs text-zinc-400 font-mono">Searching products...</div>
          ) : suggestions.length === 0 ? (
            <div className="p-3 text-center text-xs text-zinc-500">No matching products found.</div>
          ) : (
            suggestions.map(car => (
              <button
                key={car.id}
                type="button"
                onClick={() => {
                  onSelectProduct(car);
                  setQuery('');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 border-b border-white/5 hover:bg-blue-500/10 transition-colors flex justify-between items-center group cursor-pointer"
              >
                <div className="truncate pr-2">
                  <span className="text-[11px] font-bold text-white block truncate">{car.brand} {car.name}</span>
                  {car.grade && <span className="text-[9px] text-zinc-400 font-mono">{car.grade}</span>}
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">₹{car.price || car.sellingPrice || 0}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
