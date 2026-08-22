"use client";

import { useState } from "react";

export default function LoginWidget({
  loginIdentifier,
  setLoginIdentifier,
  loginPassword,
  setLoginPassword,
  loginError,
  loadingLogin,
  onSubmit,
  onSwitchToSignup,
  onForgotPassword
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm w-full flex flex-col gap-6 relative animate-fadeIn">
      {/* Circle Icon */}
      <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-2-2m2 2l2-2m-2 2v-3m0 9a9 9 0 110-18 9 9 0 010 18z" />
        </svg>
      </div>

      {/* Title */}
      <div className="text-center flex flex-col gap-1.5">
        <h2 className="text-xl md:text-2xl font-black tracking-wide text-slate-800">Sign in to your account</h2>
        <p className="text-xs text-slate-500">Welcome back! Please enter your credentials to access your dashboard.</p>
      </div>

      {loginError && (
        <div className="p-3 bg-rose-50 border border-rose-100 text-xs text-rose-600 rounded-lg flex items-start gap-2 animate-fadeIn">
          <svg className="w-4 h-4 text-rose-550 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{loginError}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Mobile / Email Address</label>
          <input
            type="text"
            value={loginIdentifier}
            onChange={(e) => setLoginIdentifier(e.target.value)}
            placeholder="Enter mobile or email"
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Password</label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-[10px] text-blue-600 hover:text-blue-500 font-semibold transition cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition select-none"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a8.962 8.962 0 012.122-.195c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loadingLogin}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded-xl text-xs font-bold tracking-wide transition shadow-lg shadow-blue-600/10 cursor-pointer mt-2 text-white"
        >
          {loadingLogin ? "Signing in..." : "Sign In"}
        </button>
      </form>
      
      {/* Switch Link */}
      <div className="text-center border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <button 
            type="button"
            onClick={onSwitchToSignup}
            className="text-blue-600 hover:text-blue-500 font-semibold transition cursor-pointer"
          >
            Create account
          </button>
        </p>
      </div>
    </div>
  );
}
