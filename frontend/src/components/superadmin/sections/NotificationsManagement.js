"use client";

import SectionLayout from "../SectionLayout";
import EmailTab from "../notifications/EmailTab";
import SMSTab from "../notifications/SMSTab";
import WhatsAppTab from "../notifications/WhatsAppTab";
import PushTab from "../notifications/PushTab";
import TemplatesTab from "../notifications/TemplatesTab";
import BroadcastTab from "../notifications/BroadcastTab";

const SECTION = {
  title: "Notifications",
  icon: "🔔",
  description: "Configure and send notifications via Email, SMS, WhatsApp and Push channels.",
};

const TABS = [
  { id: "email", label: "Email", href: "/superadmin/notifications/email", icon: "📧", description: "Email notification settings and gateway status.", features: ["Configure SMTP & AWS SES", "From Email & Name settings", "Live test email trigger", "Buyer brand white-labeling"] },
  { id: "sms", label: "SMS", href: "/superadmin/notifications/sms", icon: "📱", description: "SMS gateway configuration and DLT settings.", features: ["Set Fast2SMS & MSG91 keys", "TRAI DLT Entity ID mandate", "Header / Sender ID config", "Real-time test SMS sender"] },
  { id: "whatsapp", label: "WhatsApp", href: "/superadmin/notifications/whatsapp", icon: "💚", description: "WhatsApp Business API (WABA) integration.", features: ["Meta WABA Permanent Token", "WABA Account & Phone ID", "Interakt / AiSensy fallback", "Test WhatsApp alert trigger"] },
  { id: "push", label: "Push Notification", href: "/superadmin/notifications/push", icon: "🔔", description: "Push notifications for web and mobile.", features: ["Firebase FCM Server Key", "VAPID Web Push Key", "Segment targeting", "Live push test sender"] },
  { id: "templates", label: "Templates", href: "/superadmin/notifications/templates", icon: "📝", description: "Manage message templates for all channels.", features: ["Multi-channel template editor", "Dynamic tag insertion toolbar", "DLT & WABA status tracking", "Order & shipment triggers"] },
  { id: "broadcast", label: "Broadcast", href: "/superadmin/notifications/broadcast", icon: "📢", description: "Send mass notifications to seller groups.", features: ["Target All or Specific Sellers", "Multi-channel dispatch", "Announcement composer", "Broadcast delivery history"] },
];

export default function NotificationsManagement({ activeTab = "email" }) {
  let content = null;
  if (activeTab === "email") {
    content = <EmailTab />;
  } else if (activeTab === "sms") {
    content = <SMSTab />;
  } else if (activeTab === "whatsapp") {
    content = <WhatsAppTab />;
  } else if (activeTab === "push") {
    content = <PushTab />;
  } else if (activeTab === "templates") {
    content = <TemplatesTab />;
  } else if (activeTab === "broadcast") {
    content = <BroadcastTab />;
  }

  return (
    <SectionLayout section={SECTION} tabs={TABS}>
      {content}
    </SectionLayout>
  );
}
