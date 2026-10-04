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
} from "lucide-react";

export default function BillBookPage() {
  const [parties, setParties] = useState<PartyUnbilledSummary[]>([]);
  const [selectedParty, setSelectedParty] = useState<string>("");
  const [unbilledShipments, setUnbilledShipments] = useState<UnbilledShipment[]>([]);
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<number[]>([]);
  const [loadingParties, setLoadingParties] = useState(true);
  const [loadingShipments, setLoadingShipments] = useState(false);
  const [generating, setGenerating] = useState(false);

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
      toast.error("Failed to load invoice history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleViewHistoryInvoice = async (invId: number) => {
    try {
      const inv = await invoiceService.getInvoiceById(invId);
      if (!inv) return;
      setGeneratedInvoice(inv as any);

      // Map invoice items to printable bilty structure
      const printItems = (inv.items || []).map((item: any, idx: number) => {
        let toLoc = "Destination";
        let wt = 0;
        if (item.description) {
          const routeMatch = item.description.match(/to\s+([^|]+)/i);
          if (routeMatch) toLoc = routeMatch[1].trim();
          const wtMatch = item.description.match(/Wt:\s*([0-9.]+)/i);
          if (wtMatch) wt = parseFloat(wtMatch[1]) || 0;
        }
        return {
          id: item.shipmentId || idx,
          shipmentNo: item.shipmentNo || `GR-${idx + 1}`,
          shipmentDate: inv.invoiceDate,
          totalPackages: item.quantity || 1,
          totalWeightKg: wt,
          toLocation: toLoc,
          deliveryDate: null,
          rate: item.rate,
          totalFreight: item.amount || item.totalAmount,
          grandTotal: item.totalAmount || item.amount,
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
      toast.error("Failed to load invoice print preview.");
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
      toast.error(err?.message || "Failed to load unbilled parties list.");
    } finally {
      setLoadingParties(false);
    }
  };

  const handleSelectParty = async (partyName: string) => {
    setSelectedParty(partyName);
    setSelectedShipmentIds([]);
    try {
      setLoadingShipments(true);
      const shipments = await invoiceService.getUnbilledByParty(partyName);
      setUnbilledShipments(shipments || []);
      // By default, select all unbilled bilties for this party
      setSelectedShipmentIds((shipments || []).map((s) => s.id));
    } catch (err: any) {
      console.error("Load unbilled shipments error:", err);
      toast.error(err?.message || "Failed to load party bilties.");
    } finally {
      setLoadingShipments(false);
    }
  };

  // Toggle Bilty Selection (ghatana / badhana)
  const handleToggleShipment = (id: number) => {
    if (selectedShipmentIds.includes(id)) {
      setSelectedShipmentIds(selectedShipmentIds.filter((x) => x !== id));
    } else {
      setSelectedShipmentIds([...selectedShipmentIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedShipmentIds.length === unbilledShipments.length) {
      setSelectedShipmentIds([]);
    } else {
      setSelectedShipmentIds(unbilledShipments.map((s) => s.id));
    }
  };

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
      (sum, s) => sum + (s.totalFreight > 0 ? s.totalFreight : s.grandTotal || 0),
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
      toast.error("Please select a billing party.");
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
        toast.error(res?.message || "Failed to generate Freight Bill.");
      }
    } catch (err: any) {
      console.error("Generate Bill Book error:", err);
      toast.error(err?.message || "Error generating bill book freight invoice.");
    } finally {
      setGenerating(false);
    }
  };

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            Bill Book — Consolidated Freight Billing
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Generate party-wise consolidated freight bills across multiple unbilled bilties, view history, and print authentic Freight Bills.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "generate" ? (
            <button
              onClick={loadUnbilledParties}
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Refresh Unbilled
            </button>
          ) : (
            <button
              onClick={() => loadHistoryInvoices()}
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Refresh History
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("generate")}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === "generate"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          <Plus className="w-4 h-4" />
          Create Freight Bill
          {parties.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-indigo-500 text-white rounded-full font-mono">
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
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === "history"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          <FileText className="w-4 h-4" />
          Bill Book Registry & History
        </button>
      </div>

      {/* TAB 1: GENERATE FREIGHT BILL */}
      {activeTab === "generate" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Party Selection & Bilties Checklist (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Party Selector Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Select Party / Customer to Bill:
              </label>
              <span className="text-xs text-gray-500">
                {parties.length} parties with pending bilties
              </span>
            </div>

            {loadingParties ? (
              <div className="py-4 text-center text-xs text-gray-500">
                Loading unbilled parties...
              </div>
            ) : parties.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                🎉 No unbilled consignments pending. All bilties have been billed!
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  value={selectedParty}
                  onChange={(e) => handleSelectParty(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm font-semibold bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                >
                  {parties.map((p, idx) => (
                    <option key={idx} value={p.partyName}>
                      {p.partyName} ({p.unbilledCount} unbilled bilties —{" "}
                      {formatCurrency(p.totalUnbilledAmount)})
                    </option>
                  ))}
                </select>

                {currentPartyInfo && (
                  <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/20 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-xs flex justify-between items-center text-indigo-950 dark:text-indigo-200">
                    <div>
                      <span className="font-semibold">{currentPartyInfo.partyName}</span>
                      {currentPartyInfo.partyGstNo && (
                        <span className="ml-2 font-mono text-gray-600 dark:text-gray-400">
                          GST: {currentPartyInfo.partyGstNo}
                        </span>
                      )}
                      {currentPartyInfo.partyAddress && (
                        <div className="text-[11px] text-gray-500 truncate max-w-md">
                          📍 {currentPartyInfo.partyAddress}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {unbilledShipments.length} Bilties Available
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bilties Selection Matrix */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  {selectedShipmentIds.length === unbilledShipments.length &&
                  unbilledShipments.length > 0 ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  {selectedShipmentIds.length === unbilledShipments.length
                    ? "Deselect All"
                    : "Select All Bilties"}
                </button>
                <span className="text-xs text-gray-500">
                  ({selectedShipmentIds.length} of {unbilledShipments.length} selected)
                </span>
              </div>

              <div className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200">
                Subtotal: {formatCurrency(calculations.subTotal)}
              </div>
            </div>

            {loadingShipments ? (
              <div className="py-16 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                Loading unbilled consignments for {selectedParty}...
              </div>
            ) : unbilledShipments.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">
                No unbilled bilties found for this party.
              </div>
            ) : (
              <div className="max-h-[460px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                {unbilledShipments.map((s) => {
                  const isChecked = selectedShipmentIds.includes(s.id);
                  const freight = s.totalFreight > 0 ? s.totalFreight : s.grandTotal || 0;

                  return (
                    <div
                      key={s.id}
                      onClick={() => handleToggleShipment(s.id)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="text-indigo-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleShipment(s.id);
                          }}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-gray-900 dark:text-gray-100">
                              GR #{s.shipmentNo}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({formatDate(s.shipmentDate)})
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                            <span>{s.fromLocation || "Origin"}</span>
                            <ArrowRight className="w-3 h-3 text-gray-400" />
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {s.toLocation || "Destination"}
                            </span>
                            <span className="ml-2 font-mono text-gray-500">
                              Pkg: {s.totalPackages} | Wt: {s.totalWeightKg}kg
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-sm text-gray-900 dark:text-gray-100">
                          {formatCurrency(freight)}
                        </div>
                        {s.remarks && (
                          <div className="text-[11px] text-gray-400 truncate max-w-xs">
                            {s.remarks}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Invoice Generation & Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleGenerateFreightBill}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Freight Bill Details
              </h3>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded">
                {selectedShipmentIds.length} Bilties Added
              </span>
            </div>

            {/* Bill No & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Bill No (Auto/Custom)
                </label>
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="Auto-generated if blank"
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Bill Date *
                </label>
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Billing Month & Payment Term Due Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Billing Month *
                </label>
                <input
                  type="text"
                  required
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  placeholder="e.g. October 2026"
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Due Date (10 Days Std)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Tax & Discount */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  GST Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="0"
                  className="w-full px-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Other Charges (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={otherCharges}
                  onChange={(e) => setOtherCharges(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-mono text-center"
                />
              </div>
            </div>

            {/* Prepared By & Checked By */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Prepared By
                </label>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Checked By
                </label>
                <input
                  type="text"
                  value={checkedBy}
                  onChange={(e) => setCheckedBy(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Bill Remarks / Instructions
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Notes for party, bank transfer details, etc."
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
              />
            </div>

            {/* Financial Totals Breakdown Card */}
            <div className="p-4 bg-gray-900 text-white rounded-xl space-y-2 font-mono text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Selected Bilties Count:</span>
                <span className="text-white font-bold">{selectedShipmentIds.length}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Total Packages:</span>
                <span className="text-white">{calculations.totalPackages}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Total Weight:</span>
                <span className="text-white">{calculations.totalWeight} Kg</span>
              </div>
              <div className="flex justify-between text-gray-300 pt-1 border-t border-gray-800">
                <span>Freight SubTotal:</span>
                <span>{formatCurrency(calculations.subTotal)}</span>
              </div>
              {Number(taxRate) > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>GST ({taxRate}%):</span>
                  <span>{formatCurrency(calculations.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-emerald-400 pt-2 border-t border-gray-800">
                <span>Grand Total:</span>
                <span>{formatCurrency(calculations.grandTotal)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={generating || selectedShipmentIds.length === 0}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating Freight Bill...
                  </>
                ) : (
                  <>
                    <Printer className="w-5 h-5" />
                    Generate & Print Freight Bill
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  loadHistoryInvoices(e.target.value, historyStatusFilter);
                }}
                placeholder="Search generated bills by Bill No, Party Name..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={historyStatusFilter}
                onChange={(e) => {
                  setHistoryStatusFilter(e.target.value);
                  loadHistoryInvoices(historySearch, e.target.value);
                }}
                className="px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
              >
                <option value="">All Payment Statuses</option>
                <option value="0">Unpaid</option>
                <option value="1">Partially Paid</option>
                <option value="2">Paid</option>
              </select>
            </div>
          </div>

          {/* History Invoices Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {loadingHistory ? (
              <div className="py-16 text-center text-xs text-gray-500">
                Loading bill book registry...
              </div>
            ) : historyInvoices.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <FileText className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  No generated freight bills found.
                </p>
                <p className="text-xs text-gray-400">
                  Create your first Freight Bill from the &quot;Create Freight Bill&quot; tab.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700">
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
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {historyInvoices.map((inv) => {
                      const biltyCount =
                        inv.items?.length || inv.linkedShipmentNos?.length || 1;
                      const isPaid = inv.paymentStatus === 2 || inv.paymentStatus === "Paid";
                      const isPartial = inv.paymentStatus === 1 || inv.paymentStatus === "PartiallyPaid";

                      return (
                        <tr
                          key={inv.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                            {inv.invoiceNo}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {formatDate(inv.invoiceDate)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {inv.partyName || "Direct Party"}
                            </div>
                            {inv.partyGstNo && (
                              <div className="text-[10px] font-mono text-gray-400">
                                GST: {inv.partyGstNo}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full font-mono text-xs font-semibold">
                              {biltyCount}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-gray-900 dark:text-gray-100">
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
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : isPartial
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {isPaid ? "PAID" : isPartial ? "PARTIAL" : "UNPAID"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleViewHistoryInvoice(inv.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-300 rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-xs"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Print / View
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

      {/* ========================================================================= */}
      {/* AUTHENTIC PRINTABLE FREIGHT BILL PREVIEW MODAL                            */}
      {/* ========================================================================= */}
      {isPrintModalOpen && generatedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 max-h-[92vh] overflow-y-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0">
            {/* Modal Controls (Hidden in Print) */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200 dark:border-gray-800 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-6 h-6 text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Freight Bill Preview — #{generatedInvoice.invoiceNo}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print Bill (A4)
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE FREIGHT BILL CONTAINER */}
            <div className="bill-book-print-container bg-white text-black p-6 font-serif border border-gray-800 print:border-none print:p-0 print:w-full">
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
                  <p className="text-xs text-gray-800 font-sans mt-0.5">
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

              {/* Table with Required Columns:
                  1. Sl, 2. Date, 3. GrNo, 4. Pkg, 5. Destination, 6. Wt, 7. D.Date, 8. Rate, 9. Amount, 10. Remark */}
              <table className="w-full border-collapse border border-black text-xs font-sans mb-3">
                <thead>
                  <tr className="bg-gray-100 border-b border-black text-center font-bold">
                    <th className="border border-black py-1.5 px-1 w-8">Sl.</th>
                    <th className="border border-black py-1.5 px-2 w-20">Date</th>
                    <th className="border border-black py-1.5 px-2 w-24">GrNo</th>
                    <th className="border border-black py-1.5 px-1 w-12">Pkg</th>
                    <th className="border border-black py-1.5 px-2">Destination</th>
                    <th className="border border-black py-1.5 px-1 w-14">Wt (Kg)</th>
                    <th className="border border-black py-1.5 px-2 w-20">D.Date</th>
                    <th className="border border-black py-1.5 px-2 w-14">Rate</th>
                    <th className="border border-black py-1.5 px-2 w-24 text-right">Amount (₹)</th>
                    <th className="border border-black py-1.5 px-2 w-20">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {billedShipmentsForPrint.map((s, index) => {
                    const freight = s.totalFreight > 0 ? s.totalFreight : s.grandTotal || 0;
                    return (
                      <tr key={s.id || index} className="text-center border-b border-gray-400">
                        <td className="border border-black py-1 px-1 font-mono">{index + 1}</td>
                        <td className="border border-black py-1 px-1 font-mono whitespace-nowrap">
                          {formatDate(s.shipmentDate)}
                        </td>
                        <td className="border border-black py-1 px-1 font-mono font-bold">
                          {s.shipmentNo}
                        </td>
                        <td className="border border-black py-1 px-1 font-mono">{s.totalPackages || 1}</td>
                        <td className="border border-black py-1 px-2 text-left truncate max-w-[120px]">
                          {s.toLocation || "Destination"}
                        </td>
                        <td className="border border-black py-1 px-1 font-mono">{s.totalWeightKg || 0}</td>
                        <td className="border border-black py-1 px-1 font-mono whitespace-nowrap">
                          {s.deliveryDate ? formatDate(s.deliveryDate) : "-"}
                        </td>
                        <td className="border border-black py-1 px-1 font-mono">{s.rate || "-"}</td>
                        <td className="border border-black py-1 px-2 text-right font-mono font-bold">
                          {formatCurrency(freight)}
                        </td>
                        <td className="border border-black py-1 px-2"></td>
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
                <span className="italic font-serif">
                  Rupees {numberToWords(Math.round(generatedInvoice.grandTotal))} Only.
                </span>
              </div>

              {/* Mandatory Bottom Notice & Signatures */}
              <div className="pt-2 text-xs font-sans space-y-4">
                <div className="font-bold text-[11px] text-gray-900 border-l-2 border-black pl-2">
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
                    <div className="pt-8 text-[11px] text-gray-600">
                      (Authorised Signatory)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
