"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import FeaturesPanel from "@/components/FeaturesPanel";
import TrackOrderWidget from "@/components/TrackOrderWidget";
import SecurityMatrix from "@/components/SecurityMatrix";

export default function AuthLayout({ children }) {
  const { user, sessionChecking } = useAuth();
  const router = useRouter();

  // If session is active, redirect to appropriate dashboard based on role
  useEffect(() => {
    if (!sessionChecking && user) {
      if (user.role === "SUPER_ADMIN" || user.role?.toUpperCase()?.includes("ADMIN")) {
        router.replace("/superadmin/dashboard");
      } else if (user.role === "SUPPORT") {
        router.replace("/orders");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [sessionChecking, user, router]);

  // Show spinner while checking session
  if (sessionChecking) {
    return (
      <div className="min-h-screen bg-[#f4f6fc] flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4 animate-fadeIn">
          <img src="/Companye Logo.png" alt="BeeShip" className="h-10 animate-pulse object-contain" />
          <div className="w-8 h-8 border-4 border-[#2b7fff] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Checking session...</p>
        </div>
      </div>
    );
  }

  // Already logged in — hide until redirect fires
  if (user) return null;

  return (
    <div className="min-h-screen bg-[#f4f6fc] text-slate-800 flex flex-col font-sans select-none selection:bg-blue-500 selection:text-white relative">
      {/* Background glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-400/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-400/5 blur-[140px] rounded-full pointer-events-none" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 relative z-10">
        {/* Header with Logo */}
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/Companye Logo.png" alt="BeeShip Logo" className="h-9 object-contain" />
          </div>
        </header>

        {/* Split Layout: Marketing Left + Auth Right (children) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Branding & marketing panels */}
          <div className="lg:col-span-7 flex flex-col gap-8 order-2 lg:order-1">
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Ship smarter
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Grow faster.</span>
              </h1>
              <p className="text-sm text-slate-500 max-w-lg leading-relaxed">
                Everything you need to manage shipments, compare couriers and grow your business. Connect multiple channels and get live updates.
              </p>
            </div>
            <FeaturesPanel />
            <TrackOrderWidget />
          </div>

          {/* Right: Auth form (children slot) */}
          <div className="lg:col-span-5 flex justify-center w-full order-1 lg:order-2">
            {children}
          </div>
        </div>

        <SecurityMatrix />
      </main>
    </div>
  );
}
