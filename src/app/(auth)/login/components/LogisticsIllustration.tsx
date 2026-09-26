"use client";

import React from "react";

export const LogisticsIllustration: React.FC = () => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between select-none bg-[#3a8890] text-white">
      {/* Top Status Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#32777e] border border-white/20 text-xs font-semibold text-white shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span>Fleet & Consignment Network</span>
        </div>

        <span className="text-[11px] font-medium text-white/80 tracking-wide hidden sm:inline-block">
          Enterprise Cloud TMS
        </span>
      </div>

      {/* Hero Logistics Image Illustration (Seamlessly Blended on #3a8890) */}
      <div className="relative z-10 my-auto py-2 flex flex-col items-center justify-center w-full">
        <div className="w-full max-w-[540px] lg:max-w-[580px] xl:max-w-[620px] flex items-center justify-center">
          <img
            src="/Login_illustration.png"
            alt="Transportation and Logistics Operations Illustration"
            className="w-full h-auto max-h-[380px] lg:max-h-[400px] object-contain select-none pointer-events-none"
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom Clean Product Statement */}
      <div className="relative z-10 pt-3 border-t border-white/20">
        <h3 className="text-sm sm:text-base font-bold tracking-tight text-white">
          Move smarter. Deliver faster.
        </h3>
        <p className="text-xs text-white/85 font-normal leading-relaxed mt-0.5">
          Manage consignments, manifests, billing and delivery from one platform.
        </p>
      </div>
    </div>
  );
};

export default LogisticsIllustration;
