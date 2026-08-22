import SectionLayout from "../SectionLayout";
const SECTION = { title: "Subscription Plans", icon: "📋", description: "Design and manage seller subscription tiers, features, trials and renewals." };
const TABS = [
  { id: "list", label: "Plans", href: "/superadmin/plans/list", icon: "📋", description: "All subscription plans available to sellers.", features: ["Create and edit plan tiers", "Set monthly and annual pricing", "Publish or unpublish plans", "View subscribers per plan"] },
  { id: "features", label: "Features", href: "/superadmin/plans/features", icon: "✨", description: "Define features and limits per subscription tier.", features: ["Set order and shipment limits", "Enable/disable courier access", "Configure API rate limits", "Feature flag management"] },
  { id: "trial", label: "Trial", href: "/superadmin/plans/trial", icon: "🆓", description: "Manage free trial periods for new sellers.", features: ["Set trial duration", "Extend trials for specific sellers", "Track trial-to-paid conversion", "Auto-email on trial expiry"] },
  { id: "upgrade", label: "Upgrade", href: "/superadmin/plans/upgrade", icon: "⬆️", description: "View and manage seller plan upgrades.", features: ["Upgrade seller plan manually", "Pro-rated billing calculation", "Upgrade confirmation workflow", "Notify seller on upgrade"] },
  { id: "downgrade", label: "Downgrade", href: "/superadmin/plans/downgrade", icon: "⬇️", description: "Manage plan downgrades with grace periods.", features: ["Schedule downgrade at cycle end", "Feature access during grace period", "Downgrade impact preview", "Seller notification workflow"] },
  { id: "expiry", label: "Expiry", href: "/superadmin/plans/expiry", icon: "⏰", description: "Track and manage expiring subscriptions.", features: ["Expiry alert dashboard", "Auto-renewal configuration", "Grace period settings", "Bulk renewal reminders"] },
];
export default function PlansManagement() { return <SectionLayout section={SECTION} tabs={TABS} />; }
