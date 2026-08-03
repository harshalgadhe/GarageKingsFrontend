import React from 'react';
import { Search } from 'lucide-react';
import Pagination from './Pagination';

export default function AdminCustomersTab({
  customersSearchQuery,
  setCustomersSearchQuery,
  customersLoading,
  customersList,
  customersPage,
  customersTotalPages,
  customersTotal,
  setCustomersPage
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-white">
          Customer Relationship Management
        </h3>
      </div>

      <div className="flex items-center gap-2 bg-[#141414] border border-white/5 rounded-xl px-3.5 py-2.5 w-full max-w-md">
        <Search size={14} className="text-zinc-500" />
        <input
          type="text"
          placeholder="Search customers by name, email, instagram..."
          value={customersSearchQuery}
          onChange={(e) => setCustomersSearchQuery(e.target.value)}
          className="bg-transparent border-none text-xs text-white placeholder-zinc-600 focus:outline-none w-full"
        />
      </div>

      <div className="overflow-x-auto border border-white/5 rounded-2xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#141414] border-b border-white/5 text-[#888888] uppercase tracking-widest text-[9px]">
              <th className="p-4 font-bold">Collector Name</th>
              <th className="p-4 font-bold">Instagram</th>
              <th className="p-4 font-bold">Email Address</th>
              <th className="p-4 font-bold">Phone</th>
              <th className="p-4 font-bold">City</th>
              <th className="p-4 font-bold">Notes</th>
            </tr>
          </thead>
          <tbody>
            {customersLoading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-zinc-500 font-mono">Loading customers directory...</td>
              </tr>
            ) : customersList.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-zinc-500 font-mono">No customers registered in database.</td>
              </tr>
            ) : (
              customersList.map(c => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-bold text-white">{c.name}</td>
                  <td className="p-4 text-[#ff5500] font-bold">
                    {c.instagram_username ? (
                      <a href={`https://instagram.com/${c.instagram_username}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        @{c.instagram_username}
                      </a>
                    ) : '-'}
                  </td>
                  <td className="p-4 font-mono text-zinc-400">{c.email || '-'}</td>
                  <td className="p-4 font-mono text-zinc-400">{c.phone || '-'}</td>
                  <td className="p-4 text-zinc-400">{c.city || '-'}</td>
                  <td className="p-4 text-zinc-500 max-w-[200px] truncate">{c.notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={customersPage}
        totalPages={customersTotalPages}
        totalItems={customersTotal}
        onPageChange={setCustomersPage}
      />
    </div>
  );
}
