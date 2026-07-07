import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Plus } from 'lucide-react';
import { addSupplierPurchase } from '../lib/db';

const SearchableProductSelect = ({ value, onChange, catalogList, onCreateNew }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const triggerRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  const selectedProduct = catalogList.find(c => c.id === value);
  const filtered = catalogList.filter(c => {
    const brand = (c.brand || '').toLowerCase();
    const model = (c.model_name || c.name || '').toLowerCase();
    const sku = (c.sku || '').toLowerCase();
    const s = search.toLowerCase();
    return brand.includes(s) || model.includes(s) || sku.includes(s);
  });
  
  return (
    <div className="relative flex-1" ref={triggerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#141414] border border-white/5 rounded-lg px-2.5 py-2 text-white text-[11px] flex justify-between items-center cursor-pointer select-none"
      >
        <span className="truncate pr-2">
          {selectedProduct 
            ? `${selectedProduct.brand || ''} ${selectedProduct.model_name || selectedProduct.name || ''} (${selectedProduct.sku || 'No SKU'})` 
            : '-- Select Product --'}
        </span>
        <span className="text-zinc-500 text-[8px] flex-shrink-0">▼</span>
      </div>
      
      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[9998] bg-transparent" onClick={() => setIsOpen(false)} />
          <div 
            className="fixed bg-[#0f0f0f] border border-white/10 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-3 space-y-2 max-h-64 w-[280px] sm:w-[350px] md:w-[400px] flex flex-col"
            style={{ 
              top: `${coords.top + 4}px`,
              left: `${coords.left}px`,
              zIndex: 9999 
            }}
          >
            <input
              type="text"
              placeholder="Type to search product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#181818] border border-white/5 rounded-lg px-2.5 py-2 text-white text-[11px] focus:outline-none"
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
            
            <div className="overflow-y-auto flex-1 space-y-0.5 scrollbar-none max-h-40">
              {filtered.length === 0 ? (
                <div className="text-[10px] text-zinc-500 p-2 text-center">No products found.</div>
              ) : (
                filtered.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onChange(c.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className="px-2 py-1.5 hover:bg-white/5 rounded-lg text-white text-[11px] cursor-pointer transition-colors text-left"
                  >
                    {c.brand || 'No Brand'} {c.model_name || c.name || 'Unnamed Product'} <span className="text-zinc-500 font-mono text-[9px]">({c.sku || 'No SKU'})</span>
                  </div>
                ))
              )}
            </div>
            
            <div className="border-t border-white/5 pt-1.5 flex justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onCreateNew();
                }}
                className="text-[9px] font-black uppercase tracking-wider text-[#ff5500] hover:underline cursor-pointer"
              >
                + Create New Casting
              </button>
            </div>
          </div>
        </>        ,
        document.body
      )}
    </div>
  );
};

