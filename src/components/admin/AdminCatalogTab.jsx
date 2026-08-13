import React from 'react';
import { Search, Plus, Trash2, RefreshCw, ArrowUpRight, MoreHorizontal, PackageCheck, Pencil } from 'lucide-react';
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

          {/* Marketplace-style catalog grid */}
          <div className="grid gap-3 md:grid-cols-2 md:gap-4 2xl:grid-cols-3">
            {filteredCars.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.1] bg-[#0A0A09] px-5 py-10 text-center">
                <p className="text-sm font-semibold text-[#D8D3CB]">No products found</p>
                <p className="mt-1 text-xs text-[#706C65]">Try another name, product code, or brand.</p>
              </div>
            ) : filteredCars.map(car => {
              const isPoItem = car.isPrebook || car.is_prebook || car.status === 'Pre-Order';
              const casing = Array.isArray(car.casing_types || car.casingTypes)
                ? (car.casing_types || car.casingTypes).join(', ')
                : (car.casing || car.casingType || 'Blister');

              return (
                <article
                  key={car.id}
                  onClick={() => handleEditProduct(car)}
                  className="group relative rounded-2xl border border-white/[0.09] bg-[#0A0A09] shadow-[0_14px_40px_rgba(0,0,0,.16)] transition duration-300 hover:-translate-y-0.5 hover:border-[#C8AE7D]/25 hover:shadow-[0_20px_55px_rgba(0,0,0,.3)] active:scale-[0.99]"
                >
                  <div className="flex gap-3 p-3.5 md:block md:p-0">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/[0.07] bg-[#11110F] md:h-52 md:w-full md:rounded-b-none md:rounded-t-2xl md:border-0 md:border-b">
                      <img src={car.image || '/vault-1.png'} alt="" className="h-full w-full object-contain p-1 md:p-4" />
                    </div>

                    <div className="min-w-0 flex-1 py-0.5 md:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B8A77E]">{car.brand || 'Unbranded'}</p>
                          <h4 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-[#F4F1EC]">{car.name}</h4>
                        </div>
                        <ArrowUpRight size={16} className="mt-0.5 shrink-0 text-[#827D74]" />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] ${
                          isPoItem
                            ? 'border-[#C8AE7D]/25 bg-[#C8AE7D]/10 text-[#D7BD85]'
                            : 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300'
                        }`}>
                          {isPoItem ? 'Pre-booking' : 'In stock'}
                        </span>
                        {(car.isFeatured || car.is_featured) && (
                          <span className="rounded-full border border-[#E1BD65]/25 bg-[#E1BD65]/10 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-[#E1BD65]">Featured</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 border-t border-white/[0.07] bg-white/[0.015]">
                    <div className="min-w-0 px-3 py-2.5">
                      <span className="block text-[8px] uppercase tracking-[0.14em] text-[#625F59]">Product code</span>
                      <strong className="mt-1 block truncate font-mono text-[11px] font-medium text-[#C8C3BB]">{car.sku || 'Not set'}</strong>
                    </div>
                    <div className="min-w-0 border-x border-white/[0.07] px-3 py-2.5">
                      <span className="block text-[8px] uppercase tracking-[0.14em] text-[#625F59]">Packaging</span>
                      <strong className="mt-1 block truncate text-[11px] font-medium text-[#C8C3BB]">{casing}</strong>
                    </div>
                    <div className="min-w-0 px-3 py-2.5 text-right">
                      <span className="block text-[8px] uppercase tracking-[0.14em] text-[#625F59]">Price</span>
                      <strong className="mt-1 block truncate text-sm font-semibold text-[#F4F1EC]">₹{Number(car.price || 0).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] p-2.5">
                    <p className="pl-1 text-[9px] uppercase tracking-[0.12em] text-[#625F59]">Select card to edit</p>
                    <details
                      className="group/actions relative"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.045] px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#E7E2DA] transition active:bg-white/[0.08] [&::-webkit-details-marker]:hidden">
                        <MoreHorizontal size={15} />
                        Actions
                      </summary>
                      <div className="absolute bottom-[calc(100%+0.5rem)] right-0 z-20 w-48 overflow-hidden rounded-xl border border-white/[0.11] bg-[#151412] p-1.5 shadow-[0_18px_45px_rgba(0,0,0,.65)]">
                        <button
                          type="button"
                          onClick={(event) => { event.stopPropagation(); handleEditProduct(car); }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-[#EEEAE2] transition hover:bg-white/[0.06]"
                        >
                          <Pencil size={14} className="text-[#C8AE7D]" /> Edit product
                        </button>
                        {isPoItem && (
                          <button
                            type="button"
                            onClick={(event) => { event.stopPropagation(); handleConvertPoToStock(car.id); }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/[0.08]"
                          >
                            <PackageCheck size={14} /> Move to stock
                          </button>
                        )}
                        <div className="my-1 h-px bg-white/[0.07]" />
                        <button
                          type="button"
                          onClick={(event) => { event.stopPropagation(); handleDeleteProduct(car.id); }}
                          disabled={loadingProductId !== null || isArchivingProductId !== null}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-red-300 transition hover:bg-red-500/[0.08] disabled:opacity-40"
                        >
                          {isArchivingProductId === car.id ? <RefreshCw className="animate-spin" size={14} /> : <Trash2 size={14} />}
                          Delete product
                        </button>
                      </div>
                    </details>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Legacy table retained in source for reference; card grid is the active catalog UI. */}
          <div className="hidden">
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
                              onClick={(event) => { event.stopPropagation(); handleConvertPoToStock(car.id); }}
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
