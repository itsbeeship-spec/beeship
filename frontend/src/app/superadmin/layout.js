"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SuperAdminSidebar from "@/components/superadmin/SuperAdminSidebar";

function SuperAdminShell({ children }) {
  const { user, sessionChecking } = useAuth();
  const router = useRouter();

  // A helper to check if user is any kind of admin
  const isAdminRole = (role) => role === "SUPER_ADMIN" || role?.toUpperCase()?.includes("ADMIN");

  // Guard: Only SUPER_ADMIN (or other admin roles) can access this layout
  useEffect(() => {
    if (!sessionChecking && !user) {
      router.replace("/login");
    } else if (!sessionChecking && user && !isAdminRole(user.role)) {
      router.replace("/dashboard");
    }
  }, [sessionChecking, user, router]);

  if (sessionChecking) {
    return (
      <div className="min-h-screen bg-[#0a0f2c] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/Companye Logo.png"
            alt="BeeShip"
            className="h-10 animate-pulse object-contain"
          />
          <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-white/50 font-medium">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdminRole(user.role)) return null;

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen bg-[#070b19] text-slate-100">
      <SuperAdminSidebar />
      <main className="flex-1 flex flex-col overflow-hidden min-h-screen bg-[#070b19]">
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto font-sans">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function SuperAdminLayout({ children }) {
  return <SuperAdminShell>{children}</SuperAdminShell>;
}
