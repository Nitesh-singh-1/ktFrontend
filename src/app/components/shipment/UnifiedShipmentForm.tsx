"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shipment,
  CreateShipmentRequest,
  CreateConsignmentInvoiceReferenceRequest,
  TaxTreatment,
  PaymentTerm,
  ShipmentItem,
  ShipmentChargeItem,
  PartyLookupItem,
  VehicleLookupItem,
  LocationLookupItem,
  InvoiceLookupItem,
} from "@/types/shipment";
import CustomerInvoicesTable from "./CustomerInvoicesTable";
import CargoItemsTable from "./CargoItemsTable";
import DynamicChargesTable from "./DynamicChargesTable";
import SearchableSelect from "../ui/SearchableSelect";
import { shipmentService } from "services/shipmentService";
import { partyService } from "services/partyService";
import { fleetService } from "services/fleetService";
import { invoiceService } from "services/invoiceService";
import { rateCardService } from "services/rateCardService";
import { sanitizeMobile, validateMobile } from "@/utils/validation";
import {
  Package,
  MapPin,
  Upload,
  Download,
  Receipt,
  Scale,
  Building2,
  FileText,
  RefreshCw,
  Shield,
  SlidersHorizontal,
  Zap,
  Tag,
  Check,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";

interface UnifiedShipmentFormProps {
  initialId?: number;
  initialData?: Shipment;
}

const TAX_TREATMENT_OPTIONS = [
  { value: TaxTreatment.GST_Regular, label: "GST Regular (Tax Invoice)", icon: Building2, desc: "Standard 5%/12%/18% GST" },
  { value: TaxTreatment.NonTaxable, label: "Non-Taxable / Without GST", icon: FileText, desc: "Direct Non-GST Consignment" },
];

export default function UnifiedShipmentForm({ initialId, initialData }: UnifiedShipmentFormProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!initialId && !initialData);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Customer Paper Invoices / Bills
  const [customerInvoices, setCustomerInvoices] = useState<CreateConsignmentInvoiceReferenceRequest[]>([
    {
      customerInvoiceNo: "",
      customerInvoiceDate: new Date().toISOString().split("T")[0],
      declaredGoodsValue: 0,
      ewayBillNo: "",
      documentType: "TaxInvoice",
      packageCount: 1,
      weightKg: 0,
      commodityDescription: "",
      privateMarka: "",
      documentUrl: "",
    },
  ]);

  // Form State
  const [shipmentNo, setShipmentNo] = useState("");
  const [invoiceId, setInvoiceId] = useState<number | undefined>(undefined);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [shipmentDate, setShipmentDate] = useState(new Date().toISOString().split("T")[0]);
  const [invoiceDate, setInvoiceDate] = useState("");
  const [fromLocation, setFromLocation] = useState("Zero Mile, Pahari, Patna-7");
  const [toLocation, setToLocation] = useState("");
  const [truckNo, setTruckNo] = useState("");
  const [taxTreatment, setTaxTreatment] = useState<TaxTreatment>(TaxTreatment.GST_Regular);
  const [gstPaidBy, setGstPaidBy] = useState("Consignee");

  // Consignor (Sender)
  const [consignorPartyId, setConsignorPartyId] = useState<number | undefined>(undefined);
  const [consignorName, setConsignorName] = useState("");
  const [consignorGstNo, setConsignorGstNo] = useState("");
  const [consignorMobile, setConsignorMobile] = useState("");
  const [consignorAddress, setConsignorAddress] = useState("");
  const [saveConsignorAsParty, setSaveConsignorAsParty] = useState(false);

  // Consignee (Receiver)
  const [consigneePartyId, setConsigneePartyId] = useState<number | undefined>(undefined);
  const [consigneeName, setConsigneeName] = useState("");
  const [consigneeGstNo, setConsigneeGstNo] = useState("");
  const [consigneeMobile, setConsigneeMobile] = useState("");
  const [consigneeAddress, setConsigneeAddress] = useState("");
  const [saveConsigneeAsParty, setSaveConsigneeAsParty] = useState(false);

  // Financials & Line Items
  const [goodsValue, setGoodsValue] = useState<number>(0);
  const [paymentTerm, setPaymentTerm] = useState<PaymentTerm>(PaymentTerm.ToPay);
  const [totalFreight, setTotalFreight] = useState<number>(0);
  const [totalTaxAmount, setTotalTaxAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [remarks, setRemarks] = useState("");
  const [bookingClerk, setBookingClerk] = useState("");

  // Line Items
  const [items, setItems] = useState<ShipmentItem[]>([
    { article: "", description: "", weight: 0, rate: 0, quantity: 1, totalAmount: 0 },
  ]);
  const [chargeItems, setChargeItems] = useState<ShipmentChargeItem[]>([
    { chargeName: "St. Char", amount: 20, isTaxable: false },
  ]);

  useEffect(() => {
    if (initialData) {
      populateForm(initialData);
    } else if (initialId) {
      loadShipment(initialId);
    }
  }, [initialId, initialData]);

  const loadShipment = async (id: number) => {
    try {
      setInitialLoading(true);
      const res = await shipmentService.getShipmentById(id);
      if (res.success && res.data) {
        populateForm(res.data);
      } else {
        setError(res.message || "Failed to load consignment details.");
      }
    } catch (err: any) {
      console.error("Error loading shipment:", err);
      setError(err?.message || "Failed to load consignment data.");
    } finally {
      setInitialLoading(false);
    }
  };

  const populateForm = (data: Shipment) => {
    setShipmentNo(data.shipmentNo || "");
    setInvoiceId(data.invoiceId);
    setInvoiceNo(data.invoiceNo || "");
    setShipmentDate(data.shipmentDate ? data.shipmentDate.split("T")[0] : "");
    setInvoiceDate(data.invoiceDate ? data.invoiceDate.split("T")[0] : "");
    setFromLocation(data.fromLocation || "Zero Mile, Pahari, Patna-7");
    setToLocation(data.toLocation || "");
    setTruckNo(data.truckNo || "");
    setTaxTreatment(data.taxTreatment ?? TaxTreatment.GST_Regular);
    setGstPaidBy(data.gstPaidBy || "Consignee");

    setConsignorPartyId(data.consignorPartyId);
    setConsignorName(data.consignorName || "");
    setConsignorGstNo(data.consignorGstNo || "");
    setConsignorMobile(data.consignorMobile || "");
    setConsignorAddress(data.consignorAddress || "");

    setConsigneePartyId(data.consigneePartyId);
    setConsigneeName(data.consigneeName || "");
    setConsigneeGstNo(data.consigneeGstNo || "");
    setConsigneeMobile(data.consigneeMobile || "");
    setConsigneeAddress(data.consigneeAddress || "");

    setGoodsValue(data.goodsValue || 0);
    setPaymentTerm(data.paymentTerm ?? PaymentTerm.ToPay);
    setTotalFreight(data.totalFreight || 0);
    setTotalTaxAmount(data.totalTaxAmount || 0);
    setPaidAmount(data.paidAmount || 0);
    setRemarks(data.remarks || "");
    setBookingClerk(data.bookingClerk || "");

    // Populate customer invoices
    if (data.invoiceReferences && data.invoiceReferences.length > 0) {
      setCustomerInvoices(
        data.invoiceReferences.map((ir) => ({
          customerInvoiceNo: ir.customerInvoiceNo || "",
          customerInvoiceDate: ir.customerInvoiceDate ? ir.customerInvoiceDate.split("T")[0] : "",
          declaredGoodsValue: ir.declaredGoodsValue || 0,
          ewayBillNo: ir.ewayBillNo || "",
          ewayBillDate: ir.ewayBillDate ? ir.ewayBillDate.split("T")[0] : undefined,
          ewayBillValidUpto: ir.ewayBillValidUpto,
          documentType: ir.documentType || "TaxInvoice",
          packageCount: ir.packageCount || 1,
          weightKg: ir.weightKg || 0,
          commodityDescription: ir.commodityDescription || "",
          privateMarka: ir.privateMarka || "",
          documentUrl: ir.documentUrl || "",
        }))
      );
    } else if (data.invoiceNo) {
      setCustomerInvoices([
        {
          customerInvoiceNo: data.invoiceNo,
          customerInvoiceDate: data.invoiceDate ? data.invoiceDate.split("T")[0] : data.shipmentDate ? data.shipmentDate.split("T")[0] : "",
          declaredGoodsValue: data.goodsValue || 0,
          ewayBillNo: data.ewayBillNo || "",
          documentType: "TaxInvoice",
          packageCount: 1,
          weightKg: 0,
          commodityDescription: "",
          privateMarka: "",
          documentUrl: "",
        },
      ]);
    }

    if (data.items && data.items.length > 0) {
      setItems(data.items);
    }
    if (data.chargeItems && data.chargeItems.length > 0) {
      setChargeItems(data.chargeItems);
    }
  };

  const handleCustomerInvoicesChange = (updated: CreateConsignmentInvoiceReferenceRequest[]) => {
    setCustomerInvoices(updated);

    // Auto-update declared goods value sum from all customer bills
    const totalVal = updated.reduce((sum, inv) => sum + (Number(inv.declaredGoodsValue) || 0), 0);
    setGoodsValue(totalVal);

    // Auto-populate single invoiceNo and invoiceDate
    const validInvs = updated.filter((i) => i.customerInvoiceNo.trim());
    if (validInvs.length > 0) {
      setInvoiceNo(validInvs.map((i) => i.customerInvoiceNo.trim()).join(", "));
      if (validInvs[0].customerInvoiceDate) {
        setInvoiceDate(validInvs[0].customerInvoiceDate);
      }
    }
  };

  const handleItemsChange = (newItems: ShipmentItem[]) => {
    setItems(newItems);
    const cargoTotal = newItems.reduce((sum, it) => sum + (Number(it.totalAmount) || 0), 0);
    if (cargoTotal > 0) {
      setTotalFreight(cargoTotal);
    }
  };

  const isGstRelevant =
    taxTreatment === TaxTreatment.GST_Regular ||
    taxTreatment === TaxTreatment.GST_RCM ||
    taxTreatment === TaxTreatment.CustomTax;

  // Handle party selection
  const handleSelectConsignor = (party: PartyLookupItem) => {
    setConsignorPartyId(party.id);
    setConsignorName(party.name);
    if (party.gstNo) setConsignorGstNo(party.gstNo);
    if (party.mobile) setConsignorMobile(party.mobile);
    if (party.address) {
      const fullAddr = [party.address, party.city, party.state, party.pincode].filter(Boolean).join(", ");
      setConsignorAddress(fullAddr);
    }
    if (party.defaultPaymentTerm !== undefined) {
      setPaymentTerm(party.defaultPaymentTerm);
    }
    setSaveConsignorAsParty(false);
  };

  const handleSelectConsignee = (party: PartyLookupItem) => {
    setConsigneePartyId(party.id);
    setConsigneeName(party.name);
    if (party.gstNo) setConsigneeGstNo(party.gstNo);
    if (party.mobile) setConsigneeMobile(party.mobile);
    if (party.address) {
      const fullAddr = [party.address, party.city, party.state, party.pincode].filter(Boolean).join(", ");
      setConsigneeAddress(fullAddr);
    }
    setSaveConsigneeAsParty(false);
  };

  const [calcLoading, setCalcLoading] = useState(false);
  const [calcResult, setCalcResult] = useState<string | null>(null);

  const handleAutoCalculateTariff = async () => {
    if (!fromLocation.trim() || !toLocation.trim()) {
      alert("Please enter Origin and Destination stations first.");
      return;
    }
    const totalWeight = items.reduce((sum, it) => sum + (Number(it.weight) || 0), 0);
    if (totalWeight <= 0) {
      alert("Please enter cargo weights in the items table to calculate freight tariff.");
      return;
    }

    try {
      setCalcLoading(true);
      const res = await rateCardService.calculateFreight({
        partyId: consignorPartyId,
        fromLocation,
        toLocation,
        weightKg: totalWeight,
        packagesCount: items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0),
        includeDoorDelivery: true,
        includeHamali: true,
      });

      if (res) {
        setTotalFreight(res.freightAmount || 0);
        setCalcResult(res.calculationBreakdown || `Auto-applied base freight: ₹${res.freightAmount}`);
      }
    } catch (err: any) {
      alert("Could not calculate tariff: " + (err?.message || "Check network"));
    } finally {
      setCalcLoading(false);
    }
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!fromLocation.trim()) errs.push("Origin / From Location is required.");
    if (!toLocation.trim()) errs.push("Destination / To Location is required.");
    if (!consignorName.trim()) errs.push("Consignor (Sender) Name is required.");
    if (!consigneeName.trim()) errs.push("Consignee (Receiver) Name is required.");

    if (items.length === 0) {
      errs.push("At least one cargo line-item is required.");
    } else {
      items.forEach((item, i) => {
        if (!item.article?.trim() && !item.description?.trim()) {
          errs.push(`Cargo row #${i + 1} requires an article or description.`);
        }
      });
    }

    const cnrErr = validateMobile(consignorMobile, "Sender mobile");
    if (cnrErr) errs.push(cnrErr);
    const cneErr = validateMobile(consigneeMobile, "Receiver mobile");
    if (cneErr) errs.push(cneErr);

    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(" • "));
      return;
    }

    // Filter valid customer invoices
    const validCustomerInvoices = customerInvoices.filter(
      (ci) => ci.customerInvoiceNo && ci.customerInvoiceNo.trim().length > 0
    );

    const payload: CreateShipmentRequest = {
      shipmentNo: shipmentNo.trim() || undefined,
      invoiceId: invoiceId || undefined,
      invoiceNo: invoiceNo.trim() || undefined,
      shipmentDate: shipmentDate || undefined,
      invoiceDate: invoiceDate || (validCustomerInvoices.length > 0 ? validCustomerInvoices[0].customerInvoiceDate : undefined),
      fromLocation: fromLocation.trim(),
      toLocation: toLocation.trim(),
      truckNo: truckNo.trim() || undefined,
      taxTreatment,
      gstPaidBy: isGstRelevant ? gstPaidBy : undefined,
      
      // Consignor
      consignorPartyId: consignorPartyId || undefined,
      consignorName: consignorName.trim(),
      consignorGstNo: isGstRelevant ? consignorGstNo.trim() || undefined : undefined,
      consignorMobile: consignorMobile.trim() || undefined,
      consignorAddress: consignorAddress.trim() || undefined,
      saveConsignorAsParty: !consignorPartyId ? true : undefined,

      // Consignee
      consigneePartyId: consigneePartyId || undefined,
      consigneeName: consigneeName.trim(),
      consigneeGstNo: isGstRelevant ? consigneeGstNo.trim() || undefined : undefined,
      consigneeMobile: consigneeMobile.trim() || undefined,
      consigneeAddress: consigneeAddress.trim() || undefined,
      saveConsigneeAsParty: !consigneePartyId ? true : undefined,

      goodsValue: Number(goodsValue) || 0,
      paymentTerm,
      totalFreight: Number(totalFreight) || 0,
      totalTaxAmount: isGstRelevant ? Number(totalTaxAmount) || 0 : 0,
      paidAmount: Number(paidAmount) || 0,
      remarks: remarks.trim() || undefined,
      bookingClerk: bookingClerk.trim() || undefined,
      customerInvoices: validCustomerInvoices.length > 0 ? validCustomerInvoices : undefined,
      items: items.map((it) => ({
        article: it.article || "",
        description: it.description || "",
        weight: Number(it.weight) || 0,
        rate: Number(it.rate) || 0,
        quantity: Number(it.quantity) || 1,
        totalAmount: Number(it.totalAmount) || 0,
      })),
      chargeItems: chargeItems.map((ch) => ({
        chargeName: ch.chargeName || "",
        amount: Number(ch.amount) || 0,
        isTaxable: !!ch.isTaxable,
      })),
    };

    try {
      setLoading(true);
      if (initialId) {
        const res = await shipmentService.updateShipment(initialId, payload);
        if (res.success) {
          setSuccess("Consignment updated successfully! Redirecting...");
          setTimeout(() => router.push(`/shipments/details?id=${initialId}`), 1000);
        } else {
          setError(res.message || "Failed to update consignment.");
        }
      } else {
        const res = await shipmentService.createShipment(payload);
        if (res.success) {
          setSuccess("Consignment booked successfully! Redirecting...");
          const newId = res.data?.id;
          setTimeout(() => {
            if (newId) {
              router.push(`/shipments/details?id=${newId}`);
            } else {
              router.push("/shipments");
            }
          }, 1000);
        } else {
          setError(res.message || "Failed to create consignment.");
        }
      }
    } catch (err: any) {
      console.error("Save shipment error:", err);
      setError(err?.message || "Something went wrong while saving consignment.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F8E86] mx-auto mb-3" />
          <p className="text-[#64748B] font-medium text-xs">Loading consignment data...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Action Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-[#E5EAEB] dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <span className="p-1.5 bg-[#E7F1F2] text-[#2F8E86] rounded-lg text-sm font-bold shadow-2xs shrink-0">
              <Package className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-[#111827] dark:text-slate-100 tracking-tight">
              {initialId ? `Edit Bilty / Consignment #${shipmentNo || initialId}` : "New Bilty / Consignment Booking (GR)"}
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] rounded-full dark:bg-slate-800 dark:text-[#2F8E86] dark:border-slate-700">
              Step 2: Transporter Bilty
            </span>
          </div>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
            Fill in booking route, parties, attach customer commercial invoices with photo uploads, specify cargo items, and review charges.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              <span>{initialId ? "Update" : "Create"}</span>
            )}
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* SECTION 1: Booking & Movement Details (Point A → Point B) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5EAEB] dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-200 flex items-center gap-1.5 border-b border-[#E5EAEB] dark:border-slate-800 pb-2.5">
          <MapPin className="w-4 h-4 text-[#2F8E86]" />
          <span>1. Bilty Booking & Route Details (Point A → Point B)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Shipment Date */}
          <div>
            <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
              Booking Date *
            </label>
            <input
              type="date"
              required
              value={shipmentDate}
              onChange={(e) => setShipmentDate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86]"
            />
          </div>

          {/* Origin Hub */}
          <div>
            <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
              From (Origin Hub / Point A) *
            </label>
            <SearchableSelect<LocationLookupItem>
              value={fromLocation}
              placeholder="Search station (e.g. Zero Mile, Pahari)..."
              onSearch={(q) => fleetService.lookupLocations(q)}
              getItemKey={(l) => l.id}
              getItemLabel={(l) => l.name}
              onChangeText={setFromLocation}
              onSelect={(l) => setFromLocation(l.name)}
              renderItem={(l) => (
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-slate-800">{l.name}</span>
                  {l.city && <span className="text-[10px] text-slate-400">{l.city}, {l.state}</span>}
                </div>
              )}
            />
          </div>

          {/* Destination City */}
          <div>
            <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
              To (Destination Station / Point B) *
            </label>
            <SearchableSelect<LocationLookupItem>
              value={toLocation}
              placeholder="Search destination (e.g. Gaya, Mumbai)..."
              onSearch={(q) => fleetService.lookupLocations(q)}
              getItemKey={(l) => l.id}
              getItemLabel={(l) => l.name}
              onChangeText={setToLocation}
              onSelect={(l) => setToLocation(l.name)}
              renderItem={(l) => (
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-slate-800">{l.name}</span>
                  {l.city && <span className="text-[10px] text-slate-400">{l.city}, {l.state}</span>}
                </div>
              )}
            />
          </div>

          {/* Payment Term */}
          <div>
            <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
              Freight Payment Term *
            </label>
            <select
              value={paymentTerm}
              onChange={(e) => setPaymentTerm(Number(e.target.value) as PaymentTerm)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-bold text-[#2F8E86] focus:outline-none focus:ring-1 focus:ring-[#2F8E86]"
            >
              <option value={PaymentTerm.ToPay}>To-Pay (Pay at Destination)</option>
              <option value={PaymentTerm.Paid}>Paid (Prepaid at Origin)</option>
              <option value={PaymentTerm.TBB}>TBB (To Be Billed on Account)</option>
            </select>
          </div>

          {/* Vehicle No */}
          <div>
            <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
              Direct Truck / Lorry No (Optional)
            </label>
            <SearchableSelect<VehicleLookupItem>
              value={truckNo}
              placeholder="Search truck or assign later in Challan..."
              onSearch={(q) => fleetService.lookupVehicles(q)}
              getItemKey={(v) => v.id}
              getItemLabel={(v) => v.vehicleNo}
              onChangeText={(t) => setTruckNo(t.toUpperCase())}
              onSelect={(v) => setTruckNo(v.vehicleNo)}
              renderItem={(v) => (
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono font-bold text-slate-800">{v.vehicleNo}</span>
                  <span className="text-[10px] text-slate-400">{v.vehicleType || "Truck"} {v.driverName ? `• ${v.driverName}` : ""}</span>
                </div>
              )}
            />
          </div>

          {/* Declared Goods Value */}
          <div>
            <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Total Declared Value (₹)</span>
              <span className="text-[10px] text-[#2F8E86] font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Auto from Bills
              </span>
            </label>
            <input
              type="number"
              step="any"
              min="0"
              disabled={true}
              readOnly={true}
              placeholder="0.00"
              value={goodsValue === 0 ? "" : goodsValue}
              className="w-full px-3 py-2 bg-[#F7F8F8] dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-black text-[#111827] dark:text-slate-200 font-mono cursor-not-allowed"
            />
            <span className="text-[10px] text-[#94A3B8] mt-0.5 block">
              Auto-sum of all customer invoices entered below
            </span>
          </div>

          {/* Booking Operator */}
          <div>
            <label className="block text-xs font-bold text-[#111827] dark:text-slate-300 mb-1">
              Booking Clerk / Counter
            </label>
            <input
              type="text"
              placeholder="e.g. Counter 01"
              value={bookingClerk}
              onChange={(e) => setBookingClerk(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86]"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Consignor & Consignee Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Consignor (Sender) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5EAEB] dark:border-slate-800 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E5EAEB] dark:border-slate-800 pb-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-200 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-[#2F8E86]" /> 2.1 Consignor (Sender) *
            </div>
            {consignorPartyId && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-[#E7F1F2] dark:bg-slate-800 text-[#25776F] dark:text-[#2F8E86] border border-[#D9E2E3] dark:border-slate-700 rounded">
                Linked Master Party #{consignorPartyId}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#64748B] dark:text-slate-400 mb-1">
              Consignor / Sender Name *
            </label>
            <SearchableSelect<PartyLookupItem>
              value={consignorName}
              placeholder="Search Sender (Customer A) or type new..."
              onSearch={(q) => partyService.lookupParties(q)}
              getItemKey={(p) => p.id}
              getItemLabel={(p) => p.name}
              onChangeText={(t) => {
                setConsignorName(t);
                setConsignorPartyId(undefined);
              }}
              onSelect={handleSelectConsignor}
              renderItem={(p) => (
                <div className="flex items-center justify-between w-full">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{p.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {p.gstNo ? `GST: ${p.gstNo}` : "Unregistered"} {p.city ? `• ${p.city}` : ""}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                    {p.partyType === 0 ? "Consignor" : p.partyType === 1 ? "Consignee" : "Both"}
                  </span>
                </div>
              )}
            />
          </div>

          {!consignorPartyId && consignorName.trim().length > 2 && (
            <label className="flex items-center gap-2 text-[11px] font-medium text-[#25776F] dark:text-slate-300 bg-[#E7F1F2] dark:bg-slate-800 p-2 rounded-lg border border-[#D9E2E3] dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={saveConsignorAsParty}
                onChange={(e) => setSaveConsignorAsParty(e.target.checked)}
                className="rounded text-[#2F8E86] focus:ring-[#2F8E86]"
              />
              <span>Save &ldquo;{consignorName}&rdquo; as a reusable Master Party</span>
            </label>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isGstRelevant && (
              <div>
                <label className="block text-xs font-semibold text-[#64748B] dark:text-slate-400 mb-1">
                  Consignor GSTIN
                </label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="10AAAAA0000A1Z5"
                  value={consignorGstNo}
                  onChange={(e) => setConsignorGstNo(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86]"
                />
              </div>
            )}

            <div className={!isGstRelevant ? "sm:col-span-2" : ""}>
              <label className="block text-xs font-semibold text-[#64748B] dark:text-slate-400 mb-1">
                Sender Mobile
              </label>
              <input
                type="tel"
                maxLength={10}
                inputMode="numeric"
                placeholder="9876543210"
                value={consignorMobile}
                onChange={(e) => setConsignorMobile(sanitizeMobile(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-mono text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#64748B] dark:text-slate-400 mb-1">
              Pickup / Sender Address
            </label>
            <textarea
              rows={2}
              placeholder="Sender address, warehouse, city, pin"
              value={consignorAddress}
              onChange={(e) => setConsignorAddress(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86]"
            />
          </div>
        </div>

        {/* Consignee (Receiver) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5EAEB] dark:border-slate-800 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E5EAEB] dark:border-slate-800 pb-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-200 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-[#4A90E2]" /> 2.2 Consignee (Receiver) *
            </div>
            {consigneePartyId && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-[#E7F1F2] dark:bg-slate-800 text-[#25776F] dark:text-[#2F8E86] border border-[#D9E2E3] dark:border-slate-700 rounded">
                Linked Master Party #{consigneePartyId}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#64748B] dark:text-slate-400 mb-1">
              Consignee / Receiver Name *
            </label>
            <SearchableSelect<PartyLookupItem>
              value={consigneeName}
              placeholder="Search Receiver (Party B) or type new..."
              onSearch={(q) => partyService.lookupParties(q)}
              getItemKey={(p) => p.id}
              getItemLabel={(p) => p.name}
              onChangeText={(t) => {
                setConsigneeName(t);
                setConsigneePartyId(undefined);
              }}
              onSelect={handleSelectConsignee}
              renderItem={(p) => (
                <div className="flex items-center justify-between w-full">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{p.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {p.gstNo ? `GST: ${p.gstNo}` : "Unregistered"} {p.city ? `• ${p.city}` : ""}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                    {p.partyType === 0 ? "Consignor" : p.partyType === 1 ? "Consignee" : "Both"}
                  </span>
                </div>
              )}
            />
          </div>

          {!consigneePartyId && consigneeName.trim().length > 2 && (
            <label className="flex items-center gap-2 text-[11px] font-medium text-[#25776F] dark:text-slate-300 bg-[#E7F1F2] dark:bg-slate-800 p-2 rounded-lg border border-[#D9E2E3] dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={saveConsigneeAsParty}
                onChange={(e) => setSaveConsigneeAsParty(e.target.checked)}
                className="rounded text-[#2F8E86] focus:ring-[#2F8E86]"
              />
              <span>Save &ldquo;{consigneeName}&rdquo; as a reusable Master Party</span>
            </label>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isGstRelevant && (
              <div>
                <label className="block text-xs font-semibold text-[#64748B] dark:text-slate-400 mb-1">
                  Consignee GSTIN
                </label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="10BBBBB0000B1Z6"
                  value={consigneeGstNo}
                  onChange={(e) => setConsigneeGstNo(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86]"
                />
              </div>
            )}

            <div className={!isGstRelevant ? "sm:col-span-2" : ""}>
              <label className="block text-xs font-semibold text-[#64748B] dark:text-slate-400 mb-1">
                Receiver Contact Mobile
              </label>
              <input
                type="tel"
                maxLength={10}
                inputMode="numeric"
                placeholder="9876543210"
                value={consigneeMobile}
                onChange={(e) => setConsigneeMobile(sanitizeMobile(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#64748B] dark:text-slate-400 mb-1">
              Destination Delivery Address
            </label>
            <textarea
              rows={2}
              placeholder="Recipient address in destination city, shop/godown number, pin"
              value={consigneeAddress}
              onChange={(e) => setConsigneeAddress(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2F8E86]"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: Customer Commercial Bill Intake & Photo Upload */}
      <CustomerInvoicesTable
        invoices={customerInvoices}
        onChange={handleCustomerInvoicesChange}
        disabled={loading}
      />

      {/* SECTION 4: Cargo Items Table */}
      <CargoItemsTable items={items} onChange={handleItemsChange} />

      {/* SECTION 5: Dynamic Charges Table & Real-time Ledger */}
      <DynamicChargesTable
        totalFreight={totalFreight}
        onTotalFreightChange={setTotalFreight}
        chargeItems={chargeItems}
        onChargeItemsChange={setChargeItems}
        taxTreatment={taxTreatment}
        totalTaxAmount={totalTaxAmount}
        onTotalTaxAmountChange={setTotalTaxAmount}
        paymentTerm={paymentTerm}
        onPaymentTermChange={setPaymentTerm}
        paidAmount={paidAmount}
        onPaidAmountChange={setPaidAmount}
        fromLocation={fromLocation}
        toLocation={toLocation}
      />

      {/* SECTION 6: Tax Treatment & GST Regime */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5EAEB] dark:border-slate-800 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E5EAEB] dark:border-slate-800 pb-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-slate-200 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-[#2F8E86]" /> 6. GST Treatment & Tax Rules
          </div>
          <span className="text-[11px] text-[#64748B] font-medium">Controls GST calculation on Transporter Freight</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TAX_TREATMENT_OPTIONS.map((opt) => {
            const isSelected = taxTreatment === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTaxTreatment(opt.value)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-[#E7F1F2] dark:bg-slate-800 border-[#2F8E86] ring-1 ring-[#2F8E86]/30"
                    : "bg-white dark:bg-slate-800 border-[#D9E2E3] dark:border-slate-700 hover:bg-[#F5FAFA] dark:hover:bg-slate-750"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className="w-4 h-4 text-[#2F8E86]" />
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#2F8E86]" />
                  )}
                </div>
                <div>
                  <div className={`text-xs font-bold ${isSelected ? "text-[#111827] dark:text-white" : "text-[#111827] dark:text-slate-200"}`}>
                    {opt.label}
                  </div>
                  <div className="text-[10px] text-[#64748B] mt-0.5 leading-tight">{opt.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* GST Paid By */}
        {isGstRelevant && (
          <div className="p-3.5 bg-[#F7F8F8] dark:bg-slate-800/60 rounded-lg border border-[#E5EAEB] dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-3">
            <div className="text-xs font-bold text-[#111827] dark:text-slate-200 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#64748B] dark:text-slate-300" /> GST Liability & Paid By:
            </div>
            <div className="flex items-center gap-4">
              {["Consignor", "Consignee", "Transporter (GTA)"].map((party) => (
                <label key={party} className="flex items-center gap-1.5 text-xs font-medium text-[#111827] dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="gstPaidBy"
                    checked={gstPaidBy === party}
                    onChange={() => setGstPaidBy(party)}
                    className="text-[#2F8E86] focus:ring-[#2F8E86]"
                  />
                  <span>{party}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 7: Delivery Remarks & Final Submit */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5EAEB] dark:border-slate-800 p-5 shadow-xs">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#111827] dark:text-slate-300 mb-1.5">
              Operational Remarks / Delivery Instructions
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Handle with care, deliver at godown, call receiver before delivery"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#111827] dark:text-slate-100 placeholder:text-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#2F8E86] focus:border-[#2F8E86]"
            />
          </div>
        </div>
      </div>

      {/* Standardized Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Submitting...</span>
            </>
          ) : initialId ? (
            "Update"
          ) : (
            "Create"
          )}
        </button>
      </div>
    </form>
  );
}
