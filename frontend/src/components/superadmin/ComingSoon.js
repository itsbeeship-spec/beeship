"use client";

export default function ComingSoon({ title, description, icon = "🚀", features = [] }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <div className="w-full max-w-md text-center">
        {/* Icon with glow */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 opacity-20 blur-xl" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-indigo-200">
            {icon}
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Under Development
        </div>

        {/* Title & Description */}
        <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
        {description && (
          <p className="text-sm text-slate-500 leading-relaxed mb-6">{description}</p>
        )}

        {/* Planned Features */}
        {features.length > 0 && (
          <div className="text-left bg-white border border-slate-100 rounded-2xl p-5 shadow-sm mt-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Planned Features
            </p>
            <ul className="space-y-2.5">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <svg className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
