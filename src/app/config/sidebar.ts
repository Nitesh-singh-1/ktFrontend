import { TenantFeatureFlags } from "../../../services/configService";

export type SidebarItem = {
  title: string;
  icon?: string;
  path?: string;
  moduleKey?: keyof TenantFeatureFlags;
  badge?: string;
  children?: SidebarItem[];
};

export const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    icon: "home",
    path: "/dashboard",
  },
  {
    title: "GR / Consignments",
    icon: "package",
    moduleKey: "gstBilling",
    children: [
      {
        title: "View Bills",
        icon: "list",
        path: "/dashboard/gr-list",
      },
      {
        title: "GR Entry",
        icon: "plusCircle",
        path: "/dashboard/gr-entry",
      },
    ],
  },
  {
    title: "Challan",
    icon: "truck",
    moduleKey: "challanManagement",
    children: [
      {
        title: "View Challans",
        icon: "list",
        path: "/dashboard/challan-list",
      },
      {
        title: "Challan Entry",
        icon: "plusCircle",
        path: "/dashboard/challan-entry",
      },
    ],
  },
  {
    title: "Reports & Analytics",
    icon: "barChart",
    moduleKey: "reportsAndAnalytics",
    path: "/reports",
  },
  {
    title: "System & SaaS",
    icon: "cog",
    children: [
      {
        title: "Settings & Config",
        icon: "settings",
        path: "/settings",
      },
      {
        title: "Forgot Password",
        icon: "lock",
        path: "/forgot-password",
      },
      {
        title: "About",
        icon: "info",
        path: "/about",
      },
    ],
  },
];