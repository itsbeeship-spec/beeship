import React from "react";

export default function AdminMetrics({ metrics = {} }) {
  const list = [
    {
      label: "Total Admins",
      value: metrics.totalAdmins ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      colorClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    },
    {
      label: "Active",
      value: metrics.activeAdmins ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      label: "Inactive",
      value: metrics.inactiveAdmins ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    },
    {
      label: "Logged In",
      value: metrics.loggedInAdmins ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
      ),
      colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {list.map((item) => (
        <div
          key={item.label}
          className="bg-[#0d1527] border border-[#1e293b]/70 rounded-2xl p-4.5 shadow-sm hover:shadow-md hover:border-indigo-500/30 transition duration-200 flex items-center justify-between"
        >
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {item.label}
            </span>
            <h3 className="text-xl font-extrabold text-white">{item.value}</h3>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.colorClass}`}>
            {item.icon}
          </div>
        </div>
      ))}
    </div>
  );
}
