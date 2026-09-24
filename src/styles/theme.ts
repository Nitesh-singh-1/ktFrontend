/**
 * Centralized SaaS Theme & Design System Configuration
 * Light Blue and White theme with zero gradient clutter.
 */

export const themeConfig = {
  // Brand Palette: Light Blue & White
  colors: {
    primary: {
      DEFAULT: "#0284c7", // Sky 600
      hover: "#0369a1",   // Sky 700
      light: "#f0f9ff",   // Sky 50
      border: "#bae6fd",  // Sky 200
      text: "#ffffff",
    },
    secondary: {
      DEFAULT: "#475569", // Slate 600
      hover: "#334155",   // Slate 700
      light: "#f8fafc",   // Slate 50
      dark: "#0f172a",    // Slate 900
    },
    success: {
      DEFAULT: "#059669", // Emerald 600
      light: "#ecfdf5",   // Emerald 50
      dark: "#065f46",    // Emerald 800
    },
    warning: {
      DEFAULT: "#d97706", // Amber 600
      light: "#fffbeb",   // Amber 50
      dark: "#92400e",    // Amber 800
    },
    danger: {
      DEFAULT: "#dc2626", // Red 600
      hover: "#b91c1c",   // Red 700
      light: "#fef2f2",   // Red 50
      dark: "#991b1b",    // Red 800
    },
  },

  // Standard Button Classes (Flat, Crisp & Clean)
  buttons: {
    primary:
      "inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-xl shadow-xs hover:shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]",
    secondary:
      "inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 active:bg-slate-100 border border-slate-300 dark:border-slate-600 rounded-xl shadow-2xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]",
    outline:
      "inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold text-sky-600 dark:text-sky-400 bg-transparent hover:bg-sky-50 dark:hover:bg-sky-950/50 border border-sky-600 dark:border-sky-500 rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer min-w-[100px]",
    danger:
      "inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]",
    ghost:
      "inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-sky-50 dark:hover:bg-slate-800 rounded-xl transition-all duration-150 cursor-pointer",
    sm: "h-8 px-3 text-xs min-w-[80px]",
    md: "h-10 px-5 text-sm min-w-[100px]",
    lg: "h-12 px-6 text-base min-w-[140px]",
  },

  // Standard Form Controls (Inputs, Selects, Calendars, Labels)
  forms: {
    input:
      "w-full h-10 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:text-slate-500 disabled:cursor-not-allowed",
    select:
      "w-full h-10 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors cursor-pointer disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:text-slate-500",
    date:
      "w-full h-10 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors cursor-pointer disabled:bg-slate-100 dark:disabled:bg-slate-800/60",
    label:
      "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 tracking-wide",
    requiredStar: "text-red-500 font-bold ml-0.5",
    helperText: "mt-1 text-xs text-slate-500 dark:text-slate-400",
    errorText: "mt-1 text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1",
  },

  // Standard Container Cards
  cards: {
    container:
      "bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs p-6 transition-shadow",
    header:
      "flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800",
    title:
      "text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2",
    subtitle:
      "text-xs text-slate-500 dark:text-slate-400 mt-0.5",
  },

  // Standard Modals
  modal: {
    overlay:
      "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs overflow-y-auto",
    container:
      "relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col w-full my-auto transition-all",
    header:
      "px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-sky-50/50 dark:bg-slate-800/60",
    title:
      "text-base font-bold text-slate-900 dark:text-white flex items-center gap-2",
    body:
      "p-6 overflow-y-auto max-h-[calc(85vh-130px)] space-y-5",
    footer:
      "px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3",
  },

  // Badges & Status Chips
  badges: {
    primary: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
    success: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    warning: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    danger: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
    neutral: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
};

export default themeConfig;
