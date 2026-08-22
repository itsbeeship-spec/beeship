"use client";

import { useState } from "react";

export default function VerifyRecoveryOtpStep2({ 
  mobileOrEmail, 
  onVerify, 
  onResend, 
  onBack,
  loading 
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("OTP must be exactly 6 digits.");
      return;
    }

    onVerify(code);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm w-full flex flex-col gap-6 relative">
      
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 transition text-xs font-semibold cursor-pointer"
      >
        ← Back
      </button>

      {/* Circle Icon */}
      <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mt-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>

      {/* Titles */}
      <div className="text-center flex flex-col gap-1.5">
        <h2 className="text-xl md:text-2xl font-black tracking-wide text-slate-800">Verify OTP</h2>
        <p className="text-xs text-slate-500 leading-relaxed px-4">
          Please enter the 6-digit password reset OTP sent to <br />
          <span className="font-semibold text-slate-700">{mobileOrEmail}</span>
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose border border-rose-105 text-xs text-rose-600 rounded-lg flex items-start gap-2 animate-fadeIn">
          <svg className="w-4 h-4 text-rose-550 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-[10px] text-slate-555 font-bold uppercase tracking-wider block mb-1.5 text-center">6-Digit OTP</label>
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="• • • • • •"
            className="w-full bg-white border border-slate-200 rounded-xl py-3 text-center text-lg tracking-[0.6em] font-extrabold text-blue-600 placeholder-slate-350 focus:outline-none focus:border-blue-500 transition"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded-xl text-xs font-bold tracking-wide transition shadow-lg shadow-blue-600/10 cursor-pointer text-white flex items-center justify-center gap-1"
        >
          {loading ? "Verifying..." : "Verify OTP →"}
        </button>
      </form>

      {/* Resend Helper */}
      <div className="text-center border-t border-slate-100 pt-4 flex flex-col gap-1 text-xs">
        <p className="text-slate-550">Didn&apos;t receive the code?</p>
        <button 
          onClick={onResend}
          className="text-blue-600 hover:text-blue-500 font-semibold transition cursor-pointer"
        >
          Resend OTP
        </button>
      </div>

      <div className="text-[10px] text-slate-400 text-center italic flex items-center justify-center gap-1.5 mt-2">
        <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span>Check your backend server console logs to retrieve the OTP!</span>
      </div>
    </div>
  );
}
