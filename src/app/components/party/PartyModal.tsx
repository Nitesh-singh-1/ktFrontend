"use client";

import React, { useState, useEffect } from "react";
import { Party, PartyType, PaymentTerm } from "@/types/shipment";
import { partyService } from "services/partyService";

interface PartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialParty?: Party | null;
}

export default function PartyModal({ isOpen, onClose, onSaved, initialParty }: PartyModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [partyType, setPartyType] = useState<PartyType>(PartyType.Both);
  const [gstNo, setGstNo] = useState("");
  const [panNo, setPanNo] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [defaultPaymentTerm, setDefaultPaymentTerm] = useState<PaymentTerm>(PaymentTerm.ToPay);
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (initialParty) {
      setName(initialParty.name || "");
      setCode(initialParty.code || "");
      setPartyType(initialParty.partyType ?? PartyType.Both);
      setGstNo(initialParty.gstNo || "");
      setPanNo(initialParty.panNo || "");
      setContactPerson(initialParty.contactPerson || "");
      setEmail(initialParty.email || "");
      setMobile(initialParty.mobile || "");
      setPhone(initialParty.phone || "");
      setAddress(initialParty.address || "");
      setCity(initialParty.city || "");
      setState(initialParty.state || "");
      setPincode(initialParty.pincode || "");
      setDefaultPaymentTerm(initialParty.defaultPaymentTerm ?? PaymentTerm.ToPay);
      setCreditLimit(initialParty.creditLimit || 0);
      setIsActive(initialParty.isActive ?? true);
    } else {
      resetForm();
    }
  }, [initialParty, isOpen]);

  const resetForm = () => {
    setName("");
    setCode("");
    setPartyType(PartyType.Both);
    setGstNo("");
    setPanNo("");
    setContactPerson("");
    setEmail("");
    setMobile("");
    setPhone("");
    setAddress("");
    setCity("");
    setState("");
    setPincode("");
    setDefaultPaymentTerm(PaymentTerm.ToPay);
    setCreditLimit(0);
    setIsActive(true);
    setError("");
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Company / Party Name is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload: Partial<Party> = {
        name: name.trim(),
        code: code.trim() || undefined,
        partyType,
        gstNo: gstNo.trim().toUpperCase() || undefined,
        panNo: panNo.trim().toUpperCase() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        email: email.trim() || undefined,
        mobile: mobile.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        pincode: pincode.trim() || undefined,
        defaultPaymentTerm,
        creditLimit: Number(creditLimit) || 0,
        isActive,
      };

      if (initialParty?.id) {
        await partyService.updateParty(initialParty.id, payload);
      } else {
        await partyService.createParty(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Save party error:", err);
      setError(err?.message || "Failed to save Party. Please check details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {initialParty ? "Edit Master Party / Customer" : "Add New Master Party (Consignor / Consignee)"}
            </h2>
            <p className="text-xs text-slate-500">
              Manage party directory entry for automatic shipment booking & invoicing.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Party Type & Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company / Party Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ABC Cargo & Logistics Ltd."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Party Code / Alias
              </label>
              <input
                type="text"
                placeholder="e.g. ABC-01"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Role Type & Default Term */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Party Role (Interchangeable)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: PartyType.Both, label: "Both (Recommended)" },
                  { value: PartyType.Consignor, label: "Consignor (Sender)" },
                  { value: PartyType.Consignee, label: "Consignee (Receiver)" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setPartyType(item.value)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition text-center cursor-pointer ${
                      partyType === item.value
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Default Payment Term
              </label>
              <select
                value={defaultPaymentTerm}
                onChange={(e) => setDefaultPaymentTerm(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={PaymentTerm.ToPay}>To Pay (Consignee Paid)</option>
                <option value={PaymentTerm.Paid}>Paid (Consignor Paid)</option>
                <option value={PaymentTerm.TBB}>T.B.B. (To Be Billed / Credit)</option>
              </select>
            </div>
          </div>

          {/* Tax Identification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                GSTIN / Tax Registration No
              </label>
              <input
                type="text"
                maxLength={15}
                placeholder="27AAACB1234F1Z1"
                value={gstNo}
                onChange={(e) => setGstNo(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                PAN Number
              </label>
              <input
                type="text"
                maxLength={10}
                placeholder="AAACB1234F"
                value={panNo}
                onChange={(e) => setPanNo(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Contacts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                placeholder="e.g. Rajesh Sharma"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="billing@abccargo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Premises / Street Address
            </label>
            <input
              type="text"
              placeholder="Plot 45, MIDC Industrial Area, Phase II"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                City
              </label>
              <input
                type="text"
                placeholder="e.g. Pune"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                State
              </label>
              <input
                type="text"
                placeholder="e.g. Maharashtra"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pincode
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="411018"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Active in Autocomplete Directory</span>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Saving..." : initialParty ? "Update Party" : "Save Master Party"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
