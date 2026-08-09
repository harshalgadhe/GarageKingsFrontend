import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Archive, RefreshCw, Eye, EyeOff, Globe, Sparkles } from 'lucide-react';
import { 
  getBrands, createBrand, updateBrand, deleteBrand,
  getManufacturers, createManufacturer, updateManufacturer, deleteManufacturer,
  getScales, createScale, updateScale, deleteScale,
  getSeries, createSeries, updateSeries, deleteSeries
} from '../../lib/db';

export default function MasterData() {
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
  const [currentItem, setCurrentItem] = useState(null); // null when creating
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
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
    setCurrentItem(null);
    setFormData({
      name: '',
      logoUrl: '',
      website: '',
      displayOrder: 0,
      isVisible: true,
      status: 'Active',
      accentColor: '#C8AE7D', secondaryColor: '#F4F1EC', backgroundColor: '#080706',
      themeVariant: 'archive', logoTreatment: 'natural', kicker: '', headline: '', description: '', originLabel: '', styleLabel: ''
    });
  };

  const handleEditClick = (item) => {
    setIsEditing(true);
    setCurrentItem(item);
    setFormData({
      name: item.name || '',
      logoUrl: item.logo_url || '',
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        logoUrl: formData.logoUrl.trim() || null,
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
                  ? 'bg-[#ff5500] text-black' 
                  : 'text-[#888888] hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Reload
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Left Form, Right List Table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Side: Form */}
        <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 h-fit space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} className="text-[#ff5500]" />
              {isEditing ? `Edit ${activeTab.slice(0, -1)}` : `Create ${activeTab.slice(0, -1)}`}
            </h4>
            {isEditing && (
              <button 
                onClick={resetForm} 
                className="text-[10px] font-bold text-[#ff5500] hover:underline uppercase tracking-wider"
              >
                Reset
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
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Logo URL (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.logoUrl} 
                    onChange={e => setFormData(p => ({ ...p, logoUrl: e.target.value }))} 
                    placeholder="/brand-logos/example.svg or https://..." 
                    className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 text-xs" 
                  />
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
              className="w-full bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold text-[10px] py-3.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditing ? 'Save Changes' : `Add ${activeTab.slice(0, -1)}`}
            </button>
          </form>
        </div>

        {/* Right Side: List Table */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center gap-2 bg-[#141414] border border-white/5 rounded-xl px-3.5 py-2.5 w-full max-w-md">
            <Plus size={14} className="text-zinc-500" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs text-white placeholder-zinc-600 focus:outline-none w-full"
            />
          </div>

          <div className="overflow-x-auto border border-white/5 rounded-2xl">
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
