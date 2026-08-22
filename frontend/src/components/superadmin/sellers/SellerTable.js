import React, { useState, useRef, useEffect } from "react";

const CustomSelect = ({ value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer select-none text-left"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <svg className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-9 mt-1 w-full bg-[#0d1527] border border-[#1e293b] rounded-xl shadow-2xl py-1 z-30 text-[11px] font-bold text-slate-200 select-none max-h-60 overflow-y-auto no-scrollbar animate-slideUp">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-2 hover:bg-slate-800 transition cursor-pointer ${
              value === "" ? "text-indigo-400 bg-indigo-500/5" : ""
            }`}
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 hover:bg-slate-800 transition cursor-pointer ${
                value === opt.value ? "text-indigo-400 bg-indigo-500/5" : ""
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function SellerTable({
  sellers = [],
  pagination = {},
  filters = {},
  onFilterChange = () => {},
  onPageChange = () => {},
  onViewSeller = () => {},
  onEditSeller = () => {},
  onResetPassword = () => {},
  onForceLogout = () => {},
  onToggleBlock = () => {},
  onExport = () => {},
  isLoading = false,
}) {
  const [activeMenuUserId, setActiveMenuUserId] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveMenuUserId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);

  const getInitials = (first, last) => {
    return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();
  };

  return (
    <div className="bg-[#0d1527] border border-[#1e293b]/70 rounded-3xl p-5.5 shadow-sm space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between pb-2">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative col-span-1 sm:col-span-2">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-xs">
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              name="seller-search-field-control"
              autoComplete="off"
              placeholder="Search seller name, email, company..."
              value={filters.search || ""}
              onChange={(e) => onFilterChange("search", e.target.value)}
              className="w-full pl-8.5 pr-3 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Status Filter */}
          <CustomSelect
            value={filters.status || ""}
            onChange={(val) => onFilterChange("status", val)}
            placeholder="All Status"
            options={[
              { value: "ACTIVE", label: "Active" },
              { value: "SUSPENDED", label: "Suspended" },
            ]}
          />

          {/* KYC Status Filter */}
          <CustomSelect
            value={filters.kycStatus || ""}
            onChange={(val) => onFilterChange("kycStatus", val)}
            placeholder="All KYC Status"
            options={[
              { value: "APPROVED", label: "Verified" },
              { value: "PENDING", label: "Pending" },
              { value: "REJECTED", label: "Rejected" },
              { value: "NOT_SUBMITTED", label: "Not Submitted" },
            ]}
          />

          {/* Plan Filter */}
          <CustomSelect
            value={filters.plan || ""}
            onChange={(val) => onFilterChange("plan", val)}
            placeholder="All Plans"
            options={[
              { value: "Basic", label: "Basic" },
              { value: "Pro", label: "Pro" },
              { value: "Enterprise", label: "Enterprise" },
            ]}
          />
        </div>

        {/* Export Button */}
        <button
          onClick={onExport}
          className="px-4 py-2 bg-[#16203b] hover:bg-slate-800 border border-[#1e293b] rounded-xl text-[11px] font-bold text-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
        >
          {/* Export Icon */}
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Export CSV</span>
        </button>
      </div>

      {/* Sellers List Table */}
      <div className="overflow-x-auto no-scrollbar relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center rounded-2xl transition duration-200">
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider animate-pulse">Loading data...</span>
            </div>
          </div>
        )}
        <table className="w-full text-left text-[11px] font-semibold text-slate-300">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <th className="py-3 px-2">Seller</th>
              <th className="py-3 px-2">Company</th>
              <th className="py-3 px-2 text-center">KYC Status</th>
              <th className="py-3 px-2 text-center">Plan</th>
              <th className="py-3 px-2 text-right">Wallet Balance</th>
              <th className="py-3 px-2 text-center">Status</th>
              <th className="py-3 px-2 text-center w-12">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {sellers.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-10 text-slate-500 text-xs">
                  No sellers registered or matches found.
                </td>
              </tr>
            ) : (
              sellers.map((seller) => (
                <tr key={seller.id} className="hover:bg-slate-800/25 transition">
                  {/* Seller Name and ID */}
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-[10px] shrink-0 shadow-sm">
                        {getInitials(seller.firstName, seller.lastName)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate text-[11px]">
                          {seller.firstName} {seller.lastName}
                        </p>
                        <p className="text-[9.5px] font-bold text-slate-500 uppercase tracking-tight">
                          ID: {seller.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Company Name */}
                  <td className="py-3 px-2 text-slate-200">
                    {seller.companyName || "N/A"}
                  </td>

                  {/* KYC Indicator */}
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-extrabold ${
                        seller.kycStatus === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : seller.kycStatus === "PENDING"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : seller.kycStatus === "REJECTED"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {seller.kycStatus === "APPROVED" && "✓ Verified"}
                      {seller.kycStatus === "PENDING" && "⏳ Pending"}
                      {seller.kycStatus === "REJECTED" && "❌ Rejected"}
                      {seller.kycStatus === "NOT_SUBMITTED" && "Not Submitted"}
                    </span>
                  </td>

                  {/* Plan */}
                  <td className="py-3 px-2 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-[#1e293b] text-slate-300 font-bold text-[10px]">
                      {seller.plan || "Basic"}
                    </span>
                  </td>

                  {/* Dynamic Wallet */}
                  <td className="py-3 px-2 text-right font-mono font-bold text-slate-100">
                    {formatCurrency(seller.walletBalance)}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9.5px] font-extrabold ${
                        seller.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {seller.status === "ACTIVE" ? "Active" : "Suspended"}
                    </span>
                  </td>

                  {/* Actions Dropdown Button */}
                  <td className="py-3 px-2 text-center relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuUserId(activeMenuUserId === seller.id ? null : seller.id);
                      }}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8a2 2 0 100-4 2 2 0 000 4zm0 6a2 2 0 100-4 2 2 0 000 4zm0 6a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    </button>

                    {/* Options Popup Overlay Menu */}
                    {activeMenuUserId === seller.id && (
                      <div
                        ref={dropdownRef}
                        className="absolute right-6 top-10 mt-1 w-44 bg-[#16203b] border border-[#1e293b] rounded-xl shadow-2xl py-1 z-30 text-left text-[11px] font-bold text-slate-200 select-none animate-slideUp"
                      >
                        <button
                          onClick={() => {
                            setActiveMenuUserId(null);
                            onViewSeller(seller);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-800 transition cursor-pointer flex items-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>View Details</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuUserId(null);
                            onEditSeller(seller);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-800 transition cursor-pointer flex items-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuUserId(null);
                            onResetPassword(seller);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-800 transition cursor-pointer flex items-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span>Reset Password</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuUserId(null);
                            onForceLogout(seller);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-800 transition cursor-pointer flex items-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Force Logout</span>
                        </button>
 
                        <div className="h-px bg-slate-800 my-1"></div>
 
                        {/* Suspend or Block account toggle */}
                        <button
                          onClick={() => {
                            setActiveMenuUserId(null);
                            onToggleBlock(seller);
                          }}
                          className={`w-full text-left px-3.5 py-2 hover:bg-slate-800 transition cursor-pointer flex items-center gap-2 ${
                            seller.status === "ACTIVE" ? "text-rose-400 hover:text-rose-300" : "text-emerald-400 hover:text-emerald-300"
                          }`}
                        >
                          {seller.status === "ACTIVE" ? (
                            <svg className="w-3.5 h-3.5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          <span>{seller.status === "ACTIVE" ? "Suspend Account" : "Unblock Account"}</span>
                        </button>
 
                        {/* Danger zone delete */}
                        <button
                          onClick={() => {
                            setActiveMenuUserId(null);
                            onDeleteSeller(seller);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-red-500/10 text-rose-500 hover:text-rose-400 transition cursor-pointer flex items-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete Account</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Panel */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-[11px] font-bold text-slate-400 select-none">
          <div>
            Showing <span className="text-slate-200">{(pagination.currentPage - 1) * pagination.limit + 1}</span> to{" "}
            <span className="text-slate-200">
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)}
            </span>{" "}
            of <span className="text-slate-200">{pagination.totalCount}</span> entries
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={pagination.currentPage === 1}
              onClick={() => onPageChange(pagination.currentPage - 1)}
              className="px-3 py-1.5 border border-slate-850 hover:border-slate-600 rounded-lg disabled:opacity-30 disabled:hover:border-slate-850 text-slate-200 transition cursor-pointer"
            >
              &lt; Previous
            </button>
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => onPageChange(i + 1)}
                className={`w-8 h-8 rounded-lg border transition cursor-pointer ${
                  pagination.currentPage === i + 1
                    ? "bg-indigo-600 border-indigo-500 text-white font-bold"
                    : "border-slate-850 hover:border-slate-600 text-slate-300"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => onPageChange(pagination.currentPage + 1)}
              className="px-3 py-1.5 border border-slate-850 hover:border-slate-600 rounded-lg disabled:opacity-30 disabled:hover:border-slate-850 text-slate-200 transition cursor-pointer"
            >
              Next &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
