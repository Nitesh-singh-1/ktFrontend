/**
 * Centralized FleetPulse SaaS Theme & Design System Configuration
 * Solid Muted Teal, White, Light Gray, Soft Blue & Warm Orange accents.
 */

export const themeConfig = {
  // Brand Palette: FleetPulse
  colors: {
    primary: {
      DEFAULT: "#47868C",
      hover: "#3F7C82",
      dark: "#356B70",
      light: "#E7F1F2",
      border: "#D9E2E3",
      text: "#FFFFFF",
    },
    secondary: {
      DEFAULT: "#64748B",
      hover: "#475569",
      light: "#F7F8F8",
      dark: "#111827",
    },
    info: {
      DEFAULT: "#4A90E2",
      light: "#EBF3FC",
      dark: "#3B7ECF",
    },
    accent: {
      DEFAULT: "#F4A261",
      light: "#FEF5EE",
      dark: "#B76E32",
    },
    success: {
      DEFAULT: "#2F9E8F",
      light: "#E7F5F3",
      dark: "#207267",
    },
    warning: {
      DEFAULT: "#F4A261",
      light: "#FEF5EE",
      dark: "#B76E32",
    },
    danger: {
      DEFAULT: "#D95C5C",
      hover: "#C54A4A",
      light: "#FDECEC",
      dark: "#B23C3C",
    },
    background: "#F7F8F8",
    surface: "#FFFFFF",
    border: "#D9E2E3",
    borderLight: "#E5EAEB",
    textPrimary: "#111827",
    textSecondary: "#64748B",
    textMuted: "#94A3B8",
  },

  // Standard Button Classes (Flat, Crisp & Clean)
  buttons: {
    primary:
      "inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold text-white bg-[#47868C] hover:bg-[#3F7C82] active:bg-[#356B70] rounded-xl shadow-xs hover:shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#47868C]/30 focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]",
    secondary:
      "inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold text-[#3F7C82] bg-white hover:bg-[#E7F1F2] active:bg-[#D8EAEC] border border-[#D9E2E3] rounded-xl shadow-2xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#47868C]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]",
    outline:
      "inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold text-[#47868C] bg-transparent hover:bg-[#E7F1F2] border border-[#47868C] rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#47868C]/30 cursor-pointer min-w-[100px]",
    danger:
      "inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold text-white bg-[#D95C5C] hover:bg-[#C54A4A] active:bg-[#B23C3C] rounded-xl shadow-xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#D95C5C]/30 focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]",
    ghost:
      "inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm font-semibold text-[#64748B] hover:text-[#111827] hover:bg-[#E7F1F2] rounded-xl transition-all duration-150 cursor-pointer",
    sm: "h-8 px-3 text-xs min-w-[80px]",
    md: "h-10 px-5 text-sm min-w-[100px]",
    lg: "h-12 px-6 text-base min-w-[140px]",
  },

  // Standard Form Controls (Inputs, Selects, Calendars, Labels)
  forms: {
    input:
      "w-full h-10 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-[#111827] dark:text-slate-100 placeholder:text-[#94A3B8] font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#47868C]/20 focus:border-[#47868C] transition-colors disabled:bg-[#F7F8F8] dark:disabled:bg-slate-800/60 disabled:text-[#94A3B8] disabled:cursor-not-allowed",
    select:
      "w-full h-10 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-[#111827] dark:text-slate-100 font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#47868C]/20 focus:border-[#47868C] transition-colors cursor-pointer disabled:bg-[#F7F8F8] dark:disabled:bg-slate-800/60 disabled:text-[#94A3B8]",
    date:
      "w-full h-10 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-[#111827] dark:text-slate-100 font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#47868C]/20 focus:border-[#47868C] transition-colors cursor-pointer disabled:bg-[#F7F8F8] dark:disabled:bg-slate-800/60",
    label:
      "block text-xs font-semibold text-[#111827] dark:text-slate-300 mb-1.5 tracking-wide",
    requiredStar: "text-red-500 font-bold ml-0.5",
    helperText: "mt-1 text-xs text-[#64748B]",
    errorText: "mt-1 text-xs font-medium text-[#D95C5C] flex items-center gap-1",
  },

  // Standard Container Cards
  cards: {
    container:
      "bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-800 rounded-xl shadow-xs p-6 transition-shadow",
    header:
      "flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5EAEB] dark:border-slate-800",
    title:
      "text-base font-bold text-[#111827] dark:text-slate-100 flex items-center gap-2",
    subtitle:
      "text-xs text-[#64748B] mt-0.5",
  },

  // Standard Modals
  modal: {
    overlay:
      "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs overflow-y-auto",
    container:
      "relative bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xl overflow-hidden flex flex-col w-full my-auto transition-all",
    header:
      "px-6 py-4 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between bg-[#F7F8F8] dark:bg-slate-800/60",
    title:
      "text-base font-bold text-[#111827] dark:text-white flex items-center gap-2",
    body:
      "p-6 overflow-y-auto max-h-[calc(85vh-130px)] space-y-5",
    footer:
      "px-6 py-4 bg-[#F7F8F8] dark:bg-slate-800/50 border-t border-[#E5EAEB] dark:border-slate-800 flex items-center justify-end gap-3",
  },

  // Badges & Status Chips
  badges: {
    primary: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E7F1F2] text-[#3F7C82] border border-[#D9E2E3]",
    info: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBF3FC] text-[#4A90E2] border border-[#CFE1F7]",
    success: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E7F5F3] text-[#2F9E8F] border border-[#C6E8E3]",
    warning: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF5EE] text-[#B76E32] border border-[#FADCC4]",
    danger: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDECEC] text-[#D95C5C] border border-[#F8C8C8]",
    neutral: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F7F8F8] text-[#64748B] border border-[#E5EAEB]",
  },
};

export default themeConfig;
