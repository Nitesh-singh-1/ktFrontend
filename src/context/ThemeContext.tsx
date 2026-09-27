"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeKey = "fleetpulse-teal" | "light-blue" | "ocean-blue" | "corporate-navy" | "slate-clean" | "dark-blue" | "emerald";

export interface ThemeOption {
  id: ThemeKey;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  bgPreview: string;
  isDark?: boolean;
}

export const availableThemes: ThemeOption[] = [
  {
    id: "fleetpulse-teal",
    name: "FleetPulse Teal (Default)",
    description: "Muted teal, pure white surfaces and light gray canvas",
    primaryColor: "#2F8E86",
    accentColor: "#4A90E2",
    bgPreview: "bg-[#E7F1F2] border-[#D9E2E3]",
    isDark: false,
  },
  {
    id: "light-blue",
    name: "Light Blue & White",
    description: "Crisp sky blue with pure white cards and soft blue canvas",
    primaryColor: "#0284c7",
    accentColor: "#38bdf8",
    bgPreview: "bg-sky-50 border-sky-300",
    isDark: false,
  },
  {
    id: "ocean-blue",
    name: "Ocean Royal Blue",
    description: "Deep vibrant royal blue with clean white contrast",
    primaryColor: "#2563eb",
    accentColor: "#60a5fa",
    bgPreview: "bg-blue-50 border-blue-300",
    isDark: false,
  },
  {
    id: "corporate-navy",
    name: "Corporate Navy TMS",
    description: "Professional deep navy blue with subtle slate tones",
    primaryColor: "#1e3a8a",
    accentColor: "#3b82f6",
    bgPreview: "bg-slate-50 border-blue-200",
    isDark: false,
  },
  {
    id: "slate-clean",
    name: "Slate Modern Minimal",
    description: "Clean neutral slate with high legibility",
    primaryColor: "#334155",
    accentColor: "#0284c7",
    bgPreview: "bg-slate-100 border-slate-300",
    isDark: false,
  },
  {
    id: "emerald",
    name: "Emerald Green Freight",
    description: "Fresh emerald accents with clean light surfaces",
    primaryColor: "#059669",
    accentColor: "#34d399",
    bgPreview: "bg-emerald-50 border-emerald-300",
    isDark: false,
  },
  {
    id: "dark-blue",
    name: "Sleek Dark Navy",
    description: "Modern midnight dark blue with luminous sky accents",
    primaryColor: "#0284c7",
    accentColor: "#38bdf8",
    bgPreview: "bg-slate-900 border-slate-700",
    isDark: true,
  },
];

interface ThemeContextType {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  isDark: boolean;
  availableThemes: ThemeOption[];
  density: "comfortable" | "compact";
  setDensity: (density: "comfortable" | "compact") => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeKey>("fleetpulse-teal");
  const [density, setDensityState] = useState<"comfortable" | "compact">("comfortable");
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("kt_app_theme") as ThemeKey;
      if (savedTheme && availableThemes.some((t) => t.id === savedTheme)) {
        setThemeState(savedTheme);
      } else {
        setThemeState("fleetpulse-teal");
      }

      const savedDensity = localStorage.getItem("kt_app_density") as "comfortable" | "compact";
      if (savedDensity) {
        setDensityState(savedDensity);
      }
    }
  }, []);

  useEffect(() => {
    const activeOpt = availableThemes.find((t) => t.id === theme) || availableThemes[0];
    const isDarkMode = !!activeOpt.isDark;
    setIsDark(isDarkMode);

    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      // Apply primary & accent color CSS variables
      document.documentElement.style.setProperty("--primary-color", activeOpt.primaryColor);
      document.documentElement.style.setProperty("--accent-color", activeOpt.accentColor);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("kt_app_theme", theme);
    }
  }, [theme]);

  const setTheme = (newTheme: ThemeKey) => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("kt_app_theme", newTheme);
    }
  };

  const setDensity = (newDensity: "comfortable" | "compact") => {
    setDensityState(newDensity);
    if (typeof window !== "undefined") {
      localStorage.setItem("kt_app_density", newDensity);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isDark,
        availableThemes,
        density,
        setDensity,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within a ThemeProvider");
  }
  return context;
};

export const useTheme = useAppTheme;

