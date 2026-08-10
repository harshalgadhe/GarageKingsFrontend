import React from 'react';
import { 
  TrendingUp, FolderOpen, Receipt, Package, ShoppingBag, 
  Truck, Users, BarChart3, Bell, Settings, Activity, 
  ChevronLeft, ChevronRight, LogOut 
} from 'lucide-react';

export const ADMIN_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { id: 'catalog', label: 'Catalog', icon: FolderOpen },
  { id: 'receipts', label: 'Receipts', icon: Receipt },
  { id: 'diagnostics', label: 'Diagnostics', icon: Activity }
];

export default function AdminSidebar({
  adminTab,
  setAdminTab,
  triggerTabFetch,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  handleLogout,
  unresolvedErrorCount = 0
}) {

  return (
    <aside className={`scrollbar-none flex h-fit flex-shrink-0 flex-row gap-1.5 overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#0B0B0A]/95 shadow-[0_18px_55px_rgba(0,0,0,.28)] transition-all duration-200 lg:sticky lg:top-24 lg:flex-col lg:overflow-x-visible ${
      isSidebarCollapsed ? 'lg:w-16 p-2 items-center' : 'lg:w-60 p-3'
    }`}>
      {/* Desktop collapse toggle */}
      <div className={`hidden lg:flex items-center w-full pb-2 mb-1 border-b border-white/5 ${
        isSidebarCollapsed ? 'justify-center' : 'justify-between'
      }`}>
        {!isSidebarCollapsed && (
          <span className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">
            Operations
          </span>
        )}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(prev => !prev)}
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer border-none ${
            isSidebarCollapsed ? 'mx-auto flex items-center justify-center' : 'ml-auto'
          }`}
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {ADMIN_TABS.map(tab => {
        const Icon = tab.icon;
        const active = adminTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => {
              setAdminTab(tab.id);
              if (typeof triggerTabFetch === 'function') {
                triggerTabFetch(tab.id);
              }
            }}
            title={isSidebarCollapsed ? tab.label : undefined}
            className={`relative flex items-center ${
              isSidebarCollapsed ? 'justify-center w-10 h-10 p-0 mx-auto' : 'gap-3 px-3.5 py-2'
            } rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap lg:w-full cursor-pointer border ${
              active 
                ? 'border-[#C8AE7D]/25 bg-[#C8AE7D]/[0.09] text-[#E1BD65] shadow-[inset_0_1px_0_rgba(255,255,255,.04)]'
                : 'border-transparent text-[#85817A] hover:bg-white/[0.045] hover:text-white'
            }`}
          >
            <Icon size={15} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span className="flex-1 text-left">{tab.label}</span>}
            {tab.id === 'diagnostics' && unresolvedErrorCount > 0 && (
              <span className={`${isSidebarCollapsed ? 'absolute -right-1 -top-1' : ''} min-w-5 rounded-full border border-rose-400/30 bg-rose-400/15 px-1.5 py-0.5 text-center text-[9px] font-black text-rose-300`}>
                {unresolvedErrorCount > 99 ? '99+' : unresolvedErrorCount}
              </span>
            )}
          </button>
        );
      })}
      
      <div className="hidden lg:block border-t border-white/5 my-1.5 w-full" />
      
      <button
        onClick={handleLogout}
        title={isSidebarCollapsed ? "Sign Out" : undefined}
        className={`flex items-center ${
          isSidebarCollapsed ? 'justify-center w-10 h-10 p-0 mx-auto' : 'gap-3 px-3.5 py-2'
        } rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent transition-all lg:w-full cursor-pointer`}
      >
        <LogOut size={15} className="flex-shrink-0" />
        {!isSidebarCollapsed && <span>Sign Out</span>}
      </button>
    </aside>
  );
}
