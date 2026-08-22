"use client";
import dynamic from "next/dynamic";
import PageLoader from "@/components/PageLoader";
const LabelSettings = dynamic(() => import("@/components/settings/LabelSettings"), { loading: () => <PageLoader />, ssr: false });
export default function LabelSettingsPage() { return <LabelSettings />; }
