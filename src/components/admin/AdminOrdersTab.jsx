import React from 'react';
import { Search } from 'lucide-react';
import Pagination from './Pagination';

export default function AdminOrdersTab({
  groupedOrders,
  ordersLoading,
  ordersPage,
  ordersTotalPages,
  ordersTotal,
  setOrdersPage,
  orderSearchQuery,
  setOrderSearchQuery,
  orderFilter,
  setOrderFilter,
  setActiveScreenshotOrder,
  handleConfirmOrder,
  handleCancelOrder,
  setShippingModalOrder,
  setShippingForm,
  setCollectRemainingOrder,
  setReceiptOrderId,
  getStatusBadgeClass,
  API_BASE_URL,
  fetchOrders,
  loadAllData
}) {
  return (
    <div className="space-y-6">
      {/* ── PENDING APPROVALS BANNER ────────── */}
      {groupedOrders.filter(o => o.status === 'Verification Pending').length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
              {groupedOrders.filter(o => o.status === 'Verification Pending').length} Payment{groupedOrders.filter(o => o.status === 'Verification Pending').length > 1 ? 's' : ''} Awaiting Your Approval
            </span>
          </div>
          <div className="space-y-2">
            {groupedOrders.filter(o => o.status === 'Verification Pending').map(order => (
              <div key={order.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3">
                <div className="text-xs">
                  <span className="font-mono font-black text-white text-[11px]">ORDER {order.id.slice(0, 8)}</span>
                  <span className="text-amber-300/70 mx-2">·</span>
                  <span className="text-white/70">
                    {order.items.map(item => `${item.productBrand} ${item.productName}${item.qty > 1 ? ` (x${item.qty})` : ''}`).join(', ')}
                  </span>
                  <span className="text-amber-300/70 mx-2">·</span>
                  <span className="font-mono text-gk-orange font-bold">₹{Number(order.totalPrice).toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-[#888888] block mt-0.5">{order.customerName} · {order.customerEmail}</span>
                </div>
                {order.screenshotUrl ? (
                  <button
                    onClick={() => setActiveScreenshotOrder({
                      url: `${API_BASE_URL}/admin/orders/${order.id}/screenshot`,
                      orderId: order.id,
                      status: order.status,
                      orderRef: `ORDER ${order.id.slice(0, 8)}: ${order.items.map(item => `${item.productBrand} ${item.productName}${item.qty > 1 ? ` (x${item.qty})` : ''}`).join(', ')}`
                    })}
                    className="flex-shrink-0 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[10px] px-4 py-2 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    View Receipt & Approve →
                  </button>
                ) : (
                  <button
                    onClick={() => handleConfirmOrder(order.id)}
                    className="flex-shrink-0 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[10px] px-4 py-2 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Approve Payment →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ORDERS FILTER & SEARCH HEADER ────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#141414] border border-white/5 rounded-2xl p-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-white/5 sm:border-none pb-2 sm:pb-0 w-full sm:w-auto">
          {['ALL', 'Verification Pending', 'Confirmed', 'Pre-Order', 'Awaiting Stock', 'Shipped', 'Delivered', 'Cancelled'].map(st => (
            <button
              key={st}
              onClick={() => { setOrderFilter(st); setOrdersPage(1); }}
              className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                orderFilter === st
                  ? 'bg-[#ff5500] text-black border-[#ff5500] shadow-[0_0_12px_rgba(255,85,0,0.3)]'
                  : 'bg-white/5 text-white/50 border-white/5 hover:text-white hover:bg-white/10'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-[#111111] border border-white/5 rounded-xl px-3 py-1.5 w-full sm:w-64">
          <Search size={12} className="text-[#888888]" />
          <input
            type="text"
            placeholder="Search orders..."
            value={orderSearchQuery}
            onChange={e => { setOrderSearchQuery(e.target.value); setOrdersPage(1); }}
            className="bg-transparent border-none text-xs text-white placeholder:text-[#555] focus:outline-none w-full"
          />
        </div>
      </div>

      {/* ── ORDERS LIST ────────── */}
      <div className="space-y-4">
        {ordersLoading ? (
          <div className="py-12 text-center text-xs text-zinc-500 font-mono">Loading orders dataset...</div>
        ) : groupedOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500 font-mono">No orders found.</div>
        ) : (
          groupedOrders.map(order => (
            <div key={order.id} className="bg-[#141414] border border-white/5 rounded-2xl p-5 space-y-4 hover:border-white/10 transition-colors">
              {/* Order Card Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-white text-xs">ORDER {order.id.slice(0, 8)}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${getStatusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                    {order.bookingType === 'pre_order' && (
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-gk-orange/10 text-gk-orange border border-gk-orange/30">
                        PO (Pre-Order)
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#888888] font-mono mt-0.5">
                    Placed: {new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-black text-[#ff5500] text-sm">₹{Number(order.totalPrice).toLocaleString('en-IN')}</div>
                  {order.bookingType === 'pre_order' && (
                    <div className="text-[10px] font-mono text-zinc-400">
                      Paid: ₹{Number(order.advanceAmount).toLocaleString('en-IN')} | Remaining: <span className="text-amber-400 font-bold">₹{Number(order.remainingAmount).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-white/80 font-medium">
                      {item.productBrand} {item.productName} <span className="text-white/40">x{item.qty}</span>
                    </span>
                    <span className="font-mono text-zinc-400">₹{(Number(item.priceAtPurchase) * item.qty).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              {/* Shipping & Tracking details if available */}
              {(order.courierPartner || order.trackingNumber) && (
                <div className="bg-black/30 border border-white/5 rounded-xl p-3 text-[10px] font-mono flex flex-wrap gap-x-6 gap-y-1">
                  <div><span className="text-[#888888]">COURIER:</span> {order.courierPartner}</div>
                  <div><span className="text-[#888888]">TRACKING:</span> {order.trackingNumber}</div>
                  <div><span className="text-[#888888]">SHIPPING COST:</span> ₹{order.shippingCost}</div>
                </div>
              )}

              {/* Order Action Buttons */}
              {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                  {order.status === 'Verification Pending' && (
                    <button
                      onClick={() => handleConfirmOrder(order.id)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-[10px] px-4 py-2 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Approve Payment
                    </button>
                  )}
                  {/* Pre-order: collect remaining payment */}
                  {order.bookingType === 'pre_order' && Number(order.remainingAmount) > 0 && (
                    <>
                      <button
                        onClick={() => setCollectRemainingOrder({ id: order.id, remainingAmount: order.remainingAmount })}
                        className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-extrabold text-[10px] px-4 py-2 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Collect Remaining ₹{Number(order.remainingAmount).toLocaleString('en-IN')}
                      </button>

                      {order.status === 'Pre-Order' && (
                        <button
                          onClick={async () => {
                            if (!confirm('Request remaining payment from the customer? This will notify them to pay the remaining balance.')) return;
                            const res = await fetch(`${API_BASE_URL}/admin/orders/${order.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ status: 'Awaiting Stock' })
                            });
                            if (res.ok) fetchOrders(ordersPage, orderSearchQuery, orderFilter);
                          }}
                          className="bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-[10px] px-4 py-2 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          🔔 Request Remaining Payment
                        </button>
                      )}
                    </>
                  )}
                  {order.status === 'Confirmed' && (
                    <button
                      onClick={() => {
                        setShippingModalOrder(order);
                        setShippingForm({ courierPartner: 'Delhivery', trackingNumber: '', shippingCost: 0, packagingCost: 0, dispatchDate: new Date().toISOString().split('T')[0] });
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-black font-extrabold text-[10px] px-4 py-2 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Dispatch Shipment
                    </button>
                  )}
                  {order.status === 'Shipped' && (
                    <button
                      onClick={async () => {
                        if (!confirm('Mark order as delivered?')) return;
                        const res = await fetch(`${API_BASE_URL}/admin/orders/${order.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ status: 'Delivered' })
                        });
                        if (res.ok) await loadAllData();
                      }}
                      className="bg-purple-500 hover:bg-purple-600 text-white font-extrabold text-[10px] px-4 py-2 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Mark Delivered
                    </button>
                  )}
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-extrabold text-[10px] px-4 py-2 rounded-lg border border-red-500/20 uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel / Void
                  </button>
                  {/* Generate Receipt button is always visible */}
                  <button
                    onClick={() => setReceiptOrderId(order.id)}
                    className="ml-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-extrabold text-[10px] px-4 py-2 rounded-lg uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    🧾 Generate Receipt
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <Pagination
        currentPage={ordersPage}
        totalPages={ordersTotalPages}
        totalItems={ordersTotal}
        onPageChange={setOrdersPage}
      />
    </div>
  );
}
