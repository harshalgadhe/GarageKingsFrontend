import React from 'react';
import { receiveSupplierShipment } from '../lib/db';

export default function ReceiveShipmentForm({
  receivingForm,
  setReceivingForm,
  selectedPurchase,
  setIsReceivingShipment,
  fetchSupplierPurchases,
  fetchSupplierPurchaseDetailsData,
  fetchSupplierMetrics,
  showToast
}) {
  return (
    <div className="bg-[#0b0b0b] border border-white/5 rounded-2xl p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsReceivingShipment(false)}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] uppercase font-black tracking-widest border border-white/5 cursor-pointer"
          >
            ← Back to Details
          </button>
          <div>
            <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Fulfillment & Cargo</div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Log Physical Cargo Delivery</h3>
          </div>
        </div>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const hasNegative = receivingForm.items.some(
            it => it.quantityReceived < 0 || it.quantityDamaged < 0 || it.quantityShort < 0 || it.quantityOver < 0
          );
          if (hasNegative) {
            showToast("Quantities cannot be negative", "error");
            return;
          }
          const totalArrived = receivingForm.items.reduce((acc, it) => acc + it.quantityReceived + it.quantityDamaged, 0);
          if (totalArrived === 0) {
            showToast("Please receive at least one product unit", "error");
            return;
          }
          try {
            const res = await receiveSupplierShipment(selectedPurchase.id, receivingForm);
            if (res.success) {
              showToast(`Cargo received successfully under ${res.receiptNumber}`, "success");
              setIsReceivingShipment(false);
              fetchSupplierPurchases(1, '');
              fetchSupplierPurchaseDetailsData(selectedPurchase.id);
              fetchSupplierMetrics();
            }
          } catch (err) {
            showToast(err.message || "Failed to receive shipment", "error");
          }
        }}
        className="space-y-6 text-xs"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#111111] p-5 rounded-2xl border border-white/5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#888888] uppercase block">Received By (Admin Name)</label>
            <input
              type="text"
              value={receivingForm.receivedBy}
              onChange={(e) => setReceivingForm(p => ({ ...p, receivedBy: e.target.value }))}
              placeholder="Admin Name"
              className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#888888] uppercase block">Delivery Note / Memo</label>
            <input
              type="text"
              value={receivingForm.notes}
              onChange={(e) => setReceivingForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Challan number, courier info..."
              className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Items Checklist */}
        <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 space-y-4">
          <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest block border-b border-white/5 pb-2">Cargo Checklist</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1 scrollbar-none">
            {receivingForm.items.map((item, idx) => (
              <div key={item.productId} className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-start border-b border-white/5 pb-2">
                  <div>
                    <span className="font-bold text-white block">{item.brand} {item.name}</span>
                    <span className="text-[9px] text-[#888888] font-mono">{item.sku} • {item.casingType || 'box'}</span>
                  </div>
                  <span className="text-[10px] text-amber-500 font-mono font-bold">Pending: {item.remaining} units</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <label className="text-[8px] uppercase tracking-wider text-emerald-400 block mb-0.5 font-bold">Received</label>
                    <input
                      type="number"
                      value={item.quantityReceived}
                      min="0"
                      onChange={(e) => {
                        const updated = [...receivingForm.items];
                        updated[idx].quantityReceived = parseInt(e.target.value, 10) || 0;
                        setReceivingForm(p => ({ ...p, items: updated }));
                      }}
                      className="w-full text-center bg-[#141414] border border-white/5 rounded-lg py-1.5 text-white font-mono text-[11px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[8px] uppercase tracking-wider text-red-400 block mb-0.5 font-bold">Damaged</label>
                    <input
                      type="number"
                      value={item.quantityDamaged}
                      min="0"
                      onChange={(e) => {
                        const updated = [...receivingForm.items];
                        updated[idx].quantityDamaged = parseInt(e.target.value, 10) || 0;
                        setReceivingForm(p => ({ ...p, items: updated }));
                      }}
                      className="w-full text-center bg-[#141414] border border-white/5 rounded-lg py-1.5 text-white font-mono text-[11px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[8px] uppercase tracking-wider text-amber-500 block mb-0.5 font-bold">Short</label>
                    <input
                      type="number"
                      value={item.quantityShort}
                      min="0"
                      onChange={(e) => {
                        const updated = [...receivingForm.items];
                        updated[idx].quantityShort = parseInt(e.target.value, 10) || 0;
                        setReceivingForm(p => ({ ...p, items: updated }));
                      }}
                      className="w-full text-center bg-[#141414] border border-white/5 rounded-lg py-1.5 text-white font-mono text-[11px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[8px] uppercase tracking-wider text-blue-400 block mb-0.5 font-bold">Over</label>
                    <input
                      type="number"
                      value={item.quantityOver}
                      min="0"
                      onChange={(e) => {
                        const updated = [...receivingForm.items];
                        updated[idx].quantityOver = parseInt(e.target.value, 10) || 0;
                        setReceivingForm(p => ({ ...p, items: updated }));
                      }}
                      className="w-full text-center bg-[#141414] border border-white/5 rounded-lg py-1.5 text-white font-mono text-[11px]"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold py-3.5 rounded-xl uppercase tracking-wider shadow-lg transition-colors cursor-pointer border-none text-[10px]">
          Accept Cargo Delivery & Allocate Pre-orders
        </button>
      </form>
    </div>
  );
}
