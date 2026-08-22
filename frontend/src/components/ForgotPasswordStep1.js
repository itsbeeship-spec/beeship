"use client";

import { useState } from "react";

export default function ForgotPasswordStep1({ 
  onSubmit, 
  onBackToLogin, 
  loading 
}) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!inputValue.trim()) return;

    try {
      await onSubmit(inputValue);
    } catch (err) {
      setError(err.message || "Request failed.");
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm w-full flex flex-col gap-6 relative">
      {/* Circle Icon */}
      <div className="mx-auto w-12 h-12 rounded-full bg-blue-550/10 border border-blue-100 flex items-center justify-center text-blue-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>

      {/* Titles */}
      <div className="text-center flex flex-col gap-1.5">
        <h2 className="text-xl md:text-2xl font-black tracking-wide text-slate-800">Forgot Password?</h2>
        <p className="text-xs text-slate-500 px-2 leading-relaxed">
          Enter your registered mobile number or email address to receive an OTP and reset your password.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-100 text-xs text-rose-600 rounded-lg flex items-start gap-2 animate-fadeIn">
          <svg className="w-4 h-4 text-rose-550 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Mobile Number / Email Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter mobile number or email address"
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded-xl text-xs font-bold tracking-wide transition shadow-lg shadow-blue-600/10 cursor-pointer text-white flex items-center justify-center gap-1.5"
        >
          {loading ? "Sending OTP..." : "Get OTP →"}
        </button>
      </form>

      {/* Switch to Login Link */}
      <div className="text-center border-t border-slate-100 pt-4">
        <button 
          onClick={onBackToLogin}
          className="text-xs text-blue-600 hover:text-blue-500 font-semibold transition cursor-pointer"
        >
          ← Back to Sign In
        </button>
      </div>

      <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5 font-medium">
        <svg className="w-3.5 h-3.5 text-slate-450 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Secure & encrypted. Your data is safe with us.</span>
      </p>
    </div>
  );
}
