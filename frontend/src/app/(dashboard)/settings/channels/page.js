"use client";
import dynamic from "next/dynamic";
import PageLoader from "@/components/PageLoader";
const ChannelsSettings = dynamic(() => import("@/components/settings/ChannelsSettings"), { loading: () => <PageLoader />, ssr: false });
export default function ChannelsPage() { return <ChannelsSettings />; }
