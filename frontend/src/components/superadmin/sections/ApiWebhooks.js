import SectionLayout from "../SectionLayout";
const SECTION = { title: "API & Webhooks", icon: "⚡", description: "Manage API keys, webhooks, API call logs and rate limiting configurations." };
const TABS = [
  { id: "keys", label: "API Keys", href: "/superadmin/api/keys", icon: "🔑", description: "Generate and manage API keys for sellers.", features: ["Create per-seller API keys", "Rotate or revoke keys", "Set key expiry", "Usage analytics per key"] },
  { id: "webhooks", label: "Webhooks", href: "/superadmin/api/webhooks", icon: "🔗", description: "Configure webhook endpoints for events.", features: ["Add seller webhook URLs", "Event subscription management", "Retry failed webhooks", "Webhook delivery logs"] },
  { id: "logs", label: "API Logs", href: "/superadmin/api/logs", icon: "📋", description: "Full log of all API requests and responses.", features: ["Filter by endpoint, seller, date", "Request and response body viewer", "Error rate monitoring", "Performance latency stats"] },
  { id: "limits", label: "Rate Limits", href: "/superadmin/api/limits", icon: "⏱️", description: "Configure API rate limits per seller or plan.", features: ["Set requests per minute per tier", "Custom limits per seller", "Rate limit breach alerts", "Whitelist trusted IPs"] },
];
export default function ApiWebhooks() { return <SectionLayout section={SECTION} tabs={TABS} />; }
