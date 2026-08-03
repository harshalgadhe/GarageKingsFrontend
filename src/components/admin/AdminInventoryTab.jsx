import React from 'react';
import { Search } from 'lucide-react';
import Pagination from './Pagination';
import InventoryDetails from '../../pages/admin/InventoryDetails';

export default function AdminInventoryTab({
  selectedVariantId,
  setSelectedVariantId,
  inventorySubTab,
  setInventorySubTab,
  variantsSearchQuery,
  setVariantsSearchQuery,
  variantsLoading,
  variantsList,
  variantsPage,
  variantsTotalPages,
  variantsTotal,
  setVariantsPage,
  allBatchesLoading,
  allBatches,
  allBatchesPage,
  allBatchesTotalPages,
  allBatchesTotal,
  setAllBatchesPage,
  allLedgerLoading,
  allLedger,
  allLedgerPage,
  allLedgerTotalPages,
  allLedgerTotal,
  setAllLedgerPage,
  manualAdjustmentForm,
  setManualAdjustmentForm,
  isAdjustingSubmitting,
  setIsAdjustingSubmitting,
  API_BASE_URL,
  getAuthHeaders,
  showToast,
  triggerTabFetch
}) {
  return (
    <div className="space-y-6">
      {selectedVariantId ? (
        <InventoryDetails variantId={selectedVariantId} onBack={() => setSelectedVariantId(null)} />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Physical Inventory Operations
            </h3>
          </div>

          {/* Sub Navigation */}
          <div className="flex border-b border-white/5 gap-6 pb-2 mb-6 overflow-x-auto">
            {['overview', 'batches', 'ledger', 'adjustments'].map(sub => (
              <button
                key={sub}
                onClick={() => setInventorySubTab(sub)}
                className={`pb-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
                  inventorySubTab === sub ? 'border-[#ff5500] text-white' : 'border-transparent text-zinc-500 hover:text-white'
                }`}
              >
                {sub.replace('_', ' ')}
              </button>
            ))}
          </div>

          {inventorySubTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 bg-[#141414] border border-white/5 rounded-xl px-3.5 py-2.5 w-full max-w-md">
                <Search size={14} className="text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search stock overview by SKU, name..."
                  value={variantsSearchQuery}
                  onChange={(e) => setVariantsSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-xs text-white placeholder-zinc-600 focus:outline-none w-full"
                />
              </div>

              <div className="overflow-x-auto border border-white/5 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#141414] border-b border-white/5 text-[#888888] uppercase tracking-widest text-[9px]">
                      <th className="p-4 font-bold">Variant (SKU)</th>
                      <th className="p-4 font-bold text-center">Available</th>
                      <th className="p-4 font-bold text-center">Reserved</th>
                      <th className="p-4 font-bold text-center">Sold</th>
                      <th className="p-4 font-bold text-center">Incoming</th>
                      <th className="p-4 font-bold text-center">Damaged</th>
                      <th className="p-4 font-bold text-center">Returned</th>
                      <th className="p-4 font-bold text-center">Batches</th>
                      <th className="p-4 font-bold text-right">Avg Cost</th>
                      <th className="p-4 font-bold text-right">Holding Value</th>
                      <th className="p-4 font-bold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variantsLoading ? (
                      <tr>
                        <td colSpan="11" className="p-8 text-center text-zinc-500 font-mono">Loading inventory dataset...</td>
                      </tr>
                    ) : variantsList.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="p-8 text-center text-zinc-500 font-mono">No inventory records found.</td>
                      </tr>
                    ) : (
                      variantsList.map(v => {
                        const avgCost = Number(v.avgCost || 0);
                        const isCostConfigured = avgCost > 0;
                        const inventoryValue = Number(v.inventory_value || 0);

                        return (
                          <tr 
                            key={v.id} 
                            onClick={() => setSelectedVariantId(v.id)}
                            className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                          >
                            <td className="p-4">
                              <span className="font-bold text-white block">{v.name || v.productName}</span>
                              <span className="text-[10px] text-zinc-500 font-mono">{v.sku}</span>
                            </td>
                            <td className="p-4 text-center font-mono font-bold text-white">{v.quantity_available ?? 0}</td>
                            <td className="p-4 text-center font-mono text-zinc-400">{v.quantity_reserved ?? 0}</td>
                            <td className="p-4 text-center font-mono text-zinc-400">{v.quantity_sold ?? 0}</td>
                            <td className="p-4 text-center font-mono text-zinc-400">{v.quantity_incoming ?? 0}</td>
                            <td className="p-4 text-center font-mono text-zinc-400">{v.quantity_damaged ?? 0}</td>
                            <td className="p-4 text-center font-mono text-zinc-400">{v.quantity_returned ?? 0}</td>
                            <td className="p-4 text-center font-mono text-zinc-400">{v.batchCount ?? 0}</td>
                            <td className="p-4 text-right font-mono text-zinc-400">
                              {isCostConfigured ? `₹${avgCost.toFixed(2)}` : <span className="text-[10px] italic text-zinc-600">Not Configured</span>}
                            </td>
                            <td className="p-4 text-right font-mono text-[#ff5500]">₹{inventoryValue.toLocaleString('en-IN')}</td>
                            <td className="p-4 text-center">
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                v.salesStatus === 'Preorder' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' :
                                Number(v.quantity_available || 0) <= 0 ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                                'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                              }`}>
                                {v.salesStatus === 'Preorder' ? 'Preorder' : Number(v.quantity_available || 0) <= 0 ? 'OOS' : 'Active'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={variantsPage}
                totalPages={variantsTotalPages}
                totalItems={variantsTotal}
                onPageChange={setVariantsPage}
              />
            </div>
          )}

          {inventorySubTab === 'batches' && (
            <div className="space-y-6">
              <div className="overflow-x-auto border border-white/5 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#141414] border-b border-white/5 text-[#888888] uppercase tracking-widest text-[9px]">
                      <th className="p-4 font-bold">Variant (SKU)</th>
                      <th className="p-4 font-bold">Batch ID</th>
                      <th className="p-4 font-bold text-center">Qty Received</th>
                      <th className="p-4 font-bold text-center">Qty Available</th>
                      <th className="p-4 font-bold text-right">Purchase Price</th>
                      <th className="p-4 font-bold">Supplier</th>
                      <th className="p-4 font-bold">Received Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBatchesLoading ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-zinc-500 font-mono">Loading inventory batches...</td>
                      </tr>
                    ) : allBatches.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-zinc-500 font-mono">No inventory batches recorded.</td>
                      </tr>
                    ) : (
                      allBatches.map(b => (
                        <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                          <td className="p-4">
                            <span className="font-bold text-white block">{b.variantName || b.productName}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{b.sku}</span>
                          </td>
                          <td className="p-4 font-mono text-zinc-400 text-[10px]">{b.id.slice(0, 8)}...</td>
                          <td className="p-4 text-center font-mono font-bold text-white">{b.quantity_received}</td>
                          <td className="p-4 text-center font-mono font-bold text-emerald-400">{b.quantity_available}</td>
                          <td className="p-4 text-right font-mono text-zinc-400">₹{Number(b.purchase_price).toFixed(2)}</td>
                          <td className="p-4 text-zinc-400">{b.supplierName || 'System'}</td>
                          <td className="p-4 text-zinc-500 font-mono text-[10px]">{new Date(b.received_at).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={allBatchesPage}
                totalPages={allBatchesTotalPages}
                totalItems={allBatchesTotal}
                onPageChange={setAllBatchesPage}
              />
            </div>
          )}

          {inventorySubTab === 'ledger' && (
            <div className="space-y-6">
              <div className="overflow-x-auto border border-white/5 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#141414] border-b border-white/5 text-[#888888] uppercase tracking-widest text-[9px]">
                      <th className="p-4 font-bold">Variant (SKU)</th>
                      <th className="p-4 font-bold text-center">Qty Change</th>
                      <th className="p-4 font-bold text-center">Action Type</th>
                      <th className="p-4 font-bold">Notes</th>
                      <th className="p-4 font-bold">Operator</th>
                      <th className="p-4 font-bold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allLedgerLoading ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-zinc-500 font-mono">Loading inventory ledger...</td>
                      </tr>
                    ) : allLedger.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-zinc-500 font-mono">No inventory ledger transactions recorded.</td>
                      </tr>
                    ) : (
                      allLedger.map(l => (
                        <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                          <td className="p-4">
                            <span className="font-bold text-white block">{l.variantName || l.productName}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{l.sku}</span>
                          </td>
                          <td className={`p-4 text-center font-mono font-bold ${l.quantity_change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {l.quantity_change > 0 ? `+${l.quantity_change}` : l.quantity_change}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                              l.action_type === 'Received' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                              l.action_type === 'Sold' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' :
                              'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                            }`}>
                              {l.action_type}
                            </span>
                          </td>
                          <td className="p-4 text-zinc-400">{l.notes || '-'}</td>
                          <td className="p-4 text-zinc-400 font-mono text-[10px]">{l.created_by || 'System'}</td>
                          <td className="p-4 text-zinc-500 font-mono text-[10px]">{new Date(l.created_at).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={allLedgerPage}
                totalPages={allLedgerTotalPages}
                totalItems={allLedgerTotal}
                onPageChange={setAllLedgerPage}
              />
            </div>
          )}

          {inventorySubTab === 'adjustments' && (
            <div className="max-w-xl bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-6">
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-white">Record Manual Inventory Adjustment</h4>
                <p className="text-[10px] text-zinc-500">Record stock shrinkage, damage write-offs, or manual returns directly into the transactional ledger.</p>
              </div>

              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!manualAdjustmentForm.batchId) {
                    alert("Please select a batch first.");
                    return;
                  }
                  if (Number(manualAdjustmentForm.quantityChange) === 0) {
                    alert("Quantity change cannot be zero.");
                    return;
                  }

                  setIsAdjustingSubmitting(true);
                  try {
                    const res = await fetch(`${API_BASE_URL}/admin/inventory/adjust`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeaders()
                      },
                      body: JSON.stringify({
                        batchId: manualAdjustmentForm.batchId,
                        quantityChange: Number(manualAdjustmentForm.quantityChange),
                        type: manualAdjustmentForm.type,
                        reason: manualAdjustmentForm.reason
                      })
                    });

                    if (res.ok) {
                      showToast("Inventory adjusted successfully!");
                      setManualAdjustmentForm({ batchId: '', quantityChange: 0, type: 'Adjusted', reason: '' });
                      triggerTabFetch('inventory');
                    } else {
                      const errData = await res.json();
                      showToast(errData.message || "Failed to adjust stock", "error");
                    }
                  } catch (err) {
                    console.error(err);
                    showToast("Failed to connect to backend api.", "error");
                  } finally {
                    setIsAdjustingSubmitting(false);
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Target Batch ID</label>
                  <input
                    type="text"
                    placeholder="Enter the UUID of the target inventory batch"
                    value={manualAdjustmentForm.batchId}
                    onChange={e => setManualAdjustmentForm(prev => ({ ...prev, batchId: e.target.value }))}
                    className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 font-mono text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Quantity Change</label>
                    <input
                      type="number"
                      placeholder="e.g. -2 for breakage, +1 for return"
                      value={manualAdjustmentForm.quantityChange || ''}
                      onChange={e => setManualAdjustmentForm(prev => ({ ...prev, quantityChange: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 font-mono text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Adjustment Type</label>
                    <select
                      value={manualAdjustmentForm.type}
                      onChange={e => setManualAdjustmentForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full bg-[#111111] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 text-xs"
                    >
                      <option value="Adjusted">Shrinkage / Audit Adjustment</option>
                      <option value="Damaged">Damaged Write-off</option>
                      <option value="Returned">Customer Return</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Adjustment Reason / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Broken packaging, physical stock reconciliation"
                    value={manualAdjustmentForm.reason}
                    onChange={e => setManualAdjustmentForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-[#111111] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 text-xs w-full"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAdjustingSubmitting}
                  className="w-full py-3 bg-[#ff5500] hover:bg-[#ff6611] active:bg-[#e64d00] disabled:bg-[#ff5500]/50 text-black font-extrabold text-xs rounded-xl uppercase tracking-wider transition-all shadow-[0_4px_20px_-4px_rgba(255,85,0,0.3)] cursor-pointer"
                >
                  {isAdjustingSubmitting ? 'Recording Adjustment...' : 'Record Adjustment'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
