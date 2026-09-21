"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shipment,
  CreateShipmentRequest,
  TaxTreatment,
  PaymentTerm,
  ShipmentItem,
  ShipmentChargeItem,
  PartyLookupItem,
  VehicleLookupItem,
  LocationLookupItem,
  InvoiceLookupItem,
} from "@/types/shipment";
import CargoItemsTable from "./CargoItemsTable";
import DynamicChargesTable from "./DynamicChargesTable";
import SearchableSelect from "../ui/SearchableSelect";
import { shipmentService } from "services/shipmentService";
import { partyService } from "services/partyService";
import { fleetService } from "services/fleetService";
import { invoiceService } from "services/invoiceService";

interface UnifiedShipmentFormProps {
  initialId?: number;
  initialData?: Shipment;
}

const TAX_TREATMENT_OPTIONS = [
  { value: TaxTreatment.GST_Regular, label: "GST Regular (Tax Invoice)", icon: "🏛️", desc: "Standard 5%/12%/18% GST" },
  { value: TaxTreatment.NonTaxable, label: "Non-Taxable / Without GST", icon: "📄", desc: "Direct Non-GST Consignment" },
  { value: TaxTreatment.GST_RCM, label: "GST RCM (Reverse Charge)", icon: "🔄", desc: "Tax payable by recipient" },
  { value: TaxTreatment.Exempt, label: "Exempt Goods", icon: "🛡️", desc: "Exempted commodities" },
  { value: TaxTreatment.CustomTax, label: "Custom Tax Rate", icon: "⚙️", desc: "Custom defined tax rate" },
];

