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
    title: "GR Entry",
    icon: "package",
    path: "/dashboard/gr-entry",
  },
  {
    title: "View Bills",
    icon: "fileText",
    path: "/dashboard/gr-list",
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