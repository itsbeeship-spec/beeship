"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";

// ── Severity Badge ─────────────────────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const map = {
    INFO:     { cls: "bg-blue-500/15 text-blue-400 border-blue-500/20",     label: "Info" },
    WARNING:  { cls: "bg-amber-500/15 text-amber-400 border-amber-500/20",  label: "Warning" },
    CRITICAL: { cls: "bg-rose-500/15 text-rose-400 border-rose-500/20",     label: "Critical" },
    FAILED:   { cls: "bg-red-900/30 text-red-400 border-red-500/30",        label: "Failed" },
  };
  const s = map[severity] || map.INFO;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold border ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ── Module Badge ───────────────────────────────────────────────────────────────
function ModuleBadge({ module }) {
  const colors = {
    Orders:    "bg-blue-500/10 text-blue-400",
    KYC:       "bg-amber-500/10 text-amber-400",
    Wallet:    "bg-emerald-500/10 text-emerald-400",
    Sellers:   "bg-purple-500/10 text-purple-400",
    Admins:    "bg-indigo-500/10 text-indigo-400",
    Shipments: "bg-sky-500/10 text-sky-400",
  };
  const cls = colors[module] || "bg-slate-500/10 text-slate-400";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold ${cls}`}>
      {module}
    </span>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }) {
  const colors = {
    indigo:  { bg: "bg-indigo-500/10",  border: "border-indigo-500/20",  text: "text-indigo-400",  icon: "bg-indigo-500/20" },
    blue:    { bg: "bg-blue-500/10",    border: "border-blue-500/20",    text: "text-blue-400",    icon: "bg-blue-500/20" },
    rose:    { bg: "bg-rose-500/10",    border: "border-rose-500/20",    text: "text-rose-400",    icon: "bg-rose-500/20" },
    red:     { bg: "bg-red-900/15",     border: "border-red-500/20",     text: "text-red-400",     icon: "bg-red-500/20" },
  };
  const c = colors[color] || colors.indigo;
  return (
    <div className={`rounded-2xl border p-4 flex items-center gap-3 ${c.bg} ${c.border}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.icon}`}>
        <span className={c.text}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
        <p className={`text-xl font-black mt-0.5 ${c.text}`}>{value ?? "—"}</p>
      </div>
    </div>
  );
}

// ── Custom Select (Rounded Dropdown Menus) ────────────────────────────────────
function CustomSelect({ value, onChange, placeholder, options }) {
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
        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="w-full text-left px-3 py-1.5 hover:bg-slate-800 transition text-slate-400 cursor-pointer"
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
              className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 transition cursor-pointer ${
                opt.value === value ? "text-indigo-400 bg-indigo-500/5 font-semibold" : "text-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Detail Panel ───────────────────────────────────────────────────────────────
function DetailPanel({ log, onClose }) {
  if (!log) return null;

  const date = new Date(log.createdAt);
  const formatted = date.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="w-full max-w-md bg-[#0b1120] border-l border-[#1e293b] h-full overflow-y-auto flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#1e293b] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-black text-white">Activity Details</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">{log.id?.slice(0, 8)}...</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Severity Banner */}
        <div className={`mx-6 mt-5 px-4 py-3 rounded-xl border flex items-center gap-2 ${
          log.severity === "CRITICAL" ? "bg-rose-500/10 border-rose-500/30" :
          log.severity === "FAILED"   ? "bg-red-900/20 border-red-500/30" :
          log.severity === "WARNING"  ? "bg-amber-500/10 border-amber-500/30" :
                                         "bg-blue-500/10 border-blue-500/30"
        }`}>
          <SeverityBadge severity={log.severity} />
          <span className="text-xs font-bold text-white">{log.action}</span>
        </div>

        {/* Details */}
        <div className="px-6 py-5 space-y-4 flex-1">
          {/* Who */}
          <div className="bg-[#080d1a] border border-[#1e293b] rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Performed By</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {log.adminName?.[0]}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{log.adminName}</p>
                <p className="text-[10px] text-slate-400">{log.admin?.email}</p>
              </div>
            </div>
            <DetailRow label="Role"     value={log.adminRole} />
          </div>

          {/* Action */}
          <div className="bg-[#080d1a] border border-[#1e293b] rounded-2xl p-4 space-y-2.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action Info</p>
            <DetailRow label="Module"     value={<ModuleBadge module={log.module} />} />
            <DetailRow label="Action"     value={log.action} />
            <DetailRow label="Target"     value={log.targetLabel || log.targetId || "—"} />
            <DetailRow label="Date & Time" value={formatted} />
          </div>

          {/* Description */}
          {log.description && (
            <div className="bg-[#080d1a] border border-[#1e293b] rounded-2xl p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description</p>
              <p className="text-xs text-slate-300 leading-relaxed">{log.description}</p>
            </div>
          )}

          {/* Changes */}
          {log.changes && (
            <div className="bg-[#080d1a] border border-[#1e293b] rounded-2xl p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Changes</p>
              <div className="space-y-2">
                {Object.entries(log.changes.old || {}).map(([key, oldVal]) => {
                  const newVal = log.changes.new?.[key];
                  return (
                    <div key={key} className="flex items-center gap-2 text-[11px]">
                      <span className="text-slate-400 min-w-[80px] capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-mono">{String(oldVal)}</span>
                      <svg className="w-3 h-3 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono">{String(newVal)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Technical */}
          {(log.ipAddress || log.userAgent) && (
            <div className="bg-[#080d1a] border border-[#1e293b] rounded-2xl p-4 space-y-2.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Technical Info</p>
              {log.ipAddress && <DetailRow label="IP Address" value={log.ipAddress} mono />}
              {log.userAgent && <DetailRow label="Device"     value={log.userAgent} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div className="flex items-start gap-2 justify-between">
      <span className="text-[10px] text-slate-500 font-semibold shrink-0">{label}</span>
      <span className={`text-[11px] text-slate-200 text-right ${mono ? "font-mono text-[10px]" : ""}`}>{value}</span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ActivityLogsPage() {
  const [logs,       setLogs]       = useState([]);
  const [stats,      setStats]      = useState({ total: 0, today: 0, critical: 0, failed: 0 });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0, limit: 20 });
  const [loading,    setLoading]    = useState(true);
  const [filters,    setFilters]    = useState({ search: "", module: "", action: "", severity: "", adminId: "", startDate: "", endDate: "" });
  const [filterOpts, setFilterOpts] = useState({ modules: [], actions: [], admins: [] });
  const [selectedLog, setSelectedLog] = useState(null);
  const [exporting,  setExporting]  = useState(false);
  const searchTimeout = useRef(null);

  // Load filter options once
  useEffect(() => {
    api.get("/admin/activity-logs/filters")
      .then((res) => setFilterOpts({
        modules: res?.modules || [],
        actions: res?.actions || [],
        admins:  res?.admins  || [],
      }))
      .catch(() => {});
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({ page: String(page), limit: "20" });
      Object.entries(filters).forEach(([k, v]) => {
        if (v) queryParams.append(k, String(v));
      });

      const res = await api.get(`/admin/activity-logs?${queryParams.toString()}`);
      if (res) {
        setLogs(res.logs || []);
        setPagination(res.pagination || { currentPage: 1, totalPages: 1, totalCount: 0, limit: 20 });
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  // Search debounce
  const handleSearch = (val) => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: val }));
    }, 400);
  };

  // Export CSV
  const handleExport = async () => {
    setExporting(true);
    try {
      const queryParams = new URLSearchParams({ limit: "10000" });
      Object.entries(filters).forEach(([k, v]) => {
        if (v) queryParams.append(k, String(v));
      });

      const res = await api.get(`/admin/activity-logs?${queryParams.toString()}`);
      const rows = res?.logs || [];
      const header = ["Date", "Admin", "Role", "Module", "Action", "Target", "Severity", "Description"];
      const csv = [
        header.join(","),
        ...rows.map((r) => [
          new Date(r.createdAt).toLocaleString("en-IN"),
          r.adminName,
          r.adminRole,
          r.module,
          r.action,
          r.targetLabel || r.targetId || "",
          r.severity,
          (r.description || "").replace(/,/g, " "),
        ].map((v) => `"${v}"`).join(",")),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `activity-logs-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white">Activity Logs</h1>
          <p className="text-slate-400 text-xs mt-1">Track all important actions performed by admins across the platform.</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition disabled:opacity-60 cursor-pointer shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {exporting ? "Exporting..." : "Export Logs"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Logs" value={stats?.total?.toLocaleString() ?? "0"} color="indigo" icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        } />
        <StatCard label="Today" value={stats?.today?.toLocaleString() ?? "0"} color="blue" icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        } />
        <StatCard label="Critical" value={stats?.critical?.toLocaleString() ?? "0"} color="rose" icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        } />
        <StatCard label="Failed" value={stats?.failed?.toLocaleString() ?? "0"} color="red" icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        } />
      </div>

      {/* Filters */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search admin, action, target..."
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <CustomSelect
          value={filters.adminId}
          onChange={(v) => setFilters((p) => ({ ...p, adminId: v }))}
          placeholder="All Admins"
          options={(filterOpts.admins || []).map((a) => ({ value: a.id, label: a.name }))}
        />
        <CustomSelect
          value={filters.module}
          onChange={(v) => setFilters((p) => ({ ...p, module: v }))}
          placeholder="All Modules"
          options={(filterOpts.modules || []).map((m) => ({ value: m, label: m }))}
        />
        <CustomSelect
          value={filters.severity}
          onChange={(v) => setFilters((p) => ({ ...p, severity: v }))}
          placeholder="All Severity"
          options={[
            { value: "INFO",     label: "Info" },
            { value: "WARNING",  label: "Warning" },
            { value: "CRITICAL", label: "Critical" },
            { value: "FAILED",   label: "Failed" },
          ]}
        />
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))}
          className="px-3 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))}
          className="px-3 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
        />
        {/* Clear Filters */}
        {Object.values(filters).some(Boolean) && (
          <button
            onClick={() => setFilters({ search: "", module: "", action: "", severity: "", adminId: "", startDate: "", endDate: "" })}
            className="px-3 py-2 text-[11px] text-slate-400 hover:text-white border border-[#1e293b] rounded-xl transition cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#0b1120] border border-[#1e293b] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1e293b]">
                {["Date & Time", "Admin", "Role", "Module", "Action", "Target", "Severity", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-slate-500">Loading logs...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm font-bold text-slate-500">No logs found</p>
                      <p className="text-xs text-slate-600">Activity will appear here as admins perform actions</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => {
                  const { date, time } = formatDate(log.createdAt);
                  const initials = log.adminName?.split(" ").map((n) => n[0]).join("").slice(0, 2);
                  return (
                    <tr
                      key={log.id}
                      className={`border-b border-[#1e293b]/60 hover:bg-white/[0.02] transition-colors group ${
                        idx % 2 === 0 ? "" : "bg-white/[0.01]"
                      }`}
                    >
                      {/* Date & Time */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-[11px] font-semibold text-white">{date}</p>
                        <p className="text-[10px] text-slate-500">{time}</p>
                      </td>
                      {/* Admin */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-[9px] shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold text-white whitespace-nowrap">{log.adminName}</p>
                            <p className="text-[9px] text-slate-500">{log.admin?.email}</p>
                          </div>
                        </div>
                      </td>
                      {/* Role */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-[10px] text-slate-400">{log.adminRole}</p>
                      </td>
                      {/* Module */}
                      <td className="px-4 py-3">
                        <ModuleBadge module={log.module} />
                      </td>
                      {/* Action */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-[11px] text-slate-200 font-medium">{log.action}</p>
                      </td>
                      {/* Target */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-[11px] font-mono text-slate-400">{log.targetLabel || log.targetId || "—"}</p>
                      </td>
                      {/* Severity */}
                      <td className="px-4 py-3">
                        <SeverityBadge severity={log.severity} />
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                          title="View Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1e293b]">
            <p className="text-[10px] text-slate-500 font-semibold">
              Showing {(pagination.currentPage - 1) * pagination.limit + 1}–
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount.toLocaleString()}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fetchLogs(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-2.5 py-1.5 border border-[#1e293b] rounded-xl text-[10px] text-slate-400 hover:text-white disabled:opacity-40 transition cursor-pointer"
              >
                ‹ Previous
              </button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                const start = Math.max(1, pagination.currentPage - 2);
                const pNum  = start + i;
                if (pNum > pagination.totalPages) return null;
                return (
                  <button
                    key={pNum}
                    onClick={() => fetchLogs(pNum)}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-bold transition cursor-pointer ${
                      pagination.currentPage === pNum
                        ? "bg-indigo-600 text-white"
                        : "border border-[#1e293b] text-slate-400 hover:text-white"
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}
              <button
                onClick={() => fetchLogs(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-2.5 py-1.5 border border-[#1e293b] rounded-xl text-[10px] text-slate-400 hover:text-white disabled:opacity-40 transition cursor-pointer"
              >
                Next ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Slide Panel */}
      {selectedLog && <DetailPanel log={selectedLog} onClose={() => setSelectedLog(null)} />}

      <style jsx global>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}
