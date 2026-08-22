"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import SectionLayout from "@/components/superadmin/SectionLayout";
import KYCDetailView from "@/components/superadmin/kyc/KYCDetailView";

const SECTION = {
  title: "KYC Management",
  icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-7 4h10m-7 4h3m-3 2h3" />
    </svg>
  ),
  description: "Verify seller identity documents and manage KYC approvals across the platform."
};

const TABS = [
  {
    id: "pending",
    label: "Pending Verification",
    href: "/superadmin/kyc/pending",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: "Review newly submitted KYC documents awaiting approval."
  },
  {
    id: "not-submitted",
    label: "Doc Not Submitted",
    href: "/superadmin/kyc/not-submitted",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    description: "Sellers who have not uploaded or submitted their KYC documents yet."
  },
  {
    id: "approved",
    label: "Approved",
    href: "/superadmin/kyc/approved",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
      </svg>
    ),
    description: "All sellers with verified KYC status."
  },
  {
    id: "rejected",
    label: "Rejected",
    href: "/superadmin/kyc/rejected",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    description: "Sellers whose KYC submission was rejected."
  },
];

export default function ApprovedKYCPage() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 100, counts: { PENDING: 0, APPROVED: 0, REJECTED: 0 } });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "" });
  const [selectedSeller, setSelectedSeller] = useState(null);

  const fetchApprovedList = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(page), limit: "100", status: "APPROVED" });
      if (filters.search) q.append("search", filters.search);
      const res = await api.get(`/admin/kyc/pending?${q.toString()}`);
      if (res && res.success) {
        setUsers(res.data || []);
        setMeta(res.meta || { total: 0, page: 1, limit: 100, counts: { PENDING: 0, APPROVED: 0, REJECTED: 0 } });
      }
    } catch (err) {
      console.error("Failed to load approved KYC list:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchApprovedList(1);
  }, [fetchApprovedList]);

  const mainContent = selectedSeller ? (
    <KYCDetailView
      seller={selectedSeller}
      onBack={() => setSelectedSeller(null)}
      onVerifySuccess={() => {
        setSelectedSeller(null);
        fetchApprovedList(1);
      }}
    />
  ) : (
    <div className="space-y-6">
      {/* Summary metrics header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        {[
          { label: "Pending",            val: meta.counts?.PENDING ?? 0,        color: "amber",   border: "border-amber-500/20 bg-amber-500/5 text-amber-400" },
          { label: "Doc Not Submitted",  val: meta.counts?.NOT_SUBMITTED ?? 0,  color: "indigo",  border: "border-indigo-500/20 bg-indigo-500/5 text-indigo-400" },
          { label: "Approved",           val: meta.counts?.APPROVED ?? 0,       color: "emerald", border: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" },
          { label: "Rejected",           val: meta.counts?.REJECTED ?? 0,       color: "rose",    border: "border-rose-500/20 bg-rose-500/5 text-rose-400" },
        ].map((item) => (
          <div key={item.label} className={`border rounded-xl p-4 flex flex-col justify-between h-20 ${item.border}`}>
            <p className="text-[10px] font-black uppercase tracking-wider opacity-85">{item.label}</p>
            <p className="text-2xl font-black">{item.val.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search approved sellers..."
            value={filters.search}
            onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
            className="w-full pl-9 pr-4 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#1e293b] rounded-xl overflow-hidden bg-[#070b19]/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1e293b]">
                {["Seller", "Company", "Email", "Status", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-xs text-slate-500">
                    No approved sellers found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-[#1e293b]/60 text-xs hover:bg-white/[0.01]">
                    <td className="px-4 py-3 font-bold text-white">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 text-slate-300">{u.companyName || "—"}</td>
                    <td className="px-4 py-3 text-slate-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wide">
                        Approved
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedSeller(u)}
                        className="px-3 py-1.5 bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 text-[10px] font-bold rounded-xl transition cursor-pointer"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <SectionLayout section={SECTION} tabs={TABS}>
      {mainContent}
    </SectionLayout>
  );
}
