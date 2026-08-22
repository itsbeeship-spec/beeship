"use client";

import dynamic from "next/dynamic";
import PageLoader from "@/components/PageLoader";

const NdrView = dynamic(() => import("@/components/NdrView"), {
  loading: () => <PageLoader />,
  ssr: false,
});

export default function NdrPage() {
  return <NdrView />;
}
