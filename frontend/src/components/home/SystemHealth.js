"use client";
import { BACKEND_URL } from "@/lib/config";

export default function SystemHealth({ health, fetchHealth, loadingHealth }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between font-sans select-none">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800 tracking-wide">System Health</h2>
          <button 
            type="button"
            onClick={fetchHealth} 
            disabled={loadingHealth}
            className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded-lg font-medium transition cursor-pointer text-white animate-fadeIn"
          >
            {loadingHealth ? "Syncing..." : "Refresh"}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Express API Server Status */}
          <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-455 font-bold uppercase tracking-wider">Express Server</p>
              <p className="text-sm font-semibold text-slate-700">{BACKEND_URL}</p>

            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
              health?.services?.server === "healthy" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
            }`}>
              {health?.services?.server === "healthy" ? "Online" : "Offline"}
            </span>
          </div>

          {/* Database Status */}
          <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-455 font-bold uppercase tracking-wider">PostgreSQL DB (Prisma)</p>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[180px]">
                {health?.services?.database === "connected" ? "Connection ready" : "Not connected"}
              </p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
              health?.services?.database === "connected" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
            }`}>
              {health?.services?.database === "connected" ? "Connected" : "Offline"}
            </span>
          </div>

          {/* Redis Caching Status */}
          <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-455 font-bold uppercase tracking-wider">Redis Cache (ioredis)</p>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[180px]">
                {health?.services?.cache === "connected" ? "Cache ready" : "No active cache"}
              </p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
              health?.services?.cache === "connected" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
            }`}>
              {health?.services?.cache === "connected" ? "Active" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-xs text-slate-505 bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-start gap-2">
        <svg className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span><span className="font-semibold text-slate-650">Strict Rate Limits Active:</span> Max 100 requests / 15 mins for general APIs and 20 write attempts / 15 mins for auth.</span>
      </div>
    </div>
  );
}
