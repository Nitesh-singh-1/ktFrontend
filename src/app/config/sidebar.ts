// TASK-045 Phase 3: This file is a MINIMAL FALLBACK only.
// The real menu comes from GET /api/navigation/menu, served from the
// normalized menu_items table (see .agent/specs/decisions/menu-catalog-normalization.md).
// This fallback renders only when that API fails on first page load.
// To ADD a menu item, do it in the backend menu_items table — NOT here.

import { TenantFeatureFlags } from "../../../services/configService";

export type SidebarItem = {
  id?: string;
  title: string;
  icon?: string;
  path?: string;
  moduleKey?: keyof TenantFeatureFlags;
  /**
   * Granular per-page permission key the user must hold (e.g. "billing.bill_book").
   * When present, the sidebar renderer filters this child out unless
   * `NavigationContext.hasPermission(permissionKey)` returns true. A parent whose
   * every child filters out — and whose own permissionKey is also absent — is
   * hidden entirely.
   */
  permissionKey?: string;
  badge?: string;
  children?: SidebarItem[];
};

export const sidebarItems: SidebarItem[] = [
  { id: "dashboard", title: "Dashboard", icon: "home", path: "/dashboard" },
];
