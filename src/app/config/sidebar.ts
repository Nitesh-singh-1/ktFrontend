import { TenantFeatureFlags } from "../../../services/configService";

export type SidebarItem = {
  id?: string;
  title: string;
  icon?: string;
  path?: string;
  moduleKey?: keyof TenantFeatureFlags;
  badge?: string;
  children?: SidebarItem[];
};

export const sidebarItems: SidebarItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: "home",
    path: "/dashboard",
  },
  {
    id: "consignments",
    title: "Bilty / GR Booking",
    icon: "package",
    moduleKey: "gstBilling",
    children: [
      {
        id: "consignments.create",
        title: "New Bilty (GR Booking)",
        icon: "package",
        path: "/shipments/create",
      },
      {
        id: "consignments.all",
        title: "All Bilties (GR Registry)",
        icon: "fileText",
        path: "/shipments",
      },
      {
        id: "consignments.delivery_settlement",
        title: "Delivery Settlement",
        icon: "fileText",
        path: "/delivery-settlement",
      },
    ],
  },
  {
    id: "trips",
    title: "Manifest & Dispatch",
    icon: "truck",
    moduleKey: "challanManagement",
    children: [
      {
        id: "trips.all",
        title: "Manifest & Dispatch (Challans)",
        icon: "truck",
        path: "/trips",
      },
      {
        id: "trips.settlement",
        title: "Trip Settlement",
        icon: "fileText",
        path: "/trip-settlement",
      },
    ],
  },
  {
    id: "pod",
    title: "POD & Deliveries",
    icon: "fileText",
    path: "/pod",
    moduleKey: "challanManagement",
  },
  {
    id: "billing",
    title: "Freight Invoicing & Billing",
    icon: "fileText",
    moduleKey: "gstBilling",
    children: [
      {
        id: "billing.bill_book",
        title: "Bill Book (Consolidated)",
        icon: "fileText",
        path: "/bill-book",
        badge: "Freight Bill",
      },
      {
        id: "billing.invoices",
        title: "Freight Invoices",
        icon: "fileText",
        path: "/billing",
      },
      {
        id: "billing.receipts",
        title: "Money Receipts (MR)",
        icon: "fileText",
        path: "/receipts",
      },
    ],
  },
  {
    id: "master_data",
    title: "Master Data",
    icon: "cog",
    children: [
      {
        id: "master_data.parties",
        title: "Party Directory",
        icon: "fileText",
        path: "/customers",
      },
      {
        id: "master_data.fleet",
        title: "Fleet & Stations",
        icon: "truck",
        path: "/fleet",
      },
    ],
  },
  {
    id: "vendors",
    title: "Market Vendors & Hire",
    icon: "truck",
    path: "/vendors",
    moduleKey: "vendorManagement",
  },
  {
    id: "claims",
    title: "Damage & Claims",
    icon: "info",
    path: "/claims",
    moduleKey: "cargoClaims",
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    icon: "barChart",
    moduleKey: "reportsAndAnalytics",
    path: "/reports",
  },
  {
    id: "tracking",
    title: "Live GPS Tracker",
    icon: "info",
    path: "/tracking",
    moduleKey: "gpsTracking",
  },
  {
    id: "clients",
    title: "Client Management",
    icon: "lock",
    path: "/clients",
  },
  {
    id: "system",
    title: "System & Settings",
    icon: "settings",
    children: [
      {
        id: "system.users",
        title: "Manage Users & Access",
        icon: "lock",
        path: "/users",
      },
      {
        id: "system.settings",
        title: "SaaS Configuration",
        icon: "settings",
        path: "/settings",
      },
      {
        id: "system.onboard",
        title: "Tenant Onboarding",
        icon: "info",
        path: "/onboard",
      },
      {
        id: "system.forgot_password",
        title: "Forgot Password",
        icon: "lock",
        path: "/forgot-password",
      },
    ],
  },
];