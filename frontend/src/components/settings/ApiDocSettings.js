"use client";

import { useState } from "react";

export default function ApiDocSettings() {
  const [token, setToken] = useState("besh_live_9a7c3b2e5f1d8c0b4a6e8f9d0c2b");
  const [showToken, setShowToken] = useState(false);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn font-sans">
      <div>
        <h3 className="text-base font-bold text-slate-900">Developer API Keys & Docs</h3>
        <p className="text-xs text-slate-500 mt-1">Integrate BeeShip shipping APIs directly into your custom ERP or websites.</p>
      </div>

      <div className="border border-slate-150 rounded-2xl p-5 bg-white flex flex-col gap-5 shadow-sm">
        {/* API Token Box */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Client Authorization Token</label>
          <div className="flex gap-2">
            <input 
              type={showToken ? "text" : "password"} 
              readOnly 
              value={token}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none font-mono" 
            />
            <button 
              onClick={() => setShowToken(!showToken)}
              className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 font-bold text-[10px] transition shrink-0"
            >
              {showToken ? "Hide" : "Show"}
            </button>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(token);
                alert("API Client Token copied to clipboard!");
              }}
              className="px-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold text-[10px] transition shrink-0"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Documentation Links */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Integrations SDK & Docs</label>
          <div className="flex flex-col gap-2.5">
            <a href="#" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1.5">
              <span>📖 API Endpoint References (Postman Collection)</span>
            </a>
            <a href="#" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1.5">
              <span>📦 Node.js SDK Library (npm package)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