export default function UnifiedShipmentForm({ initialId, initialData }: UnifiedShipmentFormProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!initialId && !initialData);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form State
  const [shipmentNo, setShipmentNo] = useState("");
  const [invoiceId, setInvoiceId] = useState<number | undefined>(undefined);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [shipmentDate, setShipmentDate] = useState(new Date().toISOString().split("T")[0]);
  const [invoiceDate, setInvoiceDate] = useState("");
  const [fromLocation, setFromLocation] = useState("Pahari Patna");
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
  const [chargeItems, setChargeItems] = useState<ShipmentChargeItem[]>([]);

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
    setFromLocation(data.fromLocation || "Pahari Patna");
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

    if (data.items && data.items.length > 0) {
      setItems(data.items);
    }
    if (data.chargeItems && data.chargeItems.length > 0) {
      setChargeItems(data.chargeItems);
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

    const payload: CreateShipmentRequest = {
      shipmentNo: shipmentNo.trim() || undefined,
      invoiceId: invoiceId || undefined,
      invoiceNo: invoiceNo.trim() || undefined,
      shipmentDate: shipmentDate || undefined,
      invoiceDate: invoiceDate || undefined,
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
      saveConsignorAsParty: !consignorPartyId ? saveConsignorAsParty : undefined,

      // Consignee
      consigneePartyId: consigneePartyId || undefined,
      consigneeName: consigneeName.trim(),
      consigneeGstNo: isGstRelevant ? consigneeGstNo.trim() || undefined : undefined,
      consigneeMobile: consigneeMobile.trim() || undefined,
      consigneeAddress: consigneeAddress.trim() || undefined,
      saveConsigneeAsParty: !consigneePartyId ? saveConsigneeAsParty : undefined,

      goodsValue: Number(goodsValue) || 0,
      paymentTerm,
      totalFreight: Number(totalFreight) || 0,
      totalTaxAmount: isGstRelevant ? Number(totalTaxAmount) || 0 : 0,
      paidAmount: Number(paidAmount) || 0,
      remarks: remarks.trim() || undefined,
      bookingClerk: bookingClerk.trim() || undefined,
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-xs">Loading consignment data...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Action Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {initialId ? `Edit Consignment #${shipmentNo || initialId}` : "Create New Consignment (Waybill)"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter goods receipt details, dynamic cargo items, party directory auto-fill, and rate calculation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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
              <span>{initialId ? "Update Consignment" : "Book Consignment"}</span>
            )}
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <span>✅</span>
          <span>{success}</span>
        </div>
      )}

      {/* 1. Tax Regime Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <span className="text-blue-600">⚖️</span> Tax Treatment & Regime Selector *
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Controls GSTIN & tax fields</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {TAX_TREATMENT_OPTIONS.map((opt) => {
            const isSelected = taxTreatment === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTaxTreatment(opt.value)}
                className={`p-3 rounded-lg border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-blue-50/60 border-blue-600 ring-1 ring-blue-600/30"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">{opt.icon}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <div>
                  <div className={`text-xs font-bold ${isSelected ? "text-blue-950" : "text-slate-800"}`}>
                    {opt.label}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{opt.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Movement & Consignment Details */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
          <span>🚚</span> Movement & Consignment Details
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Shipment No */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Shipment / GR No
            </label>
            <input
              type="text"
              placeholder="Auto-generated if blank (e.g. GR-2026-0001)"
              value={shipmentNo}
              onChange={(e) => setShipmentNo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-blue-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Leave empty for auto-sequencing</span>
          </div>

          {/* Shipment Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Booking Date *
            </label>
            <input
              type="date"
              required
              value={shipmentDate}
              onChange={(e) => setShipmentDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Origin Hub */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              From / Origin Hub *
            </label>
            <SearchableSelect<LocationLookupItem>
              value={fromLocation}
              placeholder="Search station or type hub..."
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
            <label className="block text-xs font-bold text-slate-700 mb-1">
              To / Destination City *
            </label>
            <SearchableSelect<LocationLookupItem>
              value={toLocation}
              placeholder="Search station or type city..."
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

          {/* Vehicle No */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Assigned Vehicle / Lorry No
            </label>
            <SearchableSelect<VehicleLookupItem>
              value={truckNo}
              placeholder="Search truck or type..."
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

          {/* Party Invoice No */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Party Invoice / Bill No
            </label>
            <SearchableSelect<InvoiceLookupItem>
              value={invoiceNo}
              placeholder="Search invoice or type..."
              onSearch={(q) => invoiceService.lookupInvoices(q)}
              getItemKey={(inv) => inv.id}
              getItemLabel={(inv) => inv.invoiceNo}
              onChangeText={setInvoiceNo}
              onSelect={(inv) => {
                setInvoiceId(inv.id);
                setInvoiceNo(inv.invoiceNo);
                if (inv.invoiceDate) setInvoiceDate(inv.invoiceDate.split("T")[0]);
              }}
              renderItem={(inv) => (
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono font-semibold text-slate-800">{inv.invoiceNo}</span>
                  <span className="text-[10px] text-slate-500">₹{inv.grandTotal} {inv.partyName ? `(${inv.partyName})` : ""}</span>
                </div>
              )}
            />
          </div>

          {/* Invoice Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Invoice Date
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Goods Value */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Declared Goods Value (₹)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={goodsValue === 0 ? "" : goodsValue}
              onChange={(e) => setGoodsValue(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* GST Paid By */}
        {isGstRelevant && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>🏛️</span> GST Liability & Paid By:
            </div>
            <div className="flex items-center gap-4">
              {["Consignor", "Consignee", "Transporter (GTA)"].map((party) => (
                <label key={party} className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="gstPaidBy"
                    checked={gstPaidBy === party}
                    onChange={() => setGstPaidBy(party)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>{party}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Consignor & Consignee Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Consignor */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="text-blue-600">📤</span> Consignor Details (Sender)
            </div>
            {consignorPartyId && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                Linked Master Party #{consignorPartyId}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Consignor / Company Name *
            </label>
            <SearchableSelect<PartyLookupItem>
              value={consignorName}
              placeholder="Search Consignor directory or type new..."
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
                    <div className="font-semibold text-slate-900">{p.name}</div>
                    <div className="text-[10px] text-slate-500">
                      {p.gstNo ? `GST: ${p.gstNo}` : "Unregistered"} {p.city ? `• ${p.city}` : ""}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {p.partyType === 0 ? "Consignor" : p.partyType === 1 ? "Consignee" : "Both"}
                  </span>
                </div>
              )}
            />
          </div>

          {!consignorPartyId && consignorName.trim().length > 2 && (
            <label className="flex items-center gap-2 text-[11px] font-medium text-blue-700 bg-blue-50/70 p-2 rounded-lg border border-blue-200/60 cursor-pointer">
              <input
                type="checkbox"
                checked={saveConsignorAsParty}
                onChange={(e) => setSaveConsignorAsParty(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Save &ldquo;{consignorName}&rdquo; as a reusable Master Party</span>
            </label>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isGstRelevant && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Consignor GSTIN
                </label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="10AAAAA0000A1Z5"
                  value={consignorGstNo}
                  onChange={(e) => setConsignorGstNo(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            <div className={!isGstRelevant ? "sm:col-span-2" : ""}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Contact Mobile
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                value={consignorMobile}
                onChange={(e) => setConsignorMobile(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Dispatch Address
            </label>
            <textarea
              rows={2}
              placeholder="Warehouse address, industrial area, city, pin"
              value={consignorAddress}
              onChange={(e) => setConsignorAddress(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Consignee */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="text-purple-600">📥</span> Consignee Details (Receiver)
            </div>
            {consigneePartyId && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded">
                Linked Master Party #{consigneePartyId}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Consignee / Destination Recipient *
            </label>
            <SearchableSelect<PartyLookupItem>
              value={consigneeName}
              placeholder="Search Consignee directory or type new..."
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
                    <div className="font-semibold text-slate-900">{p.name}</div>
                    <div className="text-[10px] text-slate-500">
                      {p.gstNo ? `GST: ${p.gstNo}` : "Unregistered"} {p.city ? `• ${p.city}` : ""}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {p.partyType === 0 ? "Consignor" : p.partyType === 1 ? "Consignee" : "Both"}
                  </span>
                </div>
              )}
            />
          </div>

          {!consigneePartyId && consigneeName.trim().length > 2 && (
            <label className="flex items-center gap-2 text-[11px] font-medium text-purple-700 bg-purple-50/70 p-2 rounded-lg border border-purple-200/60 cursor-pointer">
              <input
                type="checkbox"
                checked={saveConsigneeAsParty}
                onChange={(e) => setSaveConsigneeAsParty(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              <span>Save &ldquo;{consigneeName}&rdquo; as a reusable Master Party</span>
            </label>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isGstRelevant && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Consignee GSTIN
                </label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="10BBBBB0000B1Z6"
                  value={consigneeGstNo}
                  onChange={(e) => setConsigneeGstNo(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            <div className={!isGstRelevant ? "sm:col-span-2" : ""}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Contact Mobile
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                value={consigneeMobile}
                onChange={(e) => setConsigneeMobile(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Delivery Address
            </label>
            <textarea
              rows={2}
              placeholder="Recipient address, shop/godown number, city, pin"
              value={consigneeAddress}
              onChange={(e) => setConsigneeAddress(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 4. Cargo Items Table */}
      <CargoItemsTable items={items} onChange={setItems} />

      {/* 5. Dynamic Charges Table & Real-time Ledger */}
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
      />

      {/* 6. Administrative Footer / Remarks */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Operational Remarks / Delivery Instructions
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Handle with care, deliver during business hours"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Booking Operator / Clerk
            </label>
            <input
              type="text"
              placeholder="e.g. Operator Desk 01"
              value={bookingClerk}
              onChange={(e) => setBookingClerk(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Submit Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? "Submitting..." : initialId ? "Save Consignment Changes" : "Confirm & Save Consignment (GR)"}
        </button>
      </div>
    </form>
  );
}
