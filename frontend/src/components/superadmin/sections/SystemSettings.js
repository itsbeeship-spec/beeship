import SectionLayout from "../SectionLayout";
const SECTION = { title: "Settings", icon: "⚙️", description: "Platform-wide configuration — branding, email, SMS, payment gateway and legal pages." };
const TABS = [
  { id: "general", label: "General", href: "/superadmin/settings/general", icon: "🏠", description: "Core platform settings and configuration.", features: ["Platform name and timezone", "Default currency settings", "Company contact details", "Feature flags control"] },
  { id: "branding", label: "Branding", href: "/superadmin/settings/branding", icon: "🎨", description: "Customize platform appearance and logos.", features: ["Upload platform logo", "Set primary brand colors", "Custom favicon", "White-label configuration"] },
  { id: "smtp", label: "Email SMTP", href: "/superadmin/settings/smtp", icon: "📧", description: "Configure SMTP server for outgoing emails.", features: ["SMTP host and port settings", "Authentication credentials", "Test email sending", "Fallback SMTP provider"] },
  { id: "sms", label: "SMS", href: "/superadmin/settings/sms", icon: "📱", description: "SMS gateway provider configuration.", features: ["SMS provider API keys", "Sender ID configuration", "DLT template management", "SMS test sending"] },
  { id: "whatsapp", label: "WhatsApp", href: "/superadmin/settings/whatsapp", icon: "💚", description: "WhatsApp Business API setup.", features: ["WABA credentials", "Phone number ID setup", "Template approval flow", "Test WhatsApp message"] },
  { id: "payment", label: "Payment Gateway", href: "/superadmin/settings/payment", icon: "💳", description: "Payment gateway integrations for recharges.", features: ["Razorpay/PayU credentials", "Webhook URL configuration", "Test payment gateway", "Refund settings"] },
  { id: "invoice", label: "Invoice", href: "/superadmin/settings/invoice", icon: "🧾", description: "Invoice template and tax configuration.", features: ["Invoice numbering series", "Tax and GST settings", "Invoice template design", "Auto-invoice triggers"] },
  { id: "pickup", label: "Pickup Addresses", href: "/superadmin/settings/pickup", icon: "📍", description: "Default platform pickup address settings.", features: ["Add hub pickup addresses", "Zone-wise pickup mapping", "Default pickup for new sellers", "Pickup address verification"] },
  { id: "terms", label: "Terms & Conditions", href: "/superadmin/settings/terms", icon: "📜", description: "Edit platform terms and conditions.", features: ["Rich text editor for T&C", "Version history", "Seller acceptance tracking", "Publish/unpublish control"] },
  { id: "privacy", label: "Privacy Policy", href: "/superadmin/settings/privacy", icon: "🔒", description: "Manage privacy policy content.", features: ["Edit privacy policy content", "Update date tracking", "Multi-language support", "Legal review workflow"] },
  { id: "seo", label: "SEO", href: "/superadmin/settings/seo", icon: "🔍", description: "SEO metadata for public-facing pages.", features: ["Meta title and description", "Open Graph tags", "Sitemap generation", "Robots.txt management"] },
];
export default function SystemSettings() { return <SectionLayout section={SECTION} tabs={TABS} />; }
