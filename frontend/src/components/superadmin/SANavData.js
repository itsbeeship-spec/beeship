import React from "react";

export const SA_NAV = [
  // ── Dashboard ──────────────────────────────────────────────
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/superadmin/dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
      </svg>
    ),
    children: null,
  },

  // ── User Management ────────────────────────────────────────
  {
    id: "users",
    label: "User Management",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    href: null,
    children: [
      { id: "sellers",       label: "Sellers",       href: "/superadmin/users/sellers" },
      { id: "admins",        label: "Admins",        href: "/superadmin/users/admins" },
      { id: "activity-logs", label: "Activity Logs", href: "/superadmin/users/activity-logs" },
    ],
  },

  // ── KYC Management ─────────────────────────────────────────
  {
    id: "kyc",
    label: "KYC Management",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    href: null,
    children: [
      { id: "pending",         label: "Pending Verification", href: "/superadmin/kyc/pending" },
      { id: "not-submitted",   label: "Doc Not Submitted",    href: "/superadmin/kyc/not-submitted" },
      { id: "approved",        label: "Approved",             href: "/superadmin/kyc/approved" },
      { id: "rejected",        label: "Rejected",             href: "/superadmin/kyc/rejected" },
    ],
  },

  // ── Orders ─────────────────────────────────────────────────
  {
    id: "orders",
    label: "Orders",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    href: null,
    children: [
      { id: "all",           label: "All Orders",       href: "/superadmin/orders/all" },
      { id: "fraud",         label: "Fraud Orders",     href: "/superadmin/orders/fraud" },
      { id: "disputed",      label: "Disputed Orders",  href: "/superadmin/orders/disputed" },
    ],
  },

  // ── Shipments ──────────────────────────────────────────────
  {
    id: "shipments",
    label: "Shipments",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
    href: null,
    children: [
      { id: "all",       label: "View Shipments",              href: "/superadmin/shipments/all" },
      { id: "failed",    label: "Failed Shipments",            href: "/superadmin/shipments/failed" },
      { id: "timeline",  label: "Shipment Timeline / Tracking",href: "/superadmin/shipments/timeline" },
      { id: "api-logs",  label: "API Logs",                    href: "/superadmin/shipments/api-logs" },
    ],
  },

  // ── Courier Management ─────────────────────────────────────
  {
    id: "couriers",
    label: "Courier Management",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    href: null,
    children: [
      { id: "list",        label: "Couriers",         href: "/superadmin/couriers/list" },
      { id: "zones",       label: "Courier Rate Cards", href: "/superadmin/couriers/zones" },
      { id: "rules",       label: "Courier Rules",    href: "/superadmin/couriers/rules" },
      { id: "performance", label: "Performance",      href: "/superadmin/couriers/performance" },
    ],
  },

  // ── Wallet & Finance ───────────────────────────────────────
  {
    id: "finance",
    label: "Wallet & Finance",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    href: null,
    children: [
      { id: "wallets",        label: "Seller Wallets",  href: "/superadmin/finance/wallets" },
      { id: "transactions",   label: "Transactions",    href: "/superadmin/finance/transactions" },
      { id: "cod-settlement", label: "COD Settlements",  href: "/superadmin/finance/cod-settlement" },
      { id: "commissions",    label: "Commissions",     href: "/superadmin/finance/commissions" },
      { id: "gst-invoices",   label: "GST & Invoices",  href: "/superadmin/finance/gst-invoices" },
    ],
  },

  // ── Subscription Plans ─────────────────────────────────────
  {
    id: "plans",
    label: "Subscription Plans",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    href: null,
    children: [
      { id: "list",      label: "Plans",     href: "/superadmin/plans/list" },
      { id: "features",  label: "Features",  href: "/superadmin/plans/features" },
      { id: "trial",     label: "Trial",     href: "/superadmin/plans/trial" },
      { id: "upgrade",   label: "Upgrade",   href: "/superadmin/plans/upgrade" },
      { id: "downgrade", label: "Downgrade", href: "/superadmin/plans/downgrade" },
      { id: "expiry",    label: "Expiry",    href: "/superadmin/plans/expiry" },
    ],
  },

  // ── Pricing ────────────────────────────────────────────────
  {
    id: "pricing",
    label: "Pricing",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    href: null,
    children: [
      { id: "default-rate-cards",   label: "Default Rate Cards",    href: "/superadmin/pricing/default-rate-cards" },
      { id: "seller-rate-overrides",label: "Seller Rate Overrides", href: "/superadmin/pricing/seller-rate-overrides" },
      { id: "cod-charges",          label: "COD Charges",           href: "/superadmin/pricing/cod-charges" },
      { id: "additional-charges",   label: "Additional Charges",    href: "/superadmin/pricing/additional-charges" },
      { id: "coupons",              label: "Coupons",               href: "/superadmin/pricing/coupons" },
    ],
  },

  // ── Support Center ─────────────────────────────────────────
  {
    id: "support",
    label: "Support Center",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    href: null,
    children: [
      { id: "tickets", label: "Tickets",       href: "/superadmin/support/tickets" },
      { id: "chat",    label: "Live Chat",     href: "/superadmin/support/chat" },
      { id: "assign",  label: "Assign Agent",  href: "/superadmin/support/assign" },
      { id: "reports", label: "Reports",       href: "/superadmin/support/reports" },
    ],
  },

  // ── Notifications ──────────────────────────────────────────
  {
    id: "notifications",
    label: "Notifications",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    href: null,
    children: [
      { id: "email",     label: "Email",             href: "/superadmin/notifications/email" },
      { id: "sms",       label: "SMS",               href: "/superadmin/notifications/sms" },
      { id: "whatsapp",  label: "WhatsApp",          href: "/superadmin/notifications/whatsapp" },
      { id: "push",      label: "Push Notification", href: "/superadmin/notifications/push" },
      { id: "templates", label: "Templates",         href: "/superadmin/notifications/templates" },
      { id: "broadcast", label: "Broadcast",         href: "/superadmin/notifications/broadcast" },
    ],
  },

  // ── Reports & Analytics ────────────────────────────────────
  {
    id: "reports",
    label: "Reports & Analytics",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    href: null,
    children: [
      { id: "revenue",   label: "Revenue",   href: "/superadmin/reports/revenue" },
      { id: "sellers",   label: "Sellers",   href: "/superadmin/reports/sellers" },
      { id: "orders",    label: "Orders",    href: "/superadmin/reports/orders" },
      { id: "shipments", label: "Shipments", href: "/superadmin/reports/shipments" },
      { id: "couriers",  label: "Couriers",  href: "/superadmin/reports/couriers" },
      { id: "wallet",    label: "Wallet",    href: "/superadmin/reports/wallet" },
      { id: "cod",       label: "COD",       href: "/superadmin/reports/cod" },
      { id: "ndr",       label: "NDR",       href: "/superadmin/reports/ndr" },
      { id: "rto",       label: "RTO",       href: "/superadmin/reports/rto" },
    ],
  },

  // ── API & Webhooks ─────────────────────────────────────────
  {
    id: "api",
    label: "API & Webhooks",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    href: null,
    children: [
      { id: "keys",     label: "API Keys",    href: "/superadmin/api/keys" },
      { id: "webhooks", label: "Webhooks",    href: "/superadmin/api/webhooks" },
      { id: "logs",     label: "API Logs",    href: "/superadmin/api/logs" },
      { id: "limits",   label: "Rate Limits", href: "/superadmin/api/limits" },
    ],
  },

  // ── Security ───────────────────────────────────────────────
  {
    id: "security",
    label: "Security",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    href: null,
    children: [
      { id: "maintenance", label: "Maintenance Mode",   href: "/superadmin/security/maintenance" },
      { id: "login-logs",  label: "Login Logs",         href: "/superadmin/security/login-logs" },
      { id: "block-ip",    label: "Block IP",           href: "/superadmin/security/block-ip" },
      { id: "sessions",    label: "Sessions",           href: "/superadmin/security/sessions" },
      { id: "backup",      label: "Backup",             href: "/superadmin/security/backup" },
      { id: "restore",     label: "Restore",            href: "/superadmin/security/restore" },
      { id: "audit",       label: "Audit Logs",         href: "/superadmin/security/audit" },
      { id: "emergency",   label: "Emergency Controls", href: "/superadmin/security/emergency" },
    ],
  },

  // ── System Monitoring ──────────────────────────────────────
  {
    id: "monitoring",
    label: "System Monitoring",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 00-2 2zM9 9h6v6H9V9z" />
      </svg>
    ),
    href: null,
    children: [
      { id: "cpu",     label: "CPU",        href: "/superadmin/monitoring/cpu" },
      { id: "ram",     label: "RAM",        href: "/superadmin/monitoring/ram" },
      { id: "storage", label: "Storage",    href: "/superadmin/monitoring/storage" },
      { id: "queue",   label: "Queue",      href: "/superadmin/monitoring/queue" },
      { id: "cron",    label: "Cron Jobs",  href: "/superadmin/monitoring/cron" },
      { id: "redis",   label: "Redis",      href: "/superadmin/monitoring/redis" },
      { id: "cache",   label: "Cache",      href: "/superadmin/monitoring/cache" },
      { id: "errors",  label: "Error Logs", href: "/superadmin/monitoring/errors" },
    ],
  },

  // ── Settings ───────────────────────────────────────────────
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    href: null,
    children: [
      { id: "general",   label: "General",           href: "/superadmin/settings/general" },
      { id: "branding",  label: "Branding",          href: "/superadmin/settings/branding" },
      { id: "smtp",      label: "Email SMTP",        href: "/superadmin/settings/smtp" },
      { id: "sms",       label: "SMS",               href: "/superadmin/settings/sms" },
      { id: "whatsapp",  label: "WhatsApp",          href: "/superadmin/settings/whatsapp" },
      { id: "payment",   label: "Payment Gateway",   href: "/superadmin/settings/payment" },
      { id: "invoice",   label: "Invoice",           href: "/superadmin/settings/invoice" },
      { id: "coupons",   label: "Coupons & Offers",  href: "/superadmin/settings/coupons" },
      { id: "pickup",    label: "Pickup Addresses",  href: "/superadmin/settings/pickup" },
      { id: "terms",     label: "Terms & Conditions",href: "/superadmin/settings/terms" },
      { id: "privacy",   label: "Privacy Policy",    href: "/superadmin/settings/privacy" },
      { id: "seo",       label: "SEO",               href: "/superadmin/settings/seo" },
    ],
  },
];
