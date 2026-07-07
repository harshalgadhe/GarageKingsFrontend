import React from 'react';
import { recordSupplierPayment } from '../lib/db';

export default function RecordPaymentForm({
  paymentForm,
  setPaymentForm,
  selectedPurchase,
  cashAccounts,
  setIsRecordingSupplierPayment,
  fetchSupplierPurchases,
  fetchSupplierPurchaseDetailsData,
  fetchSupplierMetrics,
  fetchCashAccounts,
  showToast
}) {
  return (
    <div className="bg-[#0b0b0b] border border-white/5 rounded-2xl p-6 space-y-6 max-w-xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsRecordingSupplierPayment(false)}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] uppercase font-black tracking-widest border border-white/5 cursor-pointer"
          >
            ← Back to Details
          </button>
          <div>
            <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Payments & Ledger</div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Record Supplier Payment</h3>
          </div>
        </div>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (paymentForm.amount <= 0) {
            showToast("Please enter a valid payment amount", "error");
            return;
          }
          if (!paymentForm.cashAccountId) {
            showToast("Please select a funding cash drawer", "error");
            return;
          }
          try {
            const res = await recordSupplierPayment(selectedPurchase.id, paymentForm);
            if (res.success) {
              showToast("Payment recorded successfully", "success");
              setIsRecordingSupplierPayment(false);
              fetchSupplierPurchases(1, '');
              fetchSupplierPurchaseDetailsData(selectedPurchase.id);
              fetchSupplierMetrics();
              fetchCashAccounts();
            }
          } catch (err) {
            showToast(err.message || "Failed to record payment", "error");
          }
        }}
        className="space-y-4 text-xs bg-[#111111] p-5 rounded-2xl border border-white/5"
      >
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#888888] uppercase block">Payment Date</label>
          <input
            type="date"
            value={paymentForm.date}
            onChange={(e) => setPaymentForm(p => ({ ...p, date: e.target.value }))}
            className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#888888] uppercase block">Amount Paid</label>
            <input
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
              className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono"
              required
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#888888] uppercase block">Source Drawer/Bank</label>
            <select
              value={paymentForm.cashAccountId}
              onChange={(e) => setPaymentForm(p => ({ ...p, cashAccountId: e.target.value }))}
              className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none"
              required
            >
              <option value="">-- Choose Account --</option>
              {cashAccounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} (₹{Number(a.balance).toLocaleString('en-IN')})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#888888] uppercase block">Payment Method</label>
            <select
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm(p => ({ ...p, paymentMethod: e.target.value }))}
              className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none"
            >
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#888888] uppercase block">UTR / Tx Reference Number</label>
            <input
              type="text"
              value={paymentForm.referenceNumber}
              onChange={(e) => setPaymentForm(p => ({ ...p, referenceNumber: e.target.value }))}
              placeholder="Ref ID"
              className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#888888] uppercase block">Memo Notes</label>
          <input
            type="text"
            value={paymentForm.notes}
            onChange={(e) => setPaymentForm(p => ({ ...p, notes: e.target.value }))}
            placeholder="Settlement final invoice clearing..."
            className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none"
          />
        </div>

        <button type="submit" className="w-full bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold py-3.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer border-none text-[10px]">
          Submit Payment Log
        </button>
      </form>
    </div>
  );
}
