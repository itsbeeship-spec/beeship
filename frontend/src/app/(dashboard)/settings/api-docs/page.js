"use client";
import dynamic from "next/dynamic";
import PageLoader from "@/components/PageLoader";
const ApiDocSettings = dynamic(() => import("@/components/settings/ApiDocSettings"), { loading: () => <PageLoader />, ssr: false });
export default function ApiDocsPage() { return <ApiDocSettings />; }