export default function BookPurchaseForm({
  purchaseForm,
  setPurchaseForm,
  suppliers,
  cashAccounts,
  catalogList,
  setIsAddingSupplierPurchase,
  setIsCreatingNewSupplier,
  setIsCreatingNewProductInline,
  setActiveItemIndexForProductCreation,
  setNewProductFormInline,
  fetchSupplierPurchases,
  fetchSupplierMetrics,
  setSelectedPurchaseId,
  showToast
}) {
  return (
    <div className="bg-[#0b0b0b] border border-white/5 rounded-2xl p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAddingSupplierPurchase(false)}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] uppercase font-black tracking-widest border border-white/5 cursor-pointer"
          >
            ← Back to List
          </button>
          <div>
            <div className="text-[9px] font-black text-[#ff5500] uppercase tracking-widest">Procurement Pipeline</div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Book New Supplier Purchase</h3>
          </div>
        </div>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!purchaseForm.supplierId) {
            showToast("Please select a supplier", "error");
            return;
          }
          const hasEmptyProducts = purchaseForm.items.some(it => !it.productId || it.quantity <= 0 || it.purchasePrice <= 0);
          if (hasEmptyProducts) {
            showToast("Please fill in all product items correctly", "error");
            return;
          }
          try {
            const res = await addSupplierPurchase(purchaseForm);
            if (res.success) {
              showToast("Supplier Purchase booked successfully", "success");
              setIsAddingSupplierPurchase(false);
              fetchSupplierPurchases(1, '');
              fetchSupplierMetrics();
              if (res.id) setSelectedPurchaseId(res.id);
            }
          } catch (err) {
            showToast(err.message || "Failed to book supplier order", "error");
          }
        }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs"
      >
        {/* Left Column: Details */}
        <div className="space-y-4">
          <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 space-y-4">
            <h4 className="text-[10px] font-black text-white/50 uppercase tracking-widest border-b border-white/5 pb-2">Order Configuration</h4>
            
            {/* Supplier Selection */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Select Supplier</label>
                <button type="button" onClick={() => setIsCreatingNewSupplier(true)} className="text-[#ff5500] hover:underline font-bold text-[9px] uppercase tracking-wider cursor-pointer">
                  + Add New Supplier Profile
                </button>
              </div>
              <select
                value={purchaseForm.supplierId}
                onChange={(e) => setPurchaseForm(p => ({ ...p, supplierId: e.target.value }))}
                className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none"
                required
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Purchase Date & Expected Arrival Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Purchase Date</label>
                <input
                  type="date"
                  value={purchaseForm.purchaseDate}
                  onChange={(e) => setPurchaseForm(p => ({ ...p, purchaseDate: e.target.value }))}
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Expected Arrival Date</label>
                <input
                  type="date"
                  value={purchaseForm.expectedArrivalDate}
                  onChange={(e) => setPurchaseForm(p => ({ ...p, expectedArrivalDate: e.target.value }))}
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Advance Outflow Details */}
          <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasAdvance"
                checked={purchaseForm.advancePaid > 0}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setPurchaseForm(p => ({
                    ...p,
                    advancePaid: checked ? 5000 : 0,
                    cashAccountId: checked ? (cashAccounts[0]?.id || '') : ''
                  }));
                }}
                className="w-4 h-4 accent-[#ff5500] cursor-pointer"
              />
              <label htmlFor="hasAdvance" className="text-[10px] font-bold text-white uppercase tracking-widest cursor-pointer select-none">
                Log Advance Payment Outflow Now
              </label>
            </div>

            {purchaseForm.advancePaid > 0 && (
              <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#888888] uppercase block">Advance Paid Amount</label>
                    <input
                      type="number"
                      value={purchaseForm.advancePaid}
                      onChange={(e) => setPurchaseForm(p => ({ ...p, advancePaid: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-[#141414] border border-white/5 rounded-lg px-3 py-2 text-white focus:outline-none font-mono"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#888888] uppercase block">Funding Cash Drawer</label>
                    <select
                      value={purchaseForm.cashAccountId}
                      onChange={(e) => setPurchaseForm(p => ({ ...p, cashAccountId: e.target.value }))}
                      className="w-full bg-[#141414] border border-white/5 rounded-lg px-3 py-2 text-white focus:outline-none"
                      required
                    >
                      <option value="">-- Choose Account --</option>
                      {cashAccounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name} (₹{Number(a.balance).toLocaleString('en-IN')})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#888888] uppercase block">Payment Method</label>
                    <select
                      value={purchaseForm.paymentMethod}
                      onChange={(e) => setPurchaseForm(p => ({ ...p, paymentMethod: e.target.value }))}
                      className="w-full bg-[#141414] border border-white/5 rounded-lg px-3 py-2 text-white focus:outline-none"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#888888] uppercase block">UTR / Tx Reference ID</label>
                    <input
                      type="text"
                      value={purchaseForm.referenceNumber}
                      onChange={(e) => setPurchaseForm(p => ({ ...p, referenceNumber: e.target.value }))}
                      placeholder="Bank UTR / UPI Ref"
                      className="w-full bg-[#141414] border border-white/5 rounded-lg px-3 py-2 text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Products & Notes */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 space-y-4 flex-1">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h4 className="text-[10px] font-black text-white/50 uppercase tracking-widest">Ordered Product Lines</h4>
              <button
                type="button"
                onClick={() => setPurchaseForm(p => ({ ...p, items: [...p.items, { productId: '', quantity: 1, purchasePrice: 0, casingType: 'box' }] }))}
                className="text-[#ff5500] hover:underline font-black text-[9px] uppercase tracking-wider cursor-pointer"
              >
                + Add Product Line
              </button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-none pr-1">
              {purchaseForm.items.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-2.5 bg-black/30 border border-white/5 p-3 rounded-xl">
                  {/* Top Row: Product Select & Delete */}
                  <div className="flex gap-2 items-center">
                    <SearchableProductSelect
                      value={item.productId}
                      onChange={(val) => {
                        const updated = [...purchaseForm.items];
                        updated[idx].productId = val;
                        const prod = catalogList.find(c => c.id === val);
                        if (prod) {
                          updated[idx].purchasePrice = prod.purchase_price || 0;
                        }
                        setPurchaseForm(p => ({ ...p, items: updated }));
                      }}
                      catalogList={catalogList}
                      onCreateNew={() => {
                        setActiveItemIndexForProductCreation(idx);
                        setNewProductFormInline({
                          name: '',
                          brand: '',
                          sku: '',
                          purchasePrice: item.purchasePrice || 0,
                          price: item.purchasePrice ? Math.round(item.purchasePrice * 1.3) : 0,
                          scale: '1:64',
                          series: 'NA',
                          casingTypes: ['box']
                        });
                        setIsCreatingNewProductInline(true);
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const updated = purchaseForm.items.filter((_, i) => i !== idx);
                        setPurchaseForm(p => ({ ...p, items: updated }));
                      }}
                      className="w-7 h-7 flex-shrink-0 bg-red-950/20 hover:bg-red-950/40 text-red-500 rounded-lg flex items-center justify-center border border-red-500/10 cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Bottom Row: Casing, Qty, Cost */}
                  <div className="flex gap-3 items-center">
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-[8px] font-bold text-[#888888] uppercase tracking-wider">Casing</span>
                      <select
                        value={item.casingType || 'box'}
                        onChange={(e) => {
                          const updated = [...purchaseForm.items];
                          updated[idx].casingType = e.target.value;
                          setPurchaseForm(p => ({ ...p, items: updated }));
                        }}
                        className="w-full bg-[#141414] border border-white/5 rounded-lg px-2.5 py-2 text-white focus:outline-none text-[11px] cursor-pointer"
                        required
                      >
                        <option value="box">Box</option>
                        <option value="blister">Blister</option>
                        <option value="acrylic casing">Acrylic Casing</option>
                      </select>
                    </div>

                    <div className="w-16 flex-shrink-0 flex flex-col gap-1">
                      <span className="text-[8px] font-bold text-[#888888] uppercase tracking-wider text-center">Qty</span>
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        min="1"
                        onChange={(e) => {
                          const updated = [...purchaseForm.items];
                          updated[idx].quantity = parseInt(e.target.value, 10) || 0;
                          setPurchaseForm(p => ({ ...p, items: updated }));
                        }}
                        className="w-full bg-[#141414] border border-white/5 rounded-lg px-2.5 py-2 text-white focus:outline-none font-mono text-[11px] text-center"
                        required
                      />
                    </div>

                    <div className="w-20 flex-shrink-0 flex flex-col gap-1">
                      <span className="text-[8px] font-bold text-[#888888] uppercase tracking-wider text-center">Cost (₹)</span>
                      <input
                        type="number"
                        placeholder="Cost"
                        value={item.purchasePrice}
                        min="0"
                        step="0.01"
                        onChange={(e) => {
                          const updated = [...purchaseForm.items];
                          updated[idx].purchasePrice = parseFloat(e.target.value) || 0;
                          setPurchaseForm(p => ({ ...p, items: updated }));
                        }}
                        className="w-full bg-[#141414] border border-white/5 rounded-lg px-2.5 py-2 text-white focus:outline-none font-mono text-[11px] text-center"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Order Memo / Supplier Notes</label>
            <textarea
              value={purchaseForm.notes}
              onChange={(e) => setPurchaseForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="WhatsApp logs details, custom invoices, payment commitments details..."
              className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none h-16 resize-none"
            />
          </div>

          <button type="submit" className="w-full bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold py-3.5 rounded-xl uppercase tracking-wider shadow-lg transition-colors cursor-pointer border-none text-[11px]">
            Book Supplier Purchase Order
          </button>
        </div>
      </form>
    </div>
  );
}
