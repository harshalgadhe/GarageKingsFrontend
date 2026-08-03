import React from 'react';
import { Search, Plus } from 'lucide-react';
import Pagination from './Pagination';
import BookPurchaseForm from '../BookPurchaseForm';
import ReceiveShipmentForm from '../ReceiveShipmentForm';
import RecordPaymentForm from '../RecordPaymentForm';

export default function AdminProcurementTab({
  isAddingSupplierPurchase,
  isReceivingShipment,
  isRecordingSupplierPayment,
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
  showToast,
  receivingForm,
  setReceivingForm,
  selectedPurchase,
  setIsReceivingShipment,
  fetchSupplierPurchaseDetailsData,
  paymentForm,
  setPaymentForm,
  setIsRecordingSupplierPayment,
  fetchCashAccounts,
  supplierMetrics,
  supplierPurchasesSearch,
  setSupplierPurchasesSearch,
  supplierPurchasesLoading,
  supplierPurchases,
  supplierPurchasesPage,
  supplierPurchasesTotalPages,
  supplierPurchasesTotal,
  setSupplierPurchasesPage,
  selectedPurchaseId,
  API_BASE_URL,
  user,
  updateSupplierPurchaseStatus
}) {
  return (
    <div className="space-y-6">
      {isAddingSupplierPurchase ? (
        <BookPurchaseForm
          purchaseForm={purchaseForm}
          setPurchaseForm={setPurchaseForm}
          suppliers={suppliers}
          cashAccounts={cashAccounts}
          catalogList={catalogList}
          setIsAddingSupplierPurchase={setIsAddingSupplierPurchase}
          setIsCreatingNewSupplier={setIsCreatingNewSupplier}
          setIsCreatingNewProductInline={setIsCreatingNewProductInline}
          setActiveItemIndexForProductCreation={setActiveItemIndexForProductCreation}
          setNewProductFormInline={setNewProductFormInline}
          fetchSupplierPurchases={fetchSupplierPurchases}
          fetchSupplierMetrics={fetchSupplierMetrics}
          setSelectedPurchaseId={setSelectedPurchaseId}
          showToast={showToast}
        />
      ) : isReceivingShipment ? (
        <ReceiveShipmentForm
          receivingForm={receivingForm}
          setReceivingForm={setReceivingForm}
          selectedPurchase={selectedPurchase}
          setIsReceivingShipment={setIsReceivingShipment}
          fetchSupplierPurchases={fetchSupplierPurchases}
          fetchSupplierPurchaseDetailsData={fetchSupplierPurchaseDetailsData}
          fetchSupplierMetrics={fetchSupplierMetrics}
          showToast={showToast}
        />
      ) : isRecordingSupplierPayment ? (
        <RecordPaymentForm
          paymentForm={paymentForm}
          setPaymentForm={setPaymentForm}
          selectedPurchase={selectedPurchase}
          cashAccounts={cashAccounts}
          setIsRecordingSupplierPayment={setIsRecordingSupplierPayment}
          fetchSupplierPurchases={fetchSupplierPurchases}
          fetchSupplierPurchaseDetailsData={fetchSupplierPurchaseDetailsData}
          fetchSupplierMetrics={fetchSupplierMetrics}
          fetchCashAccounts={fetchCashAccounts}
          showToast={showToast}
        />
      ) : (
        <>
          {/* Supplier KPIs Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111111] border border-white/5 p-4 rounded-2xl">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#888888]">Total Spend</span>
              <div className="text-lg font-black font-mono text-[#ff5500] mt-1">₹{Number(supplierMetrics.totalSpend || 0).toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-[#111111] border border-white/5 p-4 rounded-2xl">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#888888]">Outstanding Payable</span>
              <div className="text-lg font-black font-mono text-amber-500 mt-1">₹{Number(supplierMetrics.outstandingPayables || 0).toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-[#111111] border border-white/5 p-4 rounded-2xl">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#888888]">Upcoming Arrivals</span>
              <div className="text-lg font-black font-mono text-blue-400 mt-1">{supplierMetrics.upcomingArrivals || 0} Shipments</div>
            </div>
            <div className="bg-[#111111] border border-white/5 p-4 rounded-2xl">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#888888]">Delayed / Late</span>
              <div className="text-lg font-black font-mono text-red-500 mt-1">{supplierMetrics.delayedShipments || 0} Orders</div>
            </div>
          </div>

          {/* Action Bar: Search & Add Supplier Purchase */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            <div className="flex items-center gap-2 bg-[#141414] border border-white/5 rounded-xl px-3.5 py-2.5 w-full max-w-md">
              <Search size={14} className="text-zinc-500" />
              <input
                type="text"
                placeholder="Search by supplier or notes..."
                value={supplierPurchasesSearch}
                onChange={(e) => setSupplierPurchasesSearch(e.target.value)}
                className="bg-transparent border-none text-xs text-white placeholder-zinc-600 focus:outline-none w-full"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsAddingSupplierPurchase(true);
                  setPurchaseForm({
                    supplierId: '',
                    purchaseDate: new Date().toISOString().split('T')[0],
                    expectedArrivalDate: '',
                    items: [{ productId: '', quantity: 1, purchasePrice: 0 }],
                    advancePaid: 0,
                    cashAccountId: '',
                    paymentMethod: 'Bank Transfer',
                    referenceNumber: '',
                    notes: ''
                  });
                }}
                className="bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-[0_4px_15px_-4px_rgba(255,85,0,0.3)] cursor-pointer"
              >
                <Plus size={14} /> New Supplier Order
              </button>
            </div>
          </div>

          {/* Commitments Table */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Left: Supplier Purchase Orders List */}
            <div className="xl:col-span-2 overflow-x-auto border border-white/5 rounded-2xl bg-[#0b0b0b] p-4 space-y-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#111111] border-b border-white/5 text-[#888888] uppercase tracking-widest text-[9px]">
                    <th className="p-4 font-bold">Supplier & Date</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-right">Total Value</th>
                    <th className="p-4 font-bold text-right">Balance</th>
                    <th className="p-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierPurchasesLoading ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-[#888888] font-mono">Loading commitments...</td>
                    </tr>
                  ) : supplierPurchases.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-[#888888] font-mono">No supplier purchases logged.</td>
                    </tr>
                  ) : (
                    supplierPurchases.map(p => {
                      const isFullyPaid = p.paymentStatus === 'Fully Paid';
                      const statusColor = 
                        p.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        p.status === 'Cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        p.status === 'Partially Received' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                        p.status === 'In Transit' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20';

                      return (
                        <tr key={p.id} className={`border-b border-white/5 hover:bg-white/[0.01] transition-colors cursor-pointer ${selectedPurchaseId === p.id ? 'bg-white/[0.02]' : ''}`} onClick={() => setSelectedPurchaseId(p.id)}>
                          <td className="p-4">
                            <span className="font-bold text-white block">{p.supplierName}</span>
                            <span className="text-[10px] text-[#888888] font-mono">{new Date(p.purchaseDate).toLocaleDateString('en-IN')}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${statusColor}`}>
                                {p.status}
                              </span>
                              <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.25 rounded ${isFullyPaid ? 'text-emerald-400' : 'text-amber-500'}`}>
                                {p.paymentStatus}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-white">₹{Number(p.totalValue).toLocaleString('en-IN')}</td>
                          <td className="p-4 text-right font-mono text-[#888888]">₹{Number(p.remainingBalance).toLocaleString('en-IN')}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPurchaseId(p.id);
                              }}
                              className="text-[#ff5500] hover:underline font-bold text-[10px] uppercase tracking-wider"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              
              <Pagination
                currentPage={supplierPurchasesPage}
                totalPages={supplierPurchasesTotalPages}
                totalItems={supplierPurchasesTotal}
                onPageChange={setSupplierPurchasesPage}
              />
            </div>

            {/* Right: Detailed View panel */}
            <div className="xl:col-span-1 bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-6">
              {selectedPurchase ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-sm text-white uppercase tracking-wider">{selectedPurchase.supplierName}</h4>
                      <p className="text-[10px] text-[#888888] font-mono mt-0.5">Order ID: {selectedPurchase.id.slice(0,8)}...</p>
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                      selectedPurchase.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      selectedPurchase.status === 'Cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {selectedPurchase.status}
                    </span>
                  </div>

                  {/* Financial Balance Summary */}
                  <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-4 font-mono">
                    <div>
                      <span className="text-[9px] text-[#888888] uppercase block">Total Value</span>
                      <span className="text-sm font-black text-white">₹{Number(selectedPurchase.totalValue).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#888888] uppercase block">Remaining Balance</span>
                      <span className="text-sm font-black text-amber-500">₹{Number(selectedPurchase.remainingBalance).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Items Ordered Checklist */}
                  <div className="space-y-2.5">
                    <h5 className="text-[9px] uppercase font-black tracking-widest text-[#888888]">Items List</h5>
                    <div className="space-y-2">
                      {selectedPurchase.items?.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-xs bg-white/[0.02] border border-white/5 p-2.5 rounded-xl">
                          <div>
                            <span className="font-bold text-white block">{item.brand} {item.name}</span>
                            <span className="text-[9px] text-white/40 block font-mono">{item.sku} | ₹{Number(item.purchasePrice).toLocaleString('en-IN')} / unit</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-white/80 font-bold block">{item.receivedQuantity} / {item.quantity} units</span>
                            <span className="text-[8px] uppercase tracking-wider text-emerald-400">Received</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payments Log */}
                  <div className="space-y-2.5">
                    <h5 className="text-[9px] uppercase font-black tracking-widest text-[#888888]">Payments Log</h5>
                    {selectedPurchase.payments?.length === 0 ? (
                      <p className="text-[10px] text-zinc-600 font-mono italic">No payments logged yet.</p>
                    ) : (
                      <div className="space-y-2 font-mono">
                        {selectedPurchase.payments?.map(pay => (
                          <div key={pay.id} className="flex justify-between items-center text-[11px] bg-[#0b0b0b] p-2.5 rounded-xl border border-white/5">
                            <div>
                              <span className="text-white font-bold block">₹{Number(pay.amount).toLocaleString('en-IN')}</span>
                              <span className="text-[9px] text-[#888888]">{pay.paymentMethod} {pay.referenceNumber ? `(${pay.referenceNumber})` : ''}</span>
                            </div>
                            <span className="text-[9px] text-white/30">{new Date(pay.paymentDate).toLocaleDateString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Attachments and Bills */}
                  <div className="space-y-2.5">
                    <h5 className="text-[9px] uppercase font-black tracking-widest text-[#888888]">Invoices & Attachments</h5>
                    <div className="space-y-2">
                      {selectedPurchase.attachments?.map(file => (
                        <div key={file.id} className="flex justify-between items-center bg-white/5 border border-white/5 p-2 rounded-xl text-xs">
                          <span className="text-white/80 font-mono truncate max-w-[150px]">{file.file_name}</span>
                          <a
                            href={`${API_BASE_URL}/admin/supplier-attachments/${file.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#ff5500] hover:underline font-bold text-[10px] uppercase tracking-wider"
                          >
                            View
                          </a>
                        </div>
                      ))}
                      
                      <label className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl p-3 bg-white/[0.01] hover:bg-white/[0.03] transition-all cursor-pointer">
                        <span className="text-[10px] font-black text-[#ff5500] uppercase tracking-widest">Upload Bill/Invoice</span>
                        <span className="text-[8px] text-white/30 uppercase mt-0.5">PDF or Image</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const formData = new FormData();
                            formData.append('file', file);
                            try {
                              const res = await fetch(`${API_BASE_URL}/admin/supplier-purchases/${selectedPurchase.id}/attachments`, {
                                method: 'POST',
                                body: formData
                              });
                              if (res.ok) {
                                showToast("Attachment uploaded successfully", "success");
                                fetchSupplierPurchaseDetailsData(selectedPurchase.id);
                              } else {
                                const errData = await res.json();
                                showToast(errData.message || "Failed to upload file", "error");
                              }
                            } catch (err) {
                              showToast("File upload failed", "error");
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2.5 pt-4 border-t border-white/5">
                    {selectedPurchase.status !== 'Completed' && selectedPurchase.status !== 'Cancelled' && (
                      <>
                        <button
                          onClick={() => {
                            setReceivingForm({
                              receivedBy: user?.email || '',
                              notes: '',
                              items: selectedPurchase.items.map(item => ({
                                productId: item.productId,
                                name: item.name,
                                brand: item.brand,
                                sku: item.sku,
                                casingType: item.casingType || 'box',
                                remaining: item.quantity - item.receivedQuantity,
                                quantityReceived: item.quantity - item.receivedQuantity,
                                quantityDamaged: 0,
                                quantityShort: 0,
                                quantityOver: 0
                              }))
                            });
                            setIsReceivingShipment(true);
                          }}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-[10px] py-2.5 rounded-xl uppercase tracking-wider transition-all text-center cursor-pointer"
                        >
                          Receive Shipment
                        </button>
                        {selectedPurchase.remainingBalance > 0 && (
                          <button
                            onClick={() => {
                              setPaymentForm({
                                amount: selectedPurchase.remainingBalance,
                                cashAccountId: cashAccounts[0]?.id || '',
                                paymentMethod: 'Bank Transfer',
                                referenceNumber: '',
                                notes: '',
                                date: new Date().toISOString().split('T')[0]
                              });
                              setIsRecordingSupplierPayment(true);
                            }}
                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-[10px] py-2.5 rounded-xl uppercase tracking-wider transition-all text-center cursor-pointer"
                          >
                            Record Payment
                          </button>
                        )}
                      </>
                    )}
                    {selectedPurchase.status !== 'Completed' && selectedPurchase.status !== 'Cancelled' && (
                      <button
                        onClick={async () => {
                          if (!window.confirm("Are you sure you want to cancel this purchase commitment?")) return;
                          try {
                            await updateSupplierPurchaseStatus(selectedPurchase.id, 'Cancelled');
                            showToast("Purchase order cancelled successfully", "success");
                            fetchSupplierPurchases(supplierPurchasesPage, supplierPurchasesSearch);
                            fetchSupplierPurchaseDetailsData(selectedPurchase.id);
                            fetchSupplierMetrics();
                          } catch (e) {
                            showToast("Failed to cancel purchase", "error");
                          }
                        }}
                        className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-extrabold text-[10px] px-3.5 py-2.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-[#888888] font-mono italic">
                  Select a purchase order to view details.
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  );
}
