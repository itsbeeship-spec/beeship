"use client";

import { useAuth } from "@/context/AuthContext";

export default function Toast() {
  const { toast } = useAuth();
  if (!toast) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border animate-slideDown text-xs font-semibold ${
        toast.type === "info"
          ? "bg-blue-50 border-blue-100 text-blue-700"
          : toast.type === "error"
          ? "bg-rose-50 border-rose-100 text-rose-700"
          : toast.type === "warning"
          ? "bg-amber-50 border-amber-100 text-amber-700"
          : "bg-emerald-50 border-emerald-100 text-emerald-700"
      }`}
    >
      {toast.type === "info" ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : toast.type === "error" ? (
        <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ) : toast.type === "warning" ? (
        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01M12 5v2m0 4h.01" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
      )}
      {toast.message}
    </div>
  );
}
