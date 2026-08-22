"use client";

/**
 * PageLoader — Shared skeleton used as the `loading` fallback
 * for all next/dynamic lazy-loaded page components.
 */
export default function PageLoader() {
  return (
    <div className="w-full flex flex-col gap-6 animate-pulse">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-48 bg-slate-200 rounded-xl" />
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-slate-200 rounded-xl" />
          <div className="h-8 w-24 bg-slate-200 rounded-xl" />
        </div>
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
        ))}
      </div>
      {/* Table header */}
      <div className="h-10 bg-slate-200 rounded-xl" />
      {/* Table rows */}
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-14 bg-slate-100 rounded-xl" />
      ))}
    </div>
  );
}
