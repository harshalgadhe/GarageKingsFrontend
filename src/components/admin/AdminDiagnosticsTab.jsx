import React from 'react';
import { Search, Server, AlertTriangle, Shield, Settings } from 'lucide-react';
import Pagination from './Pagination';

export default function AdminDiagnosticsTab({
  diagnosticsSubTab,
  setDiagnosticsSubTab,
  healthStatus,
  perfLoading,
  perfStats,
  telemetrySearch,
  setTelemetrySearch,
  telemetryFilter,
  setTelemetryFilter,
  handleClearErrors,
  telemetryErrors,
  handleAcknowledgeError,
  telemetryPage,
  telemetryTotalPages,
  setTelemetryPage,
  auditLogsSearch,
  setAuditLogsSearch,
  auditLogsCategory,
  setAuditLogsCategory,
  auditLogs
}) {
  return (
    <div className="space-y-6">
      {/* Header and Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h3 className="text-base font-black uppercase tracking-wider text-white">Observability & Diagnostics</h3>
          <p className="text-[10px] text-[#888888] mt-0.5">Monitor system telemetry, audit operations, and health alerts.</p>
        </div>
        
        {/* Sub-tabs menu */}
        <div className="flex flex-wrap gap-1 bg-[#141414] border border-white/5 p-1 rounded-xl">
          {[
            { id: 'health', label: 'System Health', icon: Server },
            { id: 'errors', label: 'Telemetry Errors', icon: AlertTriangle },
            { id: 'audit', label: 'Audit Logs', icon: Shield },
            { id: 'settings', label: 'Alert Settings', icon: Settings }
          ].map(sub => {
            const active = diagnosticsSubTab === sub.id;
            const SubIcon = sub.icon;
            return (
              <button
                key={sub.id}
                onClick={() => setDiagnosticsSubTab(sub.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer border ${
                  active
                    ? 'bg-[#ff5500]/10 border-[#ff5500]/30 text-[#ff5500]'
                    : 'border-transparent text-[#888888] hover:text-white'
                }`}
              >
                <SubIcon size={12} />
                {sub.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-tab Content: Health */}
      {diagnosticsSubTab === 'health' && (
        <div className="space-y-6">
          {/* System Health Status Grid (Bento Style) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#888888] uppercase tracking-wider">Database Node</span>
                <span className={`w-2 h-2 rounded-full ${(healthStatus?.database?.status === 'up' || healthStatus?.database?.status === 'healthy') ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'bg-red-400 animate-pulse'} flex-shrink-0`} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">PostgreSQL Gateway</h4>
                <p className="text-[10px] text-[#888888] font-mono mt-1">Status: {(healthStatus?.database?.status === 'up' || healthStatus?.database?.status === 'healthy') ? 'ONLINE (ACTIVE)' : 'OFFLINE'}</p>
              </div>
            </div>

            <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#888888] uppercase tracking-wider">System Environment</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)] flex-shrink-0" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Vite & Node Runtime</h4>
                <p className="text-[10px] text-[#888888] font-mono mt-1">Environment: {import.meta.env.MODE.toUpperCase()}</p>
                <p className="text-[9px] text-zinc-500 font-mono mt-0.5">V: {healthStatus?.version || '1.0.0-GA'}</p>
              </div>
            </div>

            <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#888888] uppercase tracking-wider">Build Revision</span>
                <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.3)] flex-shrink-0" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Git Commit</h4>
                <p className="text-[10px] text-[#888888] font-mono mt-1 truncate block" title={healthStatus?.commit || healthStatus?.git?.commit}>
                  SHA: {healthStatus?.commit && healthStatus?.commit !== 'N/A' ? healthStatus.commit.slice(0, 8) : (healthStatus?.git?.commit ? healthStatus.git.commit.slice(0, 8) : 'DEVELOPMENT_BUILD')}
                </p>
              </div>
            </div>
          </div>

          {/* Latency & Metrics Charts */}
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-6">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-white">Route Performance Metrics</h4>
              <p className="text-[10px] text-[#888888] mt-0.5">Monitors latency and response size profiles across routes.</p>
            </div>

            {perfLoading ? (
              <div className="py-8 text-center text-[#888888] text-xs animate-pulse font-mono">Analyzing profiles...</div>
            ) : perfStats.length === 0 ? (
              <div className="py-8 text-center text-[#888888] text-xs font-mono">No metrics recorded yet. Trigger api calls to log statistics.</div>
            ) : (
              <div className="space-y-4">
                {perfStats.map((metric, idx) => {
                  const avgLat = parseFloat(metric.avgLatency || metric.avg_duration || 0);
                  const hitCount = metric.totalRequests || metric.hit_count || 0;
                  const featureName = metric.feature || metric.route || 'Route';
                  const latencyRating = avgLat < 200 ? 'Excellent' : avgLat < 500 ? 'Good' : 'Slow';
                  const ratingColor = avgLat < 200 ? 'text-emerald-400' : avgLat < 500 ? 'text-amber-400' : 'text-red-400';
                  return (
                    <div key={idx} className="bg-[#1c1c1c] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[9px] font-mono font-bold text-[#ff5500] uppercase bg-[#ff5500]/10 border-[#ff5500]/20 px-2 py-0.5 rounded">
                          {metric.method || 'API'}
                        </span>
                        <span className="ml-2.5 text-xs font-bold text-white font-mono">{featureName}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-[10px] text-[#888888] block">AVG LATENCY</span>
                          <span className={`text-xs font-mono font-black ${ratingColor}`}>{avgLat.toFixed(1)} ms ({latencyRating})</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-[#888888] block">HIT COUNT</span>
                          <span className="text-xs font-mono font-black text-white">{hitCount} hits</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-tab Content: Telemetry Errors */}
      {diagnosticsSubTab === 'errors' && (
        <div className="space-y-6">
          {/* Actions & Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 bg-[#141414] border border-white/5 rounded-xl px-3.5 py-2 w-full max-w-xs">
                <Search size={12} className="text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search error messages..."
                  value={telemetrySearch}
                  onChange={(e) => setTelemetrySearch(e.target.value)}
                  className="bg-transparent border-none text-[11px] text-white placeholder-zinc-600 focus:outline-none w-full"
                />
              </div>
              
              <select
                value={telemetryFilter}
                onChange={(e) => setTelemetryFilter(e.target.value)}
                className="bg-[#141414] border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[#ff5500]/50"
              >
                <option value="false">Unresolved Errors</option>
                <option value="true">Resolved Errors</option>
                <option value="all">All Logs</option>
              </select>
            </div>

            <button
              onClick={handleClearErrors}
              className="bg-red-950/30 border border-red-500/20 text-red-400 hover:bg-red-950/50 hover:text-red-300 font-extrabold text-[10px] px-3.5 py-2 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
            >
              Clear Logged Errors
            </button>
          </div>

          {/* Telemetry Error Cards */}
          <div className="space-y-4">
            {telemetryErrors.length === 0 ? (
              <div className="bg-[#141414] border border-white/5 rounded-2xl p-12 text-center text-[#888888] text-xs font-mono">
                No error logs matching your filters.
              </div>
            ) : (
              telemetryErrors.map((err) => {
                const isAcknowledgeable = !err.acknowledged;
                const occurrenceCount = err.occurrenceCount || err.seen_count || err.occurrences || 0;
                const firstSeen = err.firstOccurrence || err.first_seen;
                const lastSeen = err.lastOccurrence || err.last_seen;
                const stack = err.stackTrace || err.stack;
                const correlationId = err.latestCorrelationId || err.correlation_id;
                const url = err.latestUrl || err.url || 'Internal Operation';
                return (
                  <div key={err.fingerprint} className="bg-[#141414] border border-white/5 rounded-2xl p-5 space-y-4 relative group">
                    {/* Tags row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        err.source === 'frontend' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {err.source}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                        {err.category}
                      </span>
                      <div className="ml-auto flex items-center gap-3">
                        <span className="text-[9px] text-[#555555] font-mono">
                          Occurrences: <span className="font-bold text-white">{occurrenceCount}</span>
                        </span>
                        {isAcknowledgeable && (
                          <button
                            onClick={() => handleAcknowledgeError(err.fingerprint)}
                            className="bg-[#ff5500]/10 border border-[#ff5500]/30 hover:bg-[#ff5500]/20 text-[#ff5500] font-extrabold text-[9px] px-2.5 py-1 rounded-lg uppercase tracking-wider cursor-pointer transition-colors"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Error Header */}
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-red-400 leading-snug">
                        {err.message}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-mono mt-1 break-all">Route: {url}</p>
                    </div>

                    {/* Stack trace section */}
                    {stack && (
                      <details className="group/details">
                        <summary className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-white list-none select-none flex items-center gap-1">
                          <span>▶</span> <span>Toggle Trace Stack</span>
                        </summary>
                        <pre className="mt-3 p-3 bg-[#0a0a0b] border border-white/5 rounded-xl text-[9px] font-mono text-zinc-400 leading-relaxed overflow-x-auto select-text" data-lenis-prevent="true">
                          {stack}
                        </pre>
                      </details>
                    )}

                    {/* Trace footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-white/5 text-[9px] font-mono text-[#555555]">
                      <span>Seen: {firstSeen ? new Date(firstSeen).toLocaleString('en-IN') : 'N/A'} — {lastSeen ? new Date(lastSeen).toLocaleString('en-IN') : 'N/A'}</span>
                      {correlationId && (
                        <span className="bg-zinc-900 border border-white/5 px-2 py-0.5 rounded text-[9px] font-mono text-[#888888] select-all cursor-copy" title="Click to copy Correlation ID">
                          CID: {correlationId}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Pagination
            currentPage={telemetryPage}
            totalPages={telemetryTotalPages}
            onPageChange={setTelemetryPage}
          />
        </div>
      )}

      {/* Sub-tab Content: Audit Logs */}
      {diagnosticsSubTab === 'audit' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-[#141414] border border-white/5 rounded-xl px-3.5 py-2 w-full max-w-xs">
              <Search size={12} className="text-zinc-500" />
              <input
                type="text"
                placeholder="Search logs by user, IP, action..."
                value={auditLogsSearch}
                onChange={(e) => setAuditLogsSearch(e.target.value)}
                className="bg-transparent border-none text-[11px] text-white placeholder-zinc-600 focus:outline-none w-full"
              />
            </div>
            
            <select
              value={auditLogsCategory}
              onChange={(e) => setAuditLogsCategory(e.target.value)}
              className="bg-[#141414] border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[#ff5500]/50"
            >
              <option value="All">All Categories</option>
              <option value="Products">Products</option>
              <option value="Orders">Orders</option>
              <option value="Expenses">Expenses</option>
              <option value="Invoices">Invoices</option>
            </select>
          </div>

          {/* Audit Logs Table */}
          <div className="overflow-x-auto border border-white/5 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#141414] border-b border-white/5 text-[#888888] uppercase tracking-widest text-[9px]">
                  <th className="p-4 font-bold">Timestamp</th>
                  <th className="p-4 font-bold">Action & Entity</th>
                  <th className="p-4 font-bold">Operator Details</th>
                  <th className="p-4 font-bold">State Changes</th>
                  <th className="p-4 font-bold">Correlation ID</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-[#888888] uppercase text-[10px] tracking-wider font-bold font-mono">
                      No audit logs matching your filters.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-mono text-[#888888]">
                        {new Date(log.created_at).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-white block">{log.action}</span>
                        <span className="text-[10px] text-zinc-500 uppercase font-mono">{log.entity} #{log.entity_id?.slice(0, 8)}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-white block">{log.user_email || 'System Auto'}</span>
                        <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">{log.ip_address || '127.0.0.1'}</span>
                      </td>
                      <td className="p-4 max-w-[280px]">
                        {log.before_state || log.after_state ? (
                          <details className="group/audit-details font-mono">
                            <summary className="text-[9px] font-bold text-[#ff5500] uppercase tracking-wider cursor-pointer list-none select-none">
                              View Payload JSON
                            </summary>
                            <pre className="mt-2 p-2 bg-[#09090a] border border-white/5 rounded-lg text-[9px] font-mono text-zinc-400 overflow-x-auto leading-relaxed select-text" data-lenis-prevent="true">
                              {JSON.stringify({
                                before: log.before_state ? JSON.parse(log.before_state) : null,
                                after: log.after_state ? JSON.parse(log.after_state) : null
                              }, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-[10px] text-[#555555] font-mono">No state changes</span>
                        )}
                      </td>
                      <td className="p-4 font-mono">
                        {log.correlation_id ? (
                          <span className="bg-zinc-900 border border-white/5 px-2 py-0.5 rounded text-[9px] text-[#888888] select-all cursor-copy">
                            {log.correlation_id}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#555555]">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
