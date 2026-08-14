import React from 'react';

export default function AdminSettingsTab({
  handleUpdateGlobalSettings,
  globalSettings,
  settingsLoading,
  settingsError,
  retrySettings
}) {
  const valueLoaded = typeof globalSettings?.showSoldOutProducts === 'boolean';
  const isShown = globalSettings?.showSoldOutProducts === true;

  return (
    <div className="max-w-3xl">
      <div className="rounded-2xl border border-white/[0.08] bg-[#11110F] p-5 sm:p-6">
        <div className="border-b border-white/[0.07] pb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8AE7D]">Garage visibility</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Sold-out products</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#8D8A84]">
            Control whether products with no available stock appear anywhere on the public website. This applies to regular and pre-booking products.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-4 rounded-xl border border-white/[0.07] bg-black/25 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="block text-sm font-semibold text-white">Show sold-out products</span>
            <span className="mt-1 block text-xs text-[#77746E]">
              Hidden products remain available inside the Admin catalog.
            </span>
            {settingsError && (
              <span className="mt-2 block text-xs text-rose-300">{settingsError}</span>
            )}
          </div>

          {settingsError ? (
            <button
              type="button"
              onClick={retrySettings}
              className="shrink-0 rounded-lg border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/[0.1]"
            >
              Retry
            </button>
          ) : (
            <button
              type="button"
              disabled={settingsLoading || !valueLoaded}
              onClick={() => handleUpdateGlobalSettings({ showSoldOutProducts: !isShown })}
              className={`shrink-0 rounded-lg border px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors ${
                settingsLoading || !valueLoaded
                  ? 'cursor-wait border-white/10 bg-white/5 text-white/35'
                  : isShown
                    ? 'cursor-pointer border-[#C8AE7D]/35 bg-[#C8AE7D]/12 text-[#E1BD65] hover:bg-[#C8AE7D]/18'
                    : 'cursor-pointer border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/15'
              }`}
            >
              {settingsLoading || !valueLoaded ? 'Loading' : isShown ? 'Shown' : 'Hidden'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
