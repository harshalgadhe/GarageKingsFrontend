import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Archive, RefreshCw, Eye, EyeOff, Globe, Sparkles, MoreHorizontal, Search, ImagePlus, Trash2, Download, Upload, FileSpreadsheet, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { 
  getBrands, createBrand, updateBrand, deleteBrand, uploadImageToStorage,
  getManufacturers, createManufacturer, updateManufacturer, deleteManufacturer,
  getScales, createScale, updateScale, deleteScale,
  getSeries, createSeries, updateSeries, deleteSeries, getMasterDataBackup, bulkSaveMasterData
} from '../../lib/db';
import { exportMasterDataWorkbook, masterDataRecordValue, readMasterDataWorkbook } from '../../lib/masterDataWorkbook';

export default function MasterData() {
  const formRef = useRef(null);
  const importInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('brands'); // 'brands', 'manufacturers', 'scales', 'series'
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [transferBusy, setTransferBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importResult, setImportResult] = useState(null);
  
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
      logoUrl: masterDataRecordValue(item, 'logoUrl') || '',
      coverImageUrl: masterDataRecordValue(item, 'coverImageUrl') || '',
      website: item.website || '',
      displayOrder: masterDataRecordValue(item, 'displayOrder') ?? 0,
      isVisible: masterDataRecordValue(item, 'isVisible') ?? true,
      status: item.status || 'Active',
      accentColor: masterDataRecordValue(item, 'accentColor') || '#C8AE7D',
      secondaryColor: masterDataRecordValue(item, 'secondaryColor') || '#F4F1EC',
      backgroundColor: masterDataRecordValue(item, 'backgroundColor') || '#080706',
      themeVariant: masterDataRecordValue(item, 'themeVariant') || 'archive',
      logoTreatment: masterDataRecordValue(item, 'logoTreatment') || 'natural',
      kicker: item.kicker || '', headline: item.headline || '', description: item.description || '',
      originLabel: masterDataRecordValue(item, 'originLabel') || '', styleLabel: masterDataRecordValue(item, 'styleLabel') || ''
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

  const transferConfig = {
    brands: {
      label: 'Brand',
      fields: [
        ['name', 'Name'], ['slug', 'Slug'], ['logoUrl', 'Logo URL'], ['coverImageUrl', 'Cover image URL'],
        ['website', 'Website'], ['displayOrder', 'Display order'], ['isVisible', 'Visible'], ['status', 'Status'],
        ['accentColor', 'Accent color'], ['secondaryColor', 'Secondary color'], ['backgroundColor', 'Background color'],
        ['themeVariant', 'Theme'], ['logoTreatment', 'Logo treatment'], ['kicker', 'Short label'], ['headline', 'Headline'],
        ['description', 'Description'], ['originLabel', 'Origin'], ['styleLabel', 'Collector focus'],
      ],
      create: createBrand,
      update: updateBrand,
    },
    scales: {
      label: 'Scale', fields: [['name', 'Name'], ['displayOrder', 'Display order'], ['status', 'Status']],
      create: createScale, update: updateScale,
    },
    series: {
      label: 'Series', fields: [['name', 'Name'], ['displayOrder', 'Display order'], ['status', 'Status']],
      create: createSeries, update: updateSeries,
    },
  };

  const comparableValue = (value) => {
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return String(value);
    return String(value).trim();
  };

  const getImportChanges = (row) => {
    const config = transferConfig[row.type];
    return config.fields.flatMap(([key, label]) => {
      if (row.existingItem && !row.providedFields.includes(key)) return [];
      const after = comparableValue(row.data[key]);
      if (!row.existingItem) return after ? [{ key, label, before: '', after, isNew: true }] : [];
      const before = comparableValue(masterDataRecordValue(row.existingItem, key));
      return before === after ? [] : [{ key, label, before, after, isNew: false }];
    });
  };

  const isImportRowReady = (row) => row.errors.length === 0 && (!row.existingItem || getImportChanges(row).length > 0);

  const loadMasterDataBackup = async () => {
    return getMasterDataBackup();
  };

  const handleExportBackup = async () => {
    setTransferBusy(true);
    setError('');
    try {
      await exportMasterDataWorkbook(await loadMasterDataBackup());
    } catch (err) {
      console.error(err);
      setError('Master data could not be exported. Please try again.');
    } finally {
      setTransferBusy(false);
    }
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setTransferBusy(true);
    setError('');
    setImportResult(null);
    try {
      const [rows, existing] = await Promise.all([readMasterDataWorkbook(file), loadMasterDataBackup()]);
      const reviewed = rows.map(row => {
        const records = existing[row.type] || [];
        const byId = row.data.id ? records.find(item => String(item.id) === row.data.id) : null;
        const byName = records.find(item => String(item.name || '').trim().toLocaleLowerCase() === row.data.name.toLocaleLowerCase());
        return { ...row, existingItem: byId || byName || null };
      });
      setImportRows(reviewed);
      setImportOpen(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'The master data workbook could not be read.');
    } finally {
      setTransferBusy(false);
    }
  };

  const importPayload = (row) => {
    if (!row.existingItem) return { ...row.data };
    const payload = {};
    row.providedFields.forEach(key => { if (key !== 'id') payload[key] = row.data[key]; });
    return payload;
  };

  const commitImport = async () => {
    const ready = importRows.filter(isImportRowReady);
    if (!ready.length) return;
    setTransferBusy(true);
    setImportResult(null);
    const result = { created: 0, updated: 0, failures: [] };
    const operations = ready.map(row => ({
      type: row.type,
      action: row.existingItem ? 'update' : 'create',
      id: row.existingItem?.id,
      rowNumber: row.rowNumber,
      data: importPayload(row),
    }));
    for (let start = 0; start < operations.length; start += 50) {
      const batch = operations.slice(start, start + 50);
      try {
        const batchResult = await bulkSaveMasterData(batch);
        result.created += Number(batchResult.created || 0);
        result.updated += Number(batchResult.updated || 0);
        result.failures.push(...(batchResult.failures || []).map(failure => `${failure.name || `Row ${failure.rowNumber || '?'}`}: ${failure.message}`));
      } catch (err) {
        batch.forEach(operation => result.failures.push(`${operation.data?.name || `Row ${operation.rowNumber}`}: ${err.message || 'Batch save failed'}`));
      }
    }
    setImportResult(result);
    setTransferBusy(false);
    await fetchData();
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
          <input ref={importInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleImportFile} />
          <button
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="flex min-h-10 items-center gap-1.5 rounded-full border border-[#C8AE7D]/30 bg-[#C8AE7D]/[0.12] px-4 text-[10px] font-bold uppercase tracking-wider text-[#F1D99F] transition hover:bg-[#C8AE7D]/[0.2]"
          >
            <Plus size={14} /> Add {activeTab.slice(0, -1)}
          </button>
          <details className="relative">
            <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.04] px-4 text-[10px] font-bold uppercase tracking-wider text-[#D8D3CB] transition hover:bg-white/[0.08] [&::-webkit-details-marker]:hidden">
              <FileSpreadsheet size={14} /> Backup
            </summary>
            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-60 overflow-hidden rounded-xl border border-white/[0.11] bg-[#151412] p-1.5 shadow-[0_18px_45px_rgba(0,0,0,.65)]">
              <button type="button" disabled={transferBusy} onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); handleExportBackup(); }} className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-[#EEEAE2] hover:bg-white/[0.06] disabled:opacity-40">
                <Download size={14} className="mt-0.5 shrink-0 text-[#C8AE7D]" />
                <span><strong className="block font-semibold">Export all</strong><small className="mt-0.5 block text-[9px] leading-relaxed text-[#77736D]">Brands, scales, series and brand image references.</small></span>
              </button>
              <button type="button" disabled={transferBusy} onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); importInputRef.current?.click(); }} className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-[#EEEAE2] hover:bg-white/[0.06] disabled:opacity-40">
                <Upload size={14} className="mt-0.5 shrink-0 text-[#C8AE7D]" />
                <span><strong className="block font-semibold">Import backup</strong><small className="mt-0.5 block text-[9px] leading-relaxed text-[#77736D]">Review additions and updates before saving.</small></span>
              </button>
            </div>
          </details>
          <button
            onClick={fetchData}
            aria-label="Reload settings"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.09] bg-white/[0.04] text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
          >
            <RefreshCw size={14} className={isLoading || transferBusy ? 'animate-spin' : ''} />
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
            ) : paginatedItems.map(item => {
              const itemLogo = masterDataRecordValue(item, 'logoUrl');
              const itemVisible = masterDataRecordValue(item, 'isVisible') ?? true;
              const itemDisplayOrder = masterDataRecordValue(item, 'displayOrder') ?? 0;
              return (
              <article
                key={item.id}
                onClick={() => handleEditClick(item)}
                className="group relative rounded-2xl border border-white/[0.09] bg-[#0A0A09] shadow-[0_14px_40px_rgba(0,0,0,.16)] transition duration-300 hover:-translate-y-0.5 hover:border-[#C8AE7D]/25 hover:shadow-[0_20px_55px_rgba(0,0,0,.3)]"
              >
                <div className="flex min-h-28 items-start gap-4 p-4">
                  <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.035]">
                    {itemLogo ? <img src={itemLogo} alt="" className="h-full w-full object-contain p-2" /> : <span className="font-mono text-sm font-semibold uppercase text-[#A7A198]">{item.name?.slice(0, 2) || 'NA'}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#B8A77E]">{activeTab.slice(0, -1)}</p>
                    <h4 className="mt-1 truncate text-base font-semibold text-[#F4F1EC]">{item.name}</h4>
                    <p className="mt-1 truncate font-mono text-[10px] text-[#6F6B65]">{item.slug || 'No public identifier'}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className={`rounded-full border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] ${item.status === 'Active' ? 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300' : 'border-white/[0.08] bg-white/[0.035] text-[#77736D]'}`}>{item.status}</span>
                      {(activeTab === 'brands' || activeTab === 'manufacturers') && <span className={`rounded-full border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] ${itemVisible ? 'border-[#C8AE7D]/20 bg-[#C8AE7D]/[0.08] text-[#D8BC78]' : 'border-white/[0.08] bg-white/[0.035] text-[#77736D]'}`}>{itemVisible ? 'Visible' : 'Hidden'}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-white/[0.07] bg-white/[0.015] px-4 py-3">
                  <div>
                    <span className="block text-[8px] uppercase tracking-[0.14em] text-[#625F59]">Display order</span>
                    <strong className="mt-0.5 block font-mono text-xs font-medium text-[#C8C3BB]">{itemDisplayOrder}</strong>
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
            );})}
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

      {importOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0D0D0C] shadow-[0_30px_100px_rgba(0,0,0,.75)]">
            <div className="flex shrink-0 items-start justify-between border-b border-white/[0.08] p-5 md:px-6">
              <div>
                <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#C8AE7D]"><FileSpreadsheet size={13} /> Master data import</p>
                <h3 className="mt-2 text-xl font-semibold text-[#F4F1EC]">Review backup changes</h3>
                <p className="mt-1 text-xs text-[#817C74]">Existing records match by ID first, then by name. Nothing changes until you confirm.</p>
              </div>
              <button type="button" onClick={() => setImportOpen(false)} aria-label="Close import review" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/[0.09] bg-white/[0.04] text-[#918C84] hover:text-white"><X size={16} /></button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6" data-lenis-prevent="true">
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-white/[0.08] p-3"><span className="text-[9px] uppercase text-[#77736D]">Rows</span><strong className="mt-1 block text-lg text-white">{importRows.length}</strong></div>
                <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-3"><span className="text-[9px] uppercase text-emerald-300/70">Create</span><strong className="mt-1 block text-lg text-emerald-300">{importRows.filter(row => isImportRowReady(row) && !row.existingItem).length}</strong></div>
                <div className="rounded-xl border border-[#C8AE7D]/20 bg-[#C8AE7D]/[0.05] p-3"><span className="text-[9px] uppercase text-[#C8AE7D]">Update</span><strong className="mt-1 block text-lg text-[#E2CE9E]">{importRows.filter(row => isImportRowReady(row) && row.existingItem).length}</strong></div>
                <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-3"><span className="text-[9px] uppercase text-amber-200/70">Skipped</span><strong className="mt-1 block text-lg text-amber-200">{importRows.filter(row => !isImportRowReady(row)).length}</strong></div>
              </div>

              <div className="space-y-2">
                {importRows.map((row, index) => {
                  const changes = getImportChanges(row);
                  const config = transferConfig[row.type];
                  const ready = isImportRowReady(row);
                  return (
                    <div key={`${row.type}-${row.rowNumber}-${index}`} className="overflow-hidden rounded-xl border border-white/[0.07] bg-black/20">
                      <div className="grid gap-2 p-3 sm:grid-cols-[80px_minmax(0,1fr)_auto] sm:items-center">
                        <span className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#B8A77E]">{config.label}</span>
                        <div className="min-w-0"><strong className="block truncate text-xs font-medium text-[#EEEAE2]">{row.data.name || 'Unnamed record'}</strong><span className="mt-0.5 block text-[9px] text-[#66625C]">Row {row.rowNumber}{row.data.id ? ` · ${row.data.id}` : ''}</span></div>
                        <span className={`flex items-center gap-1.5 text-[10px] ${row.errors.length ? 'text-amber-200' : ready ? 'text-emerald-300' : 'text-[#77736D]'}`}>
                          {row.errors.length ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                          {row.errors.join('; ') || (ready ? `${row.existingItem ? 'Update' : 'Create'} · ${changes.length} ${changes.length === 1 ? 'change' : 'changes'}` : 'No changes')}
                        </span>
                      </div>
                      {!row.errors.length && changes.length > 0 && (
                        <details className="border-t border-white/[0.06]" data-lenis-prevent="true">
                          <summary className="cursor-pointer list-none px-3 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#B8A77E] hover:bg-white/[0.025] [&::-webkit-details-marker]:hidden">Preview {changes.length} {changes.length === 1 ? 'change' : 'changes'}</summary>
                          <div className="grid gap-px bg-white/[0.05] sm:grid-cols-2">
                            {changes.map(change => (
                              <div key={change.key} className="min-w-0 bg-[#0C0C0B] p-3">
                                <span className="block text-[8px] font-bold uppercase tracking-[0.14em] text-[#66625C]">{change.label}</span>
                                {change.isNew ? <strong className="mt-1 line-clamp-2 break-all text-[11px] font-medium text-emerald-200">{change.after}</strong> : (
                                  <div className="mt-1 grid grid-cols-[1fr_auto_1fr] items-start gap-2 text-[11px]">
                                    <span className="line-clamp-2 break-all text-[#77736D] line-through">{change.before || 'Empty'}</span><span className="text-[#5F5A53]">→</span><strong className="line-clamp-2 break-all font-medium text-[#F1ECE4]">{change.after || 'Empty'}</strong>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>

              {importResult && (
                <div className="mt-4 rounded-xl border border-[#C8AE7D]/20 bg-[#C8AE7D]/[0.06] p-4 text-sm text-[#E7E2DA]">
                  Created {importResult.created} and updated {importResult.updated} records.
                  {importResult.failures.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-200">{importResult.failures.map(failure => <li key={failure}>{failure}</li>)}</ul>}
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-white/[0.08] bg-[#11110F] p-4 md:px-6">
              <button type="button" onClick={() => setImportOpen(false)} className="rounded-full px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#9A958D]">Close</button>
              <button type="button" disabled={transferBusy || importResult || !importRows.some(isImportRowReady)} onClick={commitImport} className="flex items-center gap-2 rounded-full bg-[#E8E2D8] px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-[#111] disabled:opacity-40">
                {transferBusy ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />} Confirm import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
