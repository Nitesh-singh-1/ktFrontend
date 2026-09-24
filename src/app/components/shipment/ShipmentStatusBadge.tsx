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
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-300 dark:border-slate-700",
    icon: FileEdit,
  },
  [ShipmentStatus.Booked]: {
    label: "Booked",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    icon: Package,
  },
  [ShipmentStatus.Manifested]: {
    label: "Manifested",
    bg: "bg-indigo-50 dark:bg-indigo-950/50",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800",
    icon: ClipboardList,
  },
  [ShipmentStatus.InTransit]: {
    label: "In Transit",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    icon: Truck,
  },
  [ShipmentStatus.OutForDelivery]: {
    label: "Out For Delivery",
    bg: "bg-purple-50 dark:bg-purple-950/50",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
    icon: Navigation,
  },
  [ShipmentStatus.Delivered]: {
    label: "Delivered",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  [ShipmentStatus.Cancelled]: {
    label: "Cancelled",
    bg: "bg-rose-50 dark:bg-rose-950/50",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
    icon: XCircle,
  },
  [ShipmentStatus.Returned]: {
    label: "Returned",
    bg: "bg-orange-50 dark:bg-orange-950/50",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
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
