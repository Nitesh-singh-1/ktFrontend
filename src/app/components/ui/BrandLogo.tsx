"use client";

import React from "react";
import { Truck } from "lucide-react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark" | "auto";
  showTagline?: boolean;
  name?: string;
  tagline?: string;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  variant = "auto",
  showTagline = true,
  name = "FleetPulse",
  tagline = "Enterprise Cloud TMS",
  className = "",
}) => {
  const sizeConfig = {
    sm: {
      iconBox: "w-8 h-8 rounded-lg",
      iconSize: "w-4 h-4",
      titleText: "text-sm",
      taglineText: "text-[10px]",
      gap: "gap-2.5",
    },
    md: {
      iconBox: "w-10 h-10 rounded-xl",
      iconSize: "w-5 h-5",
      titleText: "text-lg",
      taglineText: "text-[11px]",
      gap: "gap-3",
    },
    lg: {
      iconBox: "w-12 h-12 rounded-2xl",
      iconSize: "w-6 h-6",
      titleText: "text-xl",
      taglineText: "text-xs",
      gap: "gap-3.5",
    },
    xl: {
      iconBox: "w-14 h-14 rounded-2xl",
      iconSize: "w-7 h-7",
      titleText: "text-2xl",
      taglineText: "text-xs",
      gap: "gap-4",
    },
  }[size];

  const textColor = {
    light: "text-white",
    dark: "text-slate-900",
    auto: "text-slate-900 dark:text-white",
  }[variant];

  const taglineColor = {
    light: "text-sky-400",
    dark: "text-sky-600",
    auto: "text-sky-600 dark:text-sky-400",
  }[variant];

  return (
    <div className={`flex items-center ${sizeConfig.gap} select-none ${className}`}>
      {/* Brand Icon Mark */}
      <div className={`relative ${sizeConfig.iconBox} p-0.5 bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-700 shadow-md shadow-blue-500/20 flex items-center justify-center shrink-0`}>
        <div className="w-full h-full bg-slate-950/90 rounded-[inherit] flex items-center justify-center relative overflow-hidden backdrop-blur-xs">
          {/* Subtle geometric light accent */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-sky-400/40 rounded-full blur-xs pointer-events-none" />
          <Truck className={`${sizeConfig.iconSize} text-sky-400`} />
        </div>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black tracking-tight ${sizeConfig.titleText} ${textColor}`}>
            {name}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-sky-500/15 text-sky-500 border border-sky-500/25">
            TMS
          </span>
        </div>
        {showTagline && (
          <span className={`font-semibold tracking-wider uppercase mt-1 ${sizeConfig.taglineText} ${taglineColor}`}>
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
};

export default BrandLogo;
