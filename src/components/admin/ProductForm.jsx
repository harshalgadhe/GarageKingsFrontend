import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, X, Check, Layers, Eye, MessageCircle, ShoppingBag } from 'lucide-react';
import { uploadImageToStorage } from '../../lib/db';
import ProductCard from '../common/ProductCard';
import SearchableSelect from './SearchableSelect';

// Resolve relative image paths returned by NestJS (/uploads/...) to full URLs
const SERVER_ORIGIN = import.meta.env.PROD
  ? ''
  : (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1').replace(/\/api\/v\d+$/, '');

function resolveImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  return `${SERVER_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

const BRANDS_LIST = [
  'Mini GT',
  'Kaido House',
  'Inno64',
  'Hot Wheels',
  'Pop Race',
  'Tarmac Works',
  'Matchbox',
  'BBR',
  'Looksmart',
  'Spark',
  'Majorette',
  'Schuco',
  'Other'
];

const SCALES_LIST = ['1:64', '1:43', '1:18', '1:24', '1:12', 'Other'];
const CASE_TYPES = ['Blister', 'Box', 'Acrylic', 'Other'];
const GENERIC_TAGS = ['None', 'Limited', 'Hot', 'Rare', 'New Drop', 'Exclusive'];

export default function ProductForm({
  productId = null,
  initialData = null,
  onSave,
  onCancel,
  creatorEmail
}) {
  // Shared Product Information
  const [brand, setBrand] = useState('Mini GT');
  const [customBrand, setCustomBrand] = useState('');
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [scale, setScale] = useState('1:64');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('None');
  const [subtags, setSubtags] = useState([]);
  const [subtagInput, setSubtagInput] = useState('');

  // Pre-Booking / PO Order
  const [isPrebook, setIsPrebook] = useState(false);
  const [arrivalDate, setArrivalDate] = useState(''); // String: e.g. "Q3 2026"

  const handleAddSubtag = () => {
    const val = subtagInput.trim();
    if (!val) return;
    if (subtags.length >= 5) return;
    if (!subtags.includes(val)) {
      setSubtags(prev => [...prev, val]);
    }
    setSubtagInput('');
  };

  // Case Variants (Each case type has its own price, stock, PO deposit, and images)
  const [caseVariants, setCaseVariants] = useState([
    {
      id: 'v-1',
      casingType: 'Blister',
      price: '',
      poAmount: '',
      availableStock: 10,
      images: [],
      imageUrlInput: '',
      isUploading: false
    }
  ]);

  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form or reset cleanly when initialData changes
  useEffect(() => {
    if (initialData) {
      const b = initialData.brand || initialData.carBrand || 'Mini GT';
      if (BRANDS_LIST.includes(b)) {
        setBrand(b);
        setCustomBrand('');
      } else {
        setBrand('Other');
        setCustomBrand(b);
      }

      setSku(initialData.sku || '');
      setName(initialData.name || '');
      setScale(initialData.scale || '1:64');
      setDescription(initialData.description || '');
      setTag(initialData.tag || initialData.grade || 'None');
      const initialSubtags = Array.isArray(initialData.subtags) && initialData.subtags.length > 0
        ? initialData.subtags
        : (Array.isArray(initialData.tags) ? initialData.tags : []);
      setSubtags(initialSubtags.filter(t => t && String(t).toLowerCase() !== 'none').slice(0, 5));
      setSubtagInput('');

      setIsPrebook(initialData.isPrebook || initialData.status === 'Pre-Order' || false);
      // arrivalDate can live on the product root OR on variants[0].customerEta
      setArrivalDate(
        initialData.arrivalDate ||
        initialData.releaseDate ||
        initialData.customerEta ||
        initialData.variants?.[0]?.customerEta ||
        ''
      );

      // Extract all images from initialData (both parent image string and images array)
      const allParentImages = [];
      if (initialData.image) {
        const resolved = resolveImageUrl(initialData.image);
        if (resolved && !allParentImages.includes(resolved)) allParentImages.push(resolved);
      }
      if (Array.isArray(initialData.images)) {
        initialData.images.forEach(img => {
          const raw = typeof img === 'string' ? img : (img?.fullUrl || img?.thumbnailUrl || img?.url || img?.src);
          const resolved = resolveImageUrl(raw);
          if (resolved && !allParentImages.includes(resolved)) allParentImages.push(resolved);
        });
      }

      // Hydrate case variants
      let loadedVariants = [];
      if (Array.isArray(initialData.caseVariants) && initialData.caseVariants.length > 0) {
        loadedVariants = initialData.caseVariants.map((v, i) => {
          const vImgs = [];
          if (v.image) {
            const res = resolveImageUrl(v.image);
            if (res) vImgs.push(res);
          }
          if (Array.isArray(v.images)) {
            v.images.forEach(img => {
              const raw = typeof img === 'string' ? img : (img?.fullUrl || img?.thumbnailUrl || img?.url || img?.src);
              const res = resolveImageUrl(raw);
              if (res && !vImgs.includes(res)) vImgs.push(res);
            });
          }
          const finalImgs = vImgs.length > 0 ? vImgs : allParentImages;
          return {
            id: v.id || `v-${i}`,
            casingType: v.casingType ? (v.casingType.charAt(0).toUpperCase() + v.casingType.slice(1).toLowerCase()) : 'Blister',
            price: v.price ?? v.sellingPrice ?? '',
            poAmount: v.poAmount ?? v.prebookDepositAmount ?? initialData.prebookDepositAmount ?? '',
            availableStock: v.availableStock ?? v.totalStock ?? v.stock ?? initialData.availableStock ?? 10,
            images: finalImgs,
            imageUrlInput: '',
            isUploading: false
          };
        });
      } else if (Array.isArray(initialData.variants) && initialData.variants.length > 0) {
        loadedVariants = initialData.variants.map((v, i) => {
          const rawCasing = v.casing || initialData.casingType || initialData.casing || 'Blister';
          const casingCap = rawCasing.charAt(0).toUpperCase() + rawCasing.slice(1).toLowerCase();
          return {
            id: v.id || `v-${i}`,
            casingType: CASE_TYPES.includes(casingCap) ? casingCap : 'Blister',
            price: v.sellingPrice ?? v.price ?? initialData.sellingPrice ?? initialData.price ?? '',
            poAmount: initialData.prebookDepositAmount ?? initialData.poAmount ?? v.prebookDepositAmount ?? '',
            availableStock: v.availableStock ?? v.totalStock ?? v.stock ?? initialData.availableStock ?? 10,
            images: allParentImages,
            imageUrlInput: '',
            isUploading: false
          };
        });
      } else {
        const v0 = Array.isArray(initialData.variants) && initialData.variants[0];
        const rawCasing = (v0?.casing || initialData.casingType || initialData.casing || 'Blister');
        const casingCap = rawCasing.charAt(0).toUpperCase() + rawCasing.slice(1).toLowerCase();

        loadedVariants = [{
          id: 'v-1',
          casingType: CASE_TYPES.includes(casingCap) ? casingCap : 'Blister',
          price: v0?.sellingPrice ?? initialData.price ?? initialData.sellingPrice ?? '',
          poAmount: initialData.prebookDepositAmount ?? initialData.poAmount ?? v0?.prebookDepositAmount ?? '',
          availableStock: v0?.availableStock ?? v0?.totalStock ?? initialData.availableStock ?? 10,
          images: allParentImages,
          imageUrlInput: '',
          isUploading: false
        }];
      }
      setCaseVariants(loadedVariants);
    } else {
      // RESET TO CLEAN DEFAULTS FOR NEW PRODUCT
      setBrand('Mini GT');
      setCustomBrand('');
      setSku('');
      setName('');
      setScale('1:64');
      setDescription('');
      setTag('None');
      setSubtags([]);
      setSubtagInput('');

      setIsPrebook(false);
      setArrivalDate('');

      setCaseVariants([
        {
          id: 'v-1',
          casingType: 'Blister',
          price: '',
          poAmount: '',
          availableStock: 10,
          images: [],
          imageUrlInput: '',
          isUploading: false
        }
      ]);
    }
  }, [initialData]);

  // Variant Helpers
  const handleAddCaseVariant = () => {
    const currentTypes = caseVariants.map(v => v.casingType);
    let nextType = 'Box';
    if (!currentTypes.includes('Box')) nextType = 'Box';
    else if (!currentTypes.includes('Acrylic')) nextType = 'Acrylic';
    else if (!currentTypes.includes('Blister')) nextType = 'Blister';
    else nextType = 'Other';

    setCaseVariants(prev => [
      ...prev,
      {
        id: `v-${Date.now()}`,
        casingType: nextType,
        price: prev[0]?.price || '',
        poAmount: prev[0]?.poAmount || '',
        availableStock: 10,
        images: [],
        imageUrlInput: '',
        isUploading: false
      }
    ]);
  };

  const handleRemoveCaseVariant = (index) => {
    if (caseVariants.length <= 1) return;
    setCaseVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, field, value) => {
    setCaseVariants(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Image Upload Handlers per Variant
  const handleVariantFileUpload = async (variantIndex, e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setCaseVariants(prev => {
      const copy = [...prev];
      copy[variantIndex].isUploading = true;
      return copy;
    });

    setValidationError('');

    try {
      const uploaded = await Promise.all(files.map(f => uploadImageToStorage(f)));
      const valid = uploaded.filter(Boolean);
      if (valid.length > 0) {
        setCaseVariants(prev => {
          const copy = [...prev];
          const currentImages = [...(copy[variantIndex].images || [])];
          valid.forEach(url => { if (!currentImages.includes(url)) currentImages.push(url); });
          copy[variantIndex].images = currentImages;
          copy[variantIndex].isUploading = false;
          return copy;
        });
      }
    } catch (err) {
      console.error("Variant image upload error:", err);
      setValidationError("Failed to upload image. Please check connection and try again.");
    } finally {
      setCaseVariants(prev => {
        const copy = [...prev];
        if (copy[variantIndex]) copy[variantIndex].isUploading = false;
        return copy;
      });
    }
  };

  const handleAddVariantImageUrl = (variantIndex) => {
    const url = (caseVariants[variantIndex].imageUrlInput || '').trim();
    if (!url) return;

    setCaseVariants(prev => {
      const copy = [...prev];
      const currentImages = [...(copy[variantIndex].images || [])];
      if (!currentImages.includes(url)) currentImages.push(url);
      copy[variantIndex].images = currentImages;
      copy[variantIndex].imageUrlInput = '';
      return copy;
    });
  };

  const handleRemoveVariantImage = (variantIndex, imgIndex) => {
    setCaseVariants(prev => {
      return prev.map((v, i) => {
        if (i !== variantIndex) return v;
        return {
          ...v,
          images: (v.images || []).filter((_, idx) => idx !== imgIndex)
        };
      });
    });
  };

  const handleSetCoverImage = (variantIndex, imgIndex) => {
    setCaseVariants(prev => {
      return prev.map((v, i) => {
        if (i !== variantIndex) return v;
        const currentImages = [...(v.images || [])];
        if (imgIndex <= 0 || imgIndex >= currentImages.length) return v;
        const [selected] = currentImages.splice(imgIndex, 1);
        currentImages.unshift(selected);
        return {
          ...v,
          images: currentImages
        };
      });
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalBrand = brand === 'Other' ? (customBrand.trim() || 'Other') : brand;
    const userSku = sku.trim();
    if (!userSku) {
      setValidationError('SKU ID is required and must be unique.');
      return;
    }

    // Validate case variants
    for (let i = 0; i < caseVariants.length; i++) {
      const v = caseVariants[i];
      if (!v.price || Number(v.price) <= 0) {
        setValidationError(`Please enter a valid price for Case Type "${v.casingType}".`);
        return;
      }
    }

    setValidationError('');
    setIsSubmitting(true);

    try {
      const primaryVariant = caseVariants[0];
      const primaryImage = primaryVariant.images[0] || '';

      // Format arrivalDate safely for PostgreSQL timestamp column
      let validIsoDate = null;
      const rawArrivalDateStr = arrivalDate.trim();
      if (rawArrivalDateStr) {
        const parsedMs = Date.parse(rawArrivalDateStr);
        if (!isNaN(parsedMs)) {
          validIsoDate = new Date(parsedMs).toISOString();
        }
      }

      // NO AUTOMATIC DESCRIPTION MODIFICATION (Description stays exact as entered by admin)
      const finalDescription = description.trim();

      const firstVariant = caseVariants[0] || {};
      const productImages = (firstVariant.images && firstVariant.images.length > 0) 
        ? firstVariant.images 
        : (primaryImage ? [primaryImage] : []);
      const mainPrice = Number(firstVariant.price || 0);
      const poAmount = isPrebook ? Number(firstVariant.poAmount || 0) : 0;
      const mainStock = Number(firstVariant.availableStock ?? 10);
      const selectedCasing = firstVariant.casingType || 'Box';

      const singleProductPayload = {
        name: name.trim(),
        brand: finalBrand,
        scale: scale,
        description: finalDescription,
        price: mainPrice,
        sellingPrice: mainPrice,
        sku: userSku,
        category: 'JDM',
        series: finalBrand,
        casing: selectedCasing,
        casingType: selectedCasing,
        tag: (tag && tag !== 'None') ? tag : null,
        subtags: subtags,
        tags: subtags,
        availableStock: mainStock,
        stock: mainStock,
        totalStock: mainStock,
        image: productImages[0] || '',
        images: productImages,
        isPrebook: isPrebook,
        status: isPrebook ? 'Pre-Order' : 'Published',
        poAmount: poAmount,
        prebookDepositAmount: poAmount,
        customerEta: rawArrivalDateStr || null,
        arrivalDate: rawArrivalDateStr || null,
        releaseDate: rawArrivalDateStr || null
      };

      await onSave(singleProductPayload);
    } catch (err) {
      console.error('Save product error:', err);
      setValidationError(err.message || 'Failed to save product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Active preview data
  const previewVariant = caseVariants[0] || {};
  const previewImage = previewVariant.images?.[0] || '';
  const previewPrice = previewVariant.price ? Number(previewVariant.price) : 0;
  const previewPoAmount = isPrebook ? Number(previewVariant.poAmount || 0) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* ── LEFT: PRODUCT FORM (7 cols) ── */}
      <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6 text-xs text-white">
        {validationError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-semibold">
            {validationError}
          </div>
        )}

        {/* SHARED PRODUCT DETAILS */}
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-4">
          <h4 className="text-xs font-black uppercase text-[#ff5500] tracking-wider flex items-center gap-1.5">
            General Product Info
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Brand */}
            <div>
              <SearchableSelect
                label="Brand"
                required
                value={brand}
                onChange={setBrand}
                options={BRANDS_LIST}
              />
              {brand === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter brand name..."
                  value={customBrand}
                  onChange={e => setCustomBrand(e.target.value)}
                  className="mt-2 w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              )}
            </div>

            {/* Scale */}
            <div>
              <SearchableSelect
                label="Scale"
                required
                value={scale}
                onChange={setScale}
                options={SCALES_LIST}
              />
            </div>

            {/* SKU ID */}
            <div>
              <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">
                SKU ID / Code
              </label>
              <input
                type="text"
                placeholder="e.g. MGT00652-L"
                value={sku}
                onChange={e => setSku(e.target.value)}
                className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#ff5500]"
              />
            </div>

            {/* Product Name */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">
                Product Name / Casting Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Nissan Skyline GT-R (R34) Nismo Z-Tune"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff5500]"
                required
              />
            </div>

            {/* Main Badge / Tag */}
            <div>
              <SearchableSelect
                label="Main Badge / Tag"
                value={tag}
                onChange={setTag}
                options={GENERIC_TAGS}
              />
            </div>

            {/* Subtags (Up to 5) */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">
                Subtags (Up to 5)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={subtags.length >= 5 ? "Max 5 subtags reached" : "Type subtag (e.g. JDM, Chase, Sealed)..."}
                  value={subtagInput}
                  disabled={subtags.length >= 5}
                  onChange={e => setSubtagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtag();
                    }
                  }}
                  className="flex-1 bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff5500] disabled:opacity-40"
                />
                <button
                  type="button"
                  onClick={handleAddSubtag}
                  disabled={subtags.length >= 5 || !subtagInput.trim()}
                  className="px-3 py-2 bg-[#ff5500]/10 hover:bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/30 font-bold text-xs rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                >
                  + Add
                </button>
              </div>
              {subtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {subtags.map((st, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9.5px] font-black uppercase tracking-wider bg-white/5 text-amber-400 border border-white/10">
                      {st}
                      <button
                        type="button"
                        onClick={() => setSubtags(prev => prev.filter((_, i) => i !== idx))}
                        className="text-white/40 hover:text-red-400 cursor-pointer text-xs leading-none"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">
                Description / Notes
              </label>
              <textarea
                rows={2}
                placeholder="Casting details, specifications, packaging condition..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff5500]"
              />
            </div>
          </div>
        </div>

        {/* PRE-BOOKING / PO RELEASE SECTION */}
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-white block">Pre-Booking / PO Release</label>
              <span className="text-[10px] text-white/40 block">Enable advance pre-orders for upcoming stock</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPrebook}
                onChange={e => setIsPrebook(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff5500]"></div>
            </label>
          </div>

          {isPrebook && (
            <div className="pt-3 border-t border-white/5">
              <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">
                Expected Release / Delivery Date (Text String)
              </label>
              <input
                type="text"
                placeholder="e.g. August 2026 / Q3 2026"
                value={arrivalDate}
                onChange={e => setArrivalDate(e.target.value)}
                className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff5500]"
              />
            </div>
          )}
        </div>

        {/* CASE TYPES & PRICING & IMAGES VARIANTS */}
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black uppercase text-[#ff5500] tracking-wider flex items-center gap-1.5">
                <Layers size={14} /> Case Types, Pricing &amp; Images
              </h4>
              <span className="text-[10px] text-white/40 block">Configure prices and specific images for each Case Type (Blister, Box, Acrylic)</span>
            </div>
            <button
              type="button"
              onClick={handleAddCaseVariant}
              className="bg-[#ff5500]/10 hover:bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/30 font-bold text-[10px] px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus size={14} /> Add Case Type
            </button>
          </div>

          <div className="space-y-4 pt-2">
            {caseVariants.map((v, vIdx) => (
              <div key={v.id} className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-4 relative">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#ff5500]/20 text-[#ff5500] text-[10px] flex items-center justify-center font-mono">
                      {vIdx + 1}
                    </span>
                    Case Type Option #{vIdx + 1}
                  </span>
                  {caseVariants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCaseVariant(vIdx)}
                      className="text-white/40 hover:text-red-400 p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Variant Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Case Type */}
                  <div>
                    <SearchableSelect
                      label="Case Type"
                      required
                      value={v.casingType}
                      onChange={value => handleVariantChange(vIdx, 'casingType', value)}
                      options={CASE_TYPES}
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 1499"
                      value={v.price}
                      onChange={e => handleVariantChange(vIdx, 'price', e.target.value)}
                      className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#ff5500]"
                      required
                    />
                  </div>

                  {/* Available Stock */}
                  <div>
                    <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={v.availableStock}
                      onChange={e => handleVariantChange(vIdx, 'availableStock', Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#ff5500]"
                    />
                  </div>

                  {/* PO Deposit Amount if Prebook */}
                  {isPrebook && (
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-[#ff5500] uppercase tracking-widest mb-1">
                        PO Advance Deposit (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 500"
                        value={v.poAmount}
                        onChange={e => handleVariantChange(vIdx, 'poAmount', e.target.value)}
                        className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#ff5500]"
                      />
                    </div>
                  )}
                </div>

                {/* Variant Images Upload & Input */}
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest block">
                      Images for {v.casingType} Case
                    </label>
                    <span className="text-[9px] text-white/40">Upload files or paste URL</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <label className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0">
                      <Upload size={12} className="text-[#ff5500]" />
                      {v.isUploading ? 'Uploading...' : 'Upload Image'}
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={e => handleVariantFileUpload(vIdx, e)}
                        disabled={v.isUploading}
                        className="hidden"
                      />
                    </label>

                    <div className="flex-1 flex gap-2">
                      <input
                        type="url"
                        placeholder={`Paste image URL for ${v.casingType}...`}
                        value={v.imageUrlInput || ''}
                        onChange={e => handleVariantChange(vIdx, 'imageUrlInput', e.target.value)}
                        className="flex-1 bg-[#111116] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff5500]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddVariantImageUrl(vIdx)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs cursor-pointer"
                      >
                        Add URL
                      </button>
                    </div>
                  </div>

                  {/* Variant Image Thumbnails */}
                  {v.images && v.images.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                      {v.images.map((imgUrl, imgIdx) => (
                        <div key={imgIdx} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40 group">
                          <img src={imgUrl} alt="" className="w-full h-full object-contain p-1" />
                          {imgIdx === 0 ? (
                            <span className="absolute top-1 left-1 bg-[#ff5500] text-black text-[7.5px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow">
                              Cover
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetCoverImage(vIdx, imgIdx)}
                              className="absolute top-1 left-1 bg-black/80 hover:bg-[#ff5500] text-white hover:text-black text-[7px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                              title="Set as cover image"
                            >
                              Make Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantImage(vIdx, imgIdx)}
                            className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-3 border border-dashed border-white/10 rounded-lg text-white/30 text-[10px]">
                      No images added for this case type yet.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SUBMIT ACTIONS */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex min-w-[184px] items-center justify-center gap-2 rounded-xl border border-[#F0D889]/70 bg-[#E1BD65] px-8 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#090806] shadow-[0_8px_24px_rgba(225,189,101,0.2),inset_0_1px_0_rgba(255,255,255,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#EBD07F] hover:shadow-[0_12px_30px_rgba(225,189,101,0.28)] active:translate-y-0 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.05] disabled:text-white/30 disabled:shadow-none"
          >
            <Check size={16} />
            {isSubmitting ? 'Saving...' : productId ? 'Update Product' : 'Save Product'}
          </button>
        </div>
      </form>

      {/* ── RIGHT: LIVE MARKETPLACE CARD PREVIEW (5 cols) ── */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex items-center gap-2 text-white/60">
          <Eye size={16} className="text-[#ff5500]" />
          <h3 className="text-xs font-black uppercase text-white/70 tracking-wider">Marketplace Card Live Preview</h3>
        </div>

        <div className="max-w-sm mx-auto">
          {(() => {
            const previewCar = {
              id: 'preview',
              name: name.trim() || 'Product Title / Casting Name',
              brand: brand === 'Other' ? (customBrand || 'Other') : brand,
              scale: scale || '1:64',
              casingType: previewVariant.casingType || 'Blister',
              price: previewPrice,
              poAmount: previewPoAmount,
              isPrebook: isPrebook,
              image: previewImage || '/brand-mark.webp',
              tag: (tag && tag !== 'None') ? tag : null,
              tags: subtags,
              subtags: subtags,
              description: description,
              lane: (tag && tag !== 'None') ? tag : null,
              arrivalDate: arrivalDate.trim() || null,
              releaseDate: arrivalDate.trim() || null,
              customerEta: arrivalDate.trim() || null,
              availableStock: previewVariant.availableStock ?? 10
            };
            return <ProductCard car={previewCar} isPreview={true} />;
          })()}
        </div>
      </div>
    </div>
  );
}
