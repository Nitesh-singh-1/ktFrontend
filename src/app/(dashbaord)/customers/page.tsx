"use client";

import React, { useState, useEffect } from "react";
import { Party, PartyType, PaymentTerm } from "@/types/shipment";
import { partyService } from "services/partyService";
import PartyModal from "@/app/components/party/PartyModal";
import {
  Building2,
  Landmark,
  RotateCcw,
  Plus,
  Search,
  AlertTriangle,
  Trash2,
  Edit2
} from "lucide-react";

export default function CustomersPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [partyTypeFilter, setPartyTypeFilter] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  useEffect(() => {
    fetchParties();
  }, [partyTypeFilter]);

  const fetchParties = async (searchTerm = search) => {
    try {
      setLoading(true);
      setError(null);
      const res = await partyService.getParties({
        search: searchTerm || undefined,
        partyType: partyTypeFilter !== "" ? Number(partyTypeFilter) : undefined,
      });
      setParties(res || []);
    } catch (err: any) {
      console.error("Error fetching parties:", err);
      setError(err?.message || "Failed to load party directory.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchParties(search);
  };

  const handleEdit = (party: Party) => {
    setEditingParty(party);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingParty(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (party: Party) => {
    if (!confirm(`Are you sure you want to remove "${party.name}" from Master Data?`)) {
      return;
    }
    try {
      await partyService.deleteParty(party.id);
      fetchParties();
    } catch (err: any) {
      console.error("Delete party error:", err);
      alert(err?.message || "Failed to delete party.");
    }
  };

  // Stats
  const totalCount = parties.length;
  const gstRegisteredCount = parties.filter((p) => !!p.gstNo).length;
  const bothRoleCount = parties.filter((p) => p.partyType === PartyType.Both).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#E5EAEB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#111827] tracking-tight">
              Party Master Directory
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-[#E7F1F2] text-[#3F7C82] border border-[#D9E2E3] rounded-full">
              Consignors & Consignees
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Maintain your master trading directory. Parties can act interchangeably as Sender or Receiver with auto-fill during booking.
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-[#47868C] hover:bg-[#3F7C82] text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Master Party</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[#E5EAEB] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#64748B]">Total Master Parties</p>
            <p className="text-2xl font-bold text-[#111827] mt-1">{totalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E7F1F2] text-[#47868C] flex items-center justify-center font-bold text-lg">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5EAEB] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#64748B]">GST Registered Entities</p>
            <p className="text-2xl font-bold text-[#2F9E8F] mt-1">{gstRegisteredCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E8F6F4] text-[#2F9E8F] flex items-center justify-center font-bold text-lg">
            <Landmark className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5EAEB] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#64748B]">Dual-Role (Consignor & Consignee)</p>
            <p className="text-2xl font-bold text-[#4A90E2] mt-1">{bothRoleCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#4A90E2] flex items-center justify-center font-bold text-lg">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-[#E5EAEB] p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search party name, GSTIN, mobile, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-20 py-2 bg-white border border-[#D9E2E3] rounded-lg text-xs font-medium text-[#111827] placeholder:text-[#94A3B8] focus:border-[#47868C] focus:outline-none focus:ring-1 focus:ring-[#47868C]"
          />
          <Search className="absolute left-3 top-2.5 text-[#94A3B8] w-4 h-4" />
          <button
            type="submit"
            className="absolute right-1.5 top-1 px-3 py-1 bg-[#F7F8F8] hover:bg-[#E7F1F2] border border-[#D9E2E3] text-[#3F7C82] font-bold rounded-md text-[11px] transition cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { label: "All Roles", value: "" },
            { label: "Dual (Both)", value: PartyType.Both.toString() },
            { label: "Consignors Only", value: PartyType.Consignor.toString() },
            { label: "Consignees Only", value: PartyType.Consignee.toString() },
          ].map((tab) => {
            const isSelected = partyTypeFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setPartyTypeFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-[#47868C] text-white shadow-xs"
                    : "bg-[#F7F8F8] text-[#64748B] hover:bg-[#E7F1F2] hover:text-[#3F7C82] border border-[#E5EAEB]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-[#FDF2F2] border border-[#F8B4B4] rounded-xl text-[#D95C5C] text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#D95C5C] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Directory Table */}
      <div className="bg-white rounded-xl border border-[#E5EAEB] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#47868C] mx-auto mb-3" />
            <p className="text-xs text-[#64748B] font-medium">Loading party master directory...</p>
          </div>
        ) : parties.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="flex justify-center">
              <Building2 className="w-12 h-12 text-[#94A3B8]" />
            </div>
            <p className="text-sm font-bold text-[#111827]">No Master Parties Found</p>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Add your first customer, shipper, or receiver entity to enable instant autocomplete during consignment booking.
            </p>
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-[#47868C] hover:bg-[#3F7C82] text-white font-bold rounded-lg text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5 mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Master Party</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F8F8] border-b border-[#E5EAEB] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4">Entity / Party Name</th>
                  <th className="py-3 px-4">Role Type</th>
                  <th className="py-3 px-4">GSTIN & PAN</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Default Terms</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAEB] text-xs">
                {parties.map((party) => {
                  const roleBadge =
                    party.partyType === PartyType.Both
                      ? { text: "Consignor & Consignee", color: "bg-[#EFF6FF] text-[#4A90E2] border-[#BFDBFE]" }
                      : party.partyType === PartyType.Consignor
                      ? { text: "Consignor Only", color: "bg-[#E7F1F2] text-[#3F7C82] border-[#D9E2E3]" }
                      : { text: "Consignee Only", color: "bg-[#E8F6F4] text-[#2F9E8F] border-[#C2E9E3]" };

                  return (
                    <tr key={party.id} className="hover:bg-[#F5FAFA] transition">
                      {/* Name & Code */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#111827]">{party.name}</div>
                        {party.code && (
                          <div className="text-[10px] font-mono text-[#94A3B8]">Code: {party.code}</div>
                        )}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold border rounded-md ${roleBadge.color}`}>
                          {roleBadge.text}
                        </span>
                      </td>

                      {/* GSTIN & PAN */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {party.gstNo ? (
                          <div className="font-bold text-[#111827]">{party.gstNo}</div>
                        ) : (
                          <div className="text-[#94A3B8] italic">Unregistered</div>
                        )}
                        {party.panNo && (
                          <div className="text-[10px] text-[#64748B]">PAN: {party.panNo}</div>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#111827]">
                          {[party.city, party.state].filter(Boolean).join(", ") || "—"}
                        </div>
                        {party.address && (
                          <div className="text-[10px] text-[#64748B] truncate max-w-xs">{party.address}</div>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#111827]">{party.contactPerson || "—"}</div>
                        <div className="text-[11px] text-[#64748B] font-mono">{party.mobile || party.phone || ""}</div>
                      </td>

                      {/* Payment Terms */}
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-semibold text-[#3F7C82] bg-[#E7F1F2] px-2 py-0.5 rounded border border-[#D9E2E3]">
                          {party.defaultPaymentTerm === PaymentTerm.ToPay
                            ? "To Pay"
                            : party.defaultPaymentTerm === PaymentTerm.Paid
                            ? "Paid"
                            : "T.B.B. (Credit)"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(party)}
                            className="px-2.5 py-1 bg-white hover:bg-[#E7F1F2] text-[#3F7C82] border border-[#D9E2E3] font-bold rounded-lg text-xs transition cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(party)}
                            className="p-1.5 text-[#94A3B8] hover:text-[#D95C5C] rounded-lg transition cursor-pointer"
                            title="Delete Party"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Party Create / Edit Modal */}
      <PartyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchParties}
        initialParty={editingParty}
      />
    </div>
  );
}
