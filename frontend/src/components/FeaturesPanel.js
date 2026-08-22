export default function FeaturesPanel() {
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Feature 1 */}
      <div className="flex gap-4 p-4 bg-white/40 border border-slate-100 rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h5 className="text-sm font-bold text-slate-800">Fast & Reliable</h5>
          <p className="text-xs text-slate-500 mt-0.5">Quick deliveries across 50,000+ pin codes.</p>
        </div>
      </div>

      {/* Feature 2 */}
      <div className="flex gap-4 p-4 bg-white/40 border border-slate-100 rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h5 className="text-sm font-bold text-slate-800">Multiple Couriers</h5>
          <p className="text-xs text-slate-500 mt-0.5">Compare rates and choose the best courier.</p>
        </div>
      </div>

      {/* Feature 3 */}
      <div className="flex gap-4 p-4 bg-white/40 border border-slate-100 rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2zm12-3V3a2 2 0 00-2-2h-2a2 2 0 00-2 2v13a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 00-2-2h-2a2 2 0 00-2 2v7a2 2 0 002 2h2a2 2 0 002-2z" />
          </svg>
        </div>
        <div>
          <h5 className="text-sm font-bold text-slate-800">Real-time Tracking</h5>
          <p className="text-xs text-slate-500 mt-0.5">Live updates for every shipment.</p>
        </div>
      </div>
    </div>
  );
}
