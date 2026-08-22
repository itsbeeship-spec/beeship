"use client";

import SectionLayout from "../SectionLayout";
import RevenueReportTab from "../reports/RevenueReportTab";
import SellersReportTab from "../reports/SellersReportTab";
import OrdersReportTab from "../reports/OrdersReportTab";
import ShipmentsReportTab from "../reports/ShipmentsReportTab";
import CouriersReportTab from "../reports/CouriersReportTab";
import WalletReportTab from "../reports/WalletReportTab";
import CODReportTab from "../reports/CODReportTab";
import NDRReportTab from "../reports/NDRReportTab";
import RTOReportTab from "../reports/RTOReportTab";
import SupportReportTab from "../reports/SupportReportTab";

const SECTION = {
  title: "Reports & Analytics",
  icon: "📈",
  description: "Comprehensive analytics across revenue, sellers, logistics, finance and performance.",
};

const TABS = [
  { id: "revenue", label: "Revenue", href: "/superadmin/reports/revenue", icon: "💹", description: "Platform revenue and earnings analytics.", features: ["Daily, weekly, monthly revenue", "Revenue by seller segment", "Gross vs net revenue breakdown", "Year-over-year comparison"] },
  { id: "sellers", label: "Sellers", href: "/superadmin/reports/sellers", icon: "👥", description: "Seller growth and activity analytics.", features: ["New seller registrations", "Active vs inactive sellers", "Seller lifetime value", "Churn analysis"] },
  { id: "orders", label: "Orders", href: "/superadmin/reports/orders", icon: "📦", description: "Order volume and fulfilment analytics.", features: ["Total orders by date", "COD vs Prepaid split", "Order cancellation trends", "Order value distribution"] },
  { id: "shipments", label: "Shipments", href: "/superadmin/reports/shipments", icon: "🚚", description: "Shipment performance and logistics analytics.", features: ["Shipped vs unshipped orders", "Courier-wise shipment split", "Delivery attempt analytics", "On-time delivery rate"] },
  { id: "couriers", label: "Couriers", href: "/superadmin/reports/couriers", icon: "🏍️", description: "Courier performance comparison reports.", features: ["Delivery success rate", "NDR and RTO percentages", "TAT comparison", "Zone-wise performance"] },
  { id: "wallet", label: "Wallet", href: "/superadmin/reports/wallet", icon: "💰", description: "Wallet recharge and usage analytics.", features: ["Total recharges over period", "Average wallet balance", "Low-balance seller alerts", "Spending pattern analysis"] },
  { id: "cod", label: "COD", href: "/superadmin/reports/cod", icon: "💵", description: "COD collection and settlement reports.", features: ["Collected vs remitted COD", "COD collection success rate", "Settlement cycle analytics", "Unsettled COD aging"] },
  { id: "ndr", label: "NDR", href: "/superadmin/reports/ndr", icon: "📋", description: "Non-delivery report trends and analysis.", features: ["NDR volume by courier", "NDR reason code breakdown", "Resolution rate tracking", "NDR-to-RTO conversion rate"] },
  { id: "rto", label: "RTO", href: "/superadmin/reports/rto", icon: "↩️", description: "Return-to-origin analytics.", features: ["RTO rate by courier and zone", "Loss due to RTO", "Seller-wise RTO ranking", "RTO reduction suggestions"] },
  { id: "support", label: "Support", href: "/superadmin/reports/support", icon: "🎧", description: "Customer support ticket resolution analytics.", features: ["Ticket volume trends", "Resolution time", "Agent satisfaction rating"] },
];

export default function ReportsAnalytics({ activeTab = "revenue" }) {
  let content = null;
  if (activeTab === "revenue") {
    content = <RevenueReportTab />;
  } else if (activeTab === "sellers") {
    content = <SellersReportTab />;
  } else if (activeTab === "orders") {
    content = <OrdersReportTab />;
  } else if (activeTab === "shipments") {
    content = <ShipmentsReportTab />;
  } else if (activeTab === "couriers") {
    content = <CouriersReportTab />;
  } else if (activeTab === "wallet") {
    content = <WalletReportTab />;
  } else if (activeTab === "cod") {
    content = <CODReportTab />;
  } else if (activeTab === "ndr") {
    content = <NDRReportTab />;
  } else if (activeTab === "rto") {
    content = <RTOReportTab />;
  } else if (activeTab === "support") {
    content = <SupportReportTab />;
  }

  return (
    <SectionLayout section={SECTION} tabs={TABS}>
      {content}
    </SectionLayout>
  );
}
