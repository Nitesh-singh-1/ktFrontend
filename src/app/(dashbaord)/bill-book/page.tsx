"use client";

import React, { useState, useEffect, useMemo } from "react";
import { invoiceService } from "../../../../services/invoiceService";
import {
  UnbilledShipment,
  PartyUnbilledSummary,
  InvoiceDto,
} from "@/types/tms";
import { getTenantPrintProfile } from "@/utils/print/tenantProfile";
import { numberToWords } from "@/utils/numberToWords";
import { formatCurrency, formatDate } from "@/utils/configFormatter";
import { toast } from "@/context/ToastContext";
import { sweetAlert } from "@/app/components/ui/SweetAlert";
import {
  BookOpen,
  Search,
  Printer,
  FileText,
  User,
  Building2,
  CheckSquare,
  Square,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Calendar,
  IndianRupee,
  RefreshCw,
  X,
  ArrowRight,
  Receipt,
  Download,
  Share2,
  Copy,
  Truck,
  Percent,
  Layers,
  ChevronDown,
  Check,
  Send,
} from "lucide-react";
import PagePermissionGuard from "@/app/components/ui/PagePermissionGuard";

function BillBookContent() {
  const [parties, setParties] = useState<PartyUnbilledSummary[]>([]);
  const [selectedParty, setSelectedParty] = useState<string>("");
  const [partySearch, setPartySearch] = useState<string>("");
  const [unbilledShipments, setUnbilledShipments] = useState<UnbilledShipment[]>([]);
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<number[]>([]);
  const [loadingParties, setLoadingParties] = useState(true);
  const [loadingShipments, setLoadingShipments] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Filter & Search within Party's Bilties
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>("ALL");
  const [biltySearchFilter, setBiltySearchFilter] = useState<string>("");

  // Billing Configuration Form
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split("T")[0];
  });
  const [billingMonth, setBillingMonth] = useState(() => {
    const d = new Date();
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  });
  const [taxRate, setTaxRate] = useState<number | string>(0);
  const [otherCharges, setOtherCharges] = useState<number | string>(0);
  const [discount, setDiscount] = useState<number | string>(0);
  const [paidNow, setPaidNow] = useState<number | string>(0);
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [remarks, setRemarks] = useState("");
  const [preparedBy, setPreparedBy] = useState("Operator");
  const [checkedBy, setCheckedBy] = useState("Manager");

  // Print Preview Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<InvoiceDto | null>(null);
  const [billedShipmentsForPrint, setBilledShipmentsForPrint] = useState<UnbilledShipment[]>([]);

  // Tab Switcher ("generate" | "history")
  const [activeTab, setActiveTab] = useState<"generate" | "history">("generate");
  const [historyInvoices, setHistoryInvoices] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>("");

  const printProfile = getTenantPrintProfile();

  useEffect(() => {
    loadUnbilledParties();
    loadHistoryInvoices();
  }, []);

  const loadHistoryInvoices = async (searchTerm = historySearch, status = historyStatusFilter) => {
    try {
      setLoadingHistory(true);
      const res = await invoiceService.getInvoices({
        search: searchTerm || undefined,
        paymentStatus: status !== "" ? Number(status) : undefined,
      });
      setHistoryInvoices(res || []);
    } catch (err: any) {
      console.error("Load history invoices error:", err);
      sweetAlert.error({
        title: "Failed to load history",
        message: err?.message || "Failed to load invoice history.",
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleViewHistoryInvoice = async (invId: number) => {
    try {
      const inv = await invoiceService.getInvoiceById(invId);
      if (!inv) return;
      setGeneratedInvoice(inv as any);

      // Map invoice items to printable bilty structure. Prefer the extended
      // per-item API fields (shipmentDate / toLocation / deliveryDate /
      // totalWeightKg / chargeItems) when present, falling back to the legacy
      // description-regex parse for older invoices that pre-date the extension.
      const printItems = (inv.items || []).map((item: any, idx: number) => {
        let toLocFallback = "Destination";
        let wtFallback = 0;
        if (item.description) {
          const routeMatch = item.description.match(/to\s+([^|]+)/i);
          if (routeMatch) toLocFallback = routeMatch[1].trim();
          const wtMatch = item.description.match(/Wt:\s*([0-9.]+)/i);
          if (wtMatch) wtFallback = parseFloat(wtMatch[1]) || 0;
        }
        return {
          id: item.shipmentId || idx,
          shipmentNo: item.shipmentNo || `GR-${idx + 1}`,
          shipmentDate: item.shipmentDate ?? inv.invoiceDate,
          totalPackages: item.quantity || 1,
          totalWeightKg: item.totalWeightKg ?? wtFallback,
          toLocation: item.toLocation ?? toLocFallback,
          deliveryDate: item.deliveryDate ?? null,
          rate: item.rate,
          totalFreight: item.amount || item.totalAmount,
          grandTotal: item.totalAmount || item.amount,
          chargeItems: item.chargeItems ?? undefined,
        };
      });

      setBilledShipmentsForPrint(
        printItems.length > 0
          ? printItems
          : [
              {
                id: inv.id,
                shipmentNo: inv.invoiceNo,
                shipmentDate: inv.invoiceDate,
                totalPackages: 1,
                totalWeightKg: 0,
                toLocation: "Consolidated Freight",
                deliveryDate: null,
                rate: inv.grandTotal,
                totalFreight: inv.grandTotal,
                grandTotal: inv.grandTotal,
              } as any,
            ]
      );
      setIsPrintModalOpen(true);
    } catch (err: any) {
      console.error("View invoice error:", err);
      sweetAlert.error({
        title: "Failed to open invoice",
        message: err?.message || "Failed to load invoice print preview.",
      });
    }
  };

  const loadUnbilledParties = async () => {
    try {
      setLoadingParties(true);
      const res = await invoiceService.getUnbilledParties();
      setParties(res || []);
      if (res && res.length > 0 && !selectedParty) {
        handleSelectParty(res[0].partyName);
      }
    } catch (err: any) {
      console.error("Load unbilled parties error:", err);
      sweetAlert.error({
        title: "Failed to load parties",
        message: err?.message || "Failed to load unbilled parties list.",
      });
    } finally {
      setLoadingParties(false);
    }
  };

  const handleSelectParty = async (partyName: string) => {
    setSelectedParty(partyName);
    setSelectedShipmentIds([]);
    setSelectedMonthFilter("ALL");
    setBiltySearchFilter("");
    try {
      setLoadingShipments(true);
      const shipments = await invoiceService.getUnbilledByParty(partyName);
      setUnbilledShipments(shipments || []);
      // By default, select all unbilled bilties for this party
      setSelectedShipmentIds((shipments || []).map((s) => s.id));
    } catch (err: any) {
      console.error("Load unbilled shipments error:", err);
      sweetAlert.error({
        title: "Failed to load bilties",
        message: err?.message || "Failed to load party bilties.",
      });
    } finally {
      setLoadingShipments(false);
    }
  };

  // Distinct months detected from this party's unbilled bilties
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    unbilledShipments.forEach((s) => {
      if (s.shipmentDate) {
        try {
          const d = new Date(s.shipmentDate);
          if (!isNaN(d.getTime())) {
            monthsSet.add(
              d.toLocaleString("default", { month: "long", year: "numeric" })
            );
          }
        } catch {}
      }
    });
    return Array.from(monthsSet);
  }, [unbilledShipments]);

  // Filtered shipments based on selected month filter and search term
  const filteredShipments = useMemo(() => {
    return unbilledShipments.filter((s) => {
      if (selectedMonthFilter !== "ALL" && s.shipmentDate) {
        try {
          const d = new Date(s.shipmentDate);
          const m = d.toLocaleString("default", {
            month: "long",
            year: "numeric",
          });
          if (m !== selectedMonthFilter) return false;
        } catch {}
      }
      if (biltySearchFilter.trim()) {
        const q = biltySearchFilter.toLowerCase();
        const no = (s.shipmentNo || "").toLowerCase();
        const from = (s.fromLocation || "").toLowerCase();
        const to = (s.toLocation || "").toLowerCase();
        if (!no.includes(q) && !from.includes(q) && !to.includes(q)) return false;
      }
      return true;
    });
  }, [unbilledShipments, selectedMonthFilter, biltySearchFilter]);

  // Aggregate monthly work summary for this party in the selected month
  const partyMonthlyWorkSummary = useMemo(() => {
    const target =
      selectedMonthFilter === "ALL"
        ? unbilledShipments
        : unbilledShipments.filter((s) => {
            if (!s.shipmentDate) return false;
            try {
              const d = new Date(s.shipmentDate);
              return (
                d.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                }) === selectedMonthFilter
              );
            } catch {
              return false;
            }
          });

    const count = target.length;
    const pkgs = target.reduce((sum, s) => sum + (s.totalPackages || 1), 0);
    const weight = target.reduce((sum, s) => sum + (s.totalWeightKg || 0), 0);
    const amount = target.reduce(
      (sum, s) => sum + (s.grandTotal > 0 ? s.grandTotal : s.totalFreight || 0),
      0
    );
    return { count, pkgs, weight, amount };
  }, [unbilledShipments, selectedMonthFilter]);

  // Handle month filter change
  const handleSelectMonthFilter = (month: string) => {
    setSelectedMonthFilter(month);
    if (month !== "ALL") {
      setBillingMonth(month);
      const matchingIds = unbilledShipments
        .filter((s) => {
          if (!s.shipmentDate) return false;
          try {
            const d = new Date(s.shipmentDate);
            return (
              d.toLocaleString("default", {
                month: "long",
                year: "numeric",
              }) === month
            );
          } catch {
            return false;
          }
        })
        .map((s) => s.id);
      setSelectedShipmentIds(matchingIds);
    } else {
      setSelectedShipmentIds(unbilledShipments.map((s) => s.id));
    }
  };

  // Toggle Bilty Selection
  const handleToggleShipment = (id: number) => {
    if (selectedShipmentIds.includes(id)) {
      setSelectedShipmentIds(selectedShipmentIds.filter((x) => x !== id));
    } else {
      setSelectedShipmentIds([...selectedShipmentIds, id]);
    }
  };

  const handleSelectAll = () => {
    const currentFilteredIds = filteredShipments.map((s) => s.id);
    const allFilteredSelected = currentFilteredIds.every((id) =>
      selectedShipmentIds.includes(id)
    );
    if (allFilteredSelected) {
      setSelectedShipmentIds(
        selectedShipmentIds.filter((id) => !currentFilteredIds.includes(id))
      );
    } else {
      const combined = Array.from(
        new Set([...selectedShipmentIds, ...currentFilteredIds])
      );
      setSelectedShipmentIds(combined);
    }
  };

  // Filtered party list for party dropdown / search
  const filteredParties = useMemo(() => {
    if (!partySearch.trim()) return parties;
    const q = partySearch.toLowerCase();
    return parties.filter((p) => p.partyName.toLowerCase().includes(q));
  }, [parties, partySearch]);

  // Overall KPIs
  const totalUnbilledParties = parties.length;
  const totalPendingBilties = useMemo(
    () => parties.reduce((sum, p) => sum + (p.unbilledCount || 0), 0),
    [parties]
  );
  const totalPendingFreight = useMemo(
    () => parties.reduce((sum, p) => sum + (p.totalUnbilledAmount || 0), 0),
    [parties]
  );
  const totalGeneratedBills = historyInvoices.length;

  // Selected Bilties
  const activeSelectedShipments = useMemo(() => {
    return unbilledShipments.filter((s) => selectedShipmentIds.includes(s.id));
  }, [unbilledShipments, selectedShipmentIds]);

  // Calculations
  const calculations = useMemo(() => {
    const totalPackages = activeSelectedShipments.reduce(
      (sum, s) => sum + (s.totalPackages || 1),
      0
    );
    const totalWeight = activeSelectedShipments.reduce(
      (sum, s) => sum + (s.totalWeightKg || 0),
      0
    );
    const subTotal = activeSelectedShipments.reduce(
      (sum, s) => sum + (s.grandTotal > 0 ? s.grandTotal : s.totalFreight || 0),
      0
    );

    const numTaxRate = Number(taxRate) || 0;
    const taxAmount = (subTotal * numTaxRate) / 100;
    const numOther = Number(otherCharges) || 0;
    const numDiscount = Number(discount) || 0;
    const grandTotal = Math.max(0, subTotal + taxAmount + numOther - numDiscount);
    const numPaid = Number(paidNow) || 0;
    const dueAmount = Math.max(0, grandTotal - numPaid);

    return {
      totalPackages,
      totalWeight,
      subTotal,
      taxAmount,
      grandTotal,
      dueAmount,
    };
  }, [activeSelectedShipments, taxRate, otherCharges, discount, paidNow]);

  const printTotals = useMemo(() => {
    const pkgTotal = billedShipmentsForPrint.reduce(
      (sum, s) => sum + (s.totalPackages || 1),
      0
    );
    const wtTotal = billedShipmentsForPrint.reduce(
      (sum, s) => sum + (s.totalWeightKg || 0),
      0
    );
    return { pkgTotal, wtTotal };
  }, [billedShipmentsForPrint]);

  // Dynamic per-charge column set
  const dynamicChargeCols = useMemo(() => {
    const names = new Set<string>();
    billedShipmentsForPrint.forEach((s) =>
      (s.chargeItems ?? []).forEach((c) => {
        if (c?.chargeName) names.add(c.chargeName);
      })
    );
    return Array.from(names).sort();
  }, [billedShipmentsForPrint]);

  // Per-charge-column totals for the tfoot row
  const dynamicChargeTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    dynamicChargeCols.forEach((name) => {
      totals[name] = billedShipmentsForPrint.reduce((sum, s) => {
        const match = s.chargeItems?.find((c) => c.chargeName === name);
        return sum + (match ? Number(match.amount) || 0 : 0);
      }, 0);
    });
    return totals;
  }, [dynamicChargeCols, billedShipmentsForPrint]);

  // Selected Party Metadata
  const currentPartyInfo = useMemo(() => {
    return (
      parties.find((p) => p.partyName.toLowerCase() === selectedParty.toLowerCase()) || {
        partyName: selectedParty,
        partyGstNo: activeSelectedShipments[0]?.consignorGstNo || "",
        partyAddress: activeSelectedShipments[0]?.consignorAddress || "",
      }
    );
  }, [parties, selectedParty, activeSelectedShipments]);

  // Generate Freight Bill & Open Print
  const handleGenerateFreightBill = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!selectedParty) {
      toast.error("Please select a billing customer / party.");
      return;
    }

    if (selectedShipmentIds.length === 0) {
      toast.error("Please select at least one Bilty to generate the Freight Bill.");
      return;
    }

    try {
      setGenerating(true);

      const res = await invoiceService.createBillBookInvoice({
        invoiceNo: invoiceNo.trim() || undefined,
        partyName: selectedParty,
        partyGstNo: currentPartyInfo.partyGstNo,
        partyAddress: currentPartyInfo.partyAddress,
        billingMonth,
        invoiceDate,
        dueDate,
        shipmentIds: selectedShipmentIds,
        taxRate: Number(taxRate) || 0,
        otherCharges: Number(otherCharges) || 0,
        discount: Number(discount) || 0,
        paidAmount: Number(paidNow) || 0,
        paymentMode,
        remarks: remarks.trim() || undefined,
        preparedBy,
        checkedBy,
      });

      if (res?.success && res.data) {
        toast.success(
          res.message || `Freight Bill ${res.data.invoiceNo} generated successfully!`
        );
        setGeneratedInvoice(res.data);
        setBilledShipmentsForPrint([...activeSelectedShipments]);
        setIsPrintModalOpen(true);
        // Refresh parties and history so state is always up to date
        loadUnbilledParties();
        loadHistoryInvoices();
        setUnbilledShipments([]);
        setSelectedShipmentIds([]);
      } else {
        sweetAlert.error({
          title: "Failed to generate bill",
          message: res?.message || "Failed to generate Freight Bill.",
        });
      }
    } catch (err: any) {
      console.error("Generate Bill Book error:", err);
      sweetAlert.error({
        title: "Error generating bill",
        message: err?.message || "Error generating bill book freight invoice.",
      });
    } finally {
      setGenerating(false);
    }
  };

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  // Share Statement via WhatsApp & Clipboard
  const handleShareBill = () => {
    if (!generatedInvoice) return;
    const billText = `*FREIGHT BILL STATEMENT - ${printProfile.companyName || "KESHRI TRANSPORT"}*\n` +
      `----------------------------------------\n` +
      `Bill No: ${generatedInvoice.invoiceNo}\n` +
      `Customer / Messers: ${generatedInvoice.partyName}\n` +
      `Billing Month: ${billingMonth}\n` +
      `Bill Date: ${formatDate(generatedInvoice.invoiceDate)}\n` +
      `Total Bilties: ${billedShipmentsForPrint.length}\n` +
      `Total Weight: ${printTotals.wtTotal} Kg | Packages: ${printTotals.pkgTotal}\n` +
      `Total Amount: ${formatCurrency(generatedInvoice.grandTotal)}\n` +
      `Payment Due Date: ${generatedInvoice.dueDate ? formatDate(generatedInvoice.dueDate) : "Within 10 Days"}\n` +
      `----------------------------------------\n` +
      `Nb:- Payment should be made within 10 days on receipt of this bill.\n` +
      `Thank you for your business!`;

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(billText);
      toast.success("Bill summary copied to clipboard! Ready to share on WhatsApp or Email.");
    }

    try {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(billText)}`;
      window.open(waUrl, "_blank");
    } catch {}
  };

  return (
    <>
      <div className={`space-y-6 w-full max-w-7xl mx-auto pb-12 ${isPrintModalOpen ? "print:hidden" : ""}`}>
        {/* Page Header Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-[#E5EAEB] dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E7F1F2] dark:bg-slate-800 flex items-center justify-center text-[#2F8E86] font-bold text-lg shadow-xs shrink-0">
              <BookOpen className="w-5 h-5 text-[#2F8E86]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-[#111827] dark:text-white tracking-tight">
                  Bill Book
                </h1>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 bg-[#E7F1F2] dark:bg-slate-800 text-[#25776F] dark:text-teal-300 border border-[#D9E2E3] dark:border-slate-700 rounded-full">
                  Monthly Consolidated Billing
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                Party-wise monthly consolidated billing & customer statements
              </p>
            </div>
          </div>

          {/* Tab Switcher & Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="grid grid-cols-2 p-1 bg-[#F1F5F5] dark:bg-slate-800/80 rounded-xl border border-[#E5EAEB] dark:border-slate-800 flex-1 sm:flex-initial">
              <button
                type="button"
                onClick={() => setActiveTab("generate")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === "generate"
                    ? "bg-[#2F8E86] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#111827] dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>New Bill</span>
                {parties.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
                    {parties.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("history");
                  loadHistoryInvoices();
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === "history"
                    ? "bg-[#2F8E86] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#111827] dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>History</span>
                {historyInvoices.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-[#111827] dark:text-white font-mono">
                    {historyInvoices.length}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={() => (activeTab === "generate" ? loadUnbilledParties() : loadHistoryInvoices())}
              title="Refresh Records"
              className="p-2 border border-[#E5EAEB] dark:border-slate-800 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#111827] dark:text-slate-300 dark:hover:text-white hover:bg-[#F7F8F8] dark:hover:bg-slate-800 transition shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* 4 Financial KPI Overview Cards (FleetPulse Standard) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold truncate">Unbilled Parties</span>
              <Building2 className="w-4 h-4 text-[#2F8E86] shrink-0" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-xl sm:text-2xl font-extrabold text-[#111827] dark:text-white">
                {totalUnbilledParties}
              </p>
            </div>
            <p className="text-[10px] text-[#94A3B8] mt-1 truncate">Customers pending</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold truncate">Pending Bilties</span>
              <Truck className="w-4 h-4 text-[#4A90E2] shrink-0" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-[#111827] dark:text-white">
              {totalPendingBilties}
            </p>
            <p className="text-[10px] text-[#94A3B8] mt-1 truncate">Awaiting billing</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold truncate">Unbilled Freight</span>
              <IndianRupee className="w-4 h-4 text-[#2F8E86] shrink-0" />
            </div>
            <p className="text-base sm:text-xl font-bold text-[#2F8E86] font-mono truncate">
              {formatCurrency(totalPendingFreight)}
            </p>
            <p className="text-[10px] text-[#2F8E86]/80 mt-1 truncate">Ledger pending</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-[#64748B] dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold truncate">Generated Bills</span>
              <FileText className="w-4 h-4 text-[#F4A261] shrink-0" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-[#111827] dark:text-white">
              {totalGeneratedBills}
            </p>
            <p className="text-[10px] text-[#94A3B8] mt-1 truncate">Ready to share</p>
          </div>
        </div>

        {/* TAB 1: GENERATE CONSOLIDATED FREIGHT BILL */}
        {activeTab === "generate" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Party Selection & Bilties DataTable (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Step 1: Party Selector & Monthly Overview Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#E5EAEB] dark:border-slate-800 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-4 h-4 text-[#2F8E86] shrink-0" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-200 truncate">
                      1. Select Party
                    </h2>
                  </div>
                  <span className="text-xs text-[#25776F] dark:text-teal-300 font-bold bg-[#E7F1F2] dark:bg-slate-800 px-2 py-0.5 rounded-full border border-[#D9E2E3] dark:border-slate-700 shrink-0 whitespace-nowrap">
                    {parties.length} Pending
                  </span>
                </div>

                {loadingParties ? (
                  <div className="py-8 text-center text-xs text-[#64748B] dark:text-slate-400">
                    <div className="w-6 h-6 border-2 border-[#2F8E86] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading unbilled customers...
                  </div>
                ) : parties.length === 0 ? (
                  <div className="py-8 text-center text-xs font-medium text-[#64748B] dark:text-slate-400 bg-[#F7F8F8] dark:bg-slate-800/40 rounded-xl border border-dashed border-[#D9E2E3] dark:border-slate-700">
                    No unbilled consignments pending. All booked bilties have been settled or billed.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {/* Search & Select Party */}
                    <div className="space-y-1.5">
                      <div className="relative">
                        <select
                          value={selectedParty}
                          onChange={(e) => handleSelectParty(e.target.value)}
                          className="w-full pl-3.5 pr-10 py-2.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-[#111827] dark:text-white focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86] transition-all cursor-pointer shadow-2xs"
                        >
                          {filteredParties.map((p, idx) => (
                            <option key={idx} value={p.partyName}>
                              {p.partyName} — {p.unbilledCount} Bilties ({formatCurrency(p.totalUnbilledAmount)})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quick Party Chips for top 3 parties */}
                      {parties.length > 1 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[11px] text-[#64748B] font-medium mr-1 dark:text-slate-400">Quick Select:</span>
                          {parties.slice(0, 3).map((p, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectParty(p.partyName)}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition cursor-pointer ${
                                selectedParty === p.partyName
                                  ? "bg-[#2F8E86] text-white border-[#2F8E86] shadow-2xs"
                                  : "bg-[#F7F8F8] dark:bg-slate-800 text-[#111827] dark:text-slate-300 border-[#D9E2E3] dark:border-slate-700 hover:border-[#2F8E86]"
                              }`}
                            >
                              {p.partyName} ({p.unbilledCount})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Selected Party Business Snapshot Card */}
                    {currentPartyInfo && (
                      <div className="p-3.5 sm:p-4 bg-[#E7F1F2]/50 dark:bg-slate-800/80 rounded-xl border border-[#D9E2E3] dark:border-slate-700 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-[#111827] dark:text-white">
                                {currentPartyInfo.partyName}
                              </span>
                              {currentPartyInfo.partyGstNo && (
                                <span className="font-mono text-[11px] font-bold text-[#25776F] dark:text-[#2F8E86] bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-[#D9E2E3] dark:border-slate-700">
                                  GST: {currentPartyInfo.partyGstNo}
                                </span>
                              )}
                            </div>
                            {currentPartyInfo.partyAddress && (
                              <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 truncate max-w-lg">
                                📍 {currentPartyInfo.partyAddress}
                              </div>
                            )}
                          </div>

                          <div className="text-left sm:text-right shrink-0">
                            <span className="font-bold text-[11px] sm:text-xs text-[#2F8E86] bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-[#D9E2E3] dark:border-slate-700 shadow-2xs">
                              {unbilledShipments.length} Available
                            </span>
                          </div>
                        </div>

                        {/* Month Filter Selector & Monthly Work Indicator */}
                        <div className="pt-2.5 border-t border-[#D9E2E3]/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-[#111827] dark:text-slate-300 mr-1 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-[#2F8E86]" />
                              Month:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSelectMonthFilter("ALL")}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                                selectedMonthFilter === "ALL"
                                  ? "bg-[#2F8E86] text-white shadow-2xs"
                                  : "bg-white dark:bg-slate-900 text-[#64748B] border border-[#D9E2E3] dark:border-slate-700 hover:text-[#111827]"
                              }`}
                            >
                              All Unbilled
                            </button>
                            {availableMonths.map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => handleSelectMonthFilter(m)}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                                  selectedMonthFilter === m
                                    ? "bg-[#2F8E86] text-white shadow-2xs"
                                    : "bg-white dark:bg-slate-900 text-[#64748B] border border-[#D9E2E3] dark:border-slate-700 hover:text-[#111827]"
                                }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>

                          {/* Live Monthly Work Total Banner */}
                          <div className="text-xs font-mono font-bold text-[#111827] dark:text-white bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-[#D9E2E3] dark:border-slate-700 w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2">
                            <span>Month Work: <span className="text-[#2F8E86]">{formatCurrency(partyMonthlyWorkSummary.amount)}</span></span>
                            <span className="text-[10px] text-[#64748B] font-sans font-medium dark:text-slate-400">
                              ({partyMonthlyWorkSummary.count} GR • {partyMonthlyWorkSummary.weight}kg)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Bilties DataTable Checklist */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs overflow-hidden">
                {/* DataTable Action Bar */}
                <div className="p-3 sm:p-4 bg-[#F7F8F8] dark:bg-slate-850 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between flex-wrap gap-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#2F8E86] hover:text-[#25776F] cursor-pointer whitespace-nowrap"
                    >
                      {filteredShipments.length > 0 &&
                      filteredShipments.every((s) => selectedShipmentIds.includes(s.id)) ? (
                        <CheckSquare className="w-4 h-4 text-[#2F8E86]" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                      <span>
                        {filteredShipments.length > 0 &&
                        filteredShipments.every((s) => selectedShipmentIds.includes(s.id))
                          ? "Deselect All"
                          : "Select All"}
                      </span>
                    </button>
                    <span className="text-xs text-[#64748B] dark:text-slate-400 font-medium">
                      ({selectedShipmentIds.length}/{filteredShipments.length})
                    </span>
                  </div>

                  {/* Bilty Search Input */}
                  <div className="relative w-full sm:w-48">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={biltySearchFilter}
                      onChange={(e) => setBiltySearchFilter(e.target.value)}
                      placeholder="Filter GR No / City..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-[#111827] dark:text-white focus:ring-1 focus:ring-[#2F8E86]"
                    />
                  </div>
                </div>

                {loadingShipments ? (
                  <div className="py-16 text-center text-xs text-[#64748B] dark:text-slate-400">
                    <div className="w-6 h-6 border-2 border-[#2F8E86] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading consignments for {selectedParty}...
                  </div>
                ) : filteredShipments.length === 0 ? (
                  <div className="py-12 text-center text-xs font-medium text-[#64748B] dark:text-slate-400">
                    No unbilled bilties found matching the current filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                    <table className="w-full text-left text-xs min-w-[660px]">
                      <thead className="bg-[#F7F8F8] dark:bg-slate-800/80 text-[#64748B] dark:text-slate-400 font-semibold border-b border-[#E5EAEB] dark:border-slate-800 uppercase text-[11px] sticky top-0 z-10 whitespace-nowrap">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">Sel</th>
                          <th className="py-2.5 px-3">GR No & Date</th>
                          <th className="py-2.5 px-3">Route (Origin → Destination)</th>
                          <th className="py-2.5 px-3 text-center">Cargo (Pkg / Wt)</th>
                          <th className="py-2.5 px-3 text-right">Freight (₹)</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5EAEB] dark:divide-slate-800 whitespace-nowrap">
                        {filteredShipments.map((s) => {
                          const isChecked = selectedShipmentIds.includes(s.id);
                          const biltyAmount =
                            s.grandTotal > 0 ? s.grandTotal : s.totalFreight || 0;

                          return (
                            <tr
                              key={s.id}
                              onClick={() => handleToggleShipment(s.id)}
                              className={`cursor-pointer transition-colors ${
                                isChecked
                                  ? "bg-[#E7F1F2]/40 dark:bg-slate-800/60"
                                  : "hover:bg-[#F9FAFB] dark:hover:bg-slate-800/40"
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleShipment(s.id);
                                  }}
                                  className="text-[#2F8E86]"
                                >
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-[#2F8E86]" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                  )}
                                </button>
                              </td>

                              <td className="py-2.5 px-3">
                                <div className="font-mono font-bold text-[#2F8E86]">
                                  GR #{s.shipmentNo}
                                </div>
                                <div className="text-[10px] text-[#64748B] dark:text-slate-400">
                                  {formatDate(s.shipmentDate)}
                                </div>
                              </td>

                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5 font-medium text-[#111827] dark:text-slate-200">
                                  <span>{s.fromLocation || "Origin"}</span>
                                  <ArrowRight className="w-3 h-3 text-[#4A90E2] shrink-0" />
                                  <span>{s.toLocation || "Destination"}</span>
                                </div>
                                {s.customerInvoiceNo && (
                                  <div className="text-[10px] font-mono text-slate-400">
                                    Inv: {s.customerInvoiceNo}
                                  </div>
                                )}
                              </td>

                              <td className="py-2.5 px-3 text-center font-mono">
                                <span className="font-bold text-[#111827] dark:text-white">
                                  {s.totalPackages} Pkg
                                </span>
                                <span className="text-slate-400 text-[11px] ml-1">
                                  ({s.totalWeightKg} Kg)
                                </span>
                              </td>

                              <td className="py-2.5 px-3 text-right font-mono font-bold text-[#111827] dark:text-white">
                                {formatCurrency(biltyAmount)}
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                {s.deliveryDate ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60">
                                    Delivered
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60">
                                    In Transit
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Subtotal Sticky Bar (Clean 2-row on mobile, 1-row on desktop) */}
                <div className="p-3 bg-[#F7F8F8] dark:bg-slate-850 border-t border-[#E5EAEB] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs font-mono">
                  <div className="text-[#64748B] dark:text-slate-400 font-sans flex items-center gap-1.5 flex-wrap">
                    <span>Selected:</span>
                    <span className="text-[#111827] dark:text-white font-bold">{selectedShipmentIds.length} Bilties</span>
                    <span className="text-slate-400">•</span>
                    <span>{calculations.totalPackages} Pkg</span>
                    <span className="text-slate-400">•</span>
                    <span>{calculations.totalWeight} Kg</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-1.5 sm:pt-0 border-t sm:border-0 border-[#E5EAEB] dark:border-slate-800 font-bold">
                    <span className="text-[11px] text-[#64748B] font-sans font-medium dark:text-slate-400">Freight Subtotal:</span>
                    <span className="text-[#2F8E86] text-sm sm:text-base font-bold">{formatCurrency(calculations.subTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Invoice Generation & Configuration (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <form
                onSubmit={handleGenerateFreightBill}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#E5EAEB] dark:border-slate-800 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-[#2F8E86] shrink-0" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-white truncate">
                      2. Bill Details
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-[#25776F] bg-[#E7F1F2] dark:bg-slate-800 px-2 py-0.5 rounded-full border border-[#D9E2E3] dark:border-slate-700 shrink-0 whitespace-nowrap dark:text-teal-300">
                    {selectedShipmentIds.length} Bilties
                  </span>
                </div>

                {/* Bill Date */}
                <div>
                  <label className="block text-[11px] font-bold text-[#111827] dark:text-slate-300 uppercase tracking-wider mb-1">
                    Bill Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-[#2F8E86] font-mono text-[#111827] dark:text-white"
                  />
                </div>

                {/* Billing Month & Payment Term Due Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#111827] dark:text-slate-300 uppercase tracking-wider mb-1">
                      Billing Month *
                    </label>
                    <input
                      type="text"
                      required
                      value={billingMonth}
                      onChange={(e) => setBillingMonth(e.target.value)}
                      placeholder="e.g. October 2026"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-[#2F8E86] text-[#111827] dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-[#111827] dark:text-slate-300 uppercase tracking-wider">
                        Due Date
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(invoiceDate || new Date());
                          d.setDate(d.getDate() + 10);
                          setDueDate(d.toISOString().split("T")[0]);
                        }}
                        className="text-[10px] text-[#2F8E86] font-bold hover:underline cursor-pointer"
                      >
                        +10 Days
                      </button>
                    </div>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-[#2F8E86] font-mono text-[#111827] dark:text-white"
                    />
                  </div>
                </div>

                {/* GST Rate (%) with Preset Chips */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-[#111827] dark:text-slate-300 uppercase tracking-wider">
                      GST Rate (%)
                    </label>
                    <div className="flex items-center gap-1">
                      {[
                        { label: "0%", val: 0 },
                        { label: "5%", val: 5 },
                        { label: "12%", val: 12 },
                        { label: "18%", val: 18 },
                      ].map((chip) => (
                        <button
                          key={chip.val}
                          type="button"
                          onClick={() => setTaxRate(chip.val)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                            Number(taxRate) === chip.val
                              ? "bg-[#2F8E86] text-white border-[#2F8E86]"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl font-mono text-[#111827] dark:text-white focus:ring-1 focus:ring-[#2F8E86]"
                  />
                </div>

                {/* Other Charges & Discount */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#111827] dark:text-slate-300 uppercase tracking-wider mb-1">
                      Other Charges (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={otherCharges}
                      onChange={(e) => setOtherCharges(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl font-mono text-[#111827] dark:text-white focus:ring-1 focus:ring-[#2F8E86]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#111827] dark:text-slate-300 uppercase tracking-wider mb-1">
                      Discount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl font-mono text-[#111827] dark:text-white focus:ring-1 focus:ring-[#2F8E86]"
                    />
                  </div>
                </div>

                {/* Prepared By & Checked By */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#111827] dark:text-slate-300 uppercase tracking-wider mb-1">
                      Prepared By
                    </label>
                    <input
                      type="text"
                      value={preparedBy}
                      onChange={(e) => setPreparedBy(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-[#111827] dark:text-white focus:ring-1 focus:ring-[#2F8E86]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#111827] dark:text-slate-300 uppercase tracking-wider mb-1">
                      Checked By
                    </label>
                    <input
                      type="text"
                      value={checkedBy}
                      onChange={(e) => setCheckedBy(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-[#111827] dark:text-white focus:ring-1 focus:ring-[#2F8E86]"
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-[11px] font-bold text-[#111827] dark:text-slate-300 uppercase tracking-wider mb-1">
                    Bill Remarks / Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Notes for party, bank transfer details, payment terms..."
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-[#111827] dark:text-white focus:ring-1 focus:ring-[#2F8E86]"
                  />
                </div>

                {/* Financial Totals Breakdown Card */}
                <div className="p-4 bg-[#F7F8F8] dark:bg-slate-800/80 rounded-xl border border-[#E5EAEB] dark:border-slate-700 space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-[#64748B] dark:text-slate-400">
                    <span>Selected Bilties:</span>
                    <span className="text-[#111827] dark:text-white font-bold">{selectedShipmentIds.length}</span>
                  </div>
                  <div className="flex justify-between text-[#64748B] dark:text-slate-400">
                    <span>Total Packages:</span>
                    <span className="text-[#111827] dark:text-white">{calculations.totalPackages}</span>
                  </div>
                  <div className="flex justify-between text-[#64748B] dark:text-slate-400">
                    <span>Total Weight:</span>
                    <span className="text-[#111827] dark:text-white">{calculations.totalWeight} Kg</span>
                  </div>
                  <div className="flex justify-between text-[#111827] dark:text-slate-200 pt-1.5 border-t border-[#E5EAEB] dark:border-slate-700 font-bold">
                    <span>Freight SubTotal:</span>
                    <span>{formatCurrency(calculations.subTotal)}</span>
                  </div>
                  {Number(taxRate) > 0 && (
                    <div className="flex justify-between text-[#64748B] dark:text-slate-400">
                      <span>GST ({taxRate}%):</span>
                      <span>+ {formatCurrency(calculations.taxAmount)}</span>
                    </div>
                  )}
                  {Number(otherCharges) > 0 && (
                    <div className="flex justify-between text-[#64748B] dark:text-slate-400">
                      <span>Other Charges:</span>
                      <span>+ {formatCurrency(Number(otherCharges))}</span>
                    </div>
                  )}
                  {Number(discount) > 0 && (
                    <div className="flex justify-between text-[#D95C5C]">
                      <span>Discount:</span>
                      <span>- {formatCurrency(Number(discount))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-extrabold text-[#2F8E86] pt-2 border-t border-[#E5EAEB] dark:border-slate-700">
                    <span>Net Grand Total:</span>
                    <span>{formatCurrency(calculations.grandTotal)}</span>
                  </div>
                  <div className="text-[11px] font-sans italic text-[#64748B] dark:text-slate-400 pt-1">
                    {numberToWords(Math.round(calculations.grandTotal))}
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={generating || selectedShipmentIds.length === 0}
                    className="w-full py-3.5 bg-[#2F8E86] hover:bg-[#25776F] active:bg-[#20635c] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {generating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Generating Bill...</span>
                      </>
                    ) : (
                      <>
                        <Printer className="w-4 h-4" />
                        <span>Generate & Print Bill</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: BILL BOOK REGISTRY & HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {/* History Search & Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-[#E5EAEB] dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => {
                    setHistorySearch(e.target.value);
                    loadHistoryInvoices(e.target.value, historyStatusFilter);
                  }}
                  placeholder="Search generated bills by Bill No, Party Name..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-[#2F8E86] text-[#111827] dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={historyStatusFilter}
                  onChange={(e) => {
                    setHistoryStatusFilter(e.target.value);
                    loadHistoryInvoices(historySearch, e.target.value);
                  }}
                  className="px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-[#111827] dark:text-white cursor-pointer"
                >
                  <option value="">All Payment Statuses</option>
                  <option value="0">Unpaid</option>
                  <option value="1">Partially Paid</option>
                  <option value="2">Paid</option>
                </select>
              </div>
            </div>

            {/* History Invoices Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs overflow-hidden">
              {loadingHistory ? (
                <div className="py-16 text-center text-xs text-[#64748B] dark:text-slate-400">
                  <div className="w-6 h-6 border-2 border-[#2F8E86] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading bill book registry...
                </div>
              ) : historyInvoices.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-[#111827] dark:text-slate-200">
                    No generated freight bills found.
                  </p>
                  <p className="text-xs text-[#64748B] dark:text-slate-400">
                    Create your first consolidated freight bill from the &quot;New Consolidated Bill&quot; tab.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[760px]">
                    <thead className="bg-[#F7F8F8] dark:bg-slate-800/60 text-[#64748B] dark:text-slate-400 font-semibold border-b border-[#E5EAEB] dark:border-slate-800 uppercase text-[11px] whitespace-nowrap">
                      <tr>
                        <th className="py-3.5 px-4">Bill No</th>
                        <th className="py-3.5 px-4">Bill Date</th>
                        <th className="py-3.5 px-4">Party Name</th>
                        <th className="py-3.5 px-4 text-center">Bilties</th>
                        <th className="py-3.5 px-4 text-right">Grand Total</th>
                        <th className="py-3.5 px-4 text-right">Paid / Balance</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5EAEB] dark:divide-slate-800 whitespace-nowrap">
                      {historyInvoices.map((inv) => {
                        const biltyCount =
                          inv.items?.length || inv.linkedShipmentNos?.length || 1;
                        const isPaid = inv.paymentStatus === 2 || inv.paymentStatus === "Paid";
                        const isPartial = inv.paymentStatus === 1 || inv.paymentStatus === "PartiallyPaid";

                        return (
                          <tr
                            key={inv.id}
                            className="hover:bg-[#F9FAFB] dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono font-bold text-[#2F8E86]">
                              {inv.invoiceNo}
                            </td>
                            <td className="py-3 px-4 text-[#64748B] dark:text-slate-400">
                              {formatDate(inv.invoiceDate)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-[#111827] dark:text-white">
                                {inv.partyName || "Direct Party"}
                              </div>
                              {inv.partyGstNo && (
                                <div className="text-[10px] font-mono text-[#64748B] dark:text-slate-400">
                                  GST: {inv.partyGstNo}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 bg-[#E7F1F2] dark:bg-slate-800 text-[#25776F] dark:text-[#2F8E86] rounded-full font-mono text-xs font-semibold">
                                {biltyCount}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-[#111827] dark:text-white">
                              {formatCurrency(inv.grandTotal)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              <div className="text-emerald-600 font-semibold">
                                Paid: {formatCurrency(inv.paidAmount || 0)}
                              </div>
                              <div className="text-amber-600 text-[11px]">
                                Due: {formatCurrency(inv.dueAmount || 0)}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  isPaid
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                    : isPartial
                                    ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                                    : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                                }`}
                              >
                                {isPaid ? "PAID" : isPartial ? "PARTIAL" : "UNPAID"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleViewHistoryInvoice(inv.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E7F1F2] hover:bg-[#D9E2E3] text-[#25776F] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-[#2F8E86] rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print / View</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* AUTHENTIC PRINTABLE FREIGHT BILL PREVIEW MODAL                            */}
      {/* ========================================================================= */}
      {isPrintModalOpen && generatedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm print:static print:block print:p-0 print:m-0 print:w-full print:bg-white print:backdrop-blur-none print:overflow-visible">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-[#E5EAEB] dark:border-slate-800 max-h-[92vh] overflow-y-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:rounded-none">
            {/* Global Print Styles for Perfect Top-of-Page A4 Landscape Rendering */}
            <style jsx global>{`
              @media print {
                @page {
                  size: A4 landscape;
                  margin: 6mm 8mm;
                }
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #ffffff !important;
                  height: auto !important;
                  min-height: 0 !important;
                  overflow: visible !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .bill-book-print-container {
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 8px 12px !important;
                  border: 1.5px solid #000 !important;
                  box-sizing: border-box !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
              }
            `}</style>

            {/* Modal Controls (Hidden in Print) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#E5EAEB] dark:border-slate-800 gap-3 print:hidden">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Printer className="w-5 h-5 text-[#2F8E86] shrink-0" />
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-bold text-[#111827] dark:text-white truncate">
                      Bill Preview #{generatedInvoice.invoiceNo}
                    </h2>
                    <p className="text-[11px] text-[#64748B] dark:text-slate-400 truncate">
                      A4 Landscape format & WhatsApp sharing
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="sm:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareBill}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                  title="Share bill details on WhatsApp / Copy to clipboard"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Bill</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] active:bg-[#20635c] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print (A4)</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="hidden sm:inline-flex p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE FREIGHT BILL CONTAINER */}
            <div className="bill-book-print-container bg-white text-black p-6 font-serif border border-gray-800 print:border-none print:p-0 print:w-full dark:bg-slate-900">
              {/* Top Header */}
              <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-2">
                <div className="text-left">
                  <div className="text-xs font-sans font-bold">
                    Bill No: <span className="font-mono text-sm underline">{generatedInvoice.invoiceNo}</span>
                  </div>
                  <div className="text-xs font-sans">
                    Date: <span className="font-mono">{formatDate(generatedInvoice.invoiceDate)}</span>
                  </div>
                </div>

                <div className="text-center flex-1 px-4">
                  <h1 className="text-2xl font-bold uppercase tracking-wider font-sans">
                    {printProfile.companyName || "KESHRI TRANSPORT"}
                  </h1>
                  <p className="text-xs text-gray-800 font-sans mt-0.5 dark:text-slate-100">
                    {printProfile.address || "Zero Mile, Pahari, Patna-7"}
                    {printProfile.phone ? ` | Phone: ${printProfile.phone}` : ""}
                  </p>
                  {printProfile.gstin && (
                    <p className="text-[11px] font-mono font-bold">
                      GSTIN: {printProfile.gstin}
                    </p>
                  )}
                </div>

                <div className="text-right text-xs font-sans">
                  <div>Due Date: {generatedInvoice.dueDate ? formatDate(generatedInvoice.dueDate) : "Within 10 Days"}</div>
                </div>
              </div>

              {/* Messers & Party Details */}
              <div className="border border-black p-2 mb-3 text-xs font-sans leading-relaxed">
                <div className="flex justify-between">
                  <div>
                    <span className="font-bold">Messers: </span>
                    <span className="font-bold text-sm uppercase underline">
                      {generatedInvoice.partyName}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold">Month: </span>
                    <span className="underline font-semibold">{billingMonth}</span>
                  </div>
                </div>
                {generatedInvoice.partyAddress && (
                  <div>
                    <span className="font-bold">Address: </span>
                    <span>{generatedInvoice.partyAddress}</span>
                  </div>
                )}
                {generatedInvoice.partyGstNo && (
                  <div>
                    <span className="font-bold">GSTIN: </span>
                    <span className="font-mono">{generatedInvoice.partyGstNo}</span>
                  </div>
                )}
              </div>

              {/* Consolidated Bilties Table (Without Qty×Rate; spacious Destination column) */}
              <table className="w-full border-collapse border border-black text-xs font-sans mb-3">
                <thead>
                  <tr className="bg-gray-100 border-b border-black text-center font-bold">
                    <th className="border border-black py-1.5 px-1 w-8 text-center">Sl.</th>
                    <th className="border border-black py-1.5 px-2 w-20 text-center whitespace-nowrap">Date</th>
                    <th className="border border-black py-1.5 px-2 w-28 text-center whitespace-nowrap">GrNo</th>
                    <th className="border border-black py-1.5 px-1 w-12 text-center">Pkg</th>
                    <th className="border border-black py-1.5 px-2 text-left w-44 min-w-[140px]">Destination</th>
                    <th className="border border-black py-1.5 px-1 w-16 text-center whitespace-nowrap">Wt (Kg)</th>
                    <th className="border border-black py-1.5 px-2 w-20 text-center whitespace-nowrap">D.Date</th>
                    <th className="border border-black py-1.5 px-2 w-16 text-right whitespace-nowrap">Rate</th>
                    {dynamicChargeCols.map((name) => (
                      <th
                        key={name}
                        className="border border-black py-1.5 px-1 w-16 min-w-[60px] text-right whitespace-nowrap"
                      >
                        {name}
                      </th>
                    ))}
                    <th className="border border-black py-1.5 px-2 w-28 text-right whitespace-nowrap">Amount (₹)</th>
                    <th className="border border-black py-1.5 px-2 w-24 text-left">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {billedShipmentsForPrint.map((s, index) => {
                    const biltyAmount = s.grandTotal > 0 ? s.grandTotal : s.totalFreight || 0;
                    const qty = Number(s.totalPackages) || 1;
                    return (
                      <tr key={s.id || index} className="border-b border-gray-400">
                        <td className="border border-black py-1 px-1 font-mono text-center">{index + 1}</td>
                        <td className="border border-black py-1 px-1 font-mono whitespace-nowrap text-center">
                          {formatDate(s.shipmentDate)}
                        </td>
                        <td className="border border-black py-1 px-1 font-mono font-bold text-center whitespace-nowrap">
                          {s.shipmentNo}
                        </td>
                        <td className="border border-black py-1 px-1 font-mono text-center">{qty}</td>
                        <td className="border border-black py-1 px-2 text-left whitespace-normal break-words font-medium">
                          {s.toLocation || "Destination"}
                        </td>
                        <td className="border border-black py-1 px-1 font-mono text-center whitespace-nowrap">{s.totalWeightKg || 0}</td>
                        <td className="border border-black py-1 px-1 font-mono whitespace-nowrap text-center">
                          {s.deliveryDate ? formatDate(s.deliveryDate) : "-"}
                        </td>
                        <td className="border border-black py-1 px-2 font-mono text-right whitespace-nowrap">{s.rate ? s.rate : "-"}</td>
                        {dynamicChargeCols.map((name) => {
                          const match = s.chargeItems?.find((c) => c.chargeName === name);
                          return (
                            <td
                              key={name}
                              className="border border-black py-1 px-1 font-mono text-right whitespace-nowrap"
                            >
                              {match ? match.amount : ""}
                            </td>
                          );
                        })}
                        <td className="border border-black py-1 px-2 text-right font-mono font-bold whitespace-nowrap">
                          {formatCurrency(biltyAmount)}
                        </td>
                        <td className="border border-black py-1 px-2 text-left truncate">{s.remarks || ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold border-t-2 border-black">
                    <td colSpan={3} className="border border-black py-1.5 px-2 text-right uppercase">
                      Grand Total
                    </td>
                    <td className="border border-black py-1.5 px-1 font-mono text-center">
                      {printTotals.pkgTotal}
                    </td>
                    <td className="border border-black py-1.5 px-1"></td>
                    <td className="border border-black py-1.5 px-1 font-mono text-center">
                      {printTotals.wtTotal}
                    </td>
                    <td colSpan={2} className="border border-black py-1.5 px-1"></td>
                    {dynamicChargeCols.map((name) => (
                      <td
                        key={name}
                        className="border border-black py-1.5 px-1 font-mono text-right font-bold"
                      >
                        {dynamicChargeTotals[name] > 0 ? dynamicChargeTotals[name] : ""}
                      </td>
                    ))}
                    <td className="border border-black py-1.5 px-2 text-right font-mono text-sm whitespace-nowrap">
                      {formatCurrency(generatedInvoice.grandTotal)}
                    </td>
                    <td className="border border-black py-1.5 px-1"></td>
                  </tr>
                </tfoot>
              </table>

              {/* Amount in words */}
              <div className="border border-black p-2 mb-3 text-xs font-sans">
                <span className="font-bold">Amount in Words: </span>
                <span className="italic font-serif font-semibold">
                  {numberToWords(Math.round(generatedInvoice.grandTotal))}
                </span>
              </div>

              {/* Mandatory Bottom Notice & Signatures */}
              <div className="pt-2 text-xs font-sans space-y-4">
                <div className="font-bold text-[11px] text-gray-900 border-l-2 border-black pl-2 dark:text-white">
                  Nb:- Payment should be made within 10 days on receipt of this bill , otherwise interest will be charged @ 20%.
                </div>

                <div className="flex justify-between items-end pt-8">
                  <div className="text-left">
                    <div>Prepared by: <span className="font-semibold underline">{preparedBy || "............... "}</span></div>
                  </div>

                  <div className="text-center">
                    <div>Checked by: <span className="font-semibold underline">{checkedBy || "............... "}</span></div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold uppercase font-sans">
                      for : {printProfile.companyName || "Keshri Transport"}
                    </div>
                    <div className="pt-8 text-[11px] text-gray-600 dark:text-slate-300">
                      (Authorised Signatory)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function BillBookPage() {
  return (
    <PagePermissionGuard permission="billing.bill_book.view" moduleName="Bill Book (Consolidated Freight Bill)">
      <BillBookContent />
    </PagePermissionGuard>
  );
}
