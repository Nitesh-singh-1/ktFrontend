"use client";

import React from "react";
import { ShipmentStatus } from "@/types/shipment";
import {
  FileEdit,
  Package,
  ClipboardList,
  Truck,
  Navigation,
  CheckCircle2,
  XCircle,
  RotateCcw,
  HelpCircle,
  LucideIcon,
} from "lucide-react";

interface ShipmentStatusBadgeProps {
  status: ShipmentStatus | number;
  className?: string;
  showIcon?: boolean;
}

export const STATUS_META: Record<
  ShipmentStatus,
  { label: string; bg: string; text: string; border: string; icon: LucideIcon }
> = {
  [ShipmentStatus.Draft]: {
    label: "Draft",
    bg: "bg-[#F7F8F8] dark:bg-slate-800",
    text: "text-[#64748B] dark:text-slate-400",
    border: "border-[#D9E2E3] dark:border-slate-700",
    icon: FileEdit,
  },
  [ShipmentStatus.Booked]: {
    label: "Booked",
    bg: "bg-[#E7F1F2] dark:bg-slate-800",
    text: "text-[#3F7C82] dark:text-teal-300",
    border: "border-[#D9E2E3] dark:border-slate-700",
    icon: Package,
  },
  [ShipmentStatus.Manifested]: {
    label: "Manifested",
    bg: "bg-[#4A90E2]/10 dark:bg-sky-950/40",
    text: "text-[#4A90E2] dark:text-sky-300",
    border: "border-[#4A90E2]/20 dark:border-sky-800/40",
    icon: ClipboardList,
  },
  [ShipmentStatus.InTransit]: {
    label: "In Transit",
    bg: "bg-[#4A90E2]/10 dark:bg-sky-950/40",
    text: "text-[#4A90E2] dark:text-sky-300",
    border: "border-[#4A90E2]/20 dark:border-sky-800/40",
    icon: Truck,
  },
  [ShipmentStatus.OutForDelivery]: {
    label: "Out For Delivery",
    bg: "bg-[#4A90E2]/10 dark:bg-sky-950/40",
    text: "text-[#4A90E2] dark:text-sky-300",
    border: "border-[#4A90E2]/20 dark:border-sky-800/40",
    icon: Navigation,
  },
  [ShipmentStatus.Delivered]: {
    label: "Delivered",
    bg: "bg-[#E7F1F2] dark:bg-teal-950/40",
    text: "text-[#2F9E8F] dark:text-teal-300",
    border: "border-[#2F9E8F]/20 dark:border-teal-800/40",
    icon: CheckCircle2,
  },
  [ShipmentStatus.Cancelled]: {
    label: "Cancelled",
    bg: "bg-[#D95C5C]/10 dark:bg-rose-950/40",
    text: "text-[#D95C5C] dark:text-rose-300",
    border: "border-[#D95C5C]/20 dark:border-rose-800/40",
    icon: XCircle,
  },
  [ShipmentStatus.Returned]: {
    label: "Returned",
    bg: "bg-[#F4A261]/10 dark:bg-amber-950/40",
    text: "text-[#F4A261] dark:text-amber-300",
    border: "border-[#F4A261]/20 dark:border-amber-800/40",
    icon: RotateCcw,
  },
};

export default function ShipmentStatusBadge({
  status,
  className = "",
  showIcon = true,
}: ShipmentStatusBadgeProps) {
  const meta = STATUS_META[status as ShipmentStatus] || {
    label: "Unknown",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
    icon: HelpCircle,
  };

  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${meta.bg} ${meta.text} ${meta.border} ${className}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{meta.label}</span>
    </span>
  );
}
