/**
 * RBAC Permission Config — BeeShip Admin Portal
 *
 * Maps each admin role to the set of SANavData section IDs they can access.
 * Section IDs must match the `id` field in SANavData.js (SA_NAV array).
 *
 * Permission Levels:
 *   "full"  — can view and perform all actions in this section
 *   "view"  — read-only access to this section
 */

export const ROLE_PERMISSIONS = {

  "SUPER_ADMIN": {
    // Full unrestricted access — all sections visible
    sections: ["*"],
  },

  "Operations Admin": {
    sections: [
      "dashboard",
      "users",       // sellers view only — enforced at component level
      "orders",
      "shipments",
      "couriers",    // view only
      // NDR/RTO is part of couriers section (ndr, rto children)
    ],
    // Specific children allowed within sections (null = all children allowed)
    children: {
      users: ["sellers"],           // Only sellers tab, not admins/support/roles
      couriers: ["list", "performance", "ndr", "rto"], // view only, no credentials/rules editing
    },
  },

  "Finance Admin": {
    sections: [
      "dashboard",
      "finance",
      "plans",
      "pricing",
      "reports",
    ],
    children: {
      reports: ["revenue", "wallet", "cod", "sellers"],
    },
  },

  "KYC Admin": {
    sections: [
      "dashboard",
      "users",       // sellers basic view only
      "kyc",
    ],
    children: {
      users: ["sellers"],           // Only seller list, view-only
    },
  },

  "Support Admin": {
    sections: [
      "dashboard",
      "users",       // sellers view only
      "orders",      // view only
      "shipments",   // view only
      "support",
      "finance",     // wallet view only
    ],
    children: {
      users: ["sellers"],
      orders: ["all"],
      shipments: ["all", "timeline"],
      finance: ["wallets"],         // wallet view only
    },
  },

  "Technical Admin": {
    sections: [
      "dashboard",
      "api",
      "monitoring",
      "security",
      "settings",
    ],
    children: null, // All children in these sections allowed
  },

  "Custom Role": {
    // Custom Role — same as SUPER_ADMIN until super admin assigns specific permissions
    sections: ["*"],
    children: null,
  },
};

/**
 * Returns true if the given role has access to a section.
 * @param {string} role - user.role value
 * @param {string} sectionId - nav section id
 */
export function canAccessSection(role, sectionId) {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;

  // Wildcard — super admin and custom role can access everything
  if (perms.sections.includes("*")) return true;

  return perms.sections.includes(sectionId);
}

/**
 * Returns allowed child IDs for a section, or null if all children allowed.
 * @param {string} role
 * @param {string} sectionId
 * @returns {string[] | null} — null means all children are allowed
 */
export function getAllowedChildren(role, sectionId) {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return [];

  // Wildcard — all children allowed
  if (perms.sections.includes("*")) return null;

  if (!perms.children) return null;
  return perms.children[sectionId] ?? null;
}

/**
 * Returns user-friendly role display name
 */
export function getRoleDisplayName(role) {
  const map = {
    SUPER_ADMIN: "Super Admin",
    "Operations Admin": "Operations Admin",
    "Finance Admin": "Finance Admin",
    "KYC Admin": "KYC Admin",
    "Support Admin": "Support Admin",
    "Technical Admin": "Technical Admin",
    "Custom Role": "Custom Role",
  };
  return map[role] || role;
}

/**
 * Returns role accent color for UI badges
 */
export function getRoleColor(role) {
  const map = {
    SUPER_ADMIN: "indigo",
    "Operations Admin": "blue",
    "Finance Admin": "emerald",
    "KYC Admin": "amber",
    "Support Admin": "sky",
    "Technical Admin": "violet",
    "Custom Role": "slate",
  };
  return map[role] || "slate";
}
