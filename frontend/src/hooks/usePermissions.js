import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { canAccessSection, getAllowedChildren, ROLE_PERMISSIONS } from "@/config/rolePermissions";

/**
 * usePermissions — Role-based access hook for admin panel.
 *
 * Returns:
 *   role              — current user's role string
 *   isFullAccess      — true if user has wildcard (*) access (SUPER_ADMIN, Custom Role)
 *   can(sectionId)    — true if user can access the given nav section
 *   getChildren(id)   — returns allowed child IDs for a section, or null (all allowed)
 *   filterNav(navArr) — returns filtered version of SA_NAV for this role
 */
export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role || null;

  const isFullAccess = useMemo(() => {
    if (!role) return false;
    const perms = ROLE_PERMISSIONS[role];
    return perms?.sections?.includes("*") ?? false;
  }, [role]);

  const can = useMemo(() => {
    return (sectionId) => {
      if (!role) return false;
      return canAccessSection(role, sectionId);
    };
  }, [role]);

  const getChildren = useMemo(() => {
    return (sectionId) => {
      if (!role) return [];
      return getAllowedChildren(role, sectionId);
    };
  }, [role]);

  /**
   * Filters SA_NAV array to only sections and children the role can access.
   */
  const filterNav = useMemo(() => {
    return (navArr) => {
      if (!role || isFullAccess) return navArr; // SUPER_ADMIN / Custom Role see everything

      return navArr
        .filter((item) => canAccessSection(role, item.id))
        .map((item) => {
          if (!item.children) return item;

          const allowedChildIds = getAllowedChildren(role, item.id);
          if (!allowedChildIds) return item; // null means all children allowed

          return {
            ...item,
            children: item.children.filter((child) =>
              allowedChildIds.includes(child.id)
            ),
          };
        });
    };
  }, [role, isFullAccess]);

  return { role, isFullAccess, can, getChildren, filterNav };
}
