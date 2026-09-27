"use client";

import React from "react";
import { Truck } from "lucide-react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark" | "auto" | "teal";
  accent?: "teal" | "sky" | "indigo";
  showTagline?: boolean;
  name?: string;
  tagline?: string;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  variant = "auto",
  accent = "teal",
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
    dark: "text-[#111827]",
    teal: "text-[#111827]",
    auto: "text-[#111827] dark:text-white",
  }[variant];

  const taglineColor = {
    light: "text-white/80",
    dark: "text-[#3F7C82]",
    teal: "text-[#3F7C82]",
    auto: "text-[#3F7C82]",
  }[variant];

  const iconBg = "bg-[#47868C]";

  return (
    <div className={`flex items-center ${sizeConfig.gap} select-none ${className}`}>
      {/* Brand Icon Mark */}
      <div className={`relative ${sizeConfig.iconBox} ${iconBg} rounded-xl shadow-xs flex items-center justify-center shrink-0`}>
        <Truck className={`${sizeConfig.iconSize} text-white`} />
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-bold tracking-tight ${sizeConfig.titleText} ${textColor}`}>
            {name}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#E7F1F2] text-[#3F7C82] border border-[#D9E2E3]">
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
