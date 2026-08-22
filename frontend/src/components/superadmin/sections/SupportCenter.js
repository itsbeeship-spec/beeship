"use client";

import SectionLayout from "../SectionLayout";
import TicketsTab from "../support/TicketsTab";
import LiveChatTab from "../support/LiveChatTab";
import AssignAgentTab from "../support/AssignAgentTab";
import SupportReportsTab from "../support/SupportReportsTab";

const SECTION = {
  title: "Support Center",
  icon: "🎧",
  description: "Manage support tickets, live chat, and agent assignments.",
};

const TABS = [
  { id: "tickets", label: "Tickets", href: "/superadmin/support/tickets", icon: "🎫", description: "All support tickets from sellers.", features: ["View and filter all tickets", "Priority and category tagging", "Ticket status management", "Export ticket history"] },
  { id: "chat", label: "Live Chat", href: "/superadmin/support/chat", icon: "💬", description: "Real-time chat support interface.", features: ["Live chat queue view", "Chat transcript history", "Assign chat to agent", "Chat analytics"] },
  { id: "assign", label: "Assign Agent", href: "/superadmin/support/assign", icon: "👤", description: "Assign tickets and chats to support agents.", features: ["Round-robin auto-assignment", "Manual agent assignment", "Agent load balancing view", "Escalation to senior agent"] },
  { id: "reports", label: "Reports", href: "/superadmin/support/reports", icon: "📊", description: "Support team performance analytics.", features: ["Agent performance metrics", "Ticket resolution time stats", "Customer satisfaction scores", "Volume trends by category"] },
];

export default function SupportCenter({ activeTab = "tickets" }) {
  let content = null;
  if (activeTab === "tickets") {
    content = <TicketsTab />;
  } else if (activeTab === "chat") {
    content = <LiveChatTab />;
  } else if (activeTab === "assign") {
    content = <AssignAgentTab />;
  } else if (activeTab === "reports") {
    content = <SupportReportsTab />;
  }

  return (
    <SectionLayout section={SECTION} tabs={TABS}>
      {content}
    </SectionLayout>
  );
}
