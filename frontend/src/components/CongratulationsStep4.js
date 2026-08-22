"use client";

export default function CongratulationsStep4({ onNavigateToDashboard }) {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm w-full max-w-md flex flex-col gap-6 relative text-center">
      
      {/* Success Badge */}
      <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Titles */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-black tracking-wide text-slate-800">Congratulations!</h2>
        <p className="text-xs text-slate-500 leading-relaxed px-4">
          Your account has been created successfully. You&apos;re ready to explore all the features and grow your business with BeeShip.
        </p>
      </div>

      {/* Feature Badges list inside success card */}
      <div className="bg-slate-55 border border-slate-100 rounded-xl p-4 flex flex-col gap-3 text-left">
        {/* Row 1 */}
        <div className="flex gap-3">
          <span className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </span>
          <div>
            <span className="text-xs font-bold text-slate-700 block">Fast & Reliable Deliveries</span>
            <span className="text-[10px] text-slate-500">Deliver across 50,000+ PIN codes with ease.</span>
          </div>
        </div>
        
        {/* Row 2 */}
        <div className="flex gap-3">
          <span className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <div>
            <span className="text-xs font-bold text-slate-700 block">Compare & Choose Couriers</span>
            <span className="text-[10px] text-slate-500">Get the best rates and services for every shipment.</span>
          </div>
        </div>

        {/* Row 3 */}
        <div className="flex gap-3">
          <span className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2zm12-3V3a2 2 0 00-2-2h-2a2 2 0 00-2 2v13a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 00-2-2h-2a2 2 0 00-2 2v7a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
          </span>
          <div>
            <span className="text-xs font-bold text-slate-700 block">Real-time Tracking</span>
            <span className="text-[10px] text-slate-500">Stay updated at every step of the journey.</span>
          </div>
        </div>
      </div>

      <button
        onClick={onNavigateToDashboard}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold tracking-wide transition shadow-lg shadow-blue-600/10 cursor-pointer text-white flex items-center justify-center gap-1.5"
      >
        Go to Dashboard →
      </button>

      <div className="text-center pt-2 flex justify-center items-center gap-1">
        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span className="text-[10px] text-slate-450 font-medium">
          Secure, Reliable & Trusted by 10K+ Businesses
        </span>
      </div>
    </div>
  );
}
