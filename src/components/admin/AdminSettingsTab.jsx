import React from 'react';

export default function AdminSettingsTab({
  dropSettingsForm,
  setDropSettingsForm,
  handleUpdateGlobalSettings,
  globalSettings
}) {
  return (
    <div className="space-y-8">
      {/* Next Drop Timer Settings */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-6">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-white">
            Next Curated Drop Countdown Settings
          </h4>
          <p className="text-[10px] text-[#888888] mt-0.5">Configure target date, time, and custom labels for the countdown display.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Drop Date</label>
            <input
              type="date"
              value={dropSettingsForm.dropDate}
              onChange={(e) => setDropSettingsForm(prev => ({ ...prev, dropDate: e.target.value }))}
              className="w-full px-4 py-3 bg-[#1c1c1c] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff5500]/50"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Drop Time (IST)</label>
            <input
              type="time"
              value={dropSettingsForm.dropTime}
              onChange={(e) => setDropSettingsForm(prev => ({ ...prev, dropTime: e.target.value }))}
              className="w-full px-4 py-3 bg-[#1c1c1c] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff5500]/50"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Display Label</label>
            <input
              type="text"
              placeholder="e.g. Friday • 9 PM IST"
              value={dropSettingsForm.dropLabel}
              onChange={(e) => setDropSettingsForm(prev => ({ ...prev, dropLabel: e.target.value }))}
              className="w-full px-4 py-3 bg-[#1c1c1c] border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#ff5500]/50"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Display Description</label>
            <input
              type="text"
              placeholder="e.g. Next Curated Drop Countdown"
              value={dropSettingsForm.dropDesc}
              onChange={(e) => setDropSettingsForm(prev => ({ ...prev, dropDesc: e.target.value }))}
              className="w-full px-4 py-3 bg-[#1c1c1c] border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#ff5500]/50"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-white/5">
          <button
            onClick={async () => {
              await handleUpdateGlobalSettings(dropSettingsForm);
            }}
            className="bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold text-[10px] px-5 py-2.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
          >
            Save Drop Settings
          </button>
        </div>
      </div>

      {/* Price settings toggler */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-6">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-white">
            Catalog Price Visibility setting
          </h4>
          <p className="text-[10px] text-[#888888] mt-0.5">Toggles prices visibility for guest users ("DM for price" fallback).</p>
        </div>
        
        <div className="flex justify-between items-center bg-[#1c1c1c] border border-white/5 rounded-xl px-4 py-3">
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider block">Show prices</span>
            <span className="text-[9px] text-[#888888] uppercase mt-0.5">Visible to all visitors</span>
          </div>
          <button
            onClick={() => handleUpdateGlobalSettings({ showPrices: !globalSettings.showPrices })}
            className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              globalSettings.showPrices 
                ? 'bg-[#ff5500]/10 border-[#ff5500]/30 text-[#ff5500]' 
                : 'bg-white/5 border-white/10 text-[#888888]'
            }`}
          >
            {globalSettings.showPrices ? 'Prices Visible' : 'Prices Hidden'}
          </button>
        </div>
      </div>

      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-6">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-white">Sold-out products</h4>
          <p className="text-[10px] text-[#888888] mt-0.5">Choose whether sold-out products remain visible in the public Garage and product pages.</p>
        </div>
        <div className="flex justify-between items-center gap-4 bg-[#1c1c1c] border border-white/5 rounded-xl px-4 py-3">
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider block">Show sold-out products</span>
            <span className="text-[9px] text-[#888888] uppercase mt-0.5">Pre-booking products are unaffected</span>
          </div>
          <button
            onClick={() => handleUpdateGlobalSettings({ showSoldOutProducts: globalSettings.showSoldOutProducts === false })}
            className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              globalSettings.showSoldOutProducts !== false
                ? 'bg-[#C8AE7D]/10 border-[#C8AE7D]/30 text-[#E1BD65]'
                : 'bg-white/5 border-white/10 text-[#888888]'
            }`}
          >
            {globalSettings.showSoldOutProducts !== false ? 'Shown' : 'Hidden'}
          </button>
        </div>
      </div>
    </div>
  );
}
