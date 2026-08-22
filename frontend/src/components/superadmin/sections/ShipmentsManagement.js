import SectionLayout from "../SectionLayout";
import ShipmentsListTab from "../shipments/ShipmentsListTab";
import FailedShipmentsTab from "../shipments/FailedShipmentsTab";
import ShipmentTimelineTab from "../shipments/ShipmentTimelineTab";
import ApiLogsTab from "../shipments/ApiLogsTab";

const SECTION = { title: "Shipments", icon: "🚚", description: "End-to-end shipment control — track, reassign, retry, label and manifest management." };
const TABS = [
  { id: "all", label: "View Shipments", href: "/superadmin/shipments/all", icon: "📋", description: "All shipments across all sellers and couriers.", features: ["Filter by AWB, seller, courier, date", "Real-time tracking status", "Bulk status update", "Export shipment data"] },
  { id: "failed", label: "Failed Shipments", href: "/superadmin/shipments/failed", icon: "🔁", description: "Retry failed or stuck shipments.", features: ["Identify stuck shipments", "Trigger re-pickup request", "Send retry notification", "Track retry count"] },
  { id: "timeline", label: "Shipment Timeline / Tracking", href: "/superadmin/shipments/timeline", icon: "📅", description: "Visual timeline of shipment events and statuses.", features: ["Event-by-event tracking", "Delivery SLA tracking", "Delay identification", "Export timeline CSV"] },
  { id: "api-logs", label: "API Logs", href: "/superadmin/shipments/api-logs", icon: "⚡", description: "View raw API calls to and from courier partners.", features: ["Request/response logs per AWB", "Error and timeout detection", "Filter by courier and date", "Download API logs"] },
];

export default function ShipmentsManagement({ activeTab }) {
  let content = null;
  if (activeTab === "all") {
    content = <ShipmentsListTab />;
  } else if (activeTab === "failed") {
    content = <FailedShipmentsTab />;
  } else if (activeTab === "timeline") {
    content = <ShipmentTimelineTab />;
  } else if (activeTab === "api-logs") {
    content = <ApiLogsTab />;
  }

  return (
    <SectionLayout section={SECTION} tabs={TABS}>
      {content}
    </SectionLayout>
  );
}
