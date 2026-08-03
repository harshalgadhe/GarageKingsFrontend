import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Reusable Debounced Search Bar Component
 * Preserves local input responsiveness while delaying API search calls by `delay` ms.
 */
export default function DebouncedSearchBar({
  value = '',
  onChange,
  delay = 350,
  minChars = 0,
  placeholder = 'Search...',
  className = '',
  inputClassName = ''
}) {
  const [query, setQuery] = useState(value);
  const isFirstRender = useRef(true);

  // Sync internal state if external value resets
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
    }
  }, [value]);

  // Debounced effect for triggering external onChange handler
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const handler = setTimeout(() => {
      const trimmed = query.trim();
      if (minChars > 0 && trimmed.length > 0 && trimmed.length < minChars) {
        return;
      }
      onChange(trimmed);
    }, delay);

    return () => clearTimeout(handler);
  }, [query, delay, minChars]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={14} />
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={e => setQuery(e.target.value)}
        className={`w-full bg-[#141414] border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ff5500] transition-colors ${inputClassName}`}
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            onChange('');
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors cursor-pointer"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
