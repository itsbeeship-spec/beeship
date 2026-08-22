"use client";

import SettingsSidebar from "@/components/settings/SettingsSidebar";

export default function SettingsLayout({ children }) {
  return (
    <div className="w-full flex gap-8 items-start animate-fadeIn font-sans">
      {/* Persistent Left Settings Sidebar */}
      <SettingsSidebar />

      {/* Right Content Panel — changes per route */}
      <div className="flex-1 bg-white border border-slate-200/80 rounded-3xl p-8 min-h-[500px]">
        {children}
      </div>
    </div>
  );
}
