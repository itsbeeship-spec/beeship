"use client";
import dynamic from "next/dynamic";
import PageLoader from "@/components/PageLoader";
const WebhookSettings = dynamic(() => import("@/components/settings/WebhookSettings"), { loading: () => <PageLoader />, ssr: false });
export default function WebhooksPage() { return <WebhookSettings />; }
