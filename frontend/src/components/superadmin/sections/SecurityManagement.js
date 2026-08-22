import SectionLayout from "../SectionLayout";
const SECTION = { title: "Security", icon: "🔒", description: "Platform security controls — maintenance mode, IP blocking, sessions, backups and emergency actions." };
const TABS = [
  { id: "maintenance", label: "Maintenance Mode", href: "/superadmin/security/maintenance", icon: "🛠️", description: "Toggle platform maintenance mode with custom message.", features: ["Enable/disable maintenance mode", "Custom maintenance message", "Whitelist IPs during maintenance", "Scheduled maintenance windows"] },
  { id: "login-logs", label: "Login Logs", href: "/superadmin/security/login-logs", icon: "📋", description: "Track all login attempts across the platform.", features: ["View successful and failed logins", "Filter by user, IP, date", "Detect brute-force patterns", "Export login logs"] },
  { id: "block-ip", label: "Block IP", href: "/superadmin/security/block-ip", icon: "🚫", description: "Block malicious IP addresses.", features: ["Add single or CIDR range blocks", "Temporary and permanent blocks", "View currently blocked IPs", "Geo-IP based blocking"] },
  { id: "sessions", label: "Sessions", href: "/superadmin/security/sessions", icon: "🖥️", description: "View and terminate active user sessions.", features: ["View all active sessions", "Force logout any user", "Session duration analytics", "Concurrent session limits"] },
  { id: "backup", label: "Backup", href: "/superadmin/security/backup", icon: "💾", description: "Configure and trigger database backups.", features: ["Manual backup trigger", "Automated backup schedule", "Backup storage management", "Backup integrity verification"] },
  { id: "restore", label: "Restore", href: "/superadmin/security/restore", icon: "♻️", description: "Restore from previous backups.", features: ["Browse available backups", "Point-in-time restore", "Restore specific tables", "Restore confirmation flow"] },
  { id: "audit", label: "Audit Logs", href: "/superadmin/security/audit", icon: "📜", description: "Complete audit trail of all admin actions.", features: ["Who did what and when", "Filter by action type", "Immutable log storage", "Export audit reports"] },
  { id: "emergency", label: "Emergency Controls", href: "/superadmin/security/emergency", icon: "🚨", description: "Emergency actions for critical situations.", features: ["Disable all seller logins", "Freeze all transactions", "Mass session termination", "Emergency contact alerts"] },
];
export default function SecurityManagement() { return <SectionLayout section={SECTION} tabs={TABS} />; }
