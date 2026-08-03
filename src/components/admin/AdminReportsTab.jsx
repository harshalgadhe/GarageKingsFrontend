import React from 'react';

export default function AdminReportsTab({
  reportsSubTab,
  setReportsSubTab,
  cashAccounts,
  setCashAccountForm,
  setIsAddingCashAccount,
  setCashAdjustmentForm,
  setIsAdjustingCash,
  setSettlementForm,
  setIsAddingSettlement,
  splitsData,
  setFounderLedgerForm,
  setIsReimbursing,
  founderLedger
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-white">
          Business Intelligence & Financial Reports
        </h3>
      </div>

      <div className="flex border-b border-white/5 gap-6 pb-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setReportsSubTab('founder_splits')}
          className={`pb-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
            reportsSubTab === 'founder_splits' ? 'border-[#ff5500] text-white' : 'border-transparent text-zinc-500 hover:text-white'
          }`}
        >
          Founder Splits Ledger
        </button>
      </div>

      {reportsSubTab === 'founder_splits' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h4 className="text-xs font-black uppercase tracking-wider text-white">Cash Accounts</h4>
                <button
                  onClick={() => {
                    setCashAccountForm({ name: '', balance: 0, currency: 'INR' });
                    setIsAddingCashAccount(true);
                  }}
                  className="text-[9px] font-black text-[#ff5500] uppercase tracking-widest bg-transparent border-none cursor-pointer"
                >
                  + New Account
                </button>
              </div>
              <div className="space-y-3">
                {cashAccounts.map(acc => (
                  <div key={acc.id} className="flex justify-between items-center py-1 text-xs">
                    <span className="font-bold text-white">{acc.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-[#ff5500]">₹{Number(acc.balance).toLocaleString('en-IN')}</span>
                      <button
                        onClick={() => {
                          setCashAdjustmentForm({ cashAccountId: acc.id, amount: 0, type: 'Audit Adjustment', notes: '' });
                          setIsAdjustingCash(true);
                        }}
                        className="text-[8px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider bg-white/5 border border-white/5 px-2 py-1 rounded cursor-pointer"
                      >
                        Adjust
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h4 className="text-xs font-black uppercase tracking-wider text-white">Settle Capital Balance</h4>
                <button
                  onClick={() => {
                    setSettlementForm({ fromFounder: 'Harshal', toFounder: 'Naman', amount: 0, notes: '', date: new Date().toISOString().split('T')[0] });
                    setIsAddingSettlement(true);
                  }}
                  className="text-[9px] font-black text-[#ff5500] uppercase tracking-widest bg-transparent border-none cursor-pointer"
                >
                  + Record Transfer
                </button>
              </div>
              <div className="space-y-3 text-xs">
                {['Harshal', 'Anutosh', 'Sanchit', 'Anish'].map((founder, idx) => {
                  const contribution = splitsData.paidMap?.[founder] || 0;
                  return (
                    <div key={idx} className="flex justify-between items-center py-1">
                      <span className="font-bold text-white">{founder} Capital</span>
                      <span className="font-mono font-bold text-emerald-400">₹{Number(contribution).toLocaleString('en-IN')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">Capital Contribution / Reimbursement Logs</h4>
              <button
                onClick={() => {
                  setFounderLedgerForm({ founder: 'Harshal', amount: 0, type: 'Contribution', notes: '', date: new Date().toISOString().split('T')[0] });
                  setIsReimbursing(true);
                }}
                className="text-[9px] font-black text-[#ff5500] uppercase tracking-widest bg-transparent border-none cursor-pointer"
              >
                + Log Capital
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[#888888] uppercase tracking-widest text-[9px] bg-black/10">
                    <th className="p-3 font-bold">Founder</th>
                    <th className="p-3 font-bold">Type</th>
                    <th className="p-3 font-bold">Amount</th>
                    <th className="p-3 font-bold">Date</th>
                    <th className="p-3 font-bold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {founderLedger.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-zinc-500 font-mono">No capital ledger transactions logged.</td>
                    </tr>
                  ) : (
                    founderLedger.map(l => (
                      <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                        <td className="p-3 font-bold text-white">{l.founder}</td>
                        <td className="p-3">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                            l.type === 'Contribution' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>{l.type}</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-white">₹{Number(l.amount).toLocaleString('en-IN')}</td>
                        <td className="p-3 text-zinc-500 font-mono">{new Date(l.date).toLocaleDateString()}</td>
                        <td className="p-3 text-zinc-400">{l.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
