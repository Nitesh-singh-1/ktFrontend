"use client";

import React from "react";
import Image from "next/image";

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
  showTagline = true,
  name = "FleetPulse",
  tagline = "Enterprise Cloud TMS",
  className = "",
}) => {
  const sizeConfig = {
    sm: { markPx: 32, titleText: "text-sm",  taglineText: "text-[10px]", gap: "gap-2.5" },
    md: { markPx: 40, titleText: "text-lg",  taglineText: "text-[11px]", gap: "gap-3" },
    lg: { markPx: 48, titleText: "text-xl",  taglineText: "text-xs",     gap: "gap-3.5" },
    xl: { markPx: 56, titleText: "text-2xl", taglineText: "text-xs",     gap: "gap-4" },
  }[size];

  const textColor = {
    light: "text-white",
    dark: "text-[#111827]",
    teal: "text-[#111827]",
    auto: "text-[#111827] dark:text-white",
  }[variant];

  const taglineColor = {
    light: "text-white/80",
    dark: "text-[#25776F]",
    teal: "text-[#25776F]",
    auto: "text-[#25776F] dark:text-teal-300",
  }[variant];

  return (
    <div className={`flex items-center ${sizeConfig.gap} select-none ${className}`}>
      {/* Brand Mark — hex logistics logo, served from /logo.png */}
      <div
        className="relative shrink-0"
        style={{ width: sizeConfig.markPx, height: sizeConfig.markPx }}
      >
        <Image
          src="/logo.png"
          alt="FleetPulse"
          width={sizeConfig.markPx}
          height={sizeConfig.markPx}
          priority
          className="block"
        />
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-bold tracking-tight ${sizeConfig.titleText} ${textColor}`}>
            {name}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] dark:bg-slate-800 dark:text-teal-300 dark:border-slate-700">
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
