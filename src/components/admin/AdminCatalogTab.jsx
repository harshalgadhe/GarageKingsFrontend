import React from 'react';
import { Search, Plus, Trash2, RefreshCw } from 'lucide-react';
import MasterData from '../../pages/admin/MasterData';
import Pagination from './Pagination';

export default function AdminCatalogTab({
  catalogSubTab,
  setCatalogSubTab,
  setProductForm,
  setEditingProductId,
  setEditingProductData,
  setIsAddingProduct,
  inventorySearchQuery,
  setInventorySearchQuery,
  filteredCars,
  handleConvertPoToStock,
  handleEditProduct,
  handleDeleteProduct,
  loadingProductId,
  isArchivingProductId,
  inventoryPage,
  inventoryTotalPages,
  inventoryTotal,
  setInventoryPage,
  variantsSearchQuery,
  setVariantsSearchQuery,
  variantsLoading,
  variantsList,
  variantsPage,
  variantsTotalPages,
  variantsTotal,
  setVariantsPage
}) {
  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <div className="flex border-b border-white/5 gap-6 pb-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setCatalogSubTab('products')}
          className={`pb-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
            catalogSubTab === 'products' ? 'border-[#C8AE7D] text-[#F4F1EC]' : 'border-transparent text-[#77736D] hover:text-white'
          }`}
        >
          Products Catalog
        </button>
        <button
          onClick={() => setCatalogSubTab('lookups')}
          className={`pb-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
            catalogSubTab === 'lookups' ? 'border-[#C8AE7D] text-[#F4F1EC]' : 'border-transparent text-[#77736D] hover:text-white'
          }`}
        >
          Lookup Settings
        </button>
      </div>

      {catalogSubTab === 'products' && (
        <div className="space-y-6">
          {/* Search Bar & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/[0.09] bg-[#080808] px-3.5 py-2.5 focus-within:border-[#C8AE7D]/40">
              <Search size={14} className="text-zinc-500" />
              <input
                type="text"
                placeholder="Search castings by name, SKU, brand..."
                value={inventorySearchQuery}
                onChange={(e) => setInventorySearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs text-white placeholder-zinc-600 focus:outline-none w-full"
              />
            </div>

            <button
              onClick={() => {
                setEditingProductId(null);
                if (typeof setEditingProductData === 'function') setEditingProductData(null);
                setIsAddingProduct(true);
              }}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[#C8AE7D]/25 bg-[#C8AE7D]/[0.09] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#E1BD65] transition hover:bg-[#C8AE7D]/[0.16]"
            >
              <Plus size={14} /> Add Casting
            </button>
          </div>

          {/* Table list */}
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#080808]/70">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.07] bg-[#11110F] text-[9px] uppercase tracking-widest text-[#77736D]">
                  <th className="p-4 font-bold">Casting</th>
                  <th className="p-4 font-bold">SKU</th>
                  <th className="p-4 font-bold">Type</th>
                  <th className="p-4 font-bold">Selling Price</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCars.map(car => {
                  const isPoItem = car.isPrebook || car.is_prebook || car.status === 'Pre-Order';
                  return (
                    <tr 
                      key={car.id} 
                      onClick={() => handleEditProduct(car)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleEditProduct(car);
                        }
                      }}
                      tabIndex={0}
                      aria-label={`Edit ${car.name}`}
                      className="cursor-pointer border-b border-white/5 transition-colors hover:bg-[#C8AE7D]/[0.045] focus-visible:bg-[#C8AE7D]/[0.06] focus-visible:outline-none"
                    >
                      <td className="p-4 flex items-center gap-3">
                        <img src={car.image || '/vault-1.png'} className="w-10 h-8 object-cover rounded border border-white/5" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white block">{car.name}</span>
                            {(car.isFeatured || car.is_featured) && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-[#E1BD65]/20 text-[#E1BD65] border border-[#E1BD65]/40 flex items-center gap-0.5" title="Featured on Homepage">
                                ★ Featured
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#888888] uppercase tracking-wider">{car.brand} • {car.category} • {Array.isArray(car.casing_types || car.casingTypes) ? (car.casing_types || car.casingTypes).join(', ') : (car.casing || car.casingType || 'Blister')}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-[#888888]">{car.sku}</td>
                      <td className="p-4">
                        {isPoItem ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#ff5500]/15 text-[#ff5500] border border-[#ff5500]/30 shadow-[0_0_10px_rgba(225,6,0,0.15)] animate-pulse">
                            Pre-booking
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-green-500/15 text-green-400 border border-green-500/30">
                            In-Stock
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-mono">
                        <div className="text-white font-bold">₹{car.price}</div>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          {isPoItem && (
                            <button
                              onClick={() => handleConvertPoToStock(car.id)}
                              title="Convert PO to In-Stock"
                              className="px-2 py-1 rounded bg-green-500/10 hover:bg-green-500/20 text-green-400 font-bold text-[9px] uppercase tracking-wider border border-green-500/30 transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95 whitespace-nowrap"
                            >
                              ✓ To Stock
                            </button>
                          )}
                          {loadingProductId === car.id && <RefreshCw className="mr-2 animate-spin text-[#E1BD65]" size={13} />}
                          <button 
                            onClick={(event) => { event.stopPropagation(); handleDeleteProduct(car.id); }}
                            disabled={loadingProductId !== null || isArchivingProductId !== null}
                            title="Delete Casting"
                            className="text-red-400 hover:text-red-300 p-1.5 rounded bg-red-500/5 hover:bg-red-500/10 transition-colors border border-red-500/10 cursor-pointer inline-flex disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {isArchivingProductId === car.id ? <RefreshCw className="animate-spin" size={12} /> : <Trash2 size={12} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={inventoryPage}
            totalPages={inventoryTotalPages}
            totalItems={inventoryTotal}
            onPageChange={setInventoryPage}
          />
        </div>
      )}



      {catalogSubTab === 'lookups' && (
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
          <MasterData />
        </div>
      )}
    </div>
  );
}
