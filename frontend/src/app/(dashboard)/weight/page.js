"use client";

import dynamic from "next/dynamic";
import PageLoader from "@/components/PageLoader";

const WeightView = dynamic(() => import("@/components/WeightView"), {
  loading: () => <PageLoader />,
  ssr: false,
});

export default function WeightPage() {
  return <WeightView />;
}
