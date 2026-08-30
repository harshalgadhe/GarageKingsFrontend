import React, { useRef, useState } from 'react';
import { Search, Plus, Trash2, RefreshCw, ArrowUpRight, MoreHorizontal, PackageCheck, Pencil, Download, Upload, FileSpreadsheet, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import MasterData from '../../pages/admin/MasterData';
import Pagination from './Pagination';
import { bulkSaveProducts, getAdminProducts, getCatalogBackup, getCatalogLookups } from '../../lib/db';
import { downloadCatalogTemplate, exportCatalogWorkbook, readCatalogWorkbook } from '../../lib/catalogWorkbook';

export default function AdminCatalogTab({
  catalogSubTab,
  setCatalogSubTab,
  setProductForm,
  setEditingProductId,
  setEditingProductData,
  setIsAddingProduct,
  inventorySearchQuery,
  setInventorySearchQuery,
  filteredCars,
  handleConvertPoToStock,
  handleEditProduct,
  handleDeleteProduct,
  loadingProductId,
  isArchivingProductId,
  inventoryPage,
  inventoryTotalPages,
  inventoryTotal,
  setInventoryPage,
  variantsSearchQuery,
  setVariantsSearchQuery,
  variantsLoading,
  variantsList,
  variantsPage,
  variantsTotalPages,
  variantsTotal,
  setVariantsPage,
  onCatalogChanged,
}) {
  const fileInputRef = useRef(null);
  const [transferBusy, setTransferBusy] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importMode, setImportMode] = useState('update');

  const getRowErrors = (row) => [
    ...row.errors,
    ...(importMode === 'create' && row.existingProduct ? ['Model ID already exists; row will be skipped'] : []),
  ];

  const changeFields = [
    ['brand', 'Brand'], ['name', 'Model name'], ['series', 'Series'], ['scale', 'Scale'],
    ['casingType', 'Packaging'], ['price', 'Price'], ['purchasePrice', 'Purchase price'],
    ['availableStock', 'Stock'], ['isPrebook', 'Pre-booking'],
    ['prebookDepositAmount', 'Deposit'], ['arrivalDate', 'Arrival date'],
    ['releaseDate', 'Release date'], ['customerEta', 'Expected arrival'],
    ['category', 'Category'], ['tag', 'Rarity'], ['tags', 'Tags'], ['supplier', 'Supplier'],
    ['maxQtyPerCustomer', 'Maximum per customer'], ['description', 'Description'],
    ['image', 'Cover image URL'], ['images', 'All image URLs'],
    ['showOnHomepage', 'Show on homepage'], ['isFeatured', 'Featured'],
  ];

  const existingValue = (product, key) => {
    if (!product) return undefined;
    if (key === 'casingType') return product.casingType ?? product.casing;
    if (key === 'availableStock') return product.availableStock ?? product.totalStock ?? product.stock;
    if (key === 'purchasePrice') return product.purchasePrice ?? product.purchase_price;
    if (key === 'prebookDepositAmount') return product.prebookDepositAmount ?? product.poAmount;
    if (key === 'image') return product.image ?? product.images?.[0];
    if (key === 'images') {
      const entries = Array.isArray(product.images) ? product.images : [];
      return entries.map(item => typeof item === 'string' ? item : (item?.fullUrl || item?.url || item?.src || item?.mediumUrl || item?.thumbnailUrl)).filter(Boolean);
    }
    return product[key];
  };

  const comparable = (value) => {
    if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean).sort().join(', ');
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return String(value);
    return String(value).trim();
  };

  const numericFields = new Set(['price', 'purchasePrice', 'availableStock', 'prebookDepositAmount', 'maxQtyPerCustomer']);
  const comparableFieldValue = (key, value) => {
    if (numericFields.has(key) && value !== '' && value !== null && value !== undefined) {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? String(numeric) : comparable(value);
    }
    return comparable(value);
  };

  const displayFieldValue = (key, value) => {
    if (key === 'images') {
      const references = Array.isArray(value) ? value.filter(Boolean) : [];
      return references.length ? `${references.length} image ${references.length === 1 ? 'reference' : 'references'}` : '';
    }
    if (key === 'image') {
      const reference = comparable(value);
      if (!reference) return '';
      try {
        const parsed = new URL(reference, window.location.origin);
        const filename = parsed.pathname.split('/').filter(Boolean).pop();
        return filename ? `${parsed.host || 'Website'} / ${filename}` : reference;
      } catch {
        return reference;
      }
    }
    return comparableFieldValue(key, value);
  };

  const getRowChanges = (row) => changeFields.flatMap(([key, label]) => {
    if (row.existingProduct && Array.isArray(row.providedFields) && !row.providedFields.includes(key)) return [];
    const next = comparableFieldValue(key, row.product[key]);
    if (!row.existingProduct) return next === '' ? [] : [{ key, label, before: '', after: displayFieldValue(key, row.product[key]), isNew: true }];
    const before = comparableFieldValue(key, existingValue(row.existingProduct, key));
    return before === next ? [] : [{
      key,
      label,
      before: displayFieldValue(key, existingValue(row.existingProduct, key)),
      after: displayFieldValue(key, row.product[key]),
      isNew: false,
    }];
  });

  const getUpdatePayload = (row) => {
    const provided = new Set(row.providedFields || []);
    const payload = {};
    provided.forEach(key => { payload[key] = row.product[key]; });
    payload.sku = row.product.sku;
    if (provided.has('price')) payload.sellingPrice = row.product.price;
    if (provided.has('availableStock')) {
      payload.stock = row.product.availableStock;
      payload.totalStock = row.product.availableStock;
    }
    if (provided.has('casingType')) payload.casing = row.product.casingType;
    if (provided.has('tags')) payload.subtags = row.product.tags;
    if (provided.has('prebookDepositAmount')) payload.poAmount = row.product.prebookDepositAmount;
    if (provided.has('isPrebook')) payload.status = row.product.isPrebook ? 'Pre-Order' : 'Published';
    if (provided.has('images')) payload.images = row.product.images;
    if (provided.has('image')) payload.image = row.product.image;
    return payload;
  };

  const isRowReady = (row) => {
    if (getRowErrors(row).length) return false;
    return !(importMode === 'update' && row.existingProduct && getRowChanges(row).length === 0);
  };

  const loadAllProducts = async () => {
    const backup = await getCatalogBackup();
    return backup.products || [];
  };

  const normalizeLookupProduct = (row, lookups) => {
    const product = { ...row.product };
    const errors = [...row.errors];
    const provided = new Set(row.providedFields || []);
    const rules = [
      ['brand', 'Brand', lookups.brands], ['scale', 'Scale', lookups.scales],
      ['casingType', 'Packaging', lookups.casingTypes], ['category', 'Category', lookups.categories],
      ['series', 'Series', lookups.series], ['tag', 'Rarity', lookups.tags],
    ];
    rules.forEach(([key, label, options]) => {
      if (!provided.has(key) && key !== 'brand') return;
      if (!Array.isArray(options) || options.length === 0) {
        errors.push(`${label} options are not configured in Admin settings`);
        return;
      }
      const value = String(product[key] || '').trim();
      const canonical = options.find(option => option.toLocaleLowerCase() === value.toLocaleLowerCase());
      if (!canonical) errors.push(`${label} "${value || 'blank'}" is not an available option`);
      else product[key] = canonical;
    });
    if (provided.has('tags')) {
      if (!Array.isArray(lookups.tags) || lookups.tags.length === 0) errors.push('Tag options are not configured in Admin settings');
      else {
        const canonicalTags = [];
        product.tags.forEach(value => {
          const canonical = lookups.tags.find(option => option.toLocaleLowerCase() === String(value).toLocaleLowerCase());
          if (!canonical) errors.push(`Tag "${value}" is not an available option`);
          else canonicalTags.push(canonical);
        });
        product.tags = canonicalTags;
        product.subtags = canonicalTags;
      }
    }
    return { ...row, product, errors };
  };

  const mergeLookups = (serverLookups = {}, embeddedLookups = {}) => {
    const keys = ['brands', 'scales', 'casingTypes', 'categories', 'series', 'tags', 'suppliers'];
    return Object.fromEntries(keys.map(key => {
      const values = [...(serverLookups[key] || []), ...(embeddedLookups[key] || [])];
      const seen = new Set();
      return [key, values.filter(value => {
        const normalized = String(value || '').trim().toLocaleLowerCase();
        if (!normalized || seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      })];
    }));
  };

  const handleExport = async () => {
    setTransferBusy(true);
    try {
      const [products, lookups] = await Promise.all([loadAllProducts(), getCatalogLookups()]);
      await exportCatalogWorkbook(products, lookups);
    }
    finally { setTransferBusy(false); }
  };

  const handleTemplateDownload = async () => {
    setTransferBusy(true);
    try { await downloadCatalogTemplate(await getCatalogLookups()); }
    finally { setTransferBusy(false); }
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setTransferBusy(true);
    setImportResult(null);
    try {
      const [rows, existing, serverLookups] = await Promise.all([readCatalogWorkbook(file), loadAllProducts(), getCatalogLookups()]);
      const lookups = mergeLookups(serverLookups, rows.embeddedLookups);
      const existingBySku = new Map(existing.map(product => [String(product.sku || '').trim().toUpperCase(), product]));
      const fileSkus = new Set();
      const reviewed = rows.map(sourceRow => {
        const row = normalizeLookupProduct(sourceRow, lookups);
        const errors = [...row.errors];
        if (row.product.sku && fileSkus.has(row.product.sku)) errors.push('Duplicate Model ID in this workbook');
        if (row.product.sku) fileSkus.add(row.product.sku);
        return { ...row, errors, existingProduct: existingBySku.get(row.product.sku) || null };
      });
      // A catalog backup is primarily a restore artifact. Default to upsert so
      // existing Model IDs are reviewed for changes instead of being skipped.
      setImportMode('update');
      setImportRows(reviewed);
      setImportOpen(true);
    } catch (error) {
      setImportRows([{ rowNumber: '-', product: { sku: '', brand: '', name: '' }, errors: [error.message] }]);
      setImportOpen(true);
    } finally { setTransferBusy(false); }
  };

  const commitImport = async () => {
    const validRows = importRows.filter(isRowReady);
    if (!validRows.length) return;
    setTransferBusy(true);
    const failures = [];
    let created = 0;
    let updated = 0;
    const operations = validRows.map(row => ({
      action: importMode === 'update' && row.existingProduct ? 'update' : 'create',
      id: row.existingProduct?.id,
      rowNumber: row.rowNumber,
      sku: row.product.sku,
      product: importMode === 'update' && row.existingProduct ? getUpdatePayload(row) : row.product,
    }));
    const batchSize = 10;
    for (let start = 0; start < operations.length; start += batchSize) {
      const batch = operations.slice(start, start + batchSize);
      try {
        const result = await bulkSaveProducts(batch);
        created += Number(result.created || 0);
        updated += Number(result.updated || 0);
        failures.push(...(result.failures || []));
      }
      catch (error) { batch.forEach(item => failures.push({ rowNumber: item.rowNumber, sku: item.sku, message: error.message || 'Product batch failed.' })); }
    }
    setImportResult({ created, updated, failures });
    setTransferBusy(false);
    if ((created || updated) && typeof onCatalogChanged === 'function') onCatalogChanged();
  };
  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <div className="flex border-b border-white/5 gap-6 pb-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setCatalogSubTab('products')}
          className={`pb-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
            catalogSubTab === 'products' ? 'border-[#C8AE7D] text-[#F4F1EC]' : 'border-transparent text-[#77736D] hover:text-white'
          }`}
        >
          Products Catalog
        </button>
        <button
          onClick={() => setCatalogSubTab('lookups')}
          className={`pb-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
            catalogSubTab === 'lookups' ? 'border-[#C8AE7D] text-[#F4F1EC]' : 'border-transparent text-[#77736D] hover:text-white'
          }`}
        >
          Lookup Settings
        </button>
      </div>

      {catalogSubTab === 'products' && (
        <div className="space-y-6">
          {/* Search Bar & Actions */}
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/[0.09] bg-[#080808] px-3.5 py-2.5 focus-within:border-[#C8AE7D]/40">
              <Search size={14} className="text-zinc-500" />
              <input
                type="text"
                placeholder="Search castings by name, SKU, brand..."
                value={inventorySearchQuery}
                onChange={(e) => setInventorySearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs text-white placeholder-zinc-600 focus:outline-none w-full"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleImportFile} />
              <details className="relative">
                <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.04] px-4 text-[10px] font-bold uppercase tracking-wider text-[#D8D3CB] transition hover:bg-white/[0.08] [&::-webkit-details-marker]:hidden">
                  {transferBusy ? <RefreshCw size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />} Backup
                </summary>
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-64 overflow-hidden rounded-xl border border-white/[0.11] bg-[#151412] p-1.5 shadow-[0_18px_45px_rgba(0,0,0,.65)]">
                  <button type="button" disabled={transferBusy} onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); handleExport(); }} className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-[#EEEAE2] hover:bg-white/[0.06] disabled:opacity-40">
                    <Download size={14} className="mt-0.5 shrink-0 text-[#C8AE7D]" />
                    <span><strong className="block font-semibold">Export catalog</strong><small className="mt-0.5 block text-[9px] leading-relaxed text-[#77736D]">Back up every product and its image references.</small></span>
                  </button>
                  <button type="button" disabled={transferBusy} onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); fileInputRef.current?.click(); }} className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-[#EEEAE2] hover:bg-white/[0.06] disabled:opacity-40">
                    <Upload size={14} className="mt-0.5 shrink-0 text-[#C8AE7D]" />
                    <span><strong className="block font-semibold">Import backup</strong><small className="mt-0.5 block text-[9px] leading-relaxed text-[#77736D]">Review additions and updates before saving.</small></span>
                  </button>
                  <button type="button" disabled={transferBusy} onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); handleTemplateDownload(); }} className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-[#EEEAE2] hover:bg-white/[0.06] disabled:opacity-40">
                    <FileSpreadsheet size={14} className="mt-0.5 shrink-0 text-[#C8AE7D]" />
                    <span><strong className="block font-semibold">Blank template</strong><small className="mt-0.5 block text-[9px] leading-relaxed text-[#77736D]">Download a validated workbook for adding products.</small></span>
                  </button>
                </div>
              </details>
            <button
              onClick={() => {
                setEditingProductId(null);
                if (typeof setEditingProductData === 'function') setEditingProductData(null);
                setIsAddingProduct(true);
              }}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[#C8AE7D]/25 bg-[#C8AE7D]/[0.09] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#E1BD65] transition hover:bg-[#C8AE7D]/[0.16]"
            >
              <Plus size={14} /> Add Casting
            </button>
            </div>
          </div>

          {importOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/75 p-3 backdrop-blur-sm md:p-6">
              <div className="flex h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/[0.1] bg-[#11110F] shadow-2xl md:h-[min(88vh,780px)]">
                <div className="flex shrink-0 items-start justify-between border-b border-white/[0.08] p-5 md:p-6">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#C8AE7D]">Catalog import</p>
                    <h3 className="mt-2 text-xl font-semibold text-[#F4F1EC]">Review catalog changes</h3>
                    <p className="mt-1 text-xs text-[#858078]">Choose whether existing Model IDs should be skipped or updated. Nothing changes until you confirm.</p>
                  </div>
                  <button onClick={() => setImportOpen(false)} className="rounded-full border border-white/[0.09] p-2 text-[#A09B93] hover:text-white"><X size={17} /></button>
                </div>
                <div
                  className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain p-4 [scrollbar-color:#5F5748_#171512] md:p-6"
                  data-lenis-prevent="true"
                  data-lenis-prevent-wheel="true"
                  data-lenis-prevent-touch="true"
                >
                  <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-white/[0.08] bg-black/20 p-2 sm:flex-row">
                    <button type="button" onClick={() => { setImportMode('create'); setImportResult(null); }} className={`flex-1 rounded-xl px-4 py-3 text-left transition ${importMode === 'create' ? 'bg-[#E8E2D8] text-[#111]' : 'text-[#A9A49C] hover:bg-white/[0.04]'}`}>
                      <strong className="block text-xs">Add new products only</strong>
                      <span className="mt-1 block text-[10px] opacity-70">Existing Model IDs are skipped.</span>
                    </button>
                    <button type="button" onClick={() => { setImportMode('update'); setImportResult(null); }} className={`flex-1 rounded-xl px-4 py-3 text-left transition ${importMode === 'update' ? 'bg-[#E8E2D8] text-[#111]' : 'text-[#A9A49C] hover:bg-white/[0.04]'}`}>
                      <strong className="block text-xs">Add new and update existing</strong>
                      <span className="mt-1 block text-[10px] opacity-70">Matches by Model ID. Restores image URLs when included; otherwise preserves existing images.</span>
                    </button>
                  </div>
                  <div className="mb-4 grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-white/[0.08] p-3"><span className="text-[9px] uppercase text-[#77736D]">Rows</span><strong className="mt-1 block text-lg text-white">{importRows.length}</strong></div>
                    <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-3"><span className="text-[9px] uppercase text-emerald-300/70">Ready</span><strong className="mt-1 block text-lg text-emerald-300">{importRows.filter(isRowReady).length}</strong></div>
                    <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-3"><span className="text-[9px] uppercase text-amber-200/70">Skipped</span><strong className="mt-1 block text-lg text-amber-200">{importRows.filter(row => !isRowReady(row)).length}</strong></div>
                  </div>
                  <div className="space-y-2">
                    {importRows.map((row, index) => {
                      const rowErrors = getRowErrors(row);
                      const changes = getRowChanges(row);
                      const isExistingUpdate = importMode === 'update' && row.existingProduct;
                      const action = isExistingUpdate ? (changes.length ? `Update product · ${changes.length} changes` : 'No changes') : 'Create product';
                      return (
                      <div key={`${row.rowNumber}-${index}`} className="overflow-hidden rounded-xl border border-white/[0.07] bg-black/20">
                        <div className="grid gap-2 p-3 sm:grid-cols-[1fr_auto] md:grid-cols-[55px_120px_minmax(0,1fr)_90px_minmax(150px,1fr)] md:items-center">
                          <span className="text-[10px] text-[#66625C]">Row {row.rowNumber}</span>
                          <span className="font-mono text-xs text-[#D8D3CB]">{row.product.sku || 'No ID'}</span>
                          <span className="truncate text-xs text-[#EEEAE2]">{row.product.brand} {row.product.name}</span>
                          <span className="flex items-center gap-1.5 text-[10px] text-[#9B968E]">
                            <PackageCheck size={13} className="shrink-0 text-[#C8AE7D]" />
                            Stock
                            {row.existingProduct && importMode === 'update' ? (
                              <strong className="font-mono text-[#EEEAE2]">
                                {existingValue(row.existingProduct, 'availableStock') ?? 0} → {row.product.availableStock ?? 0}
                              </strong>
                            ) : (
                              <strong className="font-mono text-[#EEEAE2]">{row.product.availableStock ?? 0}</strong>
                            )}
                          </span>
                          <span className={`flex items-start gap-1.5 text-[10px] ${rowErrors.length ? 'text-amber-200' : (isExistingUpdate && !changes.length ? 'text-[#77736D]' : 'text-emerald-300')}`}>
                            {rowErrors.length ? <AlertTriangle size={13} className="shrink-0" /> : <CheckCircle2 size={13} className="shrink-0" />}
                            {rowErrors.join('; ') || action}
                          </span>
                        </div>
                        {!rowErrors.length && changes.length > 0 && (
                          <details className="border-t border-white/[0.06]" data-lenis-prevent="true">
                            <summary className="cursor-pointer list-none px-3 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#B8A77E] hover:bg-white/[0.025] [&::-webkit-details-marker]:hidden">
                              Preview {changes.length} {changes.length === 1 ? 'change' : 'changes'}
                            </summary>
                            <div className="grid gap-px bg-white/[0.05] sm:grid-cols-2">
                              {changes.map(change => (
                                <div key={change.key} className="min-w-0 bg-[#0C0C0B] p-3">
                                  <span className="block text-[8px] font-bold uppercase tracking-[0.14em] text-[#66625C]">{change.label}</span>
                                  {change.isNew ? (
                                    <strong className="mt-1 block break-words text-[11px] font-medium text-emerald-200">{change.after}</strong>
                                  ) : (
                                    <div className="mt-1 grid grid-cols-[1fr_auto_1fr] items-start gap-2 text-[11px]">
                                      <span className="break-words text-[#77736D] line-through">{change.before || 'Empty'}</span>
                                      <span className="text-[#5F5A53]">→</span>
                                      <strong className="break-words font-medium text-[#F1ECE4]">{change.after || 'Empty'}</strong>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    );})}
                  </div>
                  {importResult && <div className="mt-4 rounded-xl border border-[#C8AE7D]/20 bg-[#C8AE7D]/[0.06] p-4 text-sm text-[#E7E2DA]">Created {importResult.created} and updated {importResult.updated} products. {importResult.failures.length ? `${importResult.failures.length} failed during save.` : 'All valid rows were saved.'}</div>}
                </div>
                <div className="flex shrink-0 items-center justify-end gap-3 border-t border-white/[0.08] bg-[#11110F] p-4 md:px-6">
                  <button onClick={() => setImportOpen(false)} className="rounded-full px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#9A958D]">Close</button>
                  <button disabled={transferBusy || importResult || !importRows.some(isRowReady)} onClick={commitImport} className="flex items-center gap-2 rounded-full bg-[#E8E2D8] px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-[#111] disabled:opacity-40">
                    {transferBusy && <RefreshCw size={13} className="animate-spin" />} Confirm {importRows.filter(isRowReady).length} rows
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Marketplace-style catalog grid */}
          <div className="grid gap-3 md:grid-cols-2 md:gap-4 2xl:grid-cols-3">
            {filteredCars.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.1] bg-[#0A0A09] px-5 py-10 text-center">
                <p className="text-sm font-semibold text-[#D8D3CB]">No products found</p>
                <p className="mt-1 text-xs text-[#706C65]">Try another name, product code, or brand.</p>
              </div>
            ) : filteredCars.map(car => {
              const isPoItem = car.isPrebook || car.is_prebook || car.status === 'Pre-Order';
              const casing = Array.isArray(car.casing_types || car.casingTypes)
                ? (car.casing_types || car.casingTypes).join(', ')
                : (car.casing || car.casingType || 'Blister');

              return (
                <article
                  key={car.id}
                  onClick={() => handleEditProduct(car)}
                  className="group relative rounded-2xl border border-white/[0.09] bg-[#0A0A09] shadow-[0_14px_40px_rgba(0,0,0,.16)] transition duration-300 hover:-translate-y-0.5 hover:border-[#C8AE7D]/25 hover:shadow-[0_20px_55px_rgba(0,0,0,.3)] active:scale-[0.99]"
                >
                  <div className="flex gap-3 p-3.5 md:block md:p-0">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/[0.07] bg-[#11110F] md:h-52 md:w-full md:rounded-b-none md:rounded-t-2xl md:border-0 md:border-b">
                      <img src={car.image || '/vault-1.png'} alt="" className="h-full w-full object-contain p-1 md:p-4" />
                    </div>

                    <div className="min-w-0 flex-1 py-0.5 md:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B8A77E]">{car.brand || 'Unbranded'}</p>
                          <h4 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-[#F4F1EC]">{car.name}</h4>
                        </div>
                        <ArrowUpRight size={16} className="mt-0.5 shrink-0 text-[#827D74]" />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] ${
                          isPoItem
                            ? 'border-[#C8AE7D]/25 bg-[#C8AE7D]/10 text-[#D7BD85]'
                            : 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300'
                        }`}>
                          {isPoItem ? 'Pre-booking' : 'In stock'}
                        </span>
                        {(car.isFeatured || car.is_featured) && (
                          <span className="rounded-full border border-[#E1BD65]/25 bg-[#E1BD65]/10 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-[#E1BD65]">Featured</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 border-t border-white/[0.07] bg-white/[0.015]">
                    <div className="min-w-0 px-3 py-2.5">
                      <span className="block text-[8px] uppercase tracking-[0.14em] text-[#625F59]">Product code</span>
                      <strong className="mt-1 block truncate font-mono text-[11px] font-medium text-[#C8C3BB]">{car.sku || 'Not set'}</strong>
                    </div>
                    <div className="min-w-0 border-x border-white/[0.07] px-3 py-2.5">
                      <span className="block text-[8px] uppercase tracking-[0.14em] text-[#625F59]">Packaging</span>
                      <strong className="mt-1 block truncate text-[11px] font-medium text-[#C8C3BB]">{casing}</strong>
                    </div>
                    <div className="min-w-0 px-3 py-2.5 text-right">
                      <span className="block text-[8px] uppercase tracking-[0.14em] text-[#625F59]">Price</span>
                      <strong className="mt-1 block truncate text-sm font-semibold text-[#F4F1EC]">₹{Number(car.price || 0).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] p-2.5">
                    <p className="pl-1 text-[9px] uppercase tracking-[0.12em] text-[#625F59]">Select card to edit</p>
                    <details
                      className="group/actions relative"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.045] px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#E7E2DA] transition active:bg-white/[0.08] [&::-webkit-details-marker]:hidden">
                        <MoreHorizontal size={15} />
                        Actions
                      </summary>
                      <div className="absolute bottom-[calc(100%+0.5rem)] right-0 z-20 w-48 overflow-hidden rounded-xl border border-white/[0.11] bg-[#151412] p-1.5 shadow-[0_18px_45px_rgba(0,0,0,.65)]">
                        <button
                          type="button"
                          onClick={(event) => { event.stopPropagation(); handleEditProduct(car); }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-[#EEEAE2] transition hover:bg-white/[0.06]"
                        >
                          <Pencil size={14} className="text-[#C8AE7D]" /> Edit product
                        </button>
                        {isPoItem && (
                          <button
                            type="button"
                            onClick={(event) => { event.stopPropagation(); handleConvertPoToStock(car.id); }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/[0.08]"
                          >
                            <PackageCheck size={14} /> Move to stock
                          </button>
                        )}
                        <div className="my-1 h-px bg-white/[0.07]" />
                        <button
                          type="button"
                          onClick={(event) => { event.stopPropagation(); handleDeleteProduct(car.id); }}
                          disabled={loadingProductId !== null || isArchivingProductId !== null}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-red-300 transition hover:bg-red-500/[0.08] disabled:opacity-40"
                        >
                          {isArchivingProductId === car.id ? <RefreshCw className="animate-spin" size={14} /> : <Trash2 size={14} />}
                          Delete product
                        </button>
                      </div>
                    </details>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Legacy table retained in source for reference; card grid is the active catalog UI. */}
          <div className="hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.07] bg-[#11110F] text-[9px] uppercase tracking-widest text-[#77736D]">
                  <th className="p-4 font-bold">Casting</th>
                  <th className="p-4 font-bold">SKU</th>
                  <th className="p-4 font-bold">Type</th>
                  <th className="p-4 font-bold">Selling Price</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCars.map(car => {
                  const isPoItem = car.isPrebook || car.is_prebook || car.status === 'Pre-Order';
                  return (
                    <tr 
                      key={car.id} 
                      onClick={() => handleEditProduct(car)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleEditProduct(car);
                        }
                      }}
                      tabIndex={0}
                      aria-label={`Edit ${car.name}`}
                      className="cursor-pointer border-b border-white/5 transition-colors hover:bg-[#C8AE7D]/[0.045] focus-visible:bg-[#C8AE7D]/[0.06] focus-visible:outline-none"
                    >
                      <td className="p-4 flex items-center gap-3">
                        <img src={car.image || '/vault-1.png'} className="w-10 h-8 object-cover rounded border border-white/5" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white block">{car.name}</span>
                            {(car.isFeatured || car.is_featured) && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-[#E1BD65]/20 text-[#E1BD65] border border-[#E1BD65]/40 flex items-center gap-0.5" title="Featured on Homepage">
                                ★ Featured
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#888888] uppercase tracking-wider">{car.brand} • {car.category} • {Array.isArray(car.casing_types || car.casingTypes) ? (car.casing_types || car.casingTypes).join(', ') : (car.casing || car.casingType || 'Blister')}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-[#888888]">{car.sku}</td>
                      <td className="p-4">
                        {isPoItem ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#ff5500]/15 text-[#ff5500] border border-[#ff5500]/30 shadow-[0_0_10px_rgba(225,6,0,0.15)] animate-pulse">
                            Pre-booking
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-green-500/15 text-green-400 border border-green-500/30">
                            In-Stock
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-mono">
                        <div className="text-white font-bold">₹{car.price}</div>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          {isPoItem && (
                            <button
                              onClick={(event) => { event.stopPropagation(); handleConvertPoToStock(car.id); }}
                              title="Convert PO to In-Stock"
                              className="px-2 py-1 rounded bg-green-500/10 hover:bg-green-500/20 text-green-400 font-bold text-[9px] uppercase tracking-wider border border-green-500/30 transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95 whitespace-nowrap"
                            >
                              ✓ To Stock
                            </button>
                          )}
                          {loadingProductId === car.id && <RefreshCw className="mr-2 animate-spin text-[#E1BD65]" size={13} />}
                          <button 
                            onClick={(event) => { event.stopPropagation(); handleDeleteProduct(car.id); }}
                            disabled={loadingProductId !== null || isArchivingProductId !== null}
                            title="Delete Casting"
                            className="text-red-400 hover:text-red-300 p-1.5 rounded bg-red-500/5 hover:bg-red-500/10 transition-colors border border-red-500/10 cursor-pointer inline-flex disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {isArchivingProductId === car.id ? <RefreshCw className="animate-spin" size={12} /> : <Trash2 size={12} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={inventoryPage}
            totalPages={inventoryTotalPages}
            totalItems={inventoryTotal}
            onPageChange={setInventoryPage}
          />
        </div>
      )}



      {catalogSubTab === 'lookups' && (
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
          <MasterData />
        </div>
      )}
    </div>
  );
}
