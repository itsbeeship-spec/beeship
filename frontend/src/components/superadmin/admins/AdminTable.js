import React, { useState, useRef, useEffect } from "react";

const CustomSelect = ({ value, onChange, placeholder, options }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOpt = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className="relative min-w-[130px]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 transition flex items-center justify-between text-left cursor-pointer"
      >
        <span className="truncate">{selectedOpt ? selectedOpt.label : placeholder}</span>
        <svg className={`w-3 h-3 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-[#0d1527] border border-[#1e293b] rounded-xl shadow-xl overflow-hidden py-1 text-[11px]">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-slate-800 transition text-slate-400 cursor-pointer"
          >
            All {placeholder.replace("All ", "")}
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

export default function AdminTable({
  admins = [],
  pagination = {},
  filters = {},
  onFilterChange = () => {},
  onPageChange = () => {},
  onViewAdmin = () => {},
  onEditAdmin = () => {},
  onChangeRole = () => {},
  onViewPermissions = () => {},
  onViewActivityLogs = () => {},
  onForceLogout = () => {},
  onToggleStatus = () => {},
  onDeleteAdmin = () => {},
  isLoading = false,
}) {
  const [activeMenuId, setActiveMenuId] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const getInitials = (first = "", last = "") => {
    return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHrs < 24) return `${diffHrs} hrs ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className="bg-[#0d1527] border border-[#1e293b]/70 rounded-3xl p-5.5 shadow-sm space-y-4">
      
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-2">
        <div className="flex-1 flex flex-wrap gap-2.5 items-center">
          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-xs">
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              name="admin-search-box-field"
              autoComplete="off"
              placeholder="Search name, email, admin ID..."
              value={filters.search || ""}
              onChange={(e) => onFilterChange("search", e.target.value)}
              className="w-full pl-8.5 pr-3 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Role Filter */}
          <CustomSelect
            value={filters.role || ""}
            onChange={(val) => onFilterChange("role", val)}
            placeholder="All Roles"
            options={[
              { value: "Operations Admin", label: "Operations Admin" },
              { value: "Finance Admin", label: "Finance Admin" },
              { value: "KYC Admin", label: "KYC Admin" },
              { value: "Support Admin", label: "Support Admin" },
              { value: "Technical Admin", label: "Technical Admin" },
              { value: "Custom Role", label: "Custom Role" },
            ]}
          />

          {/* Status Filter */}
          <CustomSelect
            value={filters.status || ""}
            onChange={(val) => onFilterChange("status", val)}
            placeholder="All Status"
            options={[
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
          />

          {/* Reset Button */}
          {(filters.search || filters.role || filters.status) && (
            <button
              onClick={() => {
                onFilterChange("search", "");
                onFilterChange("role", "");
                onFilterChange("status", "");
              }}
              className="px-3 py-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white rounded-xl text-[11px] font-bold transition cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Admins Table List */}
      <div className="overflow-x-auto no-scrollbar relative min-h-[260px]">
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
              <th className="py-3 px-2">Admin</th>
              <th className="py-3 px-2">Role</th>
              <th className="py-3 px-2 text-center">Status</th>
              <th className="py-3 px-2 text-center">Last Login</th>
              <th className="py-3 px-2 text-center">Created</th>
              <th className="py-3 px-2 text-center w-12">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {admins.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-12 text-slate-500 text-xs">
                  No administrators registered or matches found.
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-slate-800/25 transition">
                  {/* Name and ID details */}
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-[10px] shrink-0 shadow-sm">
                        {getInitials(admin.firstName, admin.lastName)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate text-[11px]">
                          {admin.firstName} {admin.lastName}
                        </p>
                        <p className="text-[9.5px] font-bold text-slate-500 uppercase tracking-tight">
                          ID: ADM-{admin.id.slice(0, 4).toUpperCase()}
                        </p>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5 max-w-[150px]">
                          {admin.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Role Title */}
                  <td className="py-3 px-2">
                    <span className="text-[11px] text-slate-300 font-medium">
                      {admin.role === "SUPER_ADMIN" ? "Super Admin" : admin.role}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase border ${
                        admin.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      }`}
                    >
                      {admin.status === "ACTIVE" ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Last Login */}
                  <td className="py-3 px-2 text-center text-slate-400 text-[10px]">
                    {getRelativeTime(admin.updatedAt)}
                  </td>

                  {/* Created Date */}
                  <td className="py-3 px-2 text-center text-slate-400 text-[10px]">
                    {new Date(admin.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>

                  {/* Action dropdown */}
                  <td className="py-3 px-2 text-center relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === admin.id ? null : admin.id)}
                      className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 10a2 2 0 11-2 2 2 2 0 012-2zm0-6a2 2 0 11-2 2 2 2 0 012-2zm0 12a2 2 0 11-2 2 2 2 0 012-2z" />
                      </svg>
                    </button>

                    {activeMenuId === admin.id && (
                      <div
                        ref={dropdownRef}
                        className="absolute right-2 mt-1 w-44 bg-[#0d1527] border border-[#1e293b] rounded-xl shadow-xl z-20 py-1.5 text-left text-[11px] font-semibold text-slate-300"
                      >
                        <button
                          onClick={() => {
                            onViewAdmin(admin);
                            setActiveMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 hover:bg-slate-800 text-left transition flex items-center gap-2.5 cursor-pointer text-slate-300"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>View Admin</span>
                        </button>
                        <button
                          onClick={() => {
                            onEditAdmin(admin);
                            setActiveMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 hover:bg-slate-800 text-left transition flex items-center gap-2.5 cursor-pointer text-slate-300"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          <span>Edit Admin</span>
                        </button>
                        <button
                          onClick={() => {
                            onChangeRole(admin);
                            setActiveMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 hover:bg-slate-800 text-left transition flex items-center gap-2.5 cursor-pointer text-slate-300"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span>Change Role</span>
                        </button>
                        <button
                          onClick={() => {
                            onViewPermissions(admin);
                            setActiveMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 hover:bg-slate-800 text-left transition flex items-center gap-2.5 cursor-pointer text-slate-300"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>View Permissions</span>
                        </button>
                        <button
                          onClick={() => {
                            onViewActivityLogs(admin);
                            setActiveMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 hover:bg-slate-800 text-left transition flex items-center gap-2.5 cursor-pointer text-slate-300"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>View Activity Logs</span>
                        </button>
                        <button
                          onClick={() => {
                            onForceLogout(admin);
                            setActiveMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 hover:bg-slate-800 text-left transition flex items-center gap-2.5 cursor-pointer text-amber-400 hover:text-amber-300"
                        >
                          <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          <span>Force Logout</span>
                        </button>

                        <div className="border-t border-[#1e293b] my-1"></div>

                        {/* Deactivate/Activate — hidden for Super Admin accounts */}
                        {admin.role !== "SUPER_ADMIN" && (
                          <button
                            onClick={() => {
                              onToggleStatus(admin);
                              setActiveMenuId(null);
                            }}
                            className={`w-full px-3 py-1.5 hover:bg-slate-800 text-left transition flex items-center gap-2.5 cursor-pointer ${
                              admin.status === "ACTIVE" 
                                ? "text-rose-400 hover:text-rose-300" 
                                : "text-emerald-400 hover:text-emerald-300"
                            }`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            <span>{admin.status === "ACTIVE" ? "Deactivate" : "Activate"}</span>
                          </button>
                        )}
                        {/* Delete — hidden for Super Admin accounts */}
                        {admin.role !== "SUPER_ADMIN" && (
                          <button
                            onClick={() => {
                              onDeleteAdmin(admin);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-rose-500/10 text-rose-500 text-left transition flex items-center gap-2.5 cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete Admin</span>
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 text-[10px]">
          <span className="text-slate-500 font-bold">
            Showing {(pagination.currentPage - 1) * pagination.limit + 1}–
            {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-2.5 py-1.5 border border-[#1e293b] rounded-xl text-slate-400 hover:text-white disabled:opacity-40 transition cursor-pointer"
            >
              ‹ Previous
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pNum) => (
              <button
                key={pNum}
                onClick={() => onPageChange(pNum)}
                className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold transition cursor-pointer ${
                  pagination.currentPage === pNum
                    ? "bg-indigo-600 text-white"
                    : "border border-[#1e293b] text-slate-400 hover:text-white"
                }`}
              >
                {pNum}
              </button>
            ))}
            <button
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-2.5 py-1.5 border border-[#1e293b] rounded-xl text-slate-400 hover:text-white disabled:opacity-40 transition cursor-pointer"
            >
              Next ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
