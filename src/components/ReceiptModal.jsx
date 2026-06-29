import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer } from 'lucide-react';

export default function ReceiptModal({ orderId, receiptData, onClose, apiBaseUrl }) {
  const [receipt, setReceipt] = useState(receiptData || null);
  const [loading, setLoading] = useState(!receiptData);
  const [error, setError] = useState('');

  useEffect(() => {
    if (receiptData) {
      setReceipt(receiptData);
      setLoading(false);
      return;
    }

    async function fetchReceipt() {
      try {
        const res = await fetch(`${apiBaseUrl}/admin/orders/${orderId}/receipt`, { credentials: 'include' });
        if (!res.ok) {
          let errorMsg = 'Failed to load receipt.';
          try {
            const e = await res.json();
            errorMsg = e.message || errorMsg;
          } catch (_) {
            try {
              const text = await res.text();
              if (text) errorMsg = text;
            } catch (__) {}
          }
          throw new Error(errorMsg);
        }
        setReceipt(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReceipt();
  }, [orderId, receiptData, apiBaseUrl]);

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
  const fmtMoney = (n) => Number(n || 0).toLocaleString('en-IN');

  const statusStyle = (s) => {
    if (s === 'Delivered') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (s === 'Pre-Order') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (s === 'Confirmed') return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    if (s === 'Shipped') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (s === 'Verification Pending') return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    return 'bg-white/5 text-white/50 border-white/10';
  };

  return createPortal(
    <div id="gk-receipt-root-portal">
      <style>{`
        @media print {
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body > *:not(#gk-receipt-root-portal) { display: none !important; }
          #gk-receipt-root-portal {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            color: black !important;
          }
          #gk-receipt-backdrop {
            background: white !important;
            position: relative !important;
            inset: auto !important;
            padding: 0 !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
          }
          #gk-receipt-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            background: white !important;
            color: black !important;
            padding: 24px !important;
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .no-print { display: none !important; }
          #gk-receipt-root * {
            color: black !important;
            background-color: transparent !important;
            border-color: #e5e7eb !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          #gk-receipt-root .text-\[\#ff5500\\] {
            color: #e64a19 !important;
          }
          #gk-receipt-root .text-emerald-400 {
            color: #1b5e20 !important;
          }
          #gk-receipt-root .text-amber-400 {
            color: #e65100 !important;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        id="gk-receipt-backdrop"
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          id="gk-receipt-root"
          className="w-full max-w-2xl bg-[#0a0a0a] border border-white/8 rounded-2xl flex flex-col h-[96vh] md:h-[94vh] shadow-[0_0_120px_-20px_rgba(255,85,0,0.25)] overflow-hidden"
        >
          {/* Orange accent bar */}
          <div className="h-[2px] bg-gradient-to-r from-[#ff5500]/20 via-[#ff5500] to-[#ff5500]/20 flex-shrink-0" />

          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0 no-print">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#ff5500]/10 border border-[#ff5500]/20 flex items-center justify-center">
                <Printer size={14} className="text-[#ff5500]" />
              </div>
              <div>
                <div className="text-[9px] font-black text-[#ff5500] uppercase tracking-widest">Official Receipt</div>
                <div className="text-sm font-bold text-white">Order #{orderId?.slice(0, 8).toUpperCase()}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                disabled={!receipt}
                className="flex items-center gap-2 bg-[#ff5500] hover:bg-[#ff6611] disabled:opacity-40 disabled:cursor-not-allowed text-black font-extrabold text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <Printer size={11} />
                Print / Save PDF
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors border border-white/5 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 min-h-0" data-lenis-prevent>
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-[#ff5500] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {error && (
              <div className="m-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-semibold">
                {error}
              </div>
            )}

            {receipt && (
              <div className="p-6 space-y-5">
                {/* ── RECEIPT HEADER ── */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xl font-black text-white tracking-tight">GARAGE KINGS</div>
                    <div className="text-[9px] font-bold text-[#ff5500] uppercase tracking-[0.3em] mt-0.5">Premium Diecast Collectibles</div>
                    <div className="text-[10px] text-white/40 mt-1">@garagekingsindia</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Receipt No.</div>
                    <div className="text-base font-black text-white font-mono mt-0.5">{receipt.receiptNumber}</div>
                    <div className="text-[10px] text-white/40 mt-1">{fmtDate(receipt.date)}</div>
                    <div className={`inline-flex mt-2 px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${statusStyle(receipt.status)}`}>
                      {receipt.status}
                    </div>
                  </div>
                </div>

                <div className="h-[1px] bg-white/5" />

                {/* ── CUSTOMER + ORDER INFO ── */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[9px] font-black text-[#ff5500] uppercase tracking-widest mb-2">Bill To</div>
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold text-white">{receipt.customer.name}</div>
                      {receipt.customer.email && <div className="text-[10px] text-white/50">{receipt.customer.email}</div>}
                      {receipt.customer.phone && <div className="text-[10px] text-white/50">{receipt.customer.phone}</div>}
                      {receipt.customer.instagram && <div className="text-[10px] text-white/50">@{receipt.customer.instagram}</div>}
                      {receipt.customer.address && (
                        <div className="text-[10px] text-white/40 mt-1 leading-relaxed max-w-[200px]">{receipt.customer.address}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-black text-[#ff5500] uppercase tracking-widest mb-2">Order Info</div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-white/40">Order ID</span>
                        <span className="text-white font-mono text-[9px]">{receipt.orderId.slice(0, 16)}…</span>
                      </div>
                      {receipt.bookingType === 'pre_order' && (
                        <div className="flex justify-between text-[10px]">
                          <span className="text-white/40">Type</span>
                          <span className="text-amber-400 font-bold">PRE-ORDER</span>
                        </div>
                      )}
                      {receipt.trackingNumber && (
                        <div className="flex justify-between text-[10px]">
                          <span className="text-white/40">Tracking</span>
                          <span className="text-white font-mono">{receipt.trackingNumber}</span>
                        </div>
                      )}
                      {receipt.courierPartner && (
                        <div className="flex justify-between text-[10px]">
                          <span className="text-white/40">Courier</span>
                          <span className="text-white">{receipt.courierPartner}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="h-[1px] bg-white/5" />

                {/* ── ITEMS TABLE ── */}
                <div>
                  <div className="text-[9px] font-black text-[#ff5500] uppercase tracking-widest mb-3">Items</div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                    {/* Header row */}
                    <div className="grid grid-cols-[1fr_56px_36px_80px] gap-2 px-4 py-2 bg-white/[0.03] border-b border-white/5 text-[8px] font-black text-white/40 uppercase tracking-widest">
                      <span>Item</span>
                      <span className="text-right">Scale</span>
                      <span className="text-right">Qty</span>
                      <span className="text-right">Total</span>
                    </div>
                    {/* Data rows */}
                    {receipt.items.map((item, idx) => (
                      <div
                        key={idx}
                        className={`grid grid-cols-[1fr_56px_36px_80px] gap-2 px-4 py-3 items-center ${idx < receipt.items.length - 1 ? 'border-b border-white/5' : ''}`}
                      >
                        <div>
                          <div className="text-xs font-bold text-white">{item.name}</div>
                          {item.series && <div className="text-[9px] text-white/30">{item.series}</div>}
                        </div>
                        <div className="text-[9px] text-white/40 text-right">{item.scale}</div>
                        <div className="text-[10px] text-white/60 text-right">{item.qty}</div>
                        <div className="text-[11px] font-bold text-white font-mono text-right">₹{fmtMoney(item.lineTotal)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── TOTALS ── */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-white/40">Subtotal</span>
                    <span className="text-white font-mono">₹{fmtMoney(receipt.subtotal)}</span>
                  </div>
                  {receipt.shippingCharges > 0 && (
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-white/40">Shipping &amp; Packaging</span>
                      <span className="text-white font-mono">₹{fmtMoney(receipt.shippingCharges)}</span>
                    </div>
                  )}
                  <div className="h-[1px] bg-white/5 my-1" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black text-white uppercase tracking-wider">Total Amount</span>
                    <span className="text-base font-black text-[#ff5500] font-mono">₹{fmtMoney(receipt.totalAmount)}</span>
                  </div>

                  {/* Pre-order balance breakdown */}
                  {receipt.bookingType === 'pre_order' && (
                    <>
                      <div className="h-[1px] bg-amber-500/10 my-1" />
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-white/40">Advance Paid</span>
                        <span className="text-emerald-400 font-bold font-mono">₹{fmtMoney(receipt.advancePaid)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-white/40">Pending Balance</span>
                        <span className={`font-bold font-mono ${receipt.pendingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {receipt.pendingBalance > 0
                            ? `₹${fmtMoney(receipt.pendingBalance)}`
                            : 'PAID IN FULL ✓'}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* ── FOOTER ── */}
                <div className="pt-2 border-t border-white/5 text-center text-[9px] text-white/25 leading-relaxed">
                  Thank you for your purchase! For queries, DM us on Instagram @garagekingsindia
                  <br />
                  This is a computer-generated receipt and does not require a physical signature.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
