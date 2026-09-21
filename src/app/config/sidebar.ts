export type SidebarItem = {
  title: string;
  icon?: string;
  path?: string;
  children?: SidebarItem[];
};

export const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    icon: "home",
    path: "/dashboard",
  },
  {
    title: "Consignments (GR)",
    icon: "package",
    children: [
      {
        title: "All Shipments",
        icon: "fileText",
        path: "/shipments",
      },
      {
        title: "New Consignment",
        icon: "package",
        path: "/shipments/create",
      },
    ],
  },
  {
    title: "Trip Manifests",
    icon: "truck",
    path: "/trips",
  },
  {
    title: "POD & Deliveries",
    icon: "fileText",
    path: "/pod",
  },
  {
    title: "Master Data",
    icon: "cog",
    children: [
      {
        title: "Party Directory",
        icon: "fileText",
        path: "/customers",
      },
      {
        title: "Fleet & Stations",
        icon: "truck",
        path: "/fleet",
      },
    ],
  },
  {
    title: "Market Vendors & Hire",
    icon: "truck",
    path: "/vendors",
  },
  {
    title: "Billing & Invoices",
    icon: "fileText",
    path: "/billing",
  },
  {
    title: "Damage & Claims",
    icon: "info",
    path: "/claims",
  },
  {
    title: "Reports & Analytics",
    icon: "barChart",
    path: "/reports",
  },
  {
    title: "Live Tracker",
    icon: "info",
    path: "/tracking",
  },
  {
    title: "Organization",
    icon: "settings",
    children: [
      {
        title: "Onboard Company",
        icon: "info",
        path: "/onboard",
      },
    ],
  },
];