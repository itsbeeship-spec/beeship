"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminRatesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/superadmin/pricing/default-rate-cards");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#070b19] flex items-center justify-center text-slate-300 font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Redirecting to SuperAdmin Rates Manager...</p>
      </div>
    </div>
  );
}
