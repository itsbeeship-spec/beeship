import SectionLayout from "../SectionLayout";
const SECTION = { title: "KYC Management", icon: "🪪", description: "Verify seller identity documents and manage KYC approvals across the platform." };
const TABS = [
  { id: "pending", label: "Pending Verification", href: "/superadmin/kyc/pending", icon: "⏳", description: "Review newly submitted KYC documents awaiting approval.", features: ["View Aadhaar, PAN, GST documents", "Approve or reject with reason", "Bulk approval workflow", "Send notification on status change"] },
  { id: "approved", label: "Approved", href: "/superadmin/kyc/approved", icon: "✅", description: "All sellers with verified KYC status.", features: ["Search approved sellers", "View approval date and officer", "Re-verify if document expires", "Export approved list"] },
  { id: "rejected", label: "Rejected", href: "/superadmin/kyc/rejected", icon: "❌", description: "Sellers whose KYC submission was rejected.", features: ["View rejection reason", "Allow seller to resubmit", "Track rejection history", "Send re-submission reminder"] },
  { id: "documents", label: "GST / PAN / Aadhaar", href: "/superadmin/kyc/documents", icon: "📄", description: "Document viewer and verification for all KYC submissions.", features: ["Secure document viewer", "Cross-verify with government APIs", "Flag suspicious documents", "Download document copies"] },
];
export default function KycManagement() { return <SectionLayout section={SECTION} tabs={TABS} />; }
