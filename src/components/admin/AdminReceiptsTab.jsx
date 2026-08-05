import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Ban, FileText, X } from "lucide-react";
import Pagination from "./Pagination";
import DebouncedSearchBar from "../common/DebouncedSearchBar";
import ProductTypeahead from "./ProductTypeahead";
import SearchableSelect from "./SearchableSelect";

const FORMAT_NOTES = {
  standard:   "If fulfilment becomes unavailable, the GarageKings team will contact you to discuss the resolution under the terms confirmed for this acquisition.",
  prebooking: "This receipt is for the Pre-Order (PO) of the item. Rest of the payment is due when the stock arrives. Pre-Orders are non-refundable unless unfulfilled by Garage Kings India.",
};

// Shared receipt renderer for both screen preview and print portal
function ReceiptBody({ r, forPrint = false }) {
  const items    = r.items || [];
  const subtotal = items.reduce((s, it) => s + Number(it.qty) * (Number(it.amount) || 0), 0);
  const shipping = r.includeShipping ? Number(r.shippingCharges || 0) : 0;
  const taxRate  = Number(r.taxPercent || 0);
  const taxAmt   = (subtotal + shipping) * (taxRate / 100);
  const total    = subtotal + shipping + taxAmt;
  const pending  = r.formatType === "prebooking" ? Number(r.pendingBalance || 0) : 0;

  const wrapStyle = {
    color: "#000",
    backgroundColor: "#fff",
    padding: forPrint ? "0" : "18px",
    fontFamily: "system-ui, sans-serif",
    minHeight: forPrint ? "100%" : "auto",
    ...(forPrint ? { width: "100%", boxSizing: "border-box" } : {}),
    position: "relative",
    overflow: "hidden",
  };

  const fmt = (n) => Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={wrapStyle}>
      {/* Watermark */}
      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%) rotate(-25deg)", fontSize:"70px", fontWeight:"900", letterSpacing:"0.25em", color:"rgba(43,149,201,0.085)", width:"90%", textAlign:"center", textTransform:"uppercase", lineHeight:"1.2", pointerEvents:"none", userSelect:"none", wordBreak:"break-word" }}>
        {r.companyName || "Garage Kings"}
      </div>

      <div style={{ position:"relative", zIndex:10, display:"flex", flexDirection:"column", justifyContent:"space-between", minHeight: forPrint ? "250mm" : "536px" }}>
        <div>
          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px" }}>
            <div>
              <h1 style={{ fontSize:"26px", fontWeight:"900", margin:0, color:"#000" }}>{r.companyName || "Garage Kings India"}</h1>
              <p style={{ fontSize:"13px", margin:"4px 0 0", color:"#4b5563" }}>{r.companyLocation || "Delhi"}</p>
            </div>
            <div style={{ textAlign:"right" }}>
              <h2 style={{ fontSize:"26px", fontWeight:"900", margin:"0 0 4px", color:"#1f2937" }}>Receipt</h2>
              <p style={{ fontSize:"12px", margin:0, color:"#4b5563" }}>Receipt #&nbsp;{r.receiptNumber}</p>
              <p style={{ fontSize:"11px", margin:"4px 0 0", color:"#6b7280" }}>Date&nbsp;{r.dateString}</p>
            </div>
          </div>

          {/* To */}
          <div style={{ marginBottom:"24px" }}>
            <div style={{ fontSize:"11.5px", fontWeight:"bold", backgroundColor:"#2b95c9", color:"#fff", padding:"5px 12px", letterSpacing:"0.05em", borderRadius:"2px", marginBottom:"8px" }}>To</div>
            <div style={{ fontSize:"11px", color:"#1f2937", paddingLeft:"4px" }}>
              <div style={{ fontSize:"13px", fontWeight:"bold", marginBottom:"2px", color:"#000" }}>{r.customerName}</div>
              {r.customerPhone   && <div style={{ fontWeight:"600" }}>{r.customerPhone}</div>}
              {r.customerEmail   && <div style={{ color:"#4b5563" }}>{r.customerEmail}</div>}
              {r.customerInsta   && <div style={{ color:"#2563eb" }}>{r.customerInsta.startsWith("@") ? r.customerInsta : "@"+r.customerInsta}</div>}
              {r.customerAddress && <div style={{ lineHeight:"1.5", color:"#4b5563", whiteSpace:"pre-line", marginTop:"4px" }}>{r.customerAddress}</div>}
            </div>
          </div>

          {/* Items table */}
          <div style={{ marginBottom:"24px" }}>
            <div style={{ fontSize:"11.5px", fontWeight:"bold", backgroundColor:"#2b95c9", color:"#fff", padding:"7px 16px", letterSpacing:"0.05em", display:"grid", gridTemplateColumns:"repeat(12,minmax(0,1fr))", gap:"8px", borderRadius:"2px" }}>
              <div style={{ gridColumn:"span 2", textAlign:"center" }}>Qty</div>
              <div style={{ gridColumn:"span 7" }}>Description</div>
              <div style={{ gridColumn:"span 3", textAlign:"right" }}>Amount</div>
            </div>
            <div style={{ borderBottom:"1px solid #e5e7eb", paddingLeft:"4px", paddingRight:"4px" }}>
              {items.map((it, i) => (
                <div key={i} style={{ borderTop: i>0?"1px solid #f3f4f6":"none", display:"grid", gridTemplateColumns:"repeat(12,minmax(0,1fr))", gap:"8px", padding:"8px 0" }}>
                  <div style={{ gridColumn:"span 2", textAlign:"center", color:"#4b5563" }}>{it.qty}</div>
                  <div style={{ gridColumn:"span 7", color:"#1f2937" }}>{it.description}</div>
                  <div style={{ gridColumn:"span 3", textAlign:"right", fontFamily:"monospace", fontWeight:"600", color:"#111827" }}>&#x20B9;{fmt(Number(it.qty)*(Number(it.amount)||0))}</div>
                </div>
              ))}
              {r.includeShipping && (
                <div style={{ borderTop:"1px solid #f3f4f6", display:"grid", gridTemplateColumns:"repeat(12,minmax(0,1fr))", gap:"8px", padding:"8px 0" }}>
                  <div style={{ gridColumn:"span 2", textAlign:"center", color:"#4b5563" }}>1</div>
                  <div style={{ gridColumn:"span 7", color:"#1f2937" }}>Shipping Charges</div>
                  <div style={{ gridColumn:"span 3", textAlign:"right", fontFamily:"monospace", fontWeight:"600", color:"#111827" }}>&#x20B9;{fmt(shipping)}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Totals */}
        <div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", paddingTop:"8px" }}>
            {taxRate > 0 && (
              <div style={{ fontSize:"11px", display:"flex", justifyContent:"space-between", width:"320px", color:"#4b5563", marginBottom:"4px" }}>
                <span>Including Tax ({taxRate}%)</span>
                <span style={{ fontFamily:"monospace", fontWeight:"600" }}>&#x20B9;{fmt(taxAmt)}</span>
              </div>
            )}
            <div style={{ borderTop:"1px solid #d1d5db", paddingTop:"6px", marginTop:"4px", fontSize:"14px", fontWeight:"bold", display:"flex", justifyContent:"space-between", width:"320px", color:"#000" }}>
              <span>Total Paid</span>
              <span style={{ fontSize:"18px", fontWeight:"900", fontFamily:"monospace" }}>&#x20B9;{fmt(total)}</span>
            </div>
            {pending > 0 && (
              <div style={{ borderTop:"1px dashed #d1d5db", paddingTop:"6px", marginTop:"6px", fontSize:"11px", fontWeight:"bold", display:"flex", justifyContent:"space-between", alignItems:"flex-start", width:"320px", color:"#dc2626", gap:"12px" }}>
                <div>
                  <div>Balance Due Before Delivery</div>
                  <div style={{ fontSize:"9.5px", fontWeight:"500", marginTop:"1px" }}>(Excluding shipping)</div>
                </div>
                <span style={{ fontFamily:"monospace", fontWeight:"bold", whiteSpace:"nowrap" }}>&#x20B9;{fmt(pending)}</span>
              </div>
            )}
          </div>
          {r.footerNote && (
            <div style={{ marginTop: forPrint ? "28px" : "40px", fontSize:"11px", textAlign:"center", color:"#374151", lineHeight:"1.5" }}>{r.footerNote}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminReceiptsTab({
  receiptsList = [], receiptSearch, setReceiptSearch,
  receiptPage, setReceiptPage, RECEIPTS_PER_PAGE = 10,
  receiptsTotalPages = 1, receiptsTotal = 0,
  isAddingReceipt, setIsAddingReceipt,
  onFetchInventory,
  editingReceiptId, setEditingReceiptId,
  receiptForm, setReceiptForm,
  createDefaultReceiptForm,
  handleSaveReceipt, handleEditReceipt, handleVoidReceipt, handlePrintReceipt,
  activeReceiptPreview, setActiveReceiptPreview,
  cars = [],
  isReceiptsLoading = false,
}) {
  const paginated = receiptsList;
  const pageSize = RECEIPTS_PER_PAGE || 10;
  const totalPages = receiptsTotalPages || 1;
  const [voidTarget, setVoidTarget] = React.useState(null);
  const [voidReason, setVoidReason] = React.useState("");
  const [isVoiding, setIsVoiding] = React.useState(false);

  const confirmVoid = async () => {
    if (!voidTarget || voidReason.trim().length < 5) return;
    setIsVoiding(true);
    try {
      await handleVoidReceipt(voidTarget.id, voidReason.trim());
      setVoidTarget(null);
      setVoidReason("");
    } finally {
      setIsVoiding(false);
    }
  };

  // Typeahead search for products (triggers API only when query >= 3 letters)
  const API_BASE_URL = import.meta.env.PROD 
    ? '/api/v1' 
    : (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1');

  const [inventorySearchQuery, setInventorySearchQuery] = React.useState("");
  const [inventorySuggestions, setInventorySuggestions] = React.useState([]);
  const [isInventoryLoading, setIsInventoryLoading] = React.useState(false);
  const [showInventoryDropdown, setShowInventoryDropdown] = React.useState(false);

  React.useEffect(() => {
    const q = inventorySearchQuery.trim();
    if (q.length < 3) {
      setInventorySuggestions([]);
      setIsInventoryLoading(false);
      return;
    }

    setIsInventoryLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/products?page=1&limit=15&search=${encodeURIComponent(q)}`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          const items = data.products || data.items || data.data || (Array.isArray(data) ? data : []);
          setInventorySuggestions(items);
        }
      } catch (err) {
        console.error("Error searching products for receipt:", err);
      } finally {
        setIsInventoryLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inventorySearchQuery]);

  const [showCustomerDropdown, setShowCustomerDropdown] = React.useState(false);

  const uniqueCustomers = React.useMemo(() => {
    const map = new Map();
    (receiptsList || []).forEach(r => {
      if (r.customerName && r.customerName.trim()) {
        const key = r.customerName.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            name: r.customerName.trim(),
            phone: r.customerPhone || "",
            email: r.customerEmail || "",
            insta: r.customerInsta || "",
            address: r.customerAddress || "",
          });
        }
      }
    });
    return Array.from(map.values());
  }, [receiptsList]);

  const customerQuery = (receiptForm.customerName || "").trim();
  const customerSuggestions = React.useMemo(() => {
    if (customerQuery.length <= 3) return [];
    const q = customerQuery.toLowerCase();
    return uniqueCustomers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.phone && c.phone.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [customerQuery, uniqueCustomers]);

  const handleSelectCustomerSuggestion = (c) => {
    setReceiptForm(prev => ({
      ...prev,
      customerName: c.name,
      customerPhone: c.phone || prev.customerPhone,
      customerEmail: c.email || prev.customerEmail,
      customerInsta: c.insta || prev.customerInsta,
      customerAddress: c.address || prev.customerAddress,
    }));
    setShowCustomerDropdown(false);
  };

  React.useEffect(() => {
    if (activeReceiptPreview) {
      const timer = setTimeout(() => {
        window.print();
      }, 300);

      const handleAfterPrint = () => {
        setActiveReceiptPreview(null);
      };

      window.addEventListener("afterprint", handleAfterPrint);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("afterprint", handleAfterPrint);
      };
    }
  }, [activeReceiptPreview, setActiveReceiptPreview]);

  return (
    <div className="space-y-6">


      {/* TOP BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-base font-black uppercase tracking-wider text-white">Billing &amp; Receipts</h3>
          <p className="text-[10px] text-zinc-400 mt-0.5">Generate, issue, and manage official customer billing receipts</p>
        </div>
        <div className="flex items-center gap-3">
          <DebouncedSearchBar
            className="w-full sm:w-64"
            value={receiptSearch}
            placeholder="Search by customer, receipt or phone"
            onChange={value => {
              setReceiptSearch(value);
              setReceiptPage(1);
            }}
          />
          <button
            onClick={() => {
              setReceiptForm(createDefaultReceiptForm());
              setEditingReceiptId(null);
              setIsAddingReceipt(prev => !prev);
              if (onFetchInventory) onFetchInventory();
            }}
            className="bg-[#ff5500]/10 hover:bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/30 font-extrabold text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-[0_2px_10px_rgba(255,85,0,0.15)] cursor-pointer transition-all">
            <Plus size={14} /> New Receipt
          </button>
        </div>
      </div>

      {/* INLINE FORM */}
      <AnimatePresence>
        {isAddingReceipt && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }} className="overflow-hidden">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 sm:p-6 md:p-8">

              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingReceiptId ? `Edit Receipt (${receiptForm.receiptNumber})` : "Create New Receipt"}
                </h2>
                <button onClick={() => { setIsAddingReceipt(false); setEditingReceiptId(null); }} className="text-white/50 hover:text-white cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* ── LEFT: FORM (12 cols on mobile, 7 cols on lg) ── */}
                <div className="col-span-12 lg:col-span-7 space-y-5">

                  {/* Receipt # and Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Receipt Number *</label>
                      <input type="text" value={receiptForm.receiptNumber} onChange={e => setReceiptForm(p => ({ ...p, receiptNumber: e.target.value }))}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Date &amp; Time *</label>
                      <input type="text" value={receiptForm.dateString} onChange={e => setReceiptForm(p => ({ ...p, dateString: e.target.value }))}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>

                  {/* Company */}
                  <div className="bg-black/20 p-4 border border-white/5 rounded-xl space-y-4">
                    <h3 className="text-xs font-black uppercase text-blue-400 tracking-wider">Company Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Company Name *</label>
                        <input type="text" placeholder="e.g. Garage Kings India" value={receiptForm.companyName} onChange={e => setReceiptForm(p => ({ ...p, companyName: e.target.value }))}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Location / City *</label>
                        <input type="text" placeholder="e.g. Delhi" value={receiptForm.companyLocation} onChange={e => setReceiptForm(p => ({ ...p, companyLocation: e.target.value }))}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="bg-black/20 p-4 border border-white/5 rounded-xl space-y-4">
                    <h3 className="text-xs font-black uppercase text-blue-400 tracking-wider">Customer Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Customer Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Rahul Sharma"
                          value={receiptForm.customerName}
                          onFocus={() => setShowCustomerDropdown(true)}
                          onChange={e => {
                            setReceiptForm(p => ({ ...p, customerName: e.target.value }));
                            setShowCustomerDropdown(true);
                          }}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                        />
                        {showCustomerDropdown && customerQuery.length > 3 && customerSuggestions.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#18181b] border border-white/15 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                            <div className="px-3 py-1.5 text-[9px] font-bold text-zinc-400 uppercase tracking-wider bg-black/40 border-b border-white/5">
                              Suggested Customers (Autofill)
                            </div>
                            {customerSuggestions.map((c, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSelectCustomerSuggestion(c);
                                }}
                                className="w-full text-left px-3.5 py-2.5 hover:bg-blue-500/20 hover:text-white border-b border-white/5 last:border-0 transition-colors flex items-center justify-between text-xs cursor-pointer group"
                              >
                                <span className="font-bold text-white group-hover:text-blue-300">
                                  {c.name} {c.phone ? <span className="text-zinc-400 font-mono font-normal"> - {c.phone}</span> : ""}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                  Autofill
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Phone Number *</label>
                        <input type="text" placeholder="e.g. 9876543210" value={receiptForm.customerPhone} onChange={e => setReceiptForm(p => ({ ...p, customerPhone: e.target.value }))}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Email (Optional)</label>
                        <input type="email" placeholder="e.g. customer@example.com" value={receiptForm.customerEmail} onChange={e => setReceiptForm(p => ({ ...p, customerEmail: e.target.value }))}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Instagram Handle (Optional)</label>
                        <input type="text" placeholder="e.g. @diecast_collector" value={receiptForm.customerInsta} onChange={e => setReceiptForm(p => ({ ...p, customerInsta: e.target.value }))}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Customer Address (Optional)</label>
                      <textarea rows={3} placeholder="Full shipping address..." value={receiptForm.customerAddress} onChange={e => setReceiptForm(p => ({ ...p, customerAddress: e.target.value }))}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="bg-black/20 p-3 sm:p-4 border border-white/5 rounded-xl space-y-4 w-full min-w-0 max-w-full overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <h3 className="text-xs font-black uppercase text-blue-400 tracking-wider">Line Items *</h3>
                      <ProductTypeahead
                        onSelectProduct={car => {
                          const desc = `${car.brand || ''} ${car.name || ''}${car.grade ? ' - ' + car.grade : ''}`.trim();
                          const amt = String(car.price || car.sellingPrice || 0);
                          const newItem = { qty: 1, description: desc, amount: amt };
                          setReceiptForm(prev => {
                            const first = prev.items[0];
                            const isEmpty = prev.items.length === 1 && !first?.description && !first?.amount;
                            return { ...prev, items: isEmpty ? [newItem] : [...prev.items, newItem] };
                          });
                        }}
                      />
                    </div>

                    {receiptForm.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center bg-black/40 p-2 sm:p-3 border border-white/5 rounded-xl w-full min-w-0 max-w-full">
                        <div className="col-span-3 sm:col-span-2">
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-white/40 uppercase mb-1">Qty</label>
                          <input type="number" min="1" value={item.qty}
                            onChange={e => { const ni = [...receiptForm.items]; ni[index].qty = Math.max(1, parseInt(e.target.value)||1); setReceiptForm(p => ({ ...p, items: ni })); }}
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-center text-xs sm:text-sm text-white focus:outline-none" />
                        </div>
                        <div className="col-span-9 sm:col-span-6">
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-white/40 uppercase mb-1">Description *</label>
                          <input type="text" placeholder="e.g. Mini GT F1" value={item.description}
                            onChange={e => { const ni = [...receiptForm.items]; ni[index].description = e.target.value; setReceiptForm(p => ({ ...p, items: ni })); }}
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500" />
                        </div>
                        <div className="col-span-9 sm:col-span-3">
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-white/40 uppercase mb-1">Amount (₹) *</label>
                          <input type="number" placeholder="2000" value={item.amount}
                            onChange={e => { const ni = [...receiptForm.items]; ni[index].amount = e.target.value; setReceiptForm(p => ({ ...p, items: ni })); }}
                            className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-right text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500" />
                        </div>
                        {receiptForm.items.length > 1 ? (
                          <div className="col-span-3 sm:col-span-1 flex justify-end">
                            <button onClick={() => setReceiptForm(p => ({ ...p, items: p.items.filter((_, i) => i !== index) }))}
                              className="mt-3.5 p-1.5 text-white/40 hover:text-[#ff5500] hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ) : (
                          <div className="col-span-3 sm:hidden" />
                        )}
                      </div>
                    ))}

                    <button onClick={() => setReceiptForm(p => ({ ...p, items: [...p.items, { qty:1, description:"", amount:"" }] }))}
                      className="px-3 py-2 rounded-lg bg-white/5 border border-dashed border-white/10 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors w-full flex items-center justify-center gap-1.5 cursor-pointer">
                      <Plus size={14} /> Add Item
                    </button>
                  </div>

                  {/* Shipping / Tax / Format */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-black/20 p-4 border border-white/5 rounded-xl">
                    <div className="flex flex-col justify-center">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${receiptForm.includeShipping ? "bg-blue-500 border-blue-500 text-white" : "border-white/20 bg-black group-hover:border-white/40"}`}>
                          {receiptForm.includeShipping && <svg viewBox="0 0 14 14" fill="none" className="w-2.5 h-2.5"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <input type="checkbox" className="hidden" checked={receiptForm.includeShipping} onChange={e => setReceiptForm(p => ({ ...p, includeShipping: e.target.checked }))} />
                        <span className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors">Include Shipping</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Shipping Fee (&#x20B9;)</label>
                      <input type="number" min="0" disabled={!receiptForm.includeShipping} value={receiptForm.shippingCharges}
                        onChange={e => setReceiptForm(p => ({ ...p, shippingCharges: Math.max(0, parseFloat(e.target.value)||0) }))}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Tax Rate (%)</label>
                      <input type="number" min="0" value={receiptForm.taxPercent}
                        onChange={e => setReceiptForm(p => ({ ...p, taxPercent: Math.max(0, parseFloat(e.target.value)||0) }))}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none" />
                    </div>
                    <div>
                      <SearchableSelect
                        label="Receipt Format"
                        value={receiptForm.formatType}
                        onChange={handleFormatChange}
                        options={[
                          { label: 'Standard Sale', value: 'standard' },
                          { label: 'Prebooking / Pre-Order (PO)', value: 'prebooking' }
                        ]}
                      />
                    </div>
                    {receiptForm.formatType === "prebooking" && (
                      <div className="md:col-span-4 border-t border-white/5 pt-4 mt-2">
                        <label className="block text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Pending Balance / Remaining Amount (&#x20B9;)</label>
                        <input type="number" min="0" placeholder="Enter remaining balance before delivery..."
                          value={receiptForm.pendingBalance} onChange={e => setReceiptForm(p => ({ ...p, pendingBalance: e.target.value }))}
                          className="w-full bg-black/55 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 font-semibold" />
                      </div>
                    )}
                  </div>

                  {/* Footer Note */}
                  <div className="bg-black/20 p-4 border border-white/5 rounded-xl">
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Footer Refund / Payment Note</label>
                    <textarea rows={2} value={receiptForm.footerNote} onChange={e => setReceiptForm(p => ({ ...p, footerNote: e.target.value }))}
                      placeholder="Custom note to appear at the bottom of the receipt..."
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row justify-end gap-2.5 sm:gap-3 pt-3">
                    <button onClick={() => { setIsAddingReceipt(false); setEditingReceiptId(null); }}
                      className="w-full sm:w-auto px-6 py-3 rounded-lg border border-white/10 hover:bg-white/5 text-sm font-semibold transition-colors cursor-pointer text-white/70">Cancel</button>
                    <button onClick={handleSaveReceipt}
                      className="w-full sm:w-auto px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer">
                      <FileText size={18} /> {editingReceiptId ? "Update Receipt" : "Save Receipt"}
                    </button>
                  </div>
                </div>

                {/* ── RIGHT: LIVE PREVIEW (Shown below form on mobile, side-by-side on lg screens) ── */}
                <div className="col-span-12 lg:col-span-5 space-y-4">
                  <h3 className="text-xs font-black uppercase text-white/50 tracking-wider">Live Receipt Preview</h3>
                  <div className="rounded-xl shadow-2xl overflow-x-auto">
                    <ReceiptBody r={receiptForm} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RECEIPTS TABLE (DESKTOP) */}
      <div className="hidden sm:block overflow-x-auto border border-white/5 rounded-2xl bg-[#141414]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-black/40 border-b border-white/5 text-zinc-500 uppercase tracking-widest text-[9px]">
              <th className="p-4 font-bold">Receipt #</th>
              <th className="p-4 font-bold">Date</th>
              <th className="p-4 font-bold">Customer</th>
              <th className="p-4 font-bold">Format</th>
              <th className="p-4 font-bold text-right">Total</th>
              <th className="p-4 font-bold text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isReceiptsLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-white/5 animate-pulse">
                  <td className="p-4"><div className="h-4 bg-white/10 rounded w-20"></div></td>
                  <td className="p-4"><div className="h-4 bg-white/10 rounded w-24"></div></td>
                  <td className="p-4">
                    <div className="h-4 bg-white/10 rounded w-36 mb-1"></div>
                    <div className="h-3 bg-white/5 rounded w-28"></div>
                  </td>
                  <td className="p-4"><div className="h-4 bg-white/10 rounded w-24"></div></td>
                  <td className="p-4 text-right"><div className="h-4 bg-white/10 rounded w-20 ml-auto"></div></td>
                  <td className="p-4 text-center"><div className="h-4 bg-white/10 rounded w-16 mx-auto"></div></td>
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-zinc-500 font-mono">No receipts found.</td></tr>
            ) : paginated.map(r => (
              <tr key={r.id} className={`border-b border-white/5 hover:bg-white/[0.015] ${r.status === 'Voided' ? 'opacity-55' : ''}`}>
                <td className="p-4 font-mono font-bold text-[#ff5500]">{r.receiptNumber}</td>
                <td className="p-4 text-zinc-400 text-[10px] font-mono">{r.dateString || new Date(r.createdAt || r.created_at).toLocaleDateString("en-IN")}</td>
                <td className="p-4">
                  <span className="font-bold text-white block">{r.customerName}</span>
                  {r.customerPhone && <span className="text-[10px] text-zinc-500 font-mono block">{r.customerPhone}</span>}
                  {Array.isArray(r.items) && r.items.length > 0 && (
                    <span className="text-[10px] text-[#ff5500]/70 font-mono block max-w-xs truncate mt-0.5" title={r.items.map(it => it.description).filter(Boolean).join(", ")}>
                      {r.items.map(it => it.description).filter(Boolean).join(", ")}
                    </span>
                  )}
                </td>
                <td className="p-4">
                  {r.status === 'Voided' ? (
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">Voided</span>
                  ) : (
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${r.formatType === "prebooking" ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"}`}>{r.formatType === "prebooking" ? "Prebooking / PO" : "Standard Sale"}</span>
                  )}
                </td>
                <td className="p-4 text-right font-mono font-bold text-white">&#x20B9;{Number(r.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits:2 })}</td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handlePrintReceipt(r)} title="Print / Save PDF"
                      className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"><FileText size={14} /></button>
                    {r.status !== 'Voided' && <button onClick={() => handleEditReceipt(r)} title="Edit"
                      className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-colors cursor-pointer"><Edit2 size={14} /></button>}
                    {r.status !== 'Voided' && <button onClick={() => { setVoidTarget(r); setVoidReason(""); }} title="Void receipt"
                      className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"><Ban size={14} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RECEIPTS MOBILE CARDS (MOBILE ONLY) */}
      <div className="sm:hidden space-y-3">
        {isReceiptsLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#141414] border border-white/5 rounded-2xl p-4 space-y-3 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-28"></div>
              <div className="h-4 bg-white/10 rounded w-44"></div>
              <div className="h-4 bg-white/10 rounded w-32"></div>
            </div>
          ))
        ) : paginated.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 font-mono bg-[#141414] border border-white/5 rounded-2xl">No receipts found.</div>
        ) : paginated.map(r => (
          <div key={r.id} className={`bg-[#141414] border border-white/5 rounded-2xl p-4 space-y-3 ${r.status === 'Voided' ? 'opacity-55' : ''}`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono font-bold text-[#ff5500] text-sm block">{r.receiptNumber}</span>
                <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">{r.dateString || new Date(r.createdAt || r.created_at).toLocaleDateString("en-IN")}</span>
              </div>
              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${r.status === 'Voided' ? 'bg-white/5 border border-white/10 text-zinc-400' : r.formatType === "prebooking" ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"}`}>{r.status === 'Voided' ? 'Voided' : r.formatType === "prebooking" ? "Prebooking / PO" : "Standard Sale"}</span>
            </div>

            <div className="border-t border-b border-white/5 py-2.5 space-y-1">
              <div className="text-xs font-bold text-white">{r.customerName}</div>
              {r.customerPhone && <div className="text-xs text-zinc-400 font-mono">{r.customerPhone}</div>}
              {r.customerEmail && <div className="text-[11px] text-zinc-500 truncate">{r.customerEmail}</div>}
              {Array.isArray(r.items) && r.items.length > 0 && (
                <div className="text-[11px] text-[#ff5500]/80 font-mono mt-1 pt-1.5 border-t border-white/5">
                  <span className="text-zinc-500 uppercase text-[9px] block mb-0.5">Line Items ({r.items.length}):</span>
                  {r.items.map(it => `${it.qty}x ${it.description} (₹${it.amount})`).join(", ")}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-1">
              <div>
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">Total Amount</span>
                <span className="text-base font-mono font-black text-white">₹{Number(r.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button onClick={() => handlePrintReceipt(r)} className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold flex items-center gap-1 cursor-pointer">
                  <FileText size={14} /> Print
                </button>
                {r.status !== 'Voided' && <button onClick={() => handleEditReceipt(r)} className="p-2 rounded-lg bg-white/5 border border-white/10 text-zinc-300 cursor-pointer">
                  <Edit2 size={14} />
                </button>}
                {r.status !== 'Voided' && <button onClick={() => { setVoidTarget(r); setVoidReason(""); }} className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 cursor-pointer">
                  <Ban size={14} />
                </button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {(paginated.length > 0 || receiptsTotal > 0) && (
        <Pagination currentPage={receiptPage} totalPages={totalPages} onPageChange={p => setReceiptPage(p)} totalCount={receiptsTotal || paginated.length} pageSize={pageSize} />
      )}

      <AnimatePresence>
        {voidTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => !isVoiding && setVoidTarget(null)}>
            <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-2xl" onClick={event => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8AE7D]">Audit-safe correction</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Void {voidTarget.receiptNumber}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">The receipt remains in history. Its linked order is cancelled and allocated stock is restored when applicable.</p>
                </div>
                <button type="button" onClick={() => setVoidTarget(null)} disabled={isVoiding} className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white"><X size={16} /></button>
              </div>
              <label className="mt-5 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Reason</label>
              <textarea value={voidReason} onChange={event => setVoidReason(event.target.value)} rows={4} maxLength={500} placeholder="Explain why this receipt is being voided" className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#C8AE7D]/50" />
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setVoidTarget(null)} disabled={isVoiding} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-zinc-300">Keep receipt</button>
                <button type="button" onClick={confirmVoid} disabled={isVoiding || voidReason.trim().length < 5} className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2.5 text-xs font-bold text-rose-200 disabled:opacity-40">{isVoiding ? 'Voiding...' : 'Void receipt'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SCREEN PREVIEW MODAL (no-print) */}
      <AnimatePresence>
        {activeReceiptPreview && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm no-print"
            onClick={() => setActiveReceiptPreview(null)}>
            <motion.div initial={{ scale:0.95, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.95, y:20 }}
              className="bg-[#141414] border border-white/10 rounded-2xl p-4 sm:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col gap-4 sm:gap-5 shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Receipt Preview</h3>
                  <p className="text-xs text-zinc-400 mt-0.5 font-mono">Ref: {activeReceiptPreview.receiptNumber}</p>
                </div>
                <button onClick={() => setActiveReceiptPreview(null)} className="text-zinc-400 hover:text-white cursor-pointer"><X size={20} /></button>
              </div>
              <div className="rounded-xl shadow-inner overflow-x-auto">
                <ReceiptBody r={activeReceiptPreview} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setActiveReceiptPreview(null)}
                  className="px-5 sm:px-6 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-xs sm:text-sm cursor-pointer transition-colors">Close</button>
                <button onClick={() => { window.print(); setTimeout(() => setActiveReceiptPreview(null), 250); }}
                  className="px-5 sm:px-6 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold flex items-center gap-2 text-xs sm:text-sm cursor-pointer transition-colors">
                  <FileText size={16} /> Print / Save PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRINT-ONLY PORTAL */}
      {activeReceiptPreview && createPortal(
        <div className="printable-receipt-wrapper hidden print:block">
          <ReceiptBody r={activeReceiptPreview} forPrint />
        </div>,
        document.body
      )}
    </div>
  );
}
