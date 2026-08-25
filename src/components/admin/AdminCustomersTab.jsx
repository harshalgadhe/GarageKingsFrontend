import React from 'react';
import { CalendarDays, IndianRupee, LoaderCircle, Mail, MapPin, Search, ShieldCheck, ShoppingBag, UserPlus, Users } from 'lucide-react';
import Pagination from './Pagination';

const formatDate = (value) => value
  ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
  : 'Not available';

const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0
}).format(Number(value || 0));

const initials = (customer) => String(customer?.name || customer?.email || 'C')
  .split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

export default function AdminCustomersTab({
  customersSearchQuery, setCustomersSearchQuery, customersLoading, customersList,
  customersPage, customersTotalPages, customersTotal, customersSummary = {}, setCustomersPage,
  canManageRoles = false, customerRoleSavingId, onRoleChange
}) {
  const recentCustomers = customersSummary.recentCustomers || [];
  const summaryCards = [
    ['Customer accounts', customersSummary.totalCustomers || 0, Users],
    ['Joined this week', customersSummary.joinedLast7Days || 0, UserPlus],
    ['Joined this month', customersSummary.joinedLast30Days || 0, CalendarDays],
    ['Admin accounts', customersSummary.administrators || 0, ShieldCheck]
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-2 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#C8AE7D]">Customer dashboard</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">People joining GarageKings</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-white/45">View customer accounts, recent registrations and account access from one place.</p>
        </div>
        <span className="w-fit rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">{customersTotal} accounts</span>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {summaryCards.map(([label, value, Icon]) => (
          <div key={label} className="rounded-2xl border border-white/[0.08] bg-[#10100F] p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">{label}</span>
              <Icon size={15} className="text-[#C8AE7D]" />
            </div>
            <p className="mt-4 text-2xl font-semibold tabular-nums tracking-[-0.04em] text-white sm:text-3xl">{value}</p>
          </div>
        ))}
      </div>

      {recentCustomers.length > 0 && (
        <section className="rounded-2xl border border-white/[0.08] bg-[#0D0D0C] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div><h3 className="text-sm font-semibold text-white">Recently joined</h3><p className="mt-1 text-xs text-white/38">The latest customer accounts created.</p></div>
            <UserPlus size={16} className="text-[#C8AE7D]" />
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {recentCustomers.map((customer) => (
              <div key={customer.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#C8AE7D]/25 bg-[#C8AE7D]/10 text-[10px] font-black text-[#E1BD65]">{initials(customer)}</div>
                <div className="min-w-0"><p className="truncate text-xs font-semibold text-white">{customer.name}</p><p className="mt-0.5 truncate text-[10px] text-white/38">Joined {formatDate(customer.createdAt)}</p></div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="text-sm font-semibold text-white">All accounts</h3><p className="mt-1 text-xs text-white/38">Search by customer name, email, phone or Instagram username.</p></div>
          <label className="flex w-full items-center gap-2 rounded-xl border border-white/[0.09] bg-[#111110] px-3.5 py-3 focus-within:border-[#C8AE7D]/45 sm:max-w-md">
            <Search size={15} className="shrink-0 text-white/35" />
            <input type="search" aria-label="Search customers" placeholder="Search customer accounts" value={customersSearchQuery} onChange={(event) => setCustomersSearchQuery(event.target.value)} className="w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-white/25" />
          </label>
        </div>

        {customersLoading ? (
          <div className="grid min-h-52 place-items-center rounded-2xl border border-white/[0.08] bg-[#0D0D0C]"><div className="flex items-center gap-2 text-xs text-white/45"><LoaderCircle size={16} className="animate-spin text-[#C8AE7D]" />Loading customer accounts</div></div>
        ) : customersList.length === 0 ? (
          <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-white/[0.1] bg-[#0D0D0C] px-6 text-center"><div><Users size={22} className="mx-auto text-white/25" /><p className="mt-3 text-sm font-semibold text-white">No matching customers</p><p className="mt-1 text-xs text-white/38">Try a different name, email or phone number.</p></div></div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {customersList.map((customer) => {
              const role = customer.role || 'Collector';
              const saving = customerRoleSavingId === customer.id;
              return (
                <article key={customer.id} className="rounded-2xl border border-white/[0.08] bg-[#0D0D0C] p-4 transition-colors hover:border-white/[0.14] sm:p-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#C8AE7D]/25 bg-[#C8AE7D]/10 text-xs font-black text-[#E1BD65]">{initials(customer)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><h4 className="truncate text-sm font-semibold text-white">{customer.name}</h4><span className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] ${role === 'Owner' || role === 'Admin' ? 'border-[#C8AE7D]/30 bg-[#C8AE7D]/10 text-[#E1BD65]' : 'border-white/10 bg-white/[0.035] text-white/45'}`}>{role === 'Collector' ? 'Customer' : role}</span></div>
                      <a href={`mailto:${customer.email}`} className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-white/42 hover:text-white/70"><Mail size={11} className="shrink-0" /><span className="truncate">{customer.email}</span></a>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-4">
                    <Stat label="Joined" value={formatDate(customer.createdAt)} />
                    <Stat label="Orders" value={customer.totalOrders || 0} icon={ShoppingBag} />
                    <Stat label="Order value" value={formatCurrency(customer.totalSpend)} icon={IndianRupee} />
                    <Stat label="Location" value={customer.city || 'Not added'} icon={MapPin} />
                  </div>
                  <div className="mt-4 flex flex-col gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 truncate text-[10px] text-white/35">{[customer.phone, customer.instagramUsername ? `@${customer.instagramUsername}` : null].filter(Boolean).join(' · ') || 'No additional contact details'}</div>
                    {canManageRoles && role !== 'Owner' && (
                      <label className="flex shrink-0 items-center gap-2"><span className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35">Access</span><select value={role === 'Admin' ? 'Admin' : 'Collector'} disabled={saving} onChange={(event) => onRoleChange(customer, event.target.value)} className="rounded-lg border border-white/10 bg-[#151513] px-3 py-2 text-[11px] font-semibold text-white outline-none hover:border-[#C8AE7D]/35 disabled:cursor-wait disabled:opacity-50"><option value="Collector">Customer</option><option value="Admin">Admin</option></select></label>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <Pagination currentPage={customersPage} totalPages={customersTotalPages} totalItems={customersTotal} onPageChange={setCustomersPage} />
      </section>
    </div>
  );
}

function Stat({ label, value, icon: Icon }) {
  return <div className="min-w-0 bg-[#111110] p-3"><p className="text-[8px] font-black uppercase tracking-[0.15em] text-white/30">{label}</p><p className="mt-1.5 flex items-center gap-1.5 truncate text-[11px] font-medium text-white/70">{Icon && <Icon size={11} className="shrink-0" />}{value}</p></div>;
}
