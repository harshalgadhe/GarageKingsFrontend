import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function AdminNotificationsTab({
  notifications,
  handleMarkNotificationsRead,
  handleDeleteNotification,
  hasMoreNotifications,
  loadMoreNotifications
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-3 border-b border-white/5">
        <h3 className="text-xs font-black uppercase tracking-wider text-white">
          System Alerts Feed
        </h3>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkNotificationsRead}
            className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
          >
            Clear All Alerts
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-[#888888] text-xs font-mono">
            No active alerts.
          </div>
        ) : (
          notifications.map(n => {
            const isError = n.title.toLowerCase().includes('error') || n.title.toLowerCase().includes('critical') || n.title.toLowerCase().includes('fail');
            const isWarning = n.title.toLowerCase().includes('warning') || n.title.toLowerCase().includes('threshold') || n.title.toLowerCase().includes('slow');
            
            let alertClasses = "bg-blue-950/25 border-blue-500/20 text-blue-400";
            if (isError) {
              alertClasses = "bg-red-950/25 border-red-500/20 text-red-400";
            } else if (isWarning) {
              alertClasses = "bg-amber-950/25 border-amber-500/20 text-amber-400";
            }

            return (
              <div key={n.id} className={`p-4 border rounded-xl flex gap-3 text-xs relative group ${alertClasses}`}>
                <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                <div className="flex-1">
                  <span className="font-extrabold text-white block uppercase tracking-wide mb-0.5">{n.title}</span>
                  <span className="text-[#888888] leading-relaxed block">{n.message}</span>
                  <span className="text-[9px] text-[#555555] font-mono mt-1 block">
                    {new Date(n.created_at).toLocaleString('en-IN')}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteNotification(n.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3 text-[#888888] hover:text-white cursor-pointer w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/5"
                  title="Dismiss Alert"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {hasMoreNotifications && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMoreNotifications}
            className="bg-white/5 border border-white/10 hover:bg-white/10 active:bg-white/15 text-white font-bold text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
