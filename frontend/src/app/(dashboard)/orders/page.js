"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import PageLoader from "@/components/PageLoader";

// Lazy-load OrderView — it's 63KB + imports 120KB+ of modal code
const OrderView = dynamic(() => import("@/components/OrderView"), {
  loading: () => <PageLoader />,
  ssr: false,
});

function OrdersPageInner() {
  const { user, showToast } = useAuth();
  return <OrderView user={user} showToast={showToast} />;
}

// IMPORTANT: useSearchParams() inside OrderView requires a Suspense boundary
// Without this, Next.js App Router throws on production (Vercel) causing page lock
export default function OrdersPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <OrdersPageInner />
    </Suspense>
  );
}
