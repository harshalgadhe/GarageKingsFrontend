import React, { useState } from 'react';
import { ShoppingBag, Clock, TrendingUp, DollarSign, BarChart3, Plus, FileText, AlertTriangle, Package, Tag, ReceiptText } from 'lucide-react';

export default function AdminDashboardTab({
  dashboardStats,
  chartData = [],
  chartTimeframe = 'daily',
  setChartTimeframe,
  hoveredPointIndex,
  setHoveredPointIndex,
  isLoading = false,
  onNewReceiptClick,
  operations = {},
  onNavigate
}) {
  const [chartMetric, setChartMetric] = useState('all'); // 'all', 'stock', 'po'

  if (isLoading || !dashboardStats || !operations || Object.keys(operations).length === 0) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Top Metric Cards Skeleton (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#141414] border border-white/5 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="h-3 bg-white/10 rounded-md w-28"></div>
                <div className="w-8 h-8 rounded-xl bg-white/10"></div>
              </div>
              <div className="h-8 bg-white/10 rounded-lg w-36"></div>
              <div className="h-3 bg-white/5 rounded-md w-24"></div>
            </div>
          ))}
        </div>

        {/* Analytics & Quick Actions Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-4 bg-white/10 rounded-md w-44"></div>
                <div className="h-3 bg-white/5 rounded-md w-60"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-16 bg-white/10 rounded-xl"></div>
                <div className="h-8 w-16 bg-white/10 rounded-xl"></div>
              </div>
            </div>
            <div className="h-60 bg-white/[0.02] rounded-xl flex items-end justify-between p-4 gap-3 border border-white/5">
              {[40, 65, 35, 80, 55, 90, 70].map((h, i) => (
                <div key={i} style={{ height: `${h}%` }} className="w-full bg-white/10 rounded-t-md"></div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-5">
            <div className="h-4 bg-white/10 rounded-md w-36"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-white/5 rounded-xl border border-white/5 p-4 flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-white/10 rounded w-1/3"></div>
                    <div className="h-2 bg-white/5 rounded w-1/2"></div>
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-white/10"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Operational Signals Rail Skeleton */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="h-4 bg-white/10 rounded-md w-48"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-white/5 rounded-xl border border-white/5 p-4 space-y-2">
                <div className="h-3 bg-white/10 rounded w-24"></div>
                <div className="h-4 bg-white/10 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = dashboardStats || {
    stockRevenue: 0,
    poRevenue: 0,
    poPendingAmount: 0,
    totalRevenue: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    monthGrowthPct: '0.0',
    thisWeekRevenue: 0,
    lastWeekRevenue: 0,
    weekGrowthPct: '0.0',
    standardCount: 0,
    poCount: 0,
    totalReceiptsCount: 0,
    avgReceiptValue: 0
  };

  const totalReceipts = stats.totalReceiptsCount || 0;
  const standardPct = totalReceipts > 0 ? Math.round((stats.standardCount / totalReceipts) * 100) : 0;
  const poPct = totalReceipts > 0 ? Math.round((stats.poCount / totalReceipts) * 100) : 0;
  const operationalItems = [
    { label: 'Low-stock variants', value: operations.lowStockAlerts || 0, detail: 'Review inventory before accepting enquiries', icon: AlertTriangle, tab: 'catalog', tone: 'text-amber-300 bg-amber-400/10 border-amber-400/20' },
    { label: 'Catalog data missing', value: (operations.productsWithoutSKU || 0) + (operations.productsWithoutPrice || 0), detail: `${operations.productsWithoutSKU || 0} without SKU, ${operations.productsWithoutPrice || 0} without price`, icon: Tag, tab: 'catalog', tone: 'text-rose-300 bg-rose-400/10 border-rose-400/20' },
    { label: 'Pending receipt balance', value: `₹${Number(operations.pendingReceiptBalance || 0).toLocaleString('en-IN')}`, detail: `${operations.pendingReceiptCount || 0} receipts need follow-up`, icon: ReceiptText, tab: 'receipts', tone: 'text-[#E4C982] bg-[#C8AE7D]/10 border-[#C8AE7D]/25' },
    { label: 'Purchase orders delayed', value: operations.overduePurchaseOrders || 0, detail: `${operations.incomingInventory || 0} incoming units across ${operations.totalPurchaseOrders || 0} open POs`, icon: Package, tab: 'catalog', tone: 'text-zinc-200 bg-white/5 border-white/10' }
  ];

  // SVG Line Graph Calculations
  const svgWidth = 800;
  const svgHeight = 260;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  const getVal = (d) => chartMetric === 'stock' ? d.stock : chartMetric === 'po' ? d.po : d.total;
  const maxVal = Math.max(...chartData.map(getVal), 100) * 1.15;

  const points = chartData.map((d, i) => {
    const x = paddingLeft + (chartData.length > 1 ? (i / (chartData.length - 1)) * chartW : chartW / 2);
    const val = getVal(d);
    const y = svgHeight - paddingBottom - (val / maxVal) * chartH;
    return { x, y, val, data: d, index: i };
  });

  let linePath = '';
  if (points.length > 0) {
    linePath = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      linePath += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`;
    }
  }

  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x},${svgHeight - paddingBottom} L ${points[0].x},${svgHeight - paddingBottom} Z`
    : '';

  const strokeColor = chartMetric === 'stock' ? '#10b981' : chartMetric === 'po' ? '#f59e0b' : '#ff5500';
  const gradientId = `chartGradient_${chartMetric}`;

  const yTicks = [0, 0.33, 0.66, 1].map(pct => {
    const val = maxVal * pct;
    const y = svgHeight - paddingBottom - pct * chartH;
    return { val, y };
  });

  const activePoint = hoveredPointIndex !== null && points[hoveredPointIndex] 
    ? points[hoveredPointIndex] 
    : (points.length > 0 ? points[points.length - 1] : null);

  return (
    <div className="space-y-8">
      {/* Top Row: Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stock Revenue */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/50">Stock Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-white tracking-tight">
            ₹{stats.stockRevenue.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1 font-medium">In-Stock Sales Revenue</p>
        </div>

        {/* PO Revenue */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/50">PO Revenue</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-400 tracking-tight">
            ₹{stats.poRevenue.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1 font-medium">{stats.poCount} Pre-Orders Collected</p>
        </div>

        {/* PO Pending Amount */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-rose-500/40 transition-all shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/50">PO Pending Due</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-rose-400 tracking-tight">
            ₹{stats.poPendingAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1 font-medium">Balance Due Before Delivery</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-[#ff5500]/20 via-[#ff5500]/10 to-transparent border border-[#ff5500]/30 rounded-2xl p-5 relative overflow-hidden group hover:border-[#ff5500]/50 transition-all shadow-[0_0_25px_rgba(255,85,0,0.1)]">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ff5500]">Total Revenue</span>
            <div className="p-2 rounded-xl bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/30">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-white tracking-tight">
            ₹{stats.totalRevenue.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-white/60 mt-1 font-medium">Combined Collected (PO + Stock)</p>
        </div>
      </div>

      <section className="rounded-2xl border border-white/[0.08] bg-[#111111] p-5 sm:p-6">
        <div className="flex flex-col gap-2 border-b border-white/[0.07] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8AE7D]">Action centre</p>
            <h2 className="mt-1 text-lg font-semibold text-white">What needs attention now</h2>
          </div>
          <p className="text-xs text-zinc-500">Live operational exceptions, not vanity metrics</p>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {operationalItems.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.label} type="button" onClick={() => onNavigate?.(item.tab)} className="group rounded-xl border border-white/[0.07] bg-black/30 p-4 text-left transition-colors hover:border-[#C8AE7D]/35 hover:bg-white/[0.035]">
                <div className="flex items-start justify-between gap-3">
                  <div className={`rounded-lg border p-2 ${item.tone}`}><Icon size={16} /></div>
                  <span className="text-xl font-semibold tabular-nums text-white">{item.value}</span>
                </div>
                <p className="mt-4 text-sm font-medium text-zinc-200">{item.label}</p>
                <p className="mt-1 text-[11px] leading-5 text-zinc-500">{item.detail}</p>
              </button>
            );
          })}
        </div>
        {(operations.failedReceiptJobs || 0) > 0 && (
          <div className="mt-3 flex w-full items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-left text-xs text-rose-200">
            <AlertTriangle size={15} /> {operations.failedReceiptJobs} receipt generation job(s) require investigation
          </div>
        )}
      </section>

      {/* Second Row: Time-Based Analytics & Operational Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Month & Week Revenue Analytics */}
        <div className="lg:col-span-7 bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
                <BarChart3 size={18} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Revenue Trends &amp; Time Breakdown</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Comparative sales performance across time periods</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Monthly Comparison */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Month-over-Month</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  Number(stats.monthGrowthPct) >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {Number(stats.monthGrowthPct) >= 0 ? `+${stats.monthGrowthPct}%` : `${stats.monthGrowthPct}%`}
                </span>
              </div>
              <div>
                <div className="text-xl font-black font-mono text-white">₹{stats.thisMonthRevenue.toLocaleString('en-IN')}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">This Month</div>
              </div>
              <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs text-zinc-400">
                <span>Last Month:</span>
                <span className="font-mono text-white font-semibold">₹{stats.lastMonthRevenue.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Weekly Comparison */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Week-over-Week</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  Number(stats.weekGrowthPct) >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {Number(stats.weekGrowthPct) >= 0 ? `+${stats.weekGrowthPct}%` : `${stats.weekGrowthPct}%`}
                </span>
              </div>
              <div>
                <div className="text-xl font-black font-mono text-white">₹{stats.thisWeekRevenue.toLocaleString('en-IN')}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Last 7 Days</div>
              </div>
              <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs text-zinc-400">
                <span>Prior 7 Days:</span>
                <span className="font-mono text-white font-semibold">₹{stats.lastWeekRevenue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Format Distribution Progress Bars */}
          <div className="space-y-3 pt-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Receipt Format Distribution</div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/80 font-medium">Standard Sales ({stats.standardCount})</span>
                  <span className="font-mono text-zinc-400 font-bold">{standardPct}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${standardPct}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-400 font-medium">Prebooking / PO ({stats.poCount})</span>
                  <span className="font-mono text-zinc-400 font-bold">{poPct}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${poPct}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Metrics & Quick Actions */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base border-b border-white/5 pb-3">Operational Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="text-xs text-zinc-400">Total Receipts Generated</span>
                <span className="font-mono font-bold text-white text-sm">{stats.totalReceiptsCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="text-xs text-zinc-400">Average Receipt Value</span>
                <span className="font-mono font-bold text-[#ff5500] text-sm">
                  ₹{Math.round(stats.avgReceiptValue).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={onNewReceiptClick}
                className="p-3 bg-[#ff5500]/10 border border-[#ff5500]/30 rounded-xl text-[#ff5500] font-bold text-xs hover:bg-[#ff5500]/20 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus size={14} /> New Receipt
              </button>
              <button
                onClick={onNewReceiptClick}
                className="p-3 bg-white/5 border border-white/10 rounded-xl text-zinc-300 font-bold text-xs hover:bg-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText size={14} /> View Receipts
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SVG BEZIER LINE GRAPH (Visible on all devices with smooth horizontal scroll on mobile) */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              Revenue Trend Line Graph
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#ff5500]/20 text-[#ff5500] font-mono font-normal">
                {chartTimeframe === 'daily' ? 'Daily (7 Days)' : chartTimeframe === 'weekly' ? 'Weekly (8 Weeks)' : 'Monthly (12 Months)'}
              </span>
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">Filter timeframes and compare revenue trends over time</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Timeframe Switcher */}
            <div className="flex p-1 bg-black/50 border border-white/10 rounded-xl">
              {[
                { id: 'daily', label: '7 Days' },
                { id: 'weekly', label: '8 Weeks' },
                { id: 'monthly', label: '12 Months' }
              ].map(tf => (
                <button
                  key={tf.id}
                  onClick={() => { setChartTimeframe && setChartTimeframe(tf.id); setHoveredPointIndex && setHoveredPointIndex(null); }}
                  className={`px-2.5 sm:px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    chartTimeframe === tf.id
                      ? 'bg-[#ff5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.3)]'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Metric Switcher */}
            <div className="flex p-1 bg-black/50 border border-white/10 rounded-xl">
              {[
                { id: 'all', label: 'All Revenue' },
                { id: 'stock', label: 'Stock Only' },
                { id: 'po', label: 'PO Only' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => { setChartMetric(m.id); setHoveredPointIndex && setHoveredPointIndex(null); }}
                  className={`px-2.5 sm:px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    chartMetric === m.id
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Point Callout */}
        {activePoint && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-black/40 border border-white/10 rounded-xl gap-3">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: strokeColor }}></span>
              <span className="text-xs font-bold text-white font-mono">{activePoint.data.label}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-6 text-xs">
              <div>
                <span className="text-white/40 text-[10px] sm:text-xs block sm:inline sm:mr-1.5">Stock Sales:</span>
                <span className="font-mono font-bold text-emerald-400">₹{activePoint.data.stock.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-white/40 text-[10px] sm:text-xs block sm:inline sm:mr-1.5">PO Revenue:</span>
                <span className="font-mono font-bold text-amber-400">₹{activePoint.data.po.toLocaleString('en-IN')}</span>
              </div>
              <div className="sm:pl-3 sm:border-l sm:border-white/10">
                <span className="text-white/40 text-[10px] sm:text-xs block sm:inline sm:mr-1.5">Total:</span>
                <span className="font-mono font-black text-[#ff5500] text-sm">₹{activePoint.val.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}

        {/* SVG Canvas with horizontal scroll wrapper for mobile */}
        <div className="relative w-full overflow-x-auto pb-2">
          <div className="min-w-[640px]">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none">
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Y-Axis Lines */}
              {yTicks.map((tick, idx) => (
                <g key={idx}>
                  <line
                    x1={paddingLeft}
                    y1={tick.y}
                    x2={svgWidth - paddingRight}
                    y2={tick.y}
                    stroke="rgba(255, 255, 255, 0.07)"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingLeft - 10}
                    y={tick.y + 4}
                    textAnchor="end"
                    fill="rgba(255, 255, 255, 0.35)"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    ₹{tick.val >= 100000 ? `${(tick.val / 100000).toFixed(1)}L` : tick.val >= 1000 ? `${(tick.val / 1000).toFixed(0)}k` : tick.val.toFixed(0)}
                  </text>
                </g>
              ))}

              {/* X-Axis Labels */}
              {points.map((pt, idx) => (
                <text
                  key={idx}
                  x={pt.x}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  fill={hoveredPointIndex === idx ? '#ffffff' : 'rgba(255, 255, 255, 0.4)'}
                  fontSize="10"
                  fontWeight={hoveredPointIndex === idx ? 'bold' : 'normal'}
                >
                  {pt.data.label}
                </text>
              ))}

              {/* Area Gradient */}
              <path d={areaPath} fill={`url(#${gradientId})`} />

              {/* Line Path */}
              <path
                d={linePath}
                fill="none"
                stroke={strokeColor}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              {points.map((pt, idx) => (
                <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredPointIndex && setHoveredPointIndex(idx)}>
                  {hoveredPointIndex === idx && (
                    <line
                      x1={pt.x}
                      y1={paddingTop}
                      x2={pt.x}
                      y2={svgHeight - paddingBottom}
                      stroke="rgba(255, 255, 255, 0.25)"
                      strokeDasharray="3 3"
                    />
                  )}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPointIndex === idx ? 8 : 5}
                    fill={strokeColor}
                    fillOpacity={hoveredPointIndex === idx ? 0.4 : 0.2}
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPointIndex === idx ? 5 : 3.5}
                    fill="#ffffff"
                    stroke={strokeColor}
                    strokeWidth="2.5"
                  />
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
