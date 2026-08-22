import React from "react";

export default function SellerDetailsModal({
  sellerId = null,
  isOpen = false,
  onClose = () => {},
  detailsData = null, // from GET /api/admin/sellers/:userId
  isLoading = false,
}) {
  if (!isOpen) return null;

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);

  const getInitials = (first, last) => {
    return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();
  };

  const seller = detailsData?.seller || {};
  const recentTransactions = detailsData?.recentTransactions || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0d1527] border border-[#1e293b] rounded-3xl p-6 shadow-2xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-y-auto no-scrollbar space-y-6">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-2.5 border-b border-[#1e293b]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Seller Account Details</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <svg className="w-8 h-8 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xs font-bold text-slate-400">Loading details...</span>
          </div>
        ) : (
          <div className="space-y-6 text-[11px] font-semibold text-slate-300">
            {/* Top overview row */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-[#080d1a] border border-[#1e293b] p-4.5 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow">
                {getInitials(seller.firstName, seller.lastName)}
              </div>
              <div className="flex-1 space-y-1 min-w-0">
                <h4 className="text-sm font-bold text-white leading-none">
                  {seller.firstName} {seller.lastName}
                </h4>
                <p className="text-slate-400 leading-none">Company: {seller.companyName || "N/A"}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-[#1e293b] text-slate-300 font-bold text-[9px]">
                    Plan: {seller.plan || "Basic"}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-[#1e293b] text-slate-300 font-bold text-[9px]">
                    Wallet: {formatCurrency(seller.walletBalance)}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                    seller.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}>
                    {seller.status || "ACTIVE"}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Grid Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* General details */}
              <div className="bg-[#080d1a]/40 border border-[#1e293b] p-4 rounded-2xl space-y-2.5">
                <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800 pb-1">
                  Contact Information
                </h5>
                <div className="grid grid-cols-3 gap-y-2">
                  <span className="text-slate-500">Email:</span>
                  <span className="col-span-2 text-slate-200 truncate">{seller.email}</span>

                  <span className="text-slate-500">Mobile:</span>
                  <span className="col-span-2 text-slate-200">{seller.mobile}</span>

                  <span className="text-slate-500">Registered:</span>
                  <span className="col-span-2 text-slate-200">
                    {seller.createdAt ? new Date(seller.createdAt).toLocaleDateString("en-IN") : "N/A"}
                  </span>
                </div>
              </div>

              {/* Company & KYC details */}
              <div className="bg-[#080d1a]/40 border border-[#1e293b] p-4 rounded-2xl space-y-2.5">
                <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800 pb-1">
                  KYC & Address Details
                </h5>
                <div className="grid grid-cols-3 gap-y-2">
                  <span className="text-slate-500">KYC Status:</span>
                  <span className="col-span-2 font-bold text-slate-200">{seller.kycStatus || "NOT_SUBMITTED"}</span>

                  <span className="text-slate-500">GST Number:</span>
                  <span className="col-span-2 text-slate-200">{seller.gstNumber || "N/A"}</span>

                  <span className="text-slate-500">State / Pincode:</span>
                  <span className="col-span-2 text-slate-200">
                    {seller.state || "N/A"} - {seller.pincode || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Bank details row */}
            <div className="bg-[#080d1a]/40 border border-[#1e293b] p-4 rounded-2xl space-y-2.5">
              <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800 pb-1">
                Bank Settlement Information
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-0.5">
                  <p className="text-slate-500 text-[10px]">Beneficiary Name</p>
                  <p className="text-slate-100 font-bold">{seller.bankHolderName || "N/A"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-slate-500 text-[10px]">Bank / Branch</p>
                  <p className="text-slate-100 font-bold">{seller.bankName || "N/A"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-slate-500 text-[10px]">Account Number</p>
                  <p className="text-slate-100 font-mono font-bold">{seller.bankAccountNumber || "N/A"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-slate-500 text-[10px]">IFSC Code</p>
                  <p className="text-slate-100 font-mono font-bold">{seller.bankIfsc || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Recent Transaction Logs */}
            <div className="bg-[#080d1a]/40 border border-[#1e293b] p-4 rounded-2xl space-y-2.5">
              <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800 pb-1">
                Recent Wallet Transactions
              </h5>
              {recentTransactions.length === 0 ? (
                <p className="text-center py-4 text-slate-500 text-[10px]">No wallet transactions found.</p>
              ) : (
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-[10px] font-semibold text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-800 font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-1.5">TX ID</th>
                        <th className="py-1.5">Date</th>
                        <th className="py-1.5">Type</th>
                        <th className="py-1.5">Description</th>
                        <th className="py-1.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {recentTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-800/20">
                          <td className="py-2 text-slate-300 font-mono">{tx.txId}</td>
                          <td className="py-2">
                            {new Date(tx.date).toLocaleDateString("en-IN")}
                          </td>
                          <td className="py-2 capitalize">{tx.type}</td>
                          <td className="py-2 text-slate-300 truncate max-w-xs">{tx.description}</td>
                          <td className={`py-2 text-right font-mono font-bold ${
                            tx.amount >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}>
                            {tx.amount >= 0 ? "+" : ""}
                            {formatCurrency(tx.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-[11px] font-bold text-slate-200 transition cursor-pointer"
              >
                Close Profile
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
