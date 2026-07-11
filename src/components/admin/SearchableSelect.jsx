import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Search } from 'lucide-react';

export default function SearchableSelect({
  label,
  value,
  onChange,
  options = [],
  onCreateNew,
  placeholder = 'Select option...',
  disabled = false,
  required = false,
  valueKey = 'name'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Normalize options to [{ label, value }]
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'string') {
      return { label: opt, value: opt };
    }
    const val = opt[valueKey] || opt.value || opt.id || '';
    return { label: opt.label || opt.name || '', value: val };
  });

  const filteredOptions = normalizedOptions.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setHighlightedIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen) {
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          onChange(filteredOptions[highlightedIndex].value);
          setIsOpen(false);
        } else if (search.trim() && onCreateNew) {
          onCreateNew(search.trim());
          setIsOpen(false);
        }
      } else {
        setIsOpen(true);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      {label && (
        <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white flex items-center justify-between text-left focus:outline-none focus:border-[#ff5500]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
      >
        <span className={selectedOption ? 'text-white' : 'text-zinc-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className="text-zinc-500" />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-[#0f0f0f] border border-white/10 rounded-xl shadow-2xl z-[150] overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5 bg-white/[0.02]">
            <Search size={14} className="text-zinc-500 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              className="bg-transparent border-none text-xs text-white placeholder-zinc-600 focus:outline-none w-full"
            />
          </div>

          <div className="max-h-48 overflow-y-auto py-1.5 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-zinc-500 text-center text-xs">
                No matches found
              </div>
            ) : (
              filteredOptions.map((opt, idx) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-xs hover:bg-[#ff5500]/10 hover:text-[#ff5500] transition-colors block ${
                    highlightedIndex === idx ? 'bg-[#ff5500]/5 text-[#ff5500]' : 'text-zinc-300'
                  } ${value === opt.value ? 'bg-[#ff5500]/10 text-[#ff5500] font-bold' : ''}`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>

          {onCreateNew && search.trim() && (
            <button
              type="button"
              onClick={() => {
                onCreateNew(search.trim());
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 border-t border-white/5 bg-[#ff5500]/5 text-[#ff5500] hover:bg-[#ff5500]/10 transition-colors text-left font-bold text-xs flex items-center gap-2"
            >
              <Plus size={14} />
              <span>Create "{search.trim()}"</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
