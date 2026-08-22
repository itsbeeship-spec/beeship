import SectionLayout from "../SectionLayout";

const SECTION = {
  title: "User Management",
  icon: "👥",
  description: "Manage sellers, admins, support staff, roles and track activity across the platform.",
};

const TABS = [
  {
    id: "sellers",
    label: "Sellers",
    href: "/superadmin/users/sellers",
    icon: "🛍️",
    description: "View, search and manage all registered seller accounts.",
    features: ["Search & filter sellers by KYC, wallet, status", "View seller profile and shipping history", "Suspend or activate seller accounts", "Bulk export seller data", "View linked orders and shipments per seller"],
  },
  {
    id: "admins",
    label: "Admins",
    href: "/superadmin/users/admins",
    icon: "🛡️",
    description: "Manage admin staff accounts and their platform access.",
    features: ["View all admin accounts", "Create and deactivate admin profiles", "View admin action history", "Assign admin to specific modules"],
  },
  {
    id: "support",
    label: "Support Staff",
    href: "/superadmin/users/support",
    icon: "🎧",
    description: "Manage support team members and their ticket access.",
    features: ["View support staff list", "Create and remove support accounts", "Track open tickets per agent", "Monitor response time metrics"],
  },
  {
    id: "roles",
    label: "Roles & Permissions",
    href: "/superadmin/users/roles",
    icon: "🔑",
    description: "Define roles and granular access permissions for all staff.",
    features: ["Create custom roles", "Assign module-level permissions", "View which users have which roles", "Override permissions per user"],
  },
  {
    id: "activity-logs",
    label: "Activity Logs",
    href: "/superadmin/users/activity-logs",
    icon: "📝",
    description: "Full audit trail of actions performed by all users and staff.",
    features: ["Filter logs by user, date, action type", "Track login/logout events", "View API call history", "Export audit logs as CSV"],
  },
];

export default function UserManagement() {
  return <SectionLayout section={SECTION} tabs={TABS} />;
}
