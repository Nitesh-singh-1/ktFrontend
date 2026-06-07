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
    title: "GR",
    icon: "package",
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
    title: "Reports",
    icon: "barChart",
    path: "/reports",
  },
  {
    title: "System",
    icon: "cog",
    children: [
      {
        title: "Settings",
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