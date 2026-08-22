"use client";

import dynamic from "next/dynamic";
import PageLoader from "@/components/PageLoader";

const ManifestView = dynamic(() => import("@/components/ManifestView"), {
  loading: () => <PageLoader />,
  ssr: false,
});

export default function ManifestPage() {
  return <ManifestView />;
}
