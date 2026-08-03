import React from 'react';
import { 
  TrendingUp, FolderOpen, Receipt, Package, ShoppingBag, 
  Truck, Users, BarChart3, Bell, Settings, Activity, 
  ChevronLeft, ChevronRight, LogOut 
} from 'lucide-react';

export const ADMIN_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { id: 'catalog', label: 'Catalog', icon: FolderOpen },
  { id: 'receipts', label: 'Receipts', icon: Receipt }
];

export default function AdminSidebar({
  adminTab,
  setAdminTab,
  triggerTabFetch,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  handleLogout
}) {

  return (
    <aside className={`flex-shrink-0 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 bg-[#111111] border border-white/5 rounded-2xl h-fit lg:sticky lg:top-24 scrollbar-none transition-all duration-200 ${
      isSidebarCollapsed ? 'lg:w-16 p-2 items-center' : 'lg:w-60 p-3'
    }`}>
      {/* Desktop collapse toggle */}
      <div className={`hidden lg:flex items-center w-full pb-2 mb-1 border-b border-white/5 ${
        isSidebarCollapsed ? 'justify-center' : 'justify-between'
      }`}>
        {!isSidebarCollapsed && (
          <span className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">
            Navigation
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
            className={`flex items-center ${
              isSidebarCollapsed ? 'justify-center w-10 h-10 p-0 mx-auto' : 'gap-3 px-3.5 py-2'
            } rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap lg:w-full cursor-pointer border ${
              active 
                ? 'bg-[#ff5500]/10 border-[#ff5500]/30 text-[#ff5500] shadow-[0_0_15px_-5px_rgba(255,85,0,0.15)]' 
                : 'border-transparent text-[#888888] hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon size={15} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span className="flex-1 text-left">{tab.label}</span>}
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
