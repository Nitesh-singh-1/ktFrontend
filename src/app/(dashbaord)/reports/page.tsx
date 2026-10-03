"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  TripProfitabilityReportDto,
  TaxSummaryReportDto,
  PartyOutstandingReportDto,
  VendorPayableReportDto,
  BookingRegisterReportDto,
} from "@/types/tms";
import { Shipment, ShipmentStatus, PaymentTerm, TaxTreatment } from "@/types/shipment";
import { reportService } from "services/reportService";
import { useNavigation } from "@/context/NavigationContext";
import PagePermissionGuard from "@/app/components/ui/PagePermissionGuard";
import { renderPrintHeaderHtml, PRINT_HEADER_CSS, openPrintWindow } from "@/utils/print/printHeader";
import { printShipment, printMultipleShipments } from "@/utils/print/printShipment";
import { BiltyPrintOptions } from "@/utils/print/shipmentPrintTemplate";
import PrintOptionsModal from "@/app/components/print/PrintOptionsModal";
import { DatePicker, CustomSelect } from "@/app/components/ui";
import { toast } from "@/context/ToastContext";
import {
  BarChart3,
  Printer,
  Download,
  TrendingUp,
  Landmark,
  Building2,
  Handshake,
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  CreditCard,
  Calendar,
  CheckSquare,
  Square,
  FileCheck2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/configFormatter";

type ReportTab = "booking" | "vendorLedger" | "partyLedger" | "profitability" | "gst";

type BillTypeFilter = "ALL" | "PAID" | "TO_PAY" | "TBB";

function ReportsContent() {
  const searchParams = useSearchParams();
  const { menu } = useNavigation();

  const [activeTab, setActiveTab] = useState<ReportTab>("booking");
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [billTypeFilter, setBillTypeFilter] = useState<BillTypeFilter>("ALL");
  const [partyFilter, setPartyFilter] = useState<string>("ALL");

  // Selection for bulk actions (like printing multiple bilties)
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<number[]>([]);

  // Print Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [shipmentsToPrint, setShipmentsToPrint] = useState<Shipment[]>([]);
  const [printModalTitle, setPrintModalTitle] = useState("Print Bilty / Waybill");
  const [printModalSubtitle, setPrintModalSubtitle] = useState("Choose which copy to print for the customer.");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [profitability, setProfitability] = useState<TripProfitabilityReportDto | null>(null);
  const [gstSummary, setGstSummary] = useState<TaxSummaryReportDto | null>(null);
  const [partyLedger, setPartyLedger] = useState<PartyOutstandingReportDto[]>([]);
  const [vendorLedger, setVendorLedger] = useState<VendorPayableReportDto[]>([]);
  const [booking, setBooking] = useState<BookingRegisterReportDto | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      if (tabParam.includes("profit")) setActiveTab("profitability");
      else if (tabParam.includes("tax") || tabParam.includes("gst")) setActiveTab("gst");
      else if (tabParam.includes("party") || tabParam.includes("customer")) setActiveTab("partyLedger");
      else if (tabParam.includes("vendor")) setActiveTab("vendorLedger");
      else if (tabParam.includes("booking") || tabParam.includes("consignment")) setActiveTab("booking");
    }
  }, [searchParams]);

  // Reset pagination and selection on filter / tab changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedShipmentIds([]);
  }, [activeTab, searchQuery, billTypeFilter, partyFilter, fromDate, toDate]);

  useEffect(() => {
    fetchReportData();
  }, [activeTab, fromDate, toDate]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      if (activeTab === "profitability") {
        const res = await reportService.getTripProfitabilityReport({ fromDate, toDate });
        setProfitability(res);
      } else if (activeTab === "gst") {
        const res = await reportService.getTaxSummaryReport({ fromDate, toDate });
        setGstSummary(res);
      } else if (activeTab === "partyLedger") {
        const res = await reportService.getPartyOutstandingReport();
        setPartyLedger(res || []);
      } else if (activeTab === "vendorLedger") {
        const res = await reportService.getVendorPayableReport();
        setVendorLedger(res || []);
      } else if (activeTab === "booking") {
        const res = await reportService.getBookingRegister({ fromDate, toDate });
        setBooking(res);
      }
    } catch (err) {
      console.error("Fetch report error:", err);
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = (s?: ShipmentStatus | number): string => {
    switch (s) {
      case ShipmentStatus.Draft:
      case 0:
        return "Draft";
      case ShipmentStatus.Booked:
      case 1:
        return "Booked";
      case ShipmentStatus.Manifested:
      case 2:
        return "Manifested";
      case ShipmentStatus.InTransit:
      case 3:
        return "In Transit";
      case ShipmentStatus.OutForDelivery:
      case 4:
        return "Out for Delivery";
      case ShipmentStatus.Delivered:
      case 5:
        return "Delivered";
      case ShipmentStatus.Returned:
      case 6:
        return "Returned";
      case ShipmentStatus.Cancelled:
      case 7:
        return "Cancelled";
      default:
        return "—";
    }
  };

  const paymentTermLabel = (t?: PaymentTerm | number): string => {
    switch (t) {
      case PaymentTerm.Paid:
      case 1:
        return "PAID";
      case PaymentTerm.TBB:
      case 2:
        return "TBB";
      case PaymentTerm.ToPay:
      case 0:
      default:
        return "TO PAY";
    }
  };

  const taxTreatmentLabel = (t?: TaxTreatment | number): string => {
    switch (t) {
      case TaxTreatment.GST_Regular:
      case 1:
        return "GST Regular";
      case TaxTreatment.GST_RCM:
      case 2:
        return "GST RCM";
      case TaxTreatment.Exempt:
      case 3:
        return "Exempt";
      case TaxTreatment.NonTaxable:
      case 0:
        return "Non-Taxable";
      default:
        return "—";
    }
  };

  // Subtle, premium badge colors matching FleetPulse palette
  const renderPaymentTermBadge = (t?: PaymentTerm | number) => {
    const label = paymentTermLabel(t);
    if (label === "PAID") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          PAID
        </span>
      );
    }
    if (label === "TBB") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
          TBB
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        TO PAY
      </span>
    );
  };

  // Extract distinct parties across consignor & consignee in booking register
  const uniqueParties = useMemo(() => {
    const records = booking?.records || [];
    const partyMap = new Map<string, number>();
    records.forEach((r) => {
      const consignor = r.consignorName?.trim();
      if (consignor) partyMap.set(consignor, (partyMap.get(consignor) || 0) + 1);
      const consignee = r.consigneeName?.trim();
      if (consignee && consignee !== consignor) {
        partyMap.set(consignee, (partyMap.get(consignee) || 0) + 1);
      }
    });
    return Array.from(partyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [booking]);

  // -------------------------------------------------------------
  // Filtered Datasets with live search, bill type, and party filtering
  // -------------------------------------------------------------
  const filteredBookingRecords = useMemo(() => {
    const records = booking?.records || [];
    return records.filter((r) => {
      // Bill type filter
      if (billTypeFilter !== "ALL") {
        const term = paymentTermLabel(r.paymentTerm);
        if (billTypeFilter === "PAID" && term !== "PAID") return false;
        if (billTypeFilter === "TO_PAY" && term !== "TO PAY") return false;
        if (billTypeFilter === "TBB" && term !== "TBB") return false;
      }
      // Party filter
      if (partyFilter !== "ALL") {
        const p = partyFilter.toLowerCase();
        const consignor = (r.consignorName || "").toLowerCase();
        const consignee = (r.consigneeName || "").toLowerCase();
        if (consignor !== p && consignee !== p) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const gr = (r.shipmentNo || "").toLowerCase();
        const consignor = (r.consignorName || "").toLowerCase();
        const consignee = (r.consigneeName || "").toLowerCase();
        const from = (r.fromLocation || "").toLowerCase();
        const to = (r.toLocation || "").toLowerCase();
        const truck = (r.truckNo || "").toLowerCase();
        const inv = (r.invoiceNo || "").toLowerCase();
        return (
          gr.includes(q) ||
          consignor.includes(q) ||
          consignee.includes(q) ||
          from.includes(q) ||
          to.includes(q) ||
          truck.includes(q) ||
          inv.includes(q)
        );
      }
      return true;
    });
  }, [booking, billTypeFilter, partyFilter, searchQuery]);

  const filteredVendorLedger = useMemo(() => {
    return vendorLedger.filter((v) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (v.vendorName || "").toLowerCase().includes(q) ||
        (v.panNo || "").toLowerCase().includes(q) ||
        (v.mobile || "").toLowerCase().includes(q)
      );
    });
  }, [vendorLedger, searchQuery]);

  const filteredPartyLedger = useMemo(() => {
    return partyLedger.filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (p.partyName || "").toLowerCase().includes(q) ||
        (p.gstNo || "").toLowerCase().includes(q) ||
        (p.mobile || "").toLowerCase().includes(q)
      );
    });
  }, [partyLedger, searchQuery]);

  const filteredTripProfitability = useMemo(() => {
    const list = profitability?.tripDetails || [];
    return list.filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (t.tripNo || "").toLowerCase().includes(q) ||
        (t.vehicleNo || "").toLowerCase().includes(q) ||
        (t.driverName || "").toLowerCase().includes(q) ||
        (t.originLocation || "").toLowerCase().includes(q) ||
        (t.destinationLocation || "").toLowerCase().includes(q)
      );
    });
  }, [profitability, searchQuery]);

  // Paginated Slices
  const paginatedBooking = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBookingRecords.slice(start, start + pageSize);
  }, [filteredBookingRecords, currentPage, pageSize]);

  const paginatedVendor = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVendorLedger.slice(start, start + pageSize);
  }, [filteredVendorLedger, currentPage, pageSize]);

  const paginatedParty = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPartyLedger.slice(start, start + pageSize);
  }, [filteredPartyLedger, currentPage, pageSize]);

  const paginatedTrips = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTripProfitability.slice(start, start + pageSize);
  }, [filteredTripProfitability, currentPage, pageSize]);

  // Total count for current active tab
  const totalRecordsCount = useMemo(() => {
    if (activeTab === "booking") return filteredBookingRecords.length;
    if (activeTab === "vendorLedger") return filteredVendorLedger.length;
    if (activeTab === "partyLedger") return filteredPartyLedger.length;
    if (activeTab === "profitability") return filteredTripProfitability.length;
    return 0;
  }, [activeTab, filteredBookingRecords, filteredVendorLedger, filteredPartyLedger, filteredTripProfitability]);

  const totalPages = Math.max(1, Math.ceil(totalRecordsCount / pageSize));

  // Selection Helpers for Bulk Printing
  const isAllSelected = useMemo(() => {
    if (filteredBookingRecords.length === 0) return false;
    return filteredBookingRecords.every((r) => r.id && selectedShipmentIds.includes(r.id));
  }, [filteredBookingRecords, selectedShipmentIds]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedShipmentIds([]);
    } else {
      const allIds = filteredBookingRecords.map((r) => r.id).filter(Boolean) as number[];
      setSelectedShipmentIds(allIds);
    }
  };

  const toggleSelectRow = (id?: number) => {
    if (!id) return;
    setSelectedShipmentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Quick Date Preset Helpers
  const handleSetThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const todayStr = now.toISOString().slice(0, 10);
    setFromDate(firstDay);
    setToDate(todayStr);
  };

  const handleSetLastMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
    setFromDate(firstDay);
    setToDate(lastDay);
  };

  const handleSetLast30Days = () => {
    const now = new Date();
    const past = new Date();
    past.setDate(now.getDate() - 30);
    setFromDate(past.toISOString().slice(0, 10));
    setToDate(now.toISOString().slice(0, 10));
  };

  // Open Print Modal for a Single Row
  const handleInitiateRowPrint = (shipment: Shipment) => {
    setShipmentsToPrint([shipment]);
    setPrintModalTitle(`Print Bilty — ${shipment.shipmentNo || "Waybill"}`);
    setPrintModalSubtitle(`Target Party / Customer: ${shipment.consigneeName || shipment.consignorName || "Consignee"}`);
    setPrintModalOpen(true);
  };

  // Open Print Modal for Bulk Selected/Filtered Bilties
  const handleInitiateBulkPrint = () => {
    const recordsToPrint =
      selectedShipmentIds.length > 0
        ? filteredBookingRecords.filter((r) => r.id && selectedShipmentIds.includes(r.id))
        : filteredBookingRecords;

    if (recordsToPrint.length === 0) {
      toast.error("No bilties found matching your selection.");
      return;
    }

    setShipmentsToPrint(recordsToPrint);
    setPrintModalTitle(`Batch Print Bilties (${recordsToPrint.length} Bilties)`);
    setPrintModalSubtitle(
      partyFilter !== "ALL"
        ? `Preparing batch print for ${partyFilter} (Customer)`
        : `Preparing batch print for ${recordsToPrint.length} filtered bilties`
    );
    setPrintModalOpen(true);
  };

  // Execute printing once copy and layout options are chosen in the modal
  const handleExecutePrint = async (opts: BiltyPrintOptions) => {
    if (shipmentsToPrint.length === 1) {
      await printShipment(shipmentsToPrint[0], opts);
    } else {
      await printMultipleShipments(shipmentsToPrint, opts);
    }
  };

  // -------------------------------------------------------------
  // Rich Export Dataset (Exports comprehensive metadata)
  // -------------------------------------------------------------
  const getReportDataset = (): { title: string; headers: string[]; rows: (string | number)[][] } => {
    if (activeTab === "profitability") {
      return {
        title: "Trip Profitability Report",
        headers: [
          "Trip No",
          "Trip Date",
          "Vehicle No",
          "Driver Name",
          "Origin Location",
          "Destination Location",
          "Freight Revenue (₹)",
          "Total Trip Cost (₹)",
          "Net Profit (₹)",
          "Profit Margin %",
        ],
        rows: filteredTripProfitability.map((t) => [
          t.tripNo,
          formatDate(t.tripDate),
          t.vehicleNo || "-",
          t.driverName || "-",
          t.originLocation || "-",
          t.destinationLocation || "-",
          t.revenue,
          t.totalCost,
          t.netProfit,
          `${(t.profitMarginPct || 0).toFixed(2)}%`,
        ]),
      };
    }
    if (activeTab === "gst") {
      return {
        title: "GST Tax Compliance Summary Report",
        headers: ["Metric", "Amount (₹)"],
        rows: [
          ["Taxable Freight (Regular)", gstSummary?.totalTaxableFreight || 0],
          ["GST RCM Freight (Reverse Charge)", gstSummary?.totalGstRcmFreight || 0],
          ["Exempt & Non-Taxable Freight", gstSummary?.totalNonTaxableFreight || 0],
          ["Total GST Tax Collected", gstSummary?.totalTaxCollected || 0],
          ["Total Shipments Count", gstSummary?.totalShipmentsCount || 0],
        ],
      };
    }
    if (activeTab === "partyLedger") {
      return {
        title: "Customer Accounts Receivable Ledger",
        headers: [
          "Customer / Party Name",
          "GSTIN",
          "Mobile / Contact",
          "Total Billed Amount (₹)",
          "Total Amount Paid (₹)",
          "Balance Outstanding Due (₹)",
        ],
        rows: filteredPartyLedger.map((p) => [
          p.partyName,
          p.gstNo || "Unregistered",
          p.mobile || "-",
          p.totalBilledAmount,
          p.totalPaidAmount,
          p.totalOutstandingDue,
        ]),
      };
    }
    if (activeTab === "vendorLedger") {
      return {
        title: "Market Fleet Vendor & Broker Payable Ledger",
        headers: [
          "Vendor / Broker Name",
          "PAN Number",
          "Mobile / Contact",
          "Total Lorry Hire Amount (₹)",
          "Advances Paid (₹)",
          "TDS Deducted (₹)",
          "Net Balance Payable (₹)",
        ],
        rows: filteredVendorLedger.map((v) => [
          v.vendorName,
          v.panNo || "No PAN",
          v.mobile || "-",
          v.totalHireAmount,
          v.totalAdvancePaid,
          v.totalTdsDeducted,
          v.totalBalancePayable,
        ]),
      };
    }

    // Default: Booking Register (with rich columns exported)
    return {
      title: "Consignment Booking Register",
      headers: [
        "GR No",
        "Booking Date",
        "Bill Type",
        "Status",
        "Consignor Name",
        "Consignor GSTIN",
        "Consignor Mobile",
        "Consignee Name",
        "Consignee GSTIN",
        "Consignee Mobile",
        "Origin (From)",
        "Destination (To)",
        "Vehicle / Truck No",
        "E-Way Bill No",
        "Party Inv No",
        "Party Inv Date",
        "Declared Goods Value (₹)",
        "Freight (₹)",
        "Other Charges (₹)",
        "GST Amount (₹)",
        "Grand Total (₹)",
        "Paid Amount (₹)",
        "Due Amount (₹)",
        "Tax Treatment",
      ],
      rows: filteredBookingRecords.map((r) => [
        r.shipmentNo || "-",
        r.shipmentDate ? formatDate(r.shipmentDate) : "-",
        paymentTermLabel(r.paymentTerm),
        statusLabel(r.status),
        r.consignorName || "-",
        r.consignorGstNo || "-",
        r.consignorMobile || "-",
        r.consigneeName || "-",
        r.consigneeGstNo || "-",
        r.consigneeMobile || "-",
        r.fromLocation || "-",
        r.toLocation || "-",
        r.truckNo || "-",
        r.ewayBillNo || "-",
        r.invoiceNo || "-",
        r.invoiceDate ? formatDate(r.invoiceDate) : "-",
        r.goodsValue || 0,
        r.totalFreight || 0,
        r.totalOtherCharges || 0,
        r.totalTaxAmount || 0,
        r.grandTotal || 0,
        r.paidAmount || 0,
        r.dueAmount || 0,
        taxTreatmentLabel(r.taxTreatment),
      ]),
    };
  };

  const handleExportCsv = () => {
    const { title, headers, rows } = getReportDataset();
    if (rows.length === 0) {
      toast.info("No data available to export for this report filter.");
      return;
    }
    const esc = (v: string | number) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} records to CSV.`);
  };

  const handlePrint = () => {
    const { title, headers, rows } = getReportDataset();
    const escHtml = (s: string) =>
      s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
    const numericCols = new Set<number>();
    headers.forEach((h, i) => {
      if (/revenue|cost|profit|amount|billed|paid|balance|freight|total|hire|tds|due|value/i.test(h)) numericCols.add(i);
    });
    const thead = `<tr>${headers
      .map((h, i) => `<th style="text-align:${numericCols.has(i) ? "right" : "left"}">${escHtml(h)}</th>`)
      .join("")}</tr>`;
    const tbody =
      rows.length > 0
        ? rows
            .map(
              (r) =>
                `<tr>${r
                  .map((c, i) => {
                    const isNum = typeof c === "number";
                    const val = isNum
                      ? c.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : escHtml(String(c ?? ""));
                    return `<td style="${isNum || numericCols.has(i) ? "text-align:right;font-family:monospace;" : ""}">${val}</td>`;
                  })
                  .join("")}</tr>`
            )
            .join("")
        : `<tr><td colspan="${headers.length}" style="text-align:center;padding:24px;color:#6b7280;">No records for this report / period.</td></tr>`;
    const period =
      fromDate || toDate
        ? `<div class="rp-period">Period: ${escHtml(fromDate || "Start")} to ${escHtml(toDate || "Present")}</div>`
        : "";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escHtml(title)}</title><style>
      ${PRINT_HEADER_CSS}
      @media print { body { margin: 0; padding: 10mm; } @page { size: A4 landscape; margin: 8mm; } }
      body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; margin: 20px auto; max-width: 1200px; }
      .rp-title { text-align:center; font-size:15px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; margin:8px 0 2px; color:#1e293b; }
      .rp-period { text-align:center; font-size:11px; color:#6b7280; margin-bottom:12px; }
      table { width:100%; border-collapse:collapse; font-size:10px; }
      th { background:#f1f5f9; border:1px solid #cbd5e1; padding:5px 6px; font-weight:700; text-transform:uppercase; font-size:9px; }
      td { border:1px solid #e2e8f0; padding:4px 6px; }
    </style></head><body onload="(window.__ktPrint||window.print)()">
      ${renderPrintHeaderHtml()}
      <div class="rp-title">${escHtml(title)}</div>
      ${period}
      <table><thead>${thead}</thead><tbody>${tbody}</tbody></table>
    </body></html>`;
    openPrintWindow(html);
  };

  const reportTabs = [
    { id: "booking", label: "Booking Register", icon: Package },
    { id: "vendorLedger", label: "Vendor Payables", icon: Handshake },
    { id: "partyLedger", label: "Customer Outstanding", icon: Building2 },
    { id: "profitability", label: "Trip Profitability", icon: TrendingUp },
    { id: "gst", label: "GST Tax Compliance", icon: Landmark },
  ];

  // Render pagination footer control
  const renderPagination = () => {
    if (activeTab === "gst" || totalRecordsCount === 0) return null;

    const startIdx = (currentPage - 1) * pageSize + 1;
    const endIdx = Math.min(currentPage * pageSize, totalRecordsCount);

    return (
      <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-[#E5EAEB] dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B] dark:text-slate-400">
          <span>
            Showing <strong className="text-[#111827] dark:text-slate-200">{startIdx}</strong> to{" "}
            <strong className="text-[#111827] dark:text-slate-200">{endIdx}</strong> of{" "}
            <strong className="text-[#111827] dark:text-slate-200">{totalRecordsCount}</strong> records
          </span>

          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 dark:border-slate-700 pl-3">
            <CustomSelect
              value={pageSize}
              onChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}
              options={[
                { label: "10 per page", value: 10 },
                { label: "25 per page", value: 25 },
                { label: "50 per page", value: 50 },
                { label: "100 per page", value: 100 },
              ]}
              className="w-32"
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            title="First Page"
            aria-label="First page"
            className="p-1.5 rounded-lg border border-[#D9E2E3] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#64748B] dark:text-slate-300 hover:bg-[#F7F8F8] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            title="Previous Page"
            aria-label="Previous page"
            className="p-1.5 rounded-lg border border-[#D9E2E3] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#64748B] dark:text-slate-300 hover:bg-[#F7F8F8] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 px-2">
            <span className="text-xs font-semibold text-[#111827] dark:text-slate-200">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            title="Next Page"
            aria-label="Next page"
            className="p-1.5 rounded-lg border border-[#D9E2E3] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#64748B] dark:text-slate-300 hover:bg-[#F7F8F8] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            title="Last Page"
            aria-label="Last page"
            className="p-1.5 rounded-lg border border-[#D9E2E3] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#64748B] dark:text-slate-300 hover:bg-[#F7F8F8] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-[#E5EAEB] dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E7F1F2] dark:bg-slate-800 flex items-center justify-center text-[#2F8E86] font-bold text-lg shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#111827] dark:text-white tracking-tight">
                Operational & Financial Reports Suite
              </h1>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                Consignment registers, vendor payable ledgers, customer balances, trip profitability & GST liabilities
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-[#E7F1F2] dark:hover:bg-slate-700 text-[#25776F] dark:text-teal-300 font-bold rounded-xl text-xs border border-[#D9E2E3] dark:border-slate-700 transition flex items-center gap-2 shrink-0 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 p-4 shadow-xs space-y-4">
        {/* Horizontal Navigation Tabs */}
        <div className="flex items-center gap-2 w-full overflow-x-auto pb-1 scrollbar-thin">
          {reportTabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ReportTab)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? "bg-[#2F8E86] text-white shadow-xs"
                    : "bg-[#F7F8F8] dark:bg-slate-800 text-[#64748B] dark:text-slate-300 hover:bg-[#E7F1F2] dark:hover:bg-slate-700 hover:text-[#25776F] border border-[#E5EAEB] dark:border-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Controls Bar with CustomSelect & DateRangePicker */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E5EAEB] dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Search Box */}
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search name, GR, invoice, route..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-[#F7F8F8] dark:bg-slate-800/80 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-xs text-[#111827] dark:text-slate-100 placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2F8E86] focus:ring-1 focus:ring-[#2F8E86] transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Party Filter Dropdown (Booking Register) */}
            {activeTab === "booking" && (
              <CustomSelect
                value={partyFilter}
                onChange={(val) => setPartyFilter(String(val))}
                icon={<Building2 className="w-3.5 h-3.5" />}
                searchable={true}
                options={[
                  { label: `All Parties (${uniqueParties.length})`, value: "ALL" },
                  ...uniqueParties.map((p) => ({
                    label: p.name,
                    value: p.name,
                    badge: p.count,
                  })),
                ]}
                className="w-full sm:w-auto min-w-[180px]"
              />
            )}

            {/* Bill Type Filter (Booking Register) */}
            {activeTab === "booking" && (
              <CustomSelect
                value={billTypeFilter}
                onChange={(val) => setBillTypeFilter(val as BillTypeFilter)}
                icon={<CreditCard className="w-3.5 h-3.5" />}
                options={[
                  { label: "All Bill Types", value: "ALL" },
                  { label: "TBB (To Be Billed)", value: "TBB" },
                  { label: "PAID", value: "PAID" },
                  { label: "TO PAY", value: "TO_PAY" },
                ]}
                className="w-full sm:w-auto min-w-[150px]"
              />
            )}
          </div>

          {/* 2 Separate Date Pickers (From Date & To Date) */}
          {(activeTab === "profitability" || activeTab === "gst" || activeTab === "booking") && (
            <div className="flex flex-wrap items-center gap-2 text-xs w-full lg:w-auto justify-end">
              <div className="flex items-center gap-1.5">
                <DatePicker
                  value={fromDate}
                  onChange={(d) => setFromDate(d)}
                  placeholder="From Date"
                  maxDate={toDate || new Date().toISOString().slice(0, 10)}
                  align="right"
                />
                <span className="text-slate-400 font-semibold text-xs">to</span>
                <DatePicker
                  value={toDate}
                  onChange={(d) => setToDate(d)}
                  placeholder="To Date"
                  minDate={fromDate}
                  maxDate={new Date().toISOString().slice(0, 10)}
                  align="right"
                />
              </div>

              {/* Quick Presets */}
              <div className="hidden sm:flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleSetThisMonth}
                  className="px-2.5 py-1.5 rounded-xl border border-[#D9E2E3] dark:border-slate-700 bg-[#F7F8F8] dark:bg-slate-800 text-[11px] font-semibold text-[#64748B] dark:text-slate-300 hover:bg-[#E7F1F2] dark:hover:bg-slate-700 hover:text-[#25776F] transition cursor-pointer"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={handleSetLastMonth}
                  className="px-2.5 py-1.5 rounded-xl border border-[#D9E2E3] dark:border-slate-700 bg-[#F7F8F8] dark:bg-slate-800 text-[11px] font-semibold text-[#64748B] dark:text-slate-300 hover:bg-[#E7F1F2] dark:hover:bg-slate-700 hover:text-[#25776F] transition cursor-pointer"
                >
                  Last Month
                </button>
                <button
                  type="button"
                  onClick={handleSetLast30Days}
                  className="px-2.5 py-1.5 rounded-xl border border-[#D9E2E3] dark:border-slate-700 bg-[#F7F8F8] dark:bg-slate-800 text-[11px] font-semibold text-[#64748B] dark:text-slate-300 hover:bg-[#E7F1F2] dark:hover:bg-slate-700 hover:text-[#25776F] transition cursor-pointer"
                >
                  Last 30 Days
                </button>
              </div>

              {(fromDate || toDate || searchQuery || billTypeFilter !== "ALL" || partyFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                    setSearchQuery("");
                    setBillTypeFilter("ALL");
                    setPartyFilter("ALL");
                  }}
                  title="Clear all filters"
                  className="p-2 text-xs text-[#D95C5C] hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer flex items-center gap-1 border border-rose-200 dark:border-rose-900/50"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold">Clear</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800">
          <div className="w-8 h-8 mx-auto border-3 border-[#2F8E86] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-xs font-semibold text-[#64748B] dark:text-slate-400">Loading report records...</p>
        </div>
      )}

      {/* ============================================================= */}
      {/* REPORT 1: BOOKING REGISTER (With Party Filter & Bulk Print)    */}
      {/* ============================================================= */}
      {activeTab === "booking" && !loading && (
        <div className="space-y-4">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Total Bookings</p>
              <p className="text-2xl font-extrabold text-[#111827] dark:text-white mt-1">
                {filteredBookingRecords.length}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Total Freight</p>
              <p className="text-xl font-bold text-[#111827] dark:text-slate-200 font-mono mt-1">
                {formatCurrency(filteredBookingRecords.reduce((s, r) => s + (r.totalFreight || 0), 0))}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Grand Total (with GST)</p>
              <p className="text-xl font-bold text-[#2F8E86] font-mono mt-1">
                {formatCurrency(filteredBookingRecords.reduce((s, r) => s + (r.grandTotal || 0), 0))}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Outstanding Due</p>
              <p className="text-xl font-bold text-[#D95C5C] font-mono mt-1">
                {formatCurrency(filteredBookingRecords.reduce((s, r) => s + (r.dueAmount || 0), 0))}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs overflow-hidden">
            {/* Table Header Bar with Bulk Print Bilties Action */}
            <div className="px-6 py-4 bg-[#F7F8F8] dark:bg-slate-800/60 border-b border-[#E5EAEB] dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-200">
                  Consignment Booking Register
                </span>
                <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400">
                  ({filteredBookingRecords.length} bill{filteredBookingRecords.length === 1 ? "" : "s"}
                  {partyFilter !== "ALL" ? ` for ${partyFilter}` : ""})
                </span>
              </div>

              {/* Bulk Bilty Printing CTA */}
              <div className="flex items-center gap-2.5">
                {selectedShipmentIds.length > 0 && (
                  <span className="text-xs font-bold text-[#2F8E86]">
                    {selectedShipmentIds.length} selected
                  </span>
                )}
                <button
                  onClick={handleInitiateBulkPrint}
                  disabled={filteredBookingRecords.length === 0}
                  title="Print all selected or filtered bilties with copy options"
                  className="px-3.5 py-1.5 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>
                    {selectedShipmentIds.length > 0
                      ? `Print Selected Bilties (${selectedShipmentIds.length})`
                      : `Print All Bilties (${filteredBookingRecords.length})`}
                  </span>
                </button>
              </div>
            </div>

            {/* Scrollable Single-Line Table (No line wrapping/stacking) */}
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-[#F7F8F8] dark:bg-slate-800/40 border-b border-[#E5EAEB] dark:border-slate-800 text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-3 px-3 text-center w-10">
                      <button
                        onClick={toggleSelectAll}
                        aria-label="Select all shipments"
                        className="text-[#64748B] hover:text-[#2F8E86] transition cursor-pointer"
                      >
                        {isAllSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#2F8E86]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-4">GR No</th>
                    <th className="py-3 px-4">Booking Date</th>
                    <th className="py-3 px-4 text-center">Bill Type</th>
                    <th className="py-3 px-4">Consignor (Sender)</th>
                    <th className="py-3 px-4">Consignee (Customer / Receiver)</th>
                    <th className="py-3 px-4">Route</th>
                    <th className="py-3 px-4">Vehicle No</th>
                    <th className="py-3 px-4 text-right">Freight</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4 text-right">Due</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAEB] dark:divide-slate-800">
                  {paginatedBooking.length > 0 ? (
                    paginatedBooking.map((r) => {
                      const isSelected = r.id ? selectedShipmentIds.includes(r.id) : false;
                      return (
                        <tr
                          key={r.id ?? r.shipmentNo}
                          className={`hover:bg-[#F5FAFA] dark:hover:bg-slate-800/60 transition whitespace-nowrap ${
                            isSelected ? "bg-teal-50/40 dark:bg-teal-950/20" : ""
                          }`}
                        >
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => toggleSelectRow(r.id)}
                              aria-label={`Select shipment ${r.shipmentNo}`}
                              className="text-[#64748B] hover:text-[#2F8E86] transition cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#2F8E86]" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-[#2F8E86]">{r.shipmentNo || "—"}</td>
                          <td className="py-3 px-4 text-[#64748B] dark:text-slate-400">{r.shipmentDate ? formatDate(r.shipmentDate) : "—"}</td>
                          <td className="py-3 px-4 text-center">{renderPaymentTermBadge(r.paymentTerm)}</td>
                          <td className="py-3 px-4 font-semibold text-[#111827] dark:text-slate-200">{r.consignorName || "—"}</td>
                          <td className="py-3 px-4 text-[#64748B] dark:text-slate-300 font-medium">{r.consigneeName || "—"}</td>
                          <td className="py-3 px-4 text-[#64748B] dark:text-slate-400">
                            {r.fromLocation || "—"} → {r.toLocation || "—"}
                          </td>
                          <td className="py-3 px-4 font-mono text-[#64748B] dark:text-slate-400">{r.truckNo || "—"}</td>
                          <td className="py-3 px-4 text-right font-mono text-[#111827] dark:text-slate-200">{formatCurrency(r.totalFreight || 0)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#2F9E8F]">{formatCurrency(r.grandTotal || 0)}</td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-[#D95C5C]">{formatCurrency(r.dueAmount || 0)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-[#E7F1F2] dark:bg-slate-800 text-[#25776F] dark:text-teal-300 border-[#D9E2E3] dark:border-slate-700">
                              {statusLabel(r.status)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleInitiateRowPrint(r)}
                              title="Print Bilty (Customer / Consignee Copy)"
                              className="px-2.5 py-1 rounded-lg border border-[#D9E2E3] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#2F8E86] hover:bg-[#E7F1F2] dark:hover:bg-slate-700 transition cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold shadow-2xs"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Print</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={13} className="py-12 text-center text-[#64748B] dark:text-slate-400">
                        No consignment bookings found matching the selected filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {renderPagination()}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* REPORT 2: VENDOR PAYABLES (Single-Line Horizontally Scrollable) */}
      {/* ============================================================= */}
      {activeTab === "vendorLedger" && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Active Vendors / Brokers</p>
              <p className="text-2xl font-extrabold text-[#111827] dark:text-white mt-1">
                {filteredVendorLedger.length}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Total Lorry Hire Cost</p>
              <p className="text-xl font-bold text-[#111827] dark:text-slate-200 font-mono mt-1">
                {formatCurrency(filteredVendorLedger.reduce((s, v) => s + (v.totalHireAmount || 0), 0))}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Advances Paid</p>
              <p className="text-xl font-bold text-[#2F9E8F] font-mono mt-1">
                {formatCurrency(filteredVendorLedger.reduce((s, v) => s + (v.totalAdvancePaid || 0), 0))}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Net Balance Payable</p>
              <p className="text-xl font-bold text-[#D95C5C] font-mono mt-1">
                {formatCurrency(filteredVendorLedger.reduce((s, v) => s + (v.totalBalancePayable || 0), 0))}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-[#F7F8F8] dark:bg-slate-800/60 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-200">
                Market Fleet Vendor & Broker Payable Ledger
              </span>
              <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400">
                {filteredVendorLedger.length} vendor{filteredVendorLedger.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-[#F7F8F8] dark:bg-slate-800/40 border-b border-[#E5EAEB] dark:border-slate-800 text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-3 px-4">Vendor / Broker Name</th>
                    <th className="py-3 px-4">PAN</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4 text-right">Total Hire Amount</th>
                    <th className="py-3 px-4 text-right">Advances Paid</th>
                    <th className="py-3 px-4 text-right">TDS Deducted</th>
                    <th className="py-3 px-4 text-right">Net Balance Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAEB] dark:divide-slate-800">
                  {paginatedVendor.length > 0 ? (
                    paginatedVendor.map((v) => (
                      <tr key={v.vendorId} className="hover:bg-[#F5FAFA] dark:hover:bg-slate-800/60 transition whitespace-nowrap">
                        <td className="py-3 px-4 font-bold text-[#111827] dark:text-white">{v.vendorName}</td>
                        <td className="py-3 px-4 font-mono text-[#64748B] dark:text-slate-400">{v.panNo || "No PAN"}</td>
                        <td className="py-3 px-4 font-mono text-[#64748B] dark:text-slate-400">{v.mobile || "—"}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#111827] dark:text-slate-200">{formatCurrency(v.totalHireAmount)}</td>
                        <td className="py-3 px-4 text-right font-mono text-[#2F9E8F] font-semibold">{formatCurrency(v.totalAdvancePaid)}</td>
                        <td className="py-3 px-4 text-right font-mono text-[#64748B] dark:text-slate-400">{formatCurrency(v.totalTdsDeducted)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#D95C5C]">{formatCurrency(v.totalBalancePayable)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#64748B] dark:text-slate-400">
                        No vendor ledger records available matching your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {renderPagination()}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* REPORT 3: CUSTOMER OUTSTANDING                                */}
      {/* ============================================================= */}
      {activeTab === "partyLedger" && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Total Billed</p>
              <p className="text-xl font-bold text-[#111827] dark:text-slate-200 font-mono mt-1">
                {formatCurrency(filteredPartyLedger.reduce((s, p) => s + (p.totalBilledAmount || 0), 0))}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Total Received</p>
              <p className="text-xl font-bold text-[#2F9E8F] font-mono mt-1">
                {formatCurrency(filteredPartyLedger.reduce((s, p) => s + (p.totalPaidAmount || 0), 0))}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Outstanding Balance</p>
              <p className="text-xl font-bold text-[#D95C5C] font-mono mt-1">
                {formatCurrency(filteredPartyLedger.reduce((s, p) => s + (p.totalOutstandingDue || 0), 0))}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-[#F7F8F8] dark:bg-slate-800/60 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-200">
                Customer / Party Accounts Receivable Ledger
              </span>
              <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400">
                {filteredPartyLedger.length} customer{filteredPartyLedger.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-[#F7F8F8] dark:bg-slate-800/40 border-b border-[#E5EAEB] dark:border-slate-800 text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-3 px-4">Party Name</th>
                    <th className="py-3 px-4">GSTIN</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4 text-right">Total Billed</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4 text-right">Balance Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAEB] dark:divide-slate-800">
                  {paginatedParty.length > 0 ? (
                    paginatedParty.map((p) => (
                      <tr key={p.partyId} className="hover:bg-[#F5FAFA] dark:hover:bg-slate-800/60 transition whitespace-nowrap">
                        <td className="py-3 px-4 font-bold text-[#111827] dark:text-white">{p.partyName}</td>
                        <td className="py-3 px-4 font-mono text-[#64748B] dark:text-slate-400">{p.gstNo || "Unregistered"}</td>
                        <td className="py-3 px-4 font-mono text-[#64748B] dark:text-slate-400">{p.mobile || "—"}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#111827] dark:text-slate-200">{formatCurrency(p.totalBilledAmount)}</td>
                        <td className="py-3 px-4 text-right font-mono text-[#2F9E8F] font-semibold">{formatCurrency(p.totalPaidAmount)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#D95C5C]">{formatCurrency(p.totalOutstandingDue)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#64748B] dark:text-slate-400">No party ledger records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {renderPagination()}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* REPORT 4: TRIP PROFITABILITY                                  */}
      {/* ============================================================= */}
      {activeTab === "profitability" && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Total Freight Revenue</p>
              <p className="text-xl font-bold text-[#111827] dark:text-slate-200 font-mono mt-1">
                {formatCurrency(profitability?.totalFreightRevenue || 0)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Fuel & On-Road Expenses</p>
              <p className="text-xl font-bold text-[#D95C5C] font-mono mt-1">
                {formatCurrency(
                  (profitability?.totalDriverCashAdvance || 0) +
                  (profitability?.totalDieselAdvance || 0) +
                  (profitability?.totalOnRoadExpenses || 0)
                )}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Net Trip Profit</p>
              <p className="text-xl font-bold text-[#2F9E8F] font-mono mt-1">
                {formatCurrency(profitability?.netTripProfit || 0)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Average Profit Margin</p>
              <p className="text-2xl font-bold text-[#2F8E86] mt-1">
                {profitability?.profitMarginPercentage?.toFixed(1) || "0.0"}%
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-[#F7F8F8] dark:bg-slate-800/60 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-200">
                Trip Margins Breakdown
              </span>
              <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400">
                {filteredTripProfitability.length} trip{filteredTripProfitability.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-[#F7F8F8] dark:bg-slate-800/40 border-b border-[#E5EAEB] dark:border-slate-800 text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-3 px-4">Trip No</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Vehicle & Driver</th>
                    <th className="py-3 px-4">Route</th>
                    <th className="py-3 px-4 text-right">Revenue</th>
                    <th className="py-3 px-4 text-right">Total Cost</th>
                    <th className="py-3 px-4 text-right">Net Profit</th>
                    <th className="py-3 px-4 text-right">Margin (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAEB] dark:divide-slate-800">
                  {paginatedTrips.length > 0 ? (
                    paginatedTrips.map((td) => (
                      <tr key={td.tripId} className="hover:bg-[#F5FAFA] dark:hover:bg-slate-800/60 transition whitespace-nowrap">
                        <td className="py-3 px-4 font-mono font-bold text-[#2F8E86]">{td.tripNo}</td>
                        <td className="py-3 px-4 text-[#64748B] dark:text-slate-400">{formatDate(td.tripDate)}</td>
                        <td className="py-3 px-4 font-medium text-[#111827] dark:text-slate-200">{td.vehicleNo} ({td.driverName || "Driver"})</td>
                        <td className="py-3 px-4 text-[#64748B] dark:text-slate-400">{td.originLocation} → {td.destinationLocation}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#111827] dark:text-slate-200">{formatCurrency(td.revenue)}</td>
                        <td className="py-3 px-4 text-right font-mono text-[#D95C5C]">{formatCurrency(td.totalCost)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#2F9E8F]">{formatCurrency(td.netProfit)}</td>
                        <td className="py-3 px-4 text-right font-bold text-[#2F8E86]">{td.profitMarginPct?.toFixed(1)}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#64748B] dark:text-slate-400">No trip profitability records found for this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {renderPagination()}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* REPORT 5: GST TAX COMPLIANCE SUMMARY                           */}
      {/* ============================================================= */}
      {activeTab === "gst" && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Taxable Freight (Regular)</p>
              <p className="text-xl font-bold text-[#111827] dark:text-slate-200 font-mono mt-1">
                {formatCurrency(gstSummary?.totalTaxableFreight || 0)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">GST RCM Freight (Reverse)</p>
              <p className="text-xl font-bold text-[#2F8E86] font-mono mt-1">
                {formatCurrency(gstSummary?.totalGstRcmFreight || 0)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Exempt & Non-Taxable</p>
              <p className="text-xl font-bold text-[#94A3B8] font-mono mt-1">
                {formatCurrency(gstSummary?.totalNonTaxableFreight || 0)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
              <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400">Total GST Tax Collected</p>
              <p className="text-xl font-bold text-[#2F8E86] font-mono mt-1">
                {formatCurrency(gstSummary?.totalTaxCollected || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Copy Selection Print Options Modal */}
      <PrintOptionsModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        onPrint={handleExecutePrint}
        title={printModalTitle}
        subtitle={printModalSubtitle}
        defaultKinds={["consignee"]} // Default target is Customer (Consignee) copy
      />
    </div>
  );
}

export default function ReportsPage() {
  return (
    <PagePermissionGuard permission="reports.view" moduleName="Reports & Analytics">
      <Suspense fallback={<div className="p-6 text-slate-400">Loading reports hub...</div>}>
        <ReportsContent />
      </Suspense>
    </PagePermissionGuard>
  );
}
