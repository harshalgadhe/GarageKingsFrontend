import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Archive, RefreshCw, Eye, EyeOff, Globe, Sparkles, MoreHorizontal, Search, ImagePlus, Trash2 } from 'lucide-react';
import { 
  getBrands, createBrand, updateBrand, deleteBrand, uploadImageToStorage,
  getManufacturers, createManufacturer, updateManufacturer, deleteManufacturer,
  getScales, createScale, updateScale, deleteScale,
  getSeries, createSeries, updateSeries, deleteSeries
} from '../../lib/db';

export default function MasterData() {
  const formRef = useRef(null);
  const [activeTab, setActiveTab] = useState('brands'); // 'brands', 'manufacturers', 'scales', 'series'
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null); // null when creating
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    coverImageUrl: '',
    website: '',
    displayOrder: 0,
    isVisible: true,
    status: 'Active',
    accentColor: '#C8AE7D',
    secondaryColor: '#F4F1EC',
    backgroundColor: '#080706',
    themeVariant: 'archive',
    logoTreatment: 'natural',
    kicker: '',
    headline: '',
    description: '',
    originLabel: '',
    styleLabel: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      let data = [];
      if (activeTab === 'brands') {
        data = await getBrands(true); // adminMode = true
      } else if (activeTab === 'manufacturers') {
        data = await getManufacturers(true);
      } else if (activeTab === 'scales') {
        data = await getScales(true);
      } else if (activeTab === 'series') {
        data = await getSeries(true);
      }
      setItems(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch master data. Please check connectivity.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSearchQuery('');
    setCurrentPage(1);
    resetForm();
  }, [activeTab]);

  const resetForm = () => {
    setIsEditing(false);
    setIsFormOpen(false);
    setCurrentItem(null);
    setFormData({
      name: '',
      logoUrl: '',
      coverImageUrl: '',
      website: '',
      displayOrder: 0,
      isVisible: true,
      status: 'Active',
      accentColor: '#C8AE7D', secondaryColor: '#F4F1EC', backgroundColor: '#080706',
      themeVariant: 'archive', logoTreatment: 'natural', kicker: '', headline: '', description: '', originLabel: '', styleLabel: ''
    });
  };

  const handleEditClick = (item, e) => {
    if (e) {
      if (e.stopPropagation) e.stopPropagation();
      const detailsElem = e.currentTarget?.closest?.('details');
      if (detailsElem) detailsElem.removeAttribute('open');
    }
    setIsEditing(true);
    setIsFormOpen(true);
    setCurrentItem(item);
    setFormData({
      name: item.name || '',
      logoUrl: item.logo_url || '',
      coverImageUrl: item.cover_image_url || '',
      website: item.website || '',
      displayOrder: item.display_order ?? 0,
      isVisible: item.is_visible ?? true,
      status: item.status || 'Active',
      accentColor: item.accent_color || '#C8AE7D',
      secondaryColor: item.secondary_color || '#F4F1EC',
      backgroundColor: item.background_color || '#080706',
      themeVariant: item.theme_variant || 'archive',
      logoTreatment: item.logo_treatment || 'natural',
      kicker: item.kicker || '', headline: item.headline || '', description: item.description || '',
      originLabel: item.origin_label || '', styleLabel: item.style_label || ''
    });
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        logoUrl: formData.logoUrl.trim() || null,
        coverImageUrl: formData.coverImageUrl.trim() || null,
        website: formData.website.trim() || null,
        displayOrder: Number(formData.displayOrder),
        isVisible: formData.isVisible,
        status: formData.status,
        accentColor: formData.accentColor,
        secondaryColor: formData.secondaryColor,
        backgroundColor: formData.backgroundColor,
        themeVariant: formData.themeVariant,
        logoTreatment: formData.logoTreatment,
        kicker: formData.kicker.trim() || null,
        headline: formData.headline.trim() || null,
        description: formData.description.trim() || null,
        originLabel: formData.originLabel.trim() || null,
        styleLabel: formData.styleLabel.trim() || null
      };

      if (currentItem) {
        // Update
        if (activeTab === 'brands') {
          await updateBrand(currentItem.id, payload);
        } else if (activeTab === 'manufacturers') {
          await updateManufacturer(currentItem.id, payload);
        } else if (activeTab === 'scales') {
          await updateScale(currentItem.id, { name: payload.name, displayOrder: payload.displayOrder, status: payload.status });
        } else if (activeTab === 'series') {
          await updateSeries(currentItem.id, { name: payload.name, displayOrder: payload.displayOrder, status: payload.status });
        }
      } else {
        // Create
        if (activeTab === 'brands') {
          await createBrand(payload);
        } else if (activeTab === 'manufacturers') {
          await createManufacturer(payload);
        } else if (activeTab === 'scales') {
          await createScale({ name: payload.name, displayOrder: payload.displayOrder, status: payload.status });
        } else if (activeTab === 'series') {
          await createSeries({ name: payload.name, displayOrder: payload.displayOrder, status: payload.status });
        }
      }
      resetForm();
      await fetchData();
    } catch (err) {
      console.error(err);
      setError('Operation failed. Please ensure unique constraints are satisfied.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrandImageUpload = async (event, field) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setError('');
    try {
      const url = await uploadImageToStorage(file);
      if (!url) throw new Error('Upload did not return an image URL.');
      setFormData(previous => ({ ...previous, [field]: url }));
    } catch (err) {
      console.error(err);
      setError('Image upload failed. Please try again.');
    } finally {
      event.target.value = '';
      setIsLoading(false);
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm(`Are you sure you want to archive this ${activeTab.slice(0, -1)}?`)) return;

    setIsLoading(true);
    try {
      if (activeTab === 'brands') {
        await deleteBrand(id);
      } else if (activeTab === 'manufacturers') {
        await deleteManufacturer(id);
      } else if (activeTab === 'scales') {
        await deleteScale(id);
      } else if (activeTab === 'series') {
        await deleteSeries(id);
      }
      await fetchData();
    } catch (err) {
      console.error(err);
      setError('Failed to archive record.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered List
  const filteredItems = items.filter(item => 
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.slug || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination bounds
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Tabs Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex gap-1.5 bg-[#111] p-1.5 rounded-xl border border-white/5">
          {[
            { id: 'brands', label: 'Brands' },
            { id: 'scales', label: 'Scales' },
            { id: 'series', label: 'Series' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === tab.id 
                  ? 'border border-[#C8AE7D]/25 bg-[#C8AE7D]/[0.12] text-[#F1D99F]'
                  : 'text-[#888888] hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="flex min-h-10 items-center gap-1.5 rounded-full border border-[#C8AE7D]/30 bg-[#C8AE7D]/[0.12] px-4 text-[10px] font-bold uppercase tracking-wider text-[#F1D99F] transition hover:bg-[#C8AE7D]/[0.2]"
          >
            <Plus size={14} /> Add {activeTab.slice(0, -1)}
          </button>
          <button
            onClick={fetchData}
            aria-label="Reload settings"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.09] bg-white/[0.04] text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6">
        
        {/* Left Side: Form */}
        {isFormOpen && <div ref={formRef} className="mx-auto w-full max-w-3xl bg-[#111111] border border-white/[0.08] rounded-2xl p-5 sm:p-6 h-fit space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} className="text-[#ff5500]" />
              {isEditing ? `Edit ${activeTab.slice(0, -1)}` : `Create ${activeTab.slice(0, -1)}`}
            </h4>
            {isFormOpen && (
              <button 
                onClick={resetForm} 
                className="text-[10px] font-bold text-[#C8AE7D] hover:text-[#EAD39D] uppercase tracking-wider"
              >
                Close
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Name</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} 
                placeholder={`e.g. ${activeTab === 'brands' ? 'Mini GT' : activeTab === 'scales' ? '1:64' : 'Series Name'}`}
                className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 text-xs" 
                required 
              />
            </div>

            {/* Logo and Website for Brands / Manufacturers */}
            {(activeTab === 'brands' || activeTab === 'manufacturers') && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { field: 'logoUrl', label: 'Brand logo', hint: 'Transparent PNG, WebP or SVG works best', fit: 'object-contain p-4' },
                    { field: 'coverImageUrl', label: 'Brand cover image', hint: 'Wide product or campaign photograph', fit: 'object-cover' },
                  ].map(({ field, label, hint, fit }) => (
                    <div key={field} className="overflow-hidden rounded-xl border border-white/[0.08] bg-black/20">
                      <div className="relative aspect-[16/9] bg-[#0B0B0B]">
                        {formData[field] ? <img src={formData[field]} alt="" className={`h-full w-full ${fit}`} /> : <div className="grid h-full place-items-center text-zinc-700"><ImagePlus size={24} /></div>}
                        {formData[field] && <button type="button" onClick={() => setFormData(previous => ({ ...previous, [field]: '' }))} aria-label={`Remove ${label.toLowerCase()}`} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/70 text-white/70 backdrop-blur hover:text-red-300"><Trash2 size={13} /></button>}
                      </div>
                      <div className="space-y-2 p-3">
                        <div><div className="text-[10px] font-bold uppercase tracking-widest text-[#C8AE7D]">{label}</div><p className="mt-1 text-[9px] text-[#706C65]">{hint}</p></div>
                        <label className="flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 text-[9px] font-bold uppercase tracking-wider text-[#E7E2DA] transition hover:bg-white/[0.08]">
                          <ImagePlus size={13} /> {formData[field] ? 'Replace image' : 'Upload image'}
                          <input type="file" accept="image/*" className="hidden" disabled={isLoading} onChange={event => handleBrandImageUpload(event, field)} />
                        </label>
                        <input type="text" value={formData[field]} onChange={event => setFormData(previous => ({ ...previous, [field]: event.target.value }))} placeholder="Or paste an image URL" className="w-full rounded-lg border border-white/5 bg-[#141414] px-3 py-2 text-[10px] text-white outline-none focus:border-[#C8AE7D]/40" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Website (Optional)</label>
                  <input 
                    type="url" 
                    value={formData.website} 
                    onChange={e => setFormData(p => ({ ...p, website: e.target.value }))} 
                    placeholder="https://minigt.com" 
                    className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 text-xs" 
                  />
                </div>

                {activeTab === 'brands' && (
                  <div className="space-y-4 rounded-xl border border-white/5 bg-black/20 p-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#C8AE7D]">Public page presentation</div>
                    <div className="grid grid-cols-3 gap-3">
                      {[['accentColor', 'Accent'], ['secondaryColor', 'Secondary'], ['backgroundColor', 'Background']].map(([field, label]) => (
                        <label key={field} className="space-y-1 text-[9px] font-bold uppercase tracking-wider text-[#888]">
                          {label}
                          <span className="flex items-center gap-2 rounded-lg border border-white/5 bg-[#141414] p-2">
                            <input type="color" value={formData[field]} onChange={e => setFormData(p => ({ ...p, [field]: e.target.value }))} className="h-6 w-7 cursor-pointer border-0 bg-transparent p-0" />
                            <span className="truncate font-mono text-[8px] text-white/55">{formData[field]}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="space-y-1 text-[9px] font-bold uppercase tracking-wider text-[#888]">Theme motif
                        <select value={formData.themeVariant} onChange={e => setFormData(p => ({ ...p, themeVariant: e.target.value }))} className="mt-1 w-full rounded-lg border border-white/5 bg-[#141414] px-3 py-2.5 text-xs normal-case text-white">
                          {['archive', 'velocity', 'precision', 'race', 'grid', 'neon'].map(value => <option key={value} value={value}>{value}</option>)}
                        </select>
                      </label>
                      <label className="space-y-1 text-[9px] font-bold uppercase tracking-wider text-[#888]">Logo treatment
                        <select value={formData.logoTreatment} onChange={e => setFormData(p => ({ ...p, logoTreatment: e.target.value }))} className="mt-1 w-full rounded-lg border border-white/5 bg-[#141414] px-3 py-2.5 text-xs normal-case text-white">
                          <option value="natural">Natural</option><option value="invert">Invert</option>
                        </select>
                      </label>
                    </div>
                    {[['originLabel', 'Origin / parent'], ['styleLabel', 'Collector focus'], ['kicker', 'Eyebrow'], ['headline', 'Headline']].map(([field, label]) => (
                      <label key={field} className="block space-y-1 text-[9px] font-bold uppercase tracking-wider text-[#888]">{label}
                        <input value={formData[field]} onChange={e => setFormData(p => ({ ...p, [field]: e.target.value }))} className="w-full rounded-lg border border-white/5 bg-[#141414] px-3 py-2.5 text-xs normal-case text-white outline-none focus:border-[#C8AE7D]/40" />
                      </label>
                    ))}
                    <label className="block space-y-1 text-[9px] font-bold uppercase tracking-wider text-[#888]">Description
                      <textarea rows={3} value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} className="w-full resize-none rounded-lg border border-white/5 bg-[#141414] px-3 py-2.5 text-xs normal-case leading-relaxed text-white outline-none focus:border-[#C8AE7D]/40" />
                    </label>
                  </div>
                )}
                
                <div className="flex items-center justify-between py-2 border-t border-b border-white/5">
                  <span className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Visibility Status</span>
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, isVisible: !p.isVisible }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                      formData.isVisible 
                        ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                        : 'border-white/5 bg-white/5 text-zinc-500'
                    }`}
                  >
                    {formData.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                    {formData.isVisible ? 'Visible' : 'Hidden'}
                  </button>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Display Order</label>
                <input 
                  type="number" 
                  value={formData.displayOrder} 
                  onChange={e => setFormData(p => ({ ...p, displayOrder: parseInt(e.target.value) || 0 }))} 
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 font-mono text-xs" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Status</label>
                <select 
                  value={formData.status} 
                  onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 text-xs"
                >
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full border border-[#C8AE7D]/30 bg-[#C8AE7D]/[0.14] hover:bg-[#C8AE7D]/[0.22] text-[#F4E3B8] font-extrabold text-[10px] py-3.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditing ? 'Save Changes' : `Add ${activeTab.slice(0, -1)}`}
            </button>
          </form>
        </div>}

        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-[#141414] border border-white/[0.08] rounded-xl px-3.5 py-2.5 w-full max-w-md">
            <Search size={14} className="text-zinc-500" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs text-white placeholder-zinc-600 focus:outline-none w-full"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {paginatedItems.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-white/[0.1] bg-[#0A0A09] px-6 py-12 text-center">
                <p className="text-sm font-semibold text-[#D8D3CB]">{isLoading ? 'Loading settings...' : `No ${activeTab} found`}</p>
                {!isLoading && <p className="mt-1 text-xs text-[#706C65]">Add the first entry or try another search.</p>}
              </div>
            ) : paginatedItems.map(item => (
              <article
                key={item.id}
                onClick={() => handleEditClick(item)}
                className="group relative rounded-2xl border border-white/[0.09] bg-[#0A0A09] shadow-[0_14px_40px_rgba(0,0,0,.16)] transition duration-300 hover:-translate-y-0.5 hover:border-[#C8AE7D]/25 hover:shadow-[0_20px_55px_rgba(0,0,0,.3)]"
              >
                <div className="flex min-h-28 items-start gap-4 p-4">
                  <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.035]">
                    {item.logo_url ? <img src={item.logo_url} alt="" className="h-full w-full object-contain p-2" /> : <span className="font-mono text-sm font-semibold uppercase text-[#A7A198]">{item.name?.slice(0, 2) || 'NA'}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#B8A77E]">{activeTab.slice(0, -1)}</p>
                    <h4 className="mt-1 truncate text-base font-semibold text-[#F4F1EC]">{item.name}</h4>
                    <p className="mt-1 truncate font-mono text-[10px] text-[#6F6B65]">{item.slug || 'No public identifier'}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className={`rounded-full border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] ${item.status === 'Active' ? 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300' : 'border-white/[0.08] bg-white/[0.035] text-[#77736D]'}`}>{item.status}</span>
                      {(activeTab === 'brands' || activeTab === 'manufacturers') && <span className={`rounded-full border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] ${item.is_visible ? 'border-[#C8AE7D]/20 bg-[#C8AE7D]/[0.08] text-[#D8BC78]' : 'border-white/[0.08] bg-white/[0.035] text-[#77736D]'}`}>{item.is_visible ? 'Visible' : 'Hidden'}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-white/[0.07] bg-white/[0.015] px-4 py-3">
                  <div>
                    <span className="block text-[8px] uppercase tracking-[0.14em] text-[#625F59]">Display order</span>
                    <strong className="mt-0.5 block font-mono text-xs font-medium text-[#C8C3BB]">{item.display_order ?? 0}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleEditClick(item, e)}
                      className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-[#C8AE7D]/30 bg-[#C8AE7D]/[0.12] px-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#F1D99F] transition hover:bg-[#C8AE7D]/[0.2]"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    {item.website && <a href={item.website} target="_blank" rel="noreferrer" onClick={event => event.stopPropagation()} aria-label={`${item.name} website`} className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.09] bg-white/[0.04] text-[#969189] hover:text-white"><Globe size={14} /></a>}
                    <details className="relative" onClick={event => event.stopPropagation()}>
                      <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.045] px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#E7E2DA] [&::-webkit-details-marker]:hidden"><MoreHorizontal size={15} /></summary>
                      <div className="absolute bottom-[calc(100%+0.5rem)] right-0 z-20 w-44 overflow-hidden rounded-xl border border-white/[0.11] bg-[#151412] p-1.5 shadow-[0_18px_45px_rgba(0,0,0,.65)]">
                        <button onClick={(e) => handleEditClick(item, e)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs text-[#EEEAE2] hover:bg-white/[0.06]"><Edit2 size={14} className="text-[#C8AE7D]" /> Edit</button>
                        {item.status !== 'Archived' && <button onClick={() => handleArchive(item.id)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs text-red-300 hover:bg-red-500/[0.08]"><Archive size={14} /> Archive</button>}
                      </div>
                    </details>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#141414] border-b border-white/5 text-[#888888] uppercase tracking-widest text-[9px]">
                  <th className="p-4 font-bold">Details</th>
                  {(activeTab === 'brands' || activeTab === 'manufacturers') && (
                    <th className="p-4 font-bold">Channels</th>
                  )}
                  <th className="p-4 font-bold text-center">Order</th>
                  <th className="p-4 font-bold text-center">Status</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#888888] font-semibold">
                      {isLoading ? 'Fetching records...' : `No ${activeTab} registered yet.`}
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map(item => (
                    <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {item.logo_url ? (
                            <img 
                              src={item.logo_url} 
                              alt={item.name} 
                              className="w-8 h-8 rounded-lg object-contain bg-white/5 border border-white/10" 
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-[#222] border border-white/5 flex items-center justify-center font-bold text-[10px] text-zinc-400 uppercase font-mono">
                              {item.name ? item.name.slice(0, 2) : 'NA'}
                            </div>
                          )}
                          <div>
                            <div className="font-extrabold text-white">{item.name}</div>
                            {item.slug && (
                              <div className="text-[10px] font-mono text-[#666]">{item.slug}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {(activeTab === 'brands' || activeTab === 'manufacturers') && (
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {item.website && (
                              <a 
                                href={item.website} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="p-1 rounded bg-[#222] hover:bg-white/5 border border-white/5 text-zinc-400 hover:text-white transition-colors"
                              >
                                <Globe size={12} />
                              </a>
                            )}
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              item.is_visible 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-[#222] text-zinc-500 border border-white/5'
                            }`}>
                              {item.is_visible ? 'Visible' : 'Hidden'}
                            </span>
                          </div>
                        </td>
                      )}
                      
                      <td className="p-4 text-center font-mono font-bold text-[#888]">
                        {item.display_order ?? 0}
                      </td>

                      <td className="p-4 text-center">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          item.status === 'Active' 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {item.status}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => handleEditClick(item)}
                            className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit2 size={12} />
                          </button>
                          {item.status !== 'Archived' && (
                            <button 
                              onClick={() => handleArchive(item.id)}
                              className="p-1.5 rounded-lg border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 text-red-400 transition-colors cursor-pointer"
                            >
                              <Archive size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <span className="text-[10px] font-mono text-[#888] uppercase">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredItems.length)} of {filteredItems.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded border border-white/5 bg-white/5 text-[10px] font-bold text-white disabled:opacity-30 cursor-pointer"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded border border-white/5 bg-white/5 text-[10px] font-bold text-white disabled:opacity-30 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
