export default function SecurityMatrix() {
  return (
    <div className="mt-8 border border-slate-200/50 bg-white/40 rounded-3xl p-8">
      <h3 className="text-lg font-bold mb-4 tracking-wide text-slate-800">Security Architecture Matrix</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col gap-1.5">
          <span className="text-blue-600 font-bold flex items-center gap-1.5">
            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Auth & Hashing
          </span>
          <p className="text-slate-500 text-xs leading-relaxed">
            Passwords salted (10 rounds) and hashed using bcryptjs. User sessions authorized via signed JSON Web Tokens (JWT).
          </p>
        </div>
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col gap-1.5">
          <span className="text-blue-600 font-bold flex items-center gap-1.5">
            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Zod Shielding
          </span>
          <p className="text-slate-500 text-xs leading-relaxed">
            Guards all API endpoints with strict validation rules. Filters unknown params, restricts MIME types, and prevents buffer overflow data sizes.
          </p>
        </div>
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col gap-1.5">
          <span className="text-blue-600 font-bold flex items-center gap-1.5">
            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Rate Limiting
          </span>
          <p className="text-slate-500 text-xs leading-relaxed">
            Protects routes against automated scanning and DDoS abuse. Fallbacks gracefully if the Redis cache rate-limit store is down.
          </p>
        </div>
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col gap-1.5">
          <span className="text-blue-600 font-bold flex items-center gap-1.5">
            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            Header Hardening
          </span>
          <p className="text-slate-500 text-xs leading-relaxed">
            Strict Content-Security-Policy (CSP) maps loaded dynamically inside Next.js and Express to block XSS, clickjacking, and script injections.
          </p>
        </div>
      </div>
    </div>
  );
}
