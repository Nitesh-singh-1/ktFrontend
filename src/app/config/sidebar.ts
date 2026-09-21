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
    title: "Trip Challans",
    icon: "truck",
    children: [
      {
        title: "View Challans",
        icon: "fileText",
        path: "/dashboard/challan-list",
      },
      {
        title: "Challan Entry",
        icon: "truck",
        path: "/dashboard/challan-entry",
      },
    ],
  },
  {
    title: "Billing & Invoices",
    icon: "fileText",
    path: "/billing",
  },
  {
    title: "Reports & Analytics",
    icon: "barChart",
    path: "/reports",
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