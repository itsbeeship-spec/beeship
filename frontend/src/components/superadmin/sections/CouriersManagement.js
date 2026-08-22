"use client";

import SectionLayout from "../SectionLayout";
import CouriersListTab from "../couriers/CouriersListTab";
import CourierRateCardsTab from "../couriers/CourierRateCardsTab";
import CourierRulesTab from "../couriers/CourierRulesTab";
import CourierPerformanceTab from "../couriers/CourierPerformanceTab";

const SECTION = { title: "Courier Management", icon: "🏍️", description: "Manage courier integrations, pricing zones, rules and performance analytics." };
const TABS = [
  { id: "list", label: "Couriers", href: "/superadmin/couriers/list", icon: "🚀", description: "All integrated courier partners.", features: ["View active/inactive couriers", "Enable or disable per zone", "View courier SLA and TAT", "Add new courier integration"] },
  { id: "zones", label: "Courier Rate Cards", href: "/superadmin/couriers/zones", icon: "🗺️", description: "Configure pricing zones for each courier.", features: ["Define state/city based zones", "Set per-zone rate cards", "Bulk zone import via CSV", "Zone-wise rate comparison"] },
  { id: "rules", label: "Courier Rules", href: "/superadmin/couriers/rules", icon: "📏", description: "Auto-assignment rules based on weight, zone and seller.", features: ["Priority-based routing rules", "Weight and dimension conditions", "Seller-specific overrides", "Test rules with dummy shipments"] },
  { id: "performance", label: "Performance", href: "/superadmin/couriers/performance", icon: "📊", description: "Courier delivery performance metrics.", features: ["On-time delivery rate", "RTO and NDR percentages", "Average delivery time by zone", "Courier ranking dashboard"] },
];

export default function CouriersManagement({ activeTab }) {
  let content = null;
  if (activeTab === "list") {
    content = <CouriersListTab />;
  } else if (activeTab === "zones") {
    content = <CourierRateCardsTab />;
  } else if (activeTab === "rules") {
    content = <CourierRulesTab />;
  } else if (activeTab === "performance") {
    content = <CourierPerformanceTab />;
  }

  return (
    <SectionLayout section={SECTION} tabs={TABS}>
      {content}
    </SectionLayout>
  );
}
