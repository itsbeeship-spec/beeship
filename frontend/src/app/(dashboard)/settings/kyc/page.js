"use client";

import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import PageLoader from "@/components/PageLoader";

const KycSettings = dynamic(() => import("@/components/settings/KycSettings"), {
  loading: () => <PageLoader />,
  ssr: false,
});

export default function KycPage() {
  const { user, fetchUserProfile } = useAuth();
  return <KycSettings user={user} fetchUserProfile={fetchUserProfile} />;
}
