"use client";

import React from "react";
import { ShipmentStatus } from "@/types/shipment";

interface ShipmentStatusBadgeProps {
  status: ShipmentStatus | number;
  className?: string;
  showIcon?: boolean;
}

export const STATUS_META: Record<
  ShipmentStatus,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  [ShipmentStatus.Draft]: {
    label: "Draft",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
    icon: "📝",
  },
  [ShipmentStatus.Booked]: {
    label: "Booked",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: "📦",
  },
  [ShipmentStatus.Manifested]: {
    label: "Manifested",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    icon: "📋",
  },
  [ShipmentStatus.InTransit]: {
    label: "In Transit",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "🚚",
  },
  [ShipmentStatus.OutForDelivery]: {
    label: "Out For Delivery",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: "🛵",
  },
  [ShipmentStatus.Delivered]: {
    label: "Delivered",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: "✅",
  },
  [ShipmentStatus.Cancelled]: {
    label: "Cancelled",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: "❌",
  },
  [ShipmentStatus.Returned]: {
    label: "Returned",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    icon: "↩️",
  },
};

export default function ShipmentStatusBadge({
  status,
  className = "",
  showIcon = true,
}: ShipmentStatusBadgeProps) {
  const meta = STATUS_META[status as ShipmentStatus] || {
    label: "Unknown",
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
    icon: "❓",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${meta.bg} ${meta.text} ${meta.border} ${className}`}
    >
      {showIcon && <span>{meta.icon}</span>}
      <span>{meta.label}</span>
    </span>
  );
}
