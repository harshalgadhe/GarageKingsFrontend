import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Plus, Trash2, Edit2, AlertTriangle, ArrowRight, Settings, Image as ImageIcon, Check } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { 
  getBrands, createBrand,
  getManufacturers, createManufacturer,
  getScales, createScale,
  getSeries, createSeries,
  uploadImageToStorage
} from '../../lib/db';

export default function ProductForm({
  productId = null, // null when creating
  initialData = null,
  onSave,
  onCancel,
  creatorEmail
}) {
  // Master lists
  const [brands, setBrands] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [scales, setScales] = useState([]);
  const [seriesList, setSeriesList] = useState([]);
  const [casingTypes, setCasingTypes] = useState([
    { id: 'BOX', name: 'BOX', display_name: 'Box' },
    { id: 'BLISTER', name: 'BLISTER', display_name: 'Blister' },
    { id: 'ACRYLIC', name: 'ACRYLIC', display_name: 'Acrylic' }
  ]);

  // Form State
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [scale, setScale] = useState('1:64');
  const [series, setSeries] = useState('Standard Edition');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('JDM');
  const [tags, setTags] = useState([]);
  const [showOnHomepage, setShowOnHomepage] = useState(true);
  const [maxQtyPerCustomer, setMaxQtyPerCustomer] = useState('');
  
  // Multi-variants list
  const [variants, setVariants] = useState([
    {
      id: `temp-${Date.now()}`,
      casing: 'BOX',
      sku: '',
      barcode: '',
      price: '',
      purchasePrice: '',
      weight: '',
      dimensions: '',
      attributesJson: '{}',
      isVisible: true,
      status: 'Active',
      salesStatus: 'Available',
      isPrebook: false,
      customerEta: '',
      prebookDepositAmount: '',
      maxPreorders: '',
      preorderNotes: '',
      displayMessage: '',
      isCollapsed: false
    }
  ]);

  // Image Uploads
  const [productImage, setProductImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Preview Variant selection
  const [previewVariantIndex, setPreviewVariantIndex] = useState(0);

  // Load lookup lists on mount
  const loadLookups = async () => {
    try {
      const [b, m, sc, sr] = await Promise.all([
        getBrands(false),
        getManufacturers(false),
        getScales(false),
        getSeries(false)
      ]);
      setBrands(b);
      setManufacturers(m);
      setScales(sc);
      setSeriesList(sr);
    } catch (err) {
      console.error('Error loading lookup lists:', err);
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  // Hydrate form if editing
  useEffect(() => {
    if (initialData) {
      setBrand(initialData.brand || '');
      setName(initialData.name || '');
      setManufacturer(initialData.manufacturer || '');
      setScale(initialData.scale || '1:64');
      setSeries(initialData.series || 'Standard Edition');
      setDescription(initialData.description || '');
      setCategory(initialData.category || 'JDM');
      setTags(initialData.tags || []);
      setShowOnHomepage(initialData.showOnHomepage ?? true);
      setMaxQtyPerCustomer(initialData.maxQtyPerCustomer || '');
      
      if (initialData.image) {
        setProductImage(initialData.image);
      } else if (initialData.images && initialData.images.length > 0) {
        setProductImage(initialData.images[0].fullUrl || initialData.images[0].thumbnailUrl || initialData.images[0].url || '');
      }

      if (initialData.variants && initialData.variants.length > 0) {
        setVariants(initialData.variants.map((v, idx) => ({
          id: v.id,
          casing: v.casing || 'BOX',
          sku: v.sku || '',
          barcode: v.barcode || '',
          price: v.sellingPrice || '',
          purchasePrice: v.purchasePrice || '',
          weight: v.weight || '',
          dimensions: v.dimensions ? JSON.stringify(v.dimensions) : '',
          attributesJson: v.variantAttributes ? JSON.stringify(v.variantAttributes, null, 2) : '{}',
          isVisible: v.visibility ?? true,
          status: v.status || 'Active',
          salesStatus: v.salesStatus || 'Available',
          isPrebook: v.isPrebook ?? (v.salesStatus === 'Preorder' || initialData.isPrebook || false),
          customerEta: v.customerEta || initialData.arrivalDate || '',
          prebookDepositAmount: v.prebookDepositAmount || initialData.prebookDepositAmount || '',
          maxPreorders: v.maxPreorders || '',
          preorderNotes: v.preorderNotes || '',
          displayMessage: v.displayMessage || '',
          isCollapsed: true
        })));
      }
    }
  }, [initialData]);

  // Inline creation handlers
  const handleCreateBrand = async (newBrandName) => {
    try {
      const created = await createBrand({ name: newBrandName });
      setBrands(prev => [...prev, created]);
      setBrand(created.name);
    } catch (err) {
      console.error(err);
      alert('Failed to create brand.');
    }
  };

  const handleCreateManufacturer = async (newName) => {
    try {
      const created = await createManufacturer({ name: newName });
      setManufacturers(prev => [...prev, created]);
      setManufacturer(created.name);
    } catch (err) {
      console.error(err);
      alert('Failed to create manufacturer.');
    }
  };

  const handleCreateScale = async (newName) => {
    try {
      const created = await createScale({ name: newName });
      setScales(prev => [...prev, created]);
      setScale(created.name);
    } catch (err) {
      console.error(err);
      alert('Failed to create scale.');
    }
  };

  const handleCreateSeries = async (newName) => {
    try {
      const created = await createSeries({ name: newName });
      setSeriesList(prev => [...prev, created]);
      setSeries(created.name);
    } catch (err) {
      console.error(err);
      alert('Failed to create series.');
    }
  };

  // Image Upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImageToStorage(file);
      setProductImage(url);
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Variant operations
  const addVariant = () => {
    const defaultSku = variants[0]?.sku ? `${variants[0].sku.split('-')[0]}-${Date.now().toString().slice(-4)}` : '';
    setVariants(prev => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        casing: 'BOX',
        sku: defaultSku,
        barcode: '',
        price: variants[0]?.price || '',
        purchasePrice: variants[0]?.purchasePrice || '',
        weight: '',
        dimensions: '',
        attributesJson: '{}',
        isVisible: true,
        status: 'Active',
        salesStatus: 'Available',
        isPrebook: false,
        customerEta: '',
        prebookDepositAmount: '',
        maxPreorders: '',
        preorderNotes: '',
        displayMessage: '',
        isCollapsed: false
      }
    ]);
  };

  const deleteVariant = (id) => {
    if (variants.length <= 1) return;
    setVariants(prev => prev.filter(v => v.id !== id));
    setPreviewVariantIndex(0);
  };

  const updateVariantField = (id, field, val) => {
    setVariants(prev => prev.map(v => {
      if (v.id !== id) return v;
      const updated = { ...v, [field]: val };
      
      // Auto-toggle preorder sales status if preorder toggle changed
      if (field === 'isPrebook') {
        updated.salesStatus = val ? 'Preorder' : 'Available';
      }
      return updated;
    }));
  };

  const toggleCollapse = (id) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, isCollapsed: !v.isCollapsed } : v));
  };

  // Validations
  const validateForm = () => {
    setValidationError('');
    if (!brand) return 'Product Brand is required.';
    if (!name.trim()) return 'Casting Model Name is required.';
    if (variants.length === 0) return 'At least one variant must be created.';
    
    // Check duplicates and values
    const skus = new Set();
    const barcodes = new Set();

    for (const [idx, v] of variants.entries()) {
      const label = `Variant ${idx + 1} (${v.casing})`;
      if (!v.sku.trim()) return `${label} SKU is required.`;
      if (skus.has(v.sku.trim())) return `Duplicate SKU found: ${v.sku.trim()}`;
      skus.add(v.sku.trim());

      if (v.barcode.trim()) {
        if (barcodes.has(v.barcode.trim())) return `Duplicate Barcode found: ${v.barcode.trim()}`;
        barcodes.add(v.barcode.trim());
      }

      if (!v.price || Number(v.price) <= 0) return `${label} Selling Price must be positive.`;

      // Preorder validation
      if (v.isPrebook) {
        if (!v.customerEta.trim()) return `${label} Customer ETA Message is required (e.g. Expected August 2026).`;
        if (v.prebookDepositAmount && Number(v.prebookDepositAmount) > Number(v.price)) {
          return `${label} Deposit Amount cannot exceed selling price.`;
        }
      }
    }
    return '';
  };

  // Submit Handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errorMsg = validateForm();
    if (errorMsg) {
      setValidationError(errorMsg);
      return;
    }

    setIsSubmitting(true);
    try {
      const mappedVariants = variants.map(v => {
        let parsedAttrs = {};
        try {
          parsedAttrs = JSON.parse(v.attributesJson || '{}');
        } catch(e) {}

        return {
          id: v.id.startsWith('temp-') ? undefined : v.id,
          casing: v.casing,
          sku: v.sku.trim(),
          barcode: v.barcode.trim() || null,
          price: Number(v.price),
          purchasePrice: v.purchasePrice ? Number(v.purchasePrice) : null,
          weight: v.weight ? Number(v.weight) : null,
          dimensions: v.dimensions || null,
          variantAttributes: parsedAttrs,
          isVisible: v.isVisible,
          status: v.status,
          salesStatus: v.salesStatus,
          isPrebook: v.isPrebook,
          customerEta: v.isPrebook ? v.customerEta : null,
          prebookDepositAmount: v.isPrebook && v.prebookDepositAmount ? Number(v.prebookDepositAmount) : null,
          maxPreorders: v.isPrebook && v.maxPreorders ? parseInt(v.maxPreorders) : null,
          preorderNotes: v.isPrebook ? v.preorderNotes : null,
          displayMessage: v.isPrebook ? v.displayMessage : null
        };
      });

      const productPayload = {
        brand,
        name: name.trim(),
        manufacturer: manufacturer || null,
        scale,
        series,
        description: description.trim(),
        category,
        tags,
        showOnHomepage,
        maxQtyPerCustomer: maxQtyPerCustomer ? parseInt(maxQtyPerCustomer) : null,
        image: productImage || null,
        variants: mappedVariants
      };

      await onSave(productPayload);
    } catch (err) {
      console.error(err);
      setValidationError(err.message || 'Failed to save product database record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Current preview variant
  const previewVar = variants[previewVariantIndex] || variants[0] || {};

  return (
    <div className="space-y-6 text-xs selection:bg-[#ff5500] selection:text-black">
      
      {/* Validation Header */}
      {validationError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl font-semibold flex items-center gap-2">
          <AlertTriangle size={14} className="flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Grid: Left Form fields, Right Live Preview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Form Fields */}
        <form onSubmit={handleFormSubmit} className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Master Product Information */}
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ff5500] border-b border-white/5 pb-2">
              1. Master Product Profile
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SearchableSelect 
                label="Product Brand"
                value={brand}
                onChange={setBrand}
                options={brands}
                onCreateNew={handleCreateBrand}
                placeholder="Search or Create Brand..."
                required
              />
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Model Casting Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Nissan Silvia S15"
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 text-xs" 
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SearchableSelect 
                label="Manufacturer"
                value={manufacturer}
                onChange={setManufacturer}
                options={manufacturers}
                onCreateNew={handleCreateManufacturer}
                placeholder="Select Manufacturer..."
              />
              <SearchableSelect 
                label="Scale"
                value={scale}
                onChange={setScale}
                options={scales}
                onCreateNew={handleCreateScale}
                placeholder="e.g. 1:64"
                required
              />
              <SearchableSelect 
                label="Product Series"
                value={series}
                onChange={setSeries}
                options={seriesList}
                onCreateNew={handleCreateSeries}
                placeholder="Select Series..."
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Description</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Product copy write-up..." 
                rows={3}
                className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Category</label>
                <input 
                  type="text" 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 text-xs" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Customer Max Qty</label>
                <input 
                  type="number" 
                  value={maxQtyPerCustomer} 
                  onChange={e => setMaxQtyPerCustomer(e.target.value)} 
                  placeholder="Unrestricted"
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 font-mono text-xs" 
                />
              </div>
              <div className="flex items-center justify-between p-3.5 bg-[#141414] border border-white/5 rounded-xl">
                <span className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Featured Homepage</span>
                <input 
                  type="checkbox" 
                  checked={showOnHomepage} 
                  onChange={e => setShowOnHomepage(e.target.checked)} 
                  className="w-4 h-4 accent-[#ff5500]"
                />
              </div>
            </div>

            {/* Media Upload */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Product Primary Image</label>
              <div className="flex items-center gap-4">
                <input 
                  type="text" 
                  value={productImage} 
                  onChange={e => setProductImage(e.target.value)} 
                  placeholder="URL to image asset..." 
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 text-xs"
                />
                <div className="relative">
                  <input 
                    type="file" 
                    id="product-image-upload" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    accept="image/*"
                  />
                  <label 
                    htmlFor="product-image-upload"
                    className="px-4 py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white cursor-pointer transition-colors font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <ImageIcon size={12} />
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </label>
                </div>
              </div>
            </div>

          </div>

          {/* Section 2: Collapsible Variants */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ff5500]">
                2. Product Casing Variants ({variants.length})
              </h4>
              <button
                type="button"
                onClick={addVariant}
                className="bg-white/5 hover:bg-white/10 text-white font-extrabold text-[9px] px-3.5 py-2 rounded-lg border border-white/5 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Add Variant
              </button>
            </div>

            {variants.map((v, idx) => (
              <div 
                key={v.id} 
                className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-md"
              >
                {/* Header bar of variant card */}
                <div 
                  className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/[0.04]"
                  onClick={() => toggleCollapse(v.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white font-mono text-xs">#{idx + 1}</span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-[#ff5500]/10 border border-[#ff5500]/20 text-[#ff5500] rounded">
                      {v.casing}
                    </span>
                    <span className="text-zinc-500 font-mono font-bold text-[10px]">{v.sku || '(No SKU)'}</span>
                    {v.isPrebook && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded">
                        Preorder
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button 
                      type="button"
                      onClick={() => toggleCollapse(v.id)}
                      className="text-xs font-bold text-zinc-400 hover:text-white px-2 py-1"
                    >
                      {v.isCollapsed ? 'Expand' : 'Collapse'}
                    </button>
                    {variants.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => deleteVariant(v.id)}
                        className="p-1 rounded text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible Content */}
                {!v.isCollapsed && (
                  <div className="p-6 space-y-4">
                    
                    {/* Basic properties */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Casing Type</label>
                        <select
                          value={v.casing}
                          onChange={e => updateVariantField(v.id, 'casing', e.target.value)}
                          className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 text-xs"
                        >
                          <option value="BOX">Box</option>
                          <option value="BLISTER">Blister</option>
                          <option value="ACRYLIC">Acrylic</option>
                          <option value="RAW">Raw</option>
                          <option value="SIGNED">Signed</option>
                          <option value="LIMITED">Limited</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Variant SKU</label>
                        <input
                          type="text"
                          value={v.sku}
                          onChange={e => updateVariantField(v.id, 'sku', e.target.value)}
                          placeholder="e.g. MGT007-BOX"
                          className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 font-mono text-xs"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Barcode (Optional)</label>
                        <input
                          type="text"
                          value={v.barcode}
                          onChange={e => updateVariantField(v.id, 'barcode', e.target.value)}
                          placeholder="UPC/EAN code"
                          className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Selling Price (INR)</label>
                        <input
                          type="number"
                          value={v.price}
                          onChange={e => updateVariantField(v.id, 'price', e.target.value)}
                          placeholder="1200"
                          className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 font-mono text-xs"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Estimated Cost</label>
                        <input
                          type="number"
                          value={v.purchasePrice}
                          onChange={e => updateVariantField(v.id, 'purchasePrice', e.target.value)}
                          placeholder="450"
                          className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Weight (g)</label>
                        <input
                          type="number"
                          value={v.weight}
                          onChange={e => updateVariantField(v.id, 'weight', e.target.value)}
                          placeholder="80"
                          className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Dimensions</label>
                        <input
                          type="text"
                          value={v.dimensions}
                          onChange={e => updateVariantField(v.id, 'dimensions', e.target.value)}
                          placeholder="L x W x H"
                          className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 font-mono text-xs"
                        />
                      </div>
                    </div>

                    {/* Preorder support */}
                    <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-white">Enable Preorder</div>
                          <div className="text-[9px] text-[#888]">Allows customers to book this casing variant in advance</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={v.isPrebook}
                          onChange={e => updateVariantField(v.id, 'isPrebook', e.target.checked)}
                          className="w-4 h-4 accent-[#ff5500] cursor-pointer"
                        />
                      </div>

                      {v.isPrebook && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-white/5">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#888888] uppercase tracking-widest">Customer ETA</label>
                            <input
                              type="text"
                              value={v.customerEta}
                              onChange={e => updateVariantField(v.id, 'customerEta', e.target.value)}
                              placeholder="e.g. Expected August 2026"
                              className="w-full bg-[#141414] border border-white/5 rounded-xl px-3.5 py-2.5 text-white focus:outline-none text-xs"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#888888] uppercase tracking-widest">Deposit Amount</label>
                            <input
                              type="number"
                              value={v.prebookDepositAmount}
                              onChange={e => updateVariantField(v.id, 'prebookDepositAmount', e.target.value)}
                              placeholder="Optional partial payment"
                              className="w-full bg-[#141414] border border-white/5 rounded-xl px-3.5 py-2.5 text-white focus:outline-none font-mono text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#888888] uppercase tracking-widest">Max Preorders</label>
                            <input
                              type="number"
                              value={v.maxPreorders}
                              onChange={e => updateVariantField(v.id, 'maxPreorders', e.target.value)}
                              placeholder="Unlimited"
                              className="w-full bg-[#141414] border border-white/5 rounded-xl px-3.5 py-2.5 text-white focus:outline-none font-mono text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#888888] uppercase tracking-widest">Display Message</label>
                            <input
                              type="text"
                              value={v.displayMessage}
                              onChange={e => updateVariantField(v.id, 'displayMessage', e.target.value)}
                              placeholder="e.g. Pre-orders close soon"
                              className="w-full bg-[#141414] border border-white/5 rounded-xl px-3.5 py-2.5 text-white focus:outline-none text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sales status and visibility */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Sales Status</label>
                        <select
                          value={v.salesStatus}
                          onChange={e => updateVariantField(v.id, 'salesStatus', e.target.value)}
                          className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 text-xs"
                        >
                          <option value="Available">Available</option>
                          <option value="Preorder">Preorder</option>
                          <option value="Coming Soon">Coming Soon</option>
                          <option value="Out of Stock">Out of Stock</option>
                          <option value="Discontinued">Discontinued</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-[#141414] border border-white/5 rounded-xl">
                        <span className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Active Status</span>
                        <select
                          value={v.status}
                          onChange={e => updateVariantField(v.id, 'status', e.target.value)}
                          className="bg-transparent border-none text-white focus:outline-none text-xs font-bold"
                        >
                          <option value="Active">Active</option>
                          <option value="Archived">Archived</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-[#141414] border border-white/5 rounded-xl">
                        <span className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Visibility</span>
                        <button
                          type="button"
                          onClick={() => updateVariantField(v.id, 'isVisible', !v.isVisible)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider cursor-pointer ${
                            v.isVisible 
                              ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                              : 'border-white/5 bg-white/5 text-zinc-500'
                          }`}
                        >
                          {v.isVisible ? <Eye size={10} /> : <EyeOff size={10} />}
                          {v.isVisible ? 'Visible' : 'Hidden'}
                        </button>
                      </div>
                    </div>

                    {/* JSON variant attributes */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Variant Attributes JSON</label>
                      <textarea
                        value={v.attributesJson}
                        onChange={e => updateVariantField(v.id, 'attributesJson', e.target.value)}
                        placeholder='{ "color": "Silver", "limitedNum": 1200 }'
                        rows={2}
                        className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 font-mono text-xs"
                      />
                    </div>

                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold text-[10px] px-8 py-3.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Check size={14} />
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white font-extrabold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>

        </form>

        {/* Right Column: Live Storefront Card Preview */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ff5500] border-b border-white/5 pb-2">
            Marketplace Preview Card
          </h4>
          
          <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden relative shadow-lg">
            
            {/* Image panel */}
            <div className="aspect-[4/3] bg-zinc-950 flex items-center justify-center relative overflow-hidden">
              {productImage ? (
                <img 
                  src={productImage} 
                  alt="Preview" 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                />
              ) : (
                <div className="text-zinc-700 flex flex-col items-center gap-1">
                  <ImageIcon size={32} />
                  <span className="text-[9px] uppercase tracking-widest">No Image Asset</span>
                </div>
              )}
              
              {/* Scale Badge */}
              <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-lg text-[9px] font-black font-mono text-[#ff5500] border border-[#ff5500]/20 uppercase tracking-widest">
                {scale || '1:64'}
              </div>
              
              {/* Sales Status Badge */}
              <div className="absolute top-3 right-3">
                <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                  previewVar.salesStatus === 'Preorder' 
                    ? 'bg-blue-500 text-black shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                    : previewVar.salesStatus === 'Coming Soon'
                    ? 'bg-purple-500 text-black'
                    : previewVar.salesStatus === 'Out of Stock'
                    ? 'bg-zinc-800 text-zinc-500'
                    : 'bg-[#ff5500] text-black shadow-[0_0_10px_rgba(255,85,0,0.3)]'
                }`}>
                  {previewVar.salesStatus || 'Available'}
                </span>
              </div>
            </div>

            {/* Preview Details */}
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  {brand || 'MINI GT'}
                </div>
                <div className="font-extrabold text-white text-sm line-clamp-1">
                  {name || 'Casting Name'}
                </div>
                <div className="text-[10px] font-bold text-zinc-400 font-mono">
                  {previewVar.sku || 'SKU-MIG-XXXXX'}
                </div>
              </div>

              {/* Price Details */}
              <div className="flex items-baseline justify-between border-t border-white/5 pt-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Selling Price</span>
                <span className="text-sm font-extrabold text-[#ff5500] font-mono">
                  ₹{Number(previewVar.price || 0).toLocaleString()}
                </span>
              </div>

              {/* Preorder information display */}
              {previewVar.isPrebook && (
                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-bold uppercase">
                    <span className="text-blue-400">Preorder Deposit</span>
                    <span className="text-white font-mono">
                      ₹{previewVar.prebookDepositAmount ? Number(previewVar.prebookDepositAmount).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  {previewVar.customerEta && (
                    <div className="text-[9px] text-[#888] font-bold">
                      Delivery: <span className="text-white">{previewVar.customerEta}</span>
                    </div>
                  )}
                  {previewVar.displayMessage && (
                    <div className="text-[8px] uppercase tracking-wider text-blue-400 font-semibold italic">
                      💡 {previewVar.displayMessage}
                    </div>
                  )}
                </div>
              )}

              {/* Casing variant pills selector */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Select Casing Variant</span>
                <div className="flex flex-wrap gap-1.5">
                  {variants.map((v, idx) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setPreviewVariantIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                        previewVariantIndex === idx
                          ? 'bg-[#ff5500]/10 border-[#ff5500]/40 text-[#ff5500]'
                          : 'border-white/5 bg-transparent text-[#888888] hover:text-white'
                      }`}
                    >
                      {v.casing}
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Context Alert */}
          <div className="p-4 bg-[#ff5500]/5 border border-[#ff5500]/10 rounded-2xl flex gap-2.5 items-start">
            <AlertTriangle size={16} className="text-[#ff5500] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase text-white block">Preview Mode Only</span>
              <span className="text-[9px] text-[#888] block">
                Casing type pill selections on the preview card demonstrate how customers will switch between variants on the public marketplace.
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
