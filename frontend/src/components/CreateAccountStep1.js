import { useState } from "react";

export default function CreateAccountStep1({ 
  inputValue, 
  setInputValue, 
  onSubmit, 
  loading, 
  onSwitchToLogin,
  apiError,
  onClearApiError
}) {
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 10) {
      setInputValue(val);
      if (val.length === 10) {
        setError("");
      }
      if (onClearApiError) {
        onClearApiError();
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    onSubmit(e);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm w-full flex flex-col gap-6 relative">
      {/* Top Brand Circle */}
      <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>

      {/* Titles */}
      <div className="text-center flex flex-col gap-1.5">
        <h2 className="text-xl md:text-2xl font-black tracking-wide text-slate-800">Create your BeeShip account</h2>
        <p className="text-xs text-slate-500">Enter your mobile number to get started.</p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Mobile Number</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Enter 10-digit mobile number"
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              required
            />
          </div>
          {(error || apiError) && (
            <p className="text-[10px] text-red-500 font-semibold mt-1.5">{error || apiError}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded-xl text-xs font-bold tracking-wide transition shadow-lg shadow-blue-600/10 cursor-pointer text-white flex items-center justify-center gap-1.5"
        >
          {loading ? "Sending OTP..." : "Continue →"}
        </button>
      </form>

      {/* Switch to Login Link */}
      <div className="text-center border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">
          Already have an account?{" "}
          <button 
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:text-blue-500 font-semibold transition cursor-pointer"
          >
            Sign in
          </button>
        </p>
      </div>

      {/* Trust Metrics Footers */}
      <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-4 mt-2">
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span>No Credit Card<br />Required</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span>Setup in Under<br />2 Minutes</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <span>Trusted by<br />Growing Brands</span>
        </div>
      </div>
    </div>
  );
}
