"use client";

import { useState } from "react";

export default function WebhookSettings() {
  const [webhookUrl, setWebhookUrl] = useState("https://api.mywebsite.com/shipments/callback");

  return (
    <div className="flex flex-col gap-6 animate-fadeIn font-sans">
      <div>
        <h3 className="text-base font-bold text-slate-900">Developer Webhooks</h3>
        <p className="text-xs text-slate-500 mt-1">Configure URLs that receive tracking notifications in real-time.</p>
      </div>

      <div className="border border-slate-150 rounded-2xl p-5 bg-white flex flex-col gap-4 shadow-sm">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payload Delivery URL</label>
          <input 
            type="text" 
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none font-mono" 
          />
          <span className="text-[9px] text-slate-400 leading-normal">
            We will POST updates about AWB tracking state changes (e.g. Dispatched, Out for Delivery, Delivered) to this URL.
          </span>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button className="bg-slate-900 hover:bg-slate-800 transition text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md">
            Save Webhook
          </button>
        </div>
      </div>
    </div>
  );
}
