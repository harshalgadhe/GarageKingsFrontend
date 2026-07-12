import React, { useEffect, useState } from 'react';
import { getInventoryVariantDetails, updateInventoryBatch } from '../../lib/db';
import { ArrowLeft, RefreshCw, Calendar, Tag, Shield, Database, ShoppingCart, DollarSign, Archive, Edit, Check, X } from 'lucide-react';

export default function InventoryDetails({ variantId, onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Edit Batch States
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [editCost, setEditCost] = useState('');
  const [editAvailable, setEditAvailable] = useState('');
  const [editReceived, setEditReceived] = useState('');
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  const loadDetails = () => {
    if (!variantId) return;
    getInventoryVariantDetails(variantId)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message || 'Failed to load inventory details');
        setLoading(false);
      });
  };

  useEffect(() => {
    setLoading(true);
    loadDetails();
  }, [variantId]);

  const handleStartEdit = (b) => {
    setEditingBatchId(b.id);
    setEditCost(String(b.purchase_price));
    setEditReceived(String(b.quantity_received));
    setEditAvailable(String(b.quantity_available));
  };

  const handleCancelEdit = () => {
    setEditingBatchId(null);
  };

  const handleSaveEdit = async (batchId) => {
    setIsSavingBatch(true);
    try {
      await updateInventoryBatch(batchId, {
        purchasePrice: Number(editCost),
        quantityReceived: Number(editReceived),
        quantityAvailable: Number(editAvailable)
      });
      setEditingBatchId(null);
      loadDetails();
    } catch (err) {
      alert(err.message || "Failed to update batch");
    } finally {
      setIsSavingBatch(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
        <RefreshCw size={24} className="animate-spin text-[#ff5500]" />
        <span className="text-xs uppercase tracking-wider font-bold">Loading audit logs...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl text-center space-y-4">
        <p className="text-red-400 font-bold text-xs">{error || 'Variant details not found'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs uppercase tracking-wider font-black cursor-pointer border border-white/5"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { summary, batches, ledger, reservations, allocations, purchases } = data;

  const avgCost = Number(summary.averagePurchaseCost || 0);
  const sellingPrice = Number(summary.sellingPrice || 0);
  const marginPercent = summary.marginPercent;
  const value = summary.inventoryValue;

  return (
    <div className="space-y-8">
      {/* Header and Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-zinc-400 hover:text-white cursor-pointer transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h3 className="text-lg font-black tracking-tight text-white uppercase">
            Inventory Audit Log
          </h3>
          <p className="text-xs text-[#ff5500] font-mono tracking-wider">
            {summary.productName} ({summary.casing}) • SKU: {summary.sku || 'N/A'}
          </p>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111] border border-white/5 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block">Average Purchase Cost</span>
          <span className="text-lg font-mono font-bold text-white block">
            {avgCost > 0 ? `₹${avgCost.toFixed(2)}` : 'Not Configured'}
          </span>
        </div>
        <div className="bg-[#111] border border-white/5 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block">Selling Price</span>
          <span className="text-lg font-mono font-bold text-white block">
            {sellingPrice > 0 ? `₹${sellingPrice.toFixed(2)}` : 'Not Configured'}
          </span>
        </div>
        <div className="bg-[#111] border border-white/5 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block">Gross Margin</span>
          <span className={`text-lg font-mono font-bold block ${marginPercent && marginPercent > 0 ? 'text-green-400' : 'text-zinc-400'}`}>
            {marginPercent !== null && marginPercent !== undefined ? `${marginPercent.toFixed(1)}%` : 'N/A'}
          </span>
        </div>
        <div className="bg-[#111] border border-white/5 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block">Holding Inventory Value</span>
          <span className="text-lg font-mono font-bold text-[#ff5500] block">
            {value > 0 ? `₹${value.toFixed(2)}` : '₹0.00'}
          </span>
        </div>
      </div>

      {/* Stock Quantities Summary Table */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <Database size={14} className="text-zinc-500" />
          <h4 className="text-xs font-black uppercase tracking-wider text-white">Stock Quantities Summary</h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 text-center">
          <div className="bg-white/5 p-3 rounded-xl">
            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Available</span>
            <span className="block text-base font-mono font-black text-white mt-1">{summary.availableStock}</span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl">
            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Reserved</span>
            <span className="block text-base font-mono font-black text-yellow-500 mt-1">{summary.reservedStock}</span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl">
            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Sold</span>
            <span className="block text-base font-mono font-black text-green-500 mt-1">{summary.soldStock}</span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl">
            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Incoming</span>
            <span className="block text-base font-mono font-black text-blue-400 mt-1">{summary.incomingStock}</span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl">
            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Damaged</span>
            <span className="block text-base font-mono font-black text-red-500 mt-1">{summary.damagedStock}</span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl">
            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Returned</span>
            <span className="block text-base font-mono font-black text-purple-400 mt-1">{summary.returnedStock}</span>
          </div>
        </div>
      </div>

      {/* Tabs Layout for detailed Subsections */}
      <div className="space-y-6">
        
        {/* SECTION 1: Active Batches */}
        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 bg-white/[0.01] flex items-center gap-2">
            <Archive size={14} className="text-[#ff5500]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Active Inventory Batches</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5 text-[#888888] uppercase tracking-widest text-[9px]">
                  <th className="p-4 font-bold">Batch ID</th>
                  <th className="p-4 font-bold">Received Date</th>
                  <th className="p-4 font-bold">Supplier</th>
                  <th className="p-4 font-bold">Cost Price</th>
                  <th className="p-4 font-bold text-center">Received Qty</th>
                  <th className="p-4 font-bold text-center">Available Qty</th>
                  <th className="p-4 font-bold">Receipt Code</th>
                  <th className="p-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-zinc-500 uppercase tracking-wider text-[10px]">No active inventory batches.</td>
                  </tr>
                ) : (
                  batches.map(b => {
                    const isEditing = editingBatchId === b.id;
                    return (
                      <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-4 font-mono text-zinc-400">{b.id.substring(0, 8)}...</td>
                        <td className="p-4 text-zinc-300">{new Date(b.received_at).toLocaleDateString()}</td>
                        <td className="p-4 text-white font-bold">{b.supplierName || 'Default Supplier'}</td>
                        <td className="p-4 font-mono text-white font-bold">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editCost}
                              onChange={e => setEditCost(e.target.value)}
                              className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs w-20 text-white focus:outline-none focus:border-[#ff5500]"
                            />
                          ) : (
                            `₹${Number(b.purchase_price).toFixed(2)}`
                          )}
                        </td>
                        <td className="p-4 text-center font-mono text-zinc-400">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editReceived}
                              onChange={e => setEditReceived(e.target.value)}
                              className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs w-16 text-center text-white focus:outline-none focus:border-[#ff5500]"
                            />
                          ) : (
                            b.quantity_received
                          )}
                        </td>
                        <td className="p-4 text-center font-mono text-white font-bold">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editAvailable}
                              onChange={e => setEditAvailable(e.target.value)}
                              className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs w-16 text-center text-white focus:outline-none focus:border-[#ff5500]"
                            />
                          ) : (
                            b.quantity_available
                          )}
                        </td>
                        <td className="p-4 font-mono text-[#ff5500] font-bold">{b.receiptNumber || 'Direct Seeding'}</td>
                        <td className="p-4 text-center">
                          {isEditing ? (
                            <div className="flex justify-center items-center gap-2">
                              <button
                                disabled={isSavingBatch}
                                onClick={() => handleSaveEdit(b.id)}
                                className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg cursor-pointer transition-colors"
                                title="Save"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                disabled={isSavingBatch}
                                onClick={handleCancelEdit}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg cursor-pointer transition-colors"
                                title="Cancel"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(b)}
                              className="p-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 rounded-lg cursor-pointer transition-colors inline-flex items-center justify-center"
                              title="Edit Batch"
                            >
                              <Edit size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: Append-Only Ledger Logs */}
        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 bg-white/[0.01] flex items-center gap-2">
            <Shield size={14} className="text-[#ff5500]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Append-Only Stock Ledger</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5 text-[#888888] uppercase tracking-widest text-[9px]">
                  <th className="p-4 font-bold">Timestamp</th>
                  <th className="p-4 font-bold">Action Type</th>
                  <th className="p-4 font-bold text-center">Qty Change</th>
                  <th className="p-4 font-bold">Cost / Sale</th>
                  <th className="p-4 font-bold">Performed By</th>
                  <th className="p-4 font-bold">Reason / Order</th>
                </tr>
              </thead>
              <tbody>
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-500 uppercase tracking-wider text-[10px]">No ledger entries recorded.</td>
                  </tr>
                ) : (
                  ledger.map(l => (
                    <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="p-4 text-zinc-400 font-mono">{new Date(l.created_at).toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          l.type === 'Received' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          l.type === 'Adjusted' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          l.type === 'Sold' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          'bg-zinc-500/10 text-zinc-400 border border-white/5'
                        }`}>
                          {l.type}
                        </span>
                      </td>
                      <td className={`p-4 text-center font-mono font-bold ${l.quantity_changed >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {l.quantity_changed >= 0 ? `+${l.quantity_changed}` : l.quantity_changed}
                      </td>
                      <td className="p-4 font-mono text-zinc-400">
                        C: ₹{Number(l.purchase_price).toFixed(2)} / S: ₹{Number(l.selling_price).toFixed(2)}
                      </td>
                      <td className="p-4 text-zinc-400">{l.performed_by || 'system'}</td>
                      <td className="p-4 text-zinc-300">
                        {l.orderId ? (
                          <span className="font-mono text-[#ff5500]">Order: {l.orderId.substring(0, 8)}...</span>
                        ) : (
                          l.reason || 'N/A'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: Active Reservations & FIFO Allocations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Reservations Card */}
          <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 bg-white/[0.01] flex items-center gap-2">
              <Calendar size={14} className="text-[#ff5500]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">Active Stock Reservations</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5 text-[#888888] uppercase tracking-widest text-[9px]">
                    <th className="p-4 font-bold">Expiry Date</th>
                    <th className="p-4 font-bold text-center">Qty</th>
                    <th className="p-4 font-bold">Customer Email</th>
                    <th className="p-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-zinc-500 uppercase tracking-wider text-[10px]">No active reservations.</td>
                    </tr>
                  ) : (
                    reservations.map(r => (
                      <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-4 text-zinc-400 font-mono">{new Date(r.expires_at).toLocaleString()}</td>
                        <td className="p-4 text-center font-mono font-bold text-white">{r.quantity}</td>
                        <td className="p-4 text-zinc-300">{r.customerEmail || 'Guest Account'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            r.status === 'Active' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-zinc-800 text-zinc-500'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* FIFO Allocations Card */}
          <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 bg-white/[0.01] flex items-center gap-2">
              <ShoppingCart size={14} className="text-[#ff5500]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">FIFO Cost Margin Allocations</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5 text-[#888888] uppercase tracking-widest text-[9px]">
                    <th className="p-4 font-bold">Order ID</th>
                    <th className="p-4 font-bold text-center">Allocated Qty</th>
                    <th className="p-4 font-bold">Unit Purchase</th>
                    <th className="p-4 font-bold">Unit Sale</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-zinc-500 uppercase tracking-wider text-[10px]">No FIFO allocations recorded.</td>
                    </tr>
                  ) : (
                    allocations.map(a => (
                      <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-4 text-[#ff5500] font-mono font-bold">{a.orderId ? a.orderId.substring(0, 8) : 'Direct'}...</td>
                        <td className="p-4 text-center font-mono font-bold text-white">{a.quantity}</td>
                        <td className="p-4 font-mono text-zinc-400">₹{Number(a.purchase_price).toFixed(2)}</td>
                        <td className="p-4 font-mono text-green-400 font-bold">₹{Number(a.selling_price).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* SECTION 4: Purchase History */}
        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 bg-white/[0.01] flex items-center gap-2">
            <DollarSign size={14} className="text-[#ff5500]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Procurement Purchase History</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5 text-[#888888] uppercase tracking-widest text-[9px]">
                  <th className="p-4 font-bold">Order Date</th>
                  <th className="p-4 font-bold">Supplier</th>
                  <th className="p-4 font-bold text-center">Ordered Qty</th>
                  <th className="p-4 font-bold">Purchase Unit Cost</th>
                  <th className="p-4 font-bold">PO Status</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500 uppercase tracking-wider text-[10px]">No purchase history found.</td>
                  </tr>
                ) : (
                  purchases.map(p => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="p-4 text-zinc-400 font-mono">{new Date(p.purchaseDate).toLocaleDateString()}</td>
                      <td className="p-4 text-white font-bold">{p.supplierName}</td>
                      <td className="p-4 text-center font-mono text-zinc-400">{p.quantity}</td>
                      <td className="p-4 font-mono text-white font-bold">₹{Number(p.purchase_price).toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          p.purchaseStatus === 'Completed' || p.purchaseStatus === 'Received' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          p.purchaseStatus === 'Cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {p.purchaseStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
