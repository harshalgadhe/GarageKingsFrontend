import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, FileText, X, Download, Upload, MoreHorizontal, Eye, FileSpreadsheet } from "lucide-react";
import Pagination from "./Pagination";
import DebouncedSearchBar from "../common/DebouncedSearchBar";
import ProductTypeahead from "./ProductTypeahead";
import SearchableSelect from "./SearchableSelect";
import { formatReceiptDate } from "../../lib/receiptDates";
import { downloadReceiptImportTemplate, readReceiptImportWorkbook } from "../../lib/receiptExport";

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
  handleSaveReceipt, handleEditReceipt, handleDeleteReceipt, handlePrintReceipt,
  handleExportReceipts,
  handlePrepareReceiptImport, handleImportReceipts,
  activeReceiptPreview, setActiveReceiptPreview,
  cars = [],
  customersList = [],
  isReceiptsLoading = false,
}) {
  const paginated = receiptsList;
  const pageSize = RECEIPTS_PER_PAGE || 10;
  const totalPages = receiptsTotalPages || 1;
  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [exportGroup, setExportGroup] = React.useState('none');
  const [exportFormat, setExportFormat] = React.useState('all');
  const [isExporting, setIsExporting] = React.useState(false);
  const [openedReceipt, setOpenedReceipt] = React.useState(null);
  const [actionReceipt, setActionReceipt] = React.useState(null);
  const [importRows, setImportRows] = React.useState([]);
  const [isImportReviewOpen, setIsImportReviewOpen] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState(null);
  const [importMode, setImportMode] = React.useState('create');
  const importInputRef = React.useRef(null);
  const printRequestedRef = React.useRef(false);

  const receiptItemsSummary = items => (items || []).map(item =>
    `${Number(item.qty || item.quantity || 0)}x ${item.description || item.itemDescription || 'Item'} (₹${Number(item.amount || item.unitAmount || 0).toLocaleString('en-IN')})`
  ).join(' | ');

  const receiptImportFields = [
    ['receiptDate', 'Receipt date'], ['customerName', 'Customer'], ['customerPhone', 'Phone'],
    ['customerEmail', 'Email'], ['customerInsta', 'Instagram'], ['customerAddress', 'Address'],
    ['formatType', 'Receipt type'], ['items', 'Items'], ['shippingCharges', 'Shipping'],
    ['taxAmount', 'Tax'], ['advancePaid', 'Amount paid'], ['pendingBalance', 'Pending balance'],
    ['totalAmount', 'Total'], ['footerNote', 'Footer note'],
  ];

  const receiptFieldValue = (receipt, key) => {
    if (key === 'items') return receiptItemsSummary(receipt?.items);
    if (key === 'receiptDate') return receipt?.dateString || receipt?.receiptDate || receipt?.createdAt || receipt?.created_at || '';
    const value = receipt?.[key];
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'number') return String(value);
    return String(value).trim();
  };

  const getReceiptImportChanges = row => receiptImportFields.flatMap(([key, label]) => {
    const after = receiptFieldValue(row.receipt, key);
    if (!row.existingReceipt) return after ? [{ key, label, before: '', after, isNew: true }] : [];
    const before = receiptFieldValue(row.existingReceipt, key);
    return before === after ? [] : [{ key, label, before, after, isNew: false }];
  });

  const rowBlockingErrors = row => (row.errors || []).filter(error => !(
    importMode === 'update' && /receipt number already exists/i.test(String(error))
  ));
  const isNoChangeRow = row => importMode === 'update' && row.existingReceipt && getReceiptImportChanges(row).length === 0;
  const readyImportRows = importRows.filter(row =>
    !rowBlockingErrors(row).length
    && (importMode === 'update' || !row.existingReceipt)
    && !isNoChangeRow(row)
  );
  const importFailedCount = importRows.filter(row => rowBlockingErrors(row).length).length;
  const importSkippedCount = importRows.filter(row =>
    !rowBlockingErrors(row).length
    && ((importMode === 'create' && row.existingReceipt) || isNoChangeRow(row))
  ).length;

  const requestPrint = receipt => {
    printRequestedRef.current = true;
    setOpenedReceipt(null);
    setActionReceipt(null);
    handlePrintReceipt(receipt);
  };

  const handleReceiptImportFile = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      const parsed = await readReceiptImportWorkbook(file);
      const reviewed = handlePrepareReceiptImport ? await handlePrepareReceiptImport(parsed) : parsed;
      setImportRows(reviewed);
      setIsImportReviewOpen(true);
    } catch (error) {
      setImportRows([{ rowNumber: 0, receipt: { receiptNumber: file.name }, errors: [error.message || 'Could not read this workbook.'] }]);
      setIsImportReviewOpen(true);
    } finally {
      setIsImporting(false);
    }
  };

  const confirmReceiptImport = async () => {
    if (!readyImportRows.length || !handleImportReceipts) return;
    setIsImporting(true);
    try {
      const result = await handleImportReceipts(readyImportRows, importMode === 'update');
      setImportResult(result);
      if (!result.failures?.length) setIsImportReviewOpen(false);
    } finally {
      setIsImporting(false);
    }
  };

  const handleFormatChange = (formatType) => {
    setReceiptForm(previous => ({
      ...previous,
      formatType,
      pendingBalance: formatType === 'prebooking' ? previous.pendingBalance : '',
      footerNote: FORMAT_NOTES[formatType] || previous.footerNote,
    }));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await handleDeleteReceipt(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
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
    (customersList || []).forEach(c => {
      const name = c.fullName || c.name || c.full_name || '';
      if (name.trim()) {
        const key = name.trim().toLowerCase();
        map.set(key, {
          name: name.trim(),
          phone: c.phone || '',
          email: c.email || '',
          insta: c.instagram || c.insta || '',
          address: c.address || '',
        });
      }
    });
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
  }, [customersList, receiptsList]);

  const [remoteCustomerSuggestions, setRemoteCustomerSuggestions] = React.useState([]);
  const [isCustomerLoading, setIsCustomerLoading] = React.useState(false);

  const customerQuery = (receiptForm.customerName || "").trim();

  React.useEffect(() => {
    if (customerQuery.length < 3) {
      setRemoteCustomerSuggestions([]);
      setIsCustomerLoading(false);
      return;
    }

    setIsCustomerLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/customers?search=${encodeURIComponent(customerQuery)}`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.customers || []);
          setRemoteCustomerSuggestions(items.map(c => ({
            name: c.name || c.full_name || c.fullName || '',
            phone: c.phone || '',
            email: c.email || '',
            insta: c.insta || c.instagram || c.instagramUsername || '',
            address: c.address || '',
          })));
        }
      } catch (err) {
        console.error("Error searching customers for receipt:", err);
      } finally {
        setIsCustomerLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [customerQuery]);

  const customerSuggestions = React.useMemo(() => {
    if (customerQuery.length < 3) return [];
    const q = customerQuery.toLowerCase();
    const map = new Map();

    remoteCustomerSuggestions.forEach(c => {
      if (c.name && c.name.trim()) map.set(c.name.trim().toLowerCase(), c);
    });

    uniqueCustomers.forEach(c => {
      if (c.name && c.name.trim()) {
        const key = c.name.trim().toLowerCase();
        if (!map.has(key) && (c.name.toLowerCase().includes(q) || (c.phone && c.phone.toLowerCase().includes(q)))) {
          map.set(key, c);
        }
      }
    });

    return Array.from(map.values()).slice(0, 10);
  }, [customerQuery, remoteCustomerSuggestions, uniqueCustomers]);

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
    if (activeReceiptPreview && printRequestedRef.current) {
      printRequestedRef.current = false;
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
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
          <input ref={importInputRef} type="file" accept=".xlsx" onChange={handleReceiptImportFile} className="hidden" />
          <DebouncedSearchBar
            className="w-full sm:w-64"
            value={receiptSearch}
            placeholder="Search by customer, receipt or phone"
            onChange={value => {
              setReceiptSearch(value);
              setReceiptPage(1);
            }}
          />
          <details className="relative">
            <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.04] px-4 text-[10px] font-bold uppercase tracking-wider text-[#D8D3CB] transition hover:bg-white/[0.08] [&::-webkit-details-marker]:hidden">
              {(isExporting || isImporting) ? <span className="h-3.5 w-3.5 animate-spin rounded-full border border-[#C8AE7D]/30 border-t-[#C8AE7D]" /> : <FileSpreadsheet size={14} />} Backup
            </summary>
            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-72 overflow-hidden rounded-xl border border-white/[0.11] bg-[#151412] p-2 shadow-[0_18px_45px_rgba(0,0,0,.65)]">
              <div className="space-y-2 border-b border-white/[0.07] p-2 pb-3">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-[#77736D]">Receipt format</label>
                <select aria-label="Receipt export format" value={exportFormat} onChange={event => setExportFormat(event.target.value)} className="w-full rounded-lg border border-white/[0.09] bg-[#0B0B0A] px-3 py-2 text-xs text-[#DDD8CF] outline-none focus:border-[#C8AE7D]/40">
                  <option value="all">All formats</option><option value="standard">Standard</option><option value="prebooking">Pre-Order</option>
                </select>
                <label className="block pt-1 text-[9px] font-bold uppercase tracking-wider text-[#77736D]">Workbook layout</label>
                <select aria-label="Group exported receipts" value={exportGroup} onChange={event => setExportGroup(event.target.value)} className="w-full rounded-lg border border-white/[0.09] bg-[#0B0B0A] px-3 py-2 text-xs text-[#DDD8CF] outline-none focus:border-[#C8AE7D]/40">
                  <option value="none">One sheet</option><option value="format">Group by format</option><option value="month">Group by month</option>
                </select>
              </div>
              <button disabled={isExporting || isImporting} onClick={async event => { event.currentTarget.closest('details')?.removeAttribute('open'); setIsExporting(true); try { await handleExportReceipts({ groupBy: exportGroup, format: exportFormat, search: receiptSearch }); } finally { setIsExporting(false); } }} className="mt-1 flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-[#EEEAE2] hover:bg-white/[0.06] disabled:opacity-40">
                <Download size={14} className="mt-0.5 shrink-0 text-[#C8AE7D]" />
                <span><strong className="block font-semibold">Export filtered receipts</strong><small className="mt-0.5 block text-[9px] leading-relaxed text-[#77736D]">Uses the current search, format and grouping selections.</small></span>
              </button>
              <button disabled={isExporting || isImporting} onClick={event => { event.currentTarget.closest('details')?.removeAttribute('open'); importInputRef.current?.click(); }} className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-[#EEEAE2] hover:bg-white/[0.06] disabled:opacity-40">
                <Upload size={14} className="mt-0.5 shrink-0 text-[#C8AE7D]" />
                <span><strong className="block font-semibold">Import backup</strong><small className="mt-0.5 block text-[9px] leading-relaxed text-[#77736D]">Review receipt data before saving.</small></span>
              </button>
              <button disabled={isExporting || isImporting} onClick={event => { event.currentTarget.closest('details')?.removeAttribute('open'); downloadReceiptImportTemplate(); }} className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-[#EEEAE2] hover:bg-white/[0.06] disabled:opacity-40">
                <FileSpreadsheet size={14} className="mt-0.5 shrink-0 text-[#C8AE7D]" />
                <span><strong className="block font-semibold">Blank template</strong><small className="mt-0.5 block text-[9px] leading-relaxed text-[#77736D]">Download the supported receipt import format.</small></span>
              </button>
            </div>
          </details>
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
                      <input type="datetime-local" required value={receiptForm.receiptDate || ""} onChange={e => setReceiptForm(p => ({ ...p, receiptDate: e.target.value, dateString: formatReceiptDate(e.target.value) }))}
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
                        {showCustomerDropdown && customerQuery.length >= 3 && (
                          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#18181b] border border-white/15 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                            <div className="px-3 py-1.5 text-[9px] font-bold text-zinc-400 uppercase tracking-wider bg-black/40 border-b border-white/5 flex items-center justify-between">
                              <span>Suggested Customers (Autofill)</span>
                              {isCustomerLoading && <span className="text-blue-400 font-mono animate-pulse">Searching DB...</span>}
                            </div>
                            {isCustomerLoading && customerSuggestions.length === 0 ? (
                              <div className="p-3 text-center text-xs text-zinc-400 font-mono">Searching customer records...</div>
                            ) : customerSuggestions.length === 0 ? (
                              <div className="p-3 text-center text-xs text-zinc-500">No matching customer found.</div>
                            ) : (
                              customerSuggestions.map((c, idx) => (
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
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Phone Number *</label>
                        <input type="number" placeholder="e.g. 9876543210" value={receiptForm.customerPhone} onChange={e => setReceiptForm(p => ({ ...p, customerPhone: e.target.value }))}
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
              <tr key={r.id} tabIndex={0} role="button" onClick={() => setOpenedReceipt(r)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') setOpenedReceipt(r); }} className={`cursor-pointer border-b border-white/5 transition hover:bg-white/[0.035] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#ff5500]/60 ${r.status === 'Voided' ? 'opacity-55' : ''}`}>
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
                  <button onClick={event => { event.stopPropagation(); setActionReceipt(r); }} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white">
                    Actions <MoreHorizontal size={14} />
                  </button>
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
          <article key={r.id} tabIndex={0} role="button" onClick={() => setOpenedReceipt(r)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') setOpenedReceipt(r); }} className={`cursor-pointer bg-[#141414] border border-white/5 rounded-2xl p-4 space-y-3 transition active:scale-[0.995] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#ff5500]/60 ${r.status === 'Voided' ? 'opacity-55' : ''}`}>
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

              <button onClick={event => { event.stopPropagation(); setActionReceipt(r); }} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-200">
                Actions <MoreHorizontal size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>

      {(paginated.length > 0 || receiptsTotal > 0) && (
        <Pagination currentPage={receiptPage} totalPages={totalPages} onPageChange={p => setReceiptPage(p)} totalCount={receiptsTotal || paginated.length} pageSize={pageSize} />
      )}

      <AnimatePresence>
        {actionReceipt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[170] flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center" onClick={() => setActionReceipt(null)}>
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.98 }} className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111] p-3 shadow-2xl" onClick={event => event.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-white/10 px-2 pb-3 pt-1">
                <div><div className="text-xs font-bold text-white">{actionReceipt.receiptNumber}</div><div className="mt-0.5 text-[10px] text-zinc-500">Choose an action</div></div>
                <button onClick={() => setActionReceipt(null)} className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-white"><X size={16} /></button>
              </div>
              <div className="mt-2 grid gap-1">
                <button onClick={() => { setOpenedReceipt(actionReceipt); setActionReceipt(null); }} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-zinc-200 hover:bg-white/[0.06]"><Eye size={17} className="text-[#ff5500]" /> Open receipt</button>
                <button onClick={() => requestPrint(actionReceipt)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-zinc-200 hover:bg-white/[0.06]"><FileText size={17} className="text-blue-400" /> Print or save PDF</button>
                {actionReceipt.status !== 'Voided' && <button onClick={() => { handleEditReceipt(actionReceipt); setActionReceipt(null); }} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-zinc-200 hover:bg-white/[0.06]"><Edit2 size={17} /> Edit receipt</button>}
                <button onClick={() => { setDeleteTarget(actionReceipt); setActionReceipt(null); }} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-rose-300 hover:bg-rose-500/[0.08]"><Trash2 size={17} /> Delete receipt</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openedReceipt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[165] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm" onClick={() => setOpenedReceipt(null)}>
            <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121212] shadow-2xl" onClick={event => event.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
                <div><h3 className="text-sm font-bold text-white">Receipt {openedReceipt.receiptNumber}</h3><p className="mt-0.5 text-[10px] text-zinc-500">Click Print when you need a PDF or paper copy.</p></div>
                <button onClick={() => setOpenedReceipt(null)} className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white"><X size={18} /></button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-900 p-2 sm:p-4"><div className="overflow-hidden rounded-xl"><ReceiptBody r={openedReceipt} /></div></div>
              <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 p-3 sm:p-4">
                {openedReceipt.status !== 'Voided' && <button onClick={() => { handleEditReceipt(openedReceipt); setOpenedReceipt(null); }} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-zinc-200 hover:bg-white/5">Edit</button>}
                <button onClick={() => requestPrint(openedReceipt)} className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-600"><FileText size={15} /> Print / Save PDF</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isImportReviewOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[180] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm" onClick={() => !isImporting && setIsImportReviewOpen(false)}>
            <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.98 }} className="flex h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/[0.1] bg-[#11110F] shadow-2xl md:h-[min(88vh,780px)]" onClick={event => event.stopPropagation()}>
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/[0.08] p-4 sm:p-5">
                <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff6a2b]">Receipt import</p><h3 className="mt-1 text-xl font-semibold text-white">Review receipt changes</h3><p className="mt-1 text-xs leading-5 text-zinc-400">Nothing is saved until you confirm. Choose whether matching receipt numbers should be skipped or updated.</p></div>
                <button onClick={() => setIsImportReviewOpen(false)} disabled={isImporting} className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white"><X size={18} /></button>
              </div>
              <div className="grid shrink-0 grid-cols-4 border-b border-white/10 bg-black/25 text-center">
                <div className="p-3"><div className="text-lg font-bold text-white">{importRows.length}</div><div className="text-[9px] uppercase tracking-wider text-zinc-500">Receipts</div></div>
                <div className="border-l border-white/10 p-3"><div className="text-lg font-bold text-emerald-400">{readyImportRows.length}</div><div className="text-[9px] uppercase tracking-wider text-zinc-500">Ready</div></div>
                <div className="border-l border-white/10 p-3"><div className="text-lg font-bold text-amber-300">{importSkippedCount}</div><div className="text-[9px] uppercase tracking-wider text-zinc-500">Skipped</div></div>
                <div className="border-l border-white/10 p-3"><div className="text-lg font-bold text-rose-300">{importFailedCount}</div><div className="text-[9px] uppercase tracking-wider text-zinc-500">Failed</div></div>
              </div>
              <div className="grid shrink-0 gap-2 border-b border-white/10 bg-black/15 p-3 sm:grid-cols-2 sm:px-5">
                <button type="button" onClick={() => setImportMode('create')} className={`rounded-xl border p-3 text-left transition ${importMode === 'create' ? 'border-[#ff6a2b]/50 bg-[#ff6a2b]/10 text-white' : 'border-white/10 text-zinc-400 hover:border-white/20'}`}>
                  <strong className="block text-xs">Add new receipts only</strong><span className="mt-1 block text-[10px] opacity-70">Existing receipt numbers are skipped.</span>
                </button>
                <button type="button" onClick={() => setImportMode('update')} className={`rounded-xl border p-3 text-left transition ${importMode === 'update' ? 'border-[#ff6a2b]/50 bg-[#ff6a2b]/10 text-white' : 'border-white/10 text-zinc-400 hover:border-white/20'}`}>
                  <strong className="block text-xs">Add new and update existing</strong><span className="mt-1 block text-[10px] opacity-70">Matches by receipt number and keeps the existing receipt ID.</span>
                </button>
              </div>
              <div className="min-h-0 flex-1 touch-pan-y space-y-2 overflow-y-auto overscroll-contain p-3 [scrollbar-color:#5F5748_#171512] sm:p-5" data-lenis-prevent="true" data-lenis-prevent-wheel="true" data-lenis-prevent-touch="true">
                {importRows.map((row, index) => {
                  const receipt = row.receipt || {};
                  const changes = getReceiptImportChanges(row);
                  const blockingErrors = rowBlockingErrors(row);
                  const noChanges = isNoChangeRow(row);
                  return <div key={`${receipt.receiptNumber}-${index}`} className={`overflow-hidden rounded-xl border ${blockingErrors.length ? 'border-rose-400/20 bg-rose-500/[0.05]' : 'border-white/10 bg-white/[0.025]'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3 p-4"><div><div className="font-mono text-xs font-bold text-[#ff6a2b]">{receipt.receiptNumber || `Row ${row.rowNumber}`}</div><div className="mt-1 text-sm font-semibold text-white">{receipt.customerName || 'Customer missing'}</div><div className="mt-1 text-[11px] text-zinc-500">{receipt.items?.length || 0} item{receipt.items?.length === 1 ? '' : 's'} · ₹{Number(receipt.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div></div><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase ${blockingErrors.length ? 'bg-rose-400/10 text-rose-300' : (noChanges || row.existingReceipt && importMode === 'create') ? 'bg-amber-400/10 text-amber-200' : 'bg-emerald-400/10 text-emerald-300'}`}>{blockingErrors.length ? 'Failed' : noChanges ? 'No changes' : row.existingReceipt && importMode === 'create' ? 'Skipped' : row.existingReceipt ? 'Update' : 'New'}</span></div>
                    {blockingErrors.length > 0 && <ul className="mt-3 space-y-1 border-t border-rose-400/10 pt-3 text-[11px] text-rose-200">{blockingErrors.map(error => <li key={error}>{error}</li>)}</ul>}
                    {changes.length > 0 && <details className="border-t border-white/[0.07]" data-lenis-prevent="true">
                      <summary className="cursor-pointer list-none px-4 py-3 text-[9px] font-bold uppercase tracking-[0.14em] text-[#B8A77E] hover:bg-white/[0.025] [&::-webkit-details-marker]:hidden">Preview {changes.length} {changes.length === 1 ? 'change' : 'changes'}</summary>
                      <div className="grid gap-px bg-white/[0.05] sm:grid-cols-2">
                        {changes.map(change => <div key={change.key} className="min-w-0 bg-[#0C0C0B] p-3">
                          <span className="block text-[8px] font-bold uppercase tracking-[0.14em] text-[#66625C]">{change.label}</span>
                          {change.isNew ? <strong className="mt-1 block break-words text-[11px] font-medium text-emerald-200">{change.after}</strong> : <div className="mt-1 grid grid-cols-[1fr_auto_1fr] items-start gap-2 text-[11px]"><span className="break-words text-[#77736D] line-through">{change.before || 'Empty'}</span><span className="text-[#5F5A53]">→</span><strong className="break-words font-medium text-[#F1ECE4]">{change.after || 'Empty'}</strong></div>}
                        </div>)}
                      </div>
                    </details>}
                  </div>;
                })}
                {importResult && <div className={`rounded-xl border p-4 text-xs ${importResult.failures?.length ? 'border-rose-400/20 bg-rose-400/[0.05] text-rose-100' : 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-100'}`}>
                  <strong className="block text-sm">Import result</strong>
                  <p className="mt-1 text-[11px] opacity-80">{importResult.created || 0} created, {importResult.updated || 0} updated, {importResult.skipped?.length || 0} skipped, {importResult.failures?.length || 0} failed.</p>
                  {importResult.skipped?.length > 0 && <div className="mt-3 space-y-1 border-t border-white/10 pt-3 text-amber-100">{importResult.skipped.map((item, index) => <div key={`${item.receiptNumber}-${index}`}>Row {item.rowNumber || '?'} · {item.receiptNumber || 'No number'}: {item.reason || 'Duplicate receipt.'}</div>)}</div>}
                  {importResult.failures?.length > 0 && <div className="mt-3 space-y-1 border-t border-white/10 pt-3">{importResult.failures.map((failure, index) => <div key={`${failure.receiptNumber}-${index}`}>Row {failure.rowNumber || '?'} · {failure.receiptNumber || 'No number'}: {failure.message || 'Unknown save error.'}</div>)}</div>}
                </div>}
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#11110F] p-4 sm:px-5">
                <button onClick={downloadReceiptImportTemplate} className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white">Download template</button>
                <div className="flex gap-2"><button onClick={() => setIsImportReviewOpen(false)} disabled={isImporting} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-zinc-300">Cancel</button><button onClick={confirmReceiptImport} disabled={isImporting || !readyImportRows.length} className="rounded-xl bg-[#ff5500] px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{isImporting ? 'Importing...' : `Import ${readyImportRows.length}`}</button></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => !isDeleting && setDeleteTarget(null)}>
            <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-2xl" onClick={event => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300">Permanent removal</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Delete {deleteTarget.receiptNumber}?</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">This receipt and its generated receipt files will be removed permanently. The related sale and inventory record will remain unchanged.</p>
                </div>
                <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white"><X size={16} /></button>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-zinc-300">Keep receipt</button>
                <button type="button" onClick={confirmDelete} disabled={isDeleting} className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2.5 text-xs font-bold text-rose-200 disabled:opacity-40">{isDeleting ? 'Deleting...' : 'Delete permanently'}</button>
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
