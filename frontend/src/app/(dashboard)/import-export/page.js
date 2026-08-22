"use client";

import dynamic from "next/dynamic";
import PageLoader from "@/components/PageLoader";

const ImportExportView = dynamic(() => import("@/components/ImportExportView"), {
  loading: () => <PageLoader />,
  ssr: false,
});

export default function ImportExportPage() {
  return <ImportExportView />;
}
