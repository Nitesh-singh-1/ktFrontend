"use client";

import React, { useState, useEffect } from "react";
import { VendorDto, LorryHireContractDto } from "@/types/tms";
import { vendorService } from "services/vendorService";
import VendorModal from "@/app/components/vendor/VendorModal";
import LorryHireModal from "@/app/components/vendor/LorryHireModal";
import { FileText, Users, Plus, Search, AlertTriangle, Edit2 } from "lucide-react";

type VendorTab = "vendors" | "lorryHire";

export default function VendorsPage() {
  const [activeTab, setActiveTab] = useState<VendorTab>("lorryHire");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [contracts, setContracts] = useState<LorryHireContractDto[]>([]);

  // Modals
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorDto | null>(null);

  const [lorryHireModalOpen, setLorryHireModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [vList, cList] = await Promise.all([
        vendorService.getVendors(),
        vendorService.getLorryHireContracts(),
      ]);
      setVendors(vList || []);
      setContracts(cList || []);
    } catch (err: any) {
      console.error("Fetch vendors data error:", err);
      setError(err?.message || "Failed to load vendors and lorry hire memos.");
    } finally {
      setLoading(false);
    }
  };

  const handleSettleBalance = async (contract: LorryHireContractDto) => {
    const amt = prompt(
      `Enter balance settlement amount for ${contract.contractNo} (Max: ₹${contract.balancePayable}):`,
      contract.balancePayable.toString()
    );
    if (!amt || parseFloat(amt) <= 0) return;

    const ref = prompt("Enter Bank UTR / Cheque Ref No:", "NEFT-PAYOUT");

    try {
      await vendorService.recordBalancePayment(contract.id, {
        amount: parseFloat(amt),
        paymentReference: ref || undefined,
      });
      fetchData();
    } catch (err: any) {
      alert(err?.message || "Failed to record balance payment.");
    }
  };

  // KPIs
  const totalHire = contracts.reduce((sum, c) => sum + (Number(c.totalHireAmount) || 0), 0);
  const totalAdvance = contracts.reduce((sum, c) => sum + (Number(c.advanceCashPaid) + Number(c.dieselAdvanceAmount)), 0);
  const totalBalanceDue = contracts.reduce((sum, c) => sum + (Number(c.balancePayable) || 0), 0);

  // Filtered lists
  const filteredVendors = vendors.filter(
    (v) =>
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.panNo?.toLowerCase().includes(search.toLowerCase()) ||
      v.mobile?.includes(search)
  );

  const filteredContracts = contracts.filter(
    (c) =>
      c.contractNo?.toLowerCase().includes(search.toLowerCase()) ||
      c.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
      c.vehicleNo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#E5EAEB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#111827] tracking-tight">
              Market Trucks & Lorry Hire Management
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] rounded-full">
              Third-Party Fleet
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Manage market fleet vendors, issue Lorry Hire Memos with TDS deduction, and track diesel advances and balance payables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLorryHireModalOpen(true)}
            className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Lorry Hire Memo</span>
          </button>

          <button
            onClick={() => {
              setEditingVendor(null);
              setVendorModalOpen(true);
            }}
            className="px-3.5 py-2 bg-white hover:bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vendor</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[#E5EAEB] shadow-xs">
          <p className="text-xs font-semibold text-[#64748B]">Total Hired Fleet Cost</p>
          <p className="text-xl font-bold text-[#111827] font-mono mt-1">
            ₹{totalHire.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-[#94A3B8] mt-1">Across all hired contracts</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5EAEB] shadow-xs">
          <p className="text-xs font-semibold text-[#64748B]">Advances Disbursed</p>
          <p className="text-xl font-bold text-[#2F9E8F] font-mono mt-1">
            ₹{totalAdvance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-[#2F9E8F] mt-1">Cash & diesel advances</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5EAEB] shadow-xs">
          <p className="text-xs font-semibold text-[#64748B]">Balance Payables</p>
          <p className="text-xl font-bold text-[#4A90E2] font-mono mt-1">
            ₹{totalBalanceDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-[#4A90E2] mt-1">Due to truck brokers</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#E5EAEB] shadow-xs">
          <p className="text-xs font-semibold text-[#64748B]">Active Market Brokers</p>
          <p className="text-2xl font-bold text-[#111827] mt-1">{vendors.length}</p>
          <p className="text-[10px] text-[#94A3B8] mt-1">Registered suppliers</p>
        </div>
      </div>

      {/* Tab Switcher & Search Toolbar */}
      <div className="bg-white rounded-xl border border-[#E5EAEB] p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          {[
            { id: "lorryHire", label: "Lorry Hire Memos", icon: FileText, count: contracts.length },
            { id: "vendors", label: "Vendor Directory", icon: Users, count: vendors.length },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as VendorTab);
                  setSearch("");
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-[#2F8E86] text-white shadow-xs"
                    : "bg-[#F7F8F8] text-[#64748B] hover:bg-[#E7F1F2] hover:text-[#25776F] border border-[#E5EAEB]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? "bg-[#25776F] text-white" : "bg-[#E5EAEB] text-[#64748B]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder={`Search ${activeTab === "lorryHire" ? "slips, truck, broker..." : "vendor name, PAN..."}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#D9E2E3] rounded-lg text-xs font-medium text-[#111827] placeholder:text-[#94A3B8] focus:border-[#2F8E86] focus:outline-none focus:ring-1 focus:ring-[#2F8E86]"
          />
          <Search className="w-4 h-4 absolute left-3 top-2 text-[#94A3B8]" />
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 bg-[#FDF2F2] border border-[#F8B4B4] rounded-xl text-[#D95C5C] text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#D95C5C]" />
          <span>{error}</span>
        </div>
      )}

      {/* Tables Section */}
      <div className="bg-white rounded-xl border border-[#E5EAEB] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-[#64748B] text-xs font-medium">Loading market truck records...</div>
        ) : (
          <>
            {/* TAB 1: LORRY HIRE MEMOS */}
            {activeTab === "lorryHire" && (
              <div>
                {filteredContracts.length === 0 ? (
                  <div className="p-16 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#F7F8F8] flex items-center justify-center mx-auto text-[#94A3B8]">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-[#111827]">No Lorry Hire Slips Found</p>
                    <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                      Issue your first market truck hire agreement to record advances and calculate TDS deductions.
                    </p>
                    <button
                      onClick={() => setLorryHireModalOpen(true)}
                      className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-lg text-xs shadow-xs transition cursor-pointer inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Issue Lorry Hire Memo</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F7F8F8] border-b border-[#E5EAEB] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                          <th className="py-3 px-4">Contract / Slip No</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Vendor / Broker</th>
                          <th className="py-3 px-4">Vehicle & Route</th>
                          <th className="py-3 px-4 text-right">Hire Rate (₹)</th>
                          <th className="py-3 px-4 text-right">Advances (Cash+Fuel)</th>
                          <th className="py-3 px-4 text-right">TDS (₹)</th>
                          <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5EAEB]">
                        {filteredContracts.map((c) => (
                          <tr key={c.id} className="hover:bg-[#F5FAFA] transition">
                            <td className="py-3.5 px-4 font-mono font-bold text-[#2F8E86]">
                              {c.contractNo}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-[#111827]">
                              {c.contractDate ? c.contractDate.split("T")[0] : "—"}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#111827]">{c.vendorName || "Direct Owner"}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-mono font-bold text-[#111827]">{c.vehicleNo}</div>
                              <div className="text-[10px] text-[#64748B]">{c.fromLocation} → {c.toLocation}</div>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-[#111827]">
                              ₹{c.totalHireAmount}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-[#2F9E8F] font-semibold">
                              ₹{c.advanceCashPaid + c.dieselAdvanceAmount}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-[#64748B]">
                              ₹{c.tdsAmount}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-[#2F8E86]">
                              ₹{c.balancePayable}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {c.balancePayable > 0 ? (
                                <button
                                  onClick={() => handleSettleBalance(c)}
                                  className="px-2.5 py-1 bg-[#E8F6F4] hover:bg-[#D5EFEA] text-[#2F9E8F] border border-[#C2E9E3] font-bold rounded-lg text-xs transition cursor-pointer"
                                >
                                  Pay Balance
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold text-[#2F9E8F] bg-[#E8F6F4] px-2 py-0.5 rounded border border-[#C2E9E3]">
                                  SETTLED
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: VENDOR DIRECTORY */}
            {activeTab === "vendors" && (
              <div>
                {filteredVendors.length === 0 ? (
                  <div className="p-16 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#F7F8F8] flex items-center justify-center mx-auto text-[#94A3B8]">
                      <Users className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-[#111827]">No Vendors Registered</p>
                    <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                      Add third-party fleet suppliers and transport brokers.
                    </p>
                    <button
                      onClick={() => {
                        setEditingVendor(null);
                        setVendorModalOpen(true);
                      }}
                      className="px-4 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white font-bold rounded-lg text-xs shadow-xs transition cursor-pointer inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Register First Vendor</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F7F8F8] border-b border-[#E5EAEB] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                          <th className="py-3 px-4">Vendor / Broker Business</th>
                          <th className="py-3 px-4">PAN & GSTIN</th>
                          <th className="py-3 px-4">TDS Rate</th>
                          <th className="py-3 px-4">Contact Person</th>
                          <th className="py-3 px-4">Bank Payout Info</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5EAEB]">
                        {filteredVendors.map((v) => (
                          <tr key={v.id} className="hover:bg-[#F5FAFA] transition">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#111827]">{v.name}</div>
                              {v.code && <div className="text-[10px] font-mono text-[#94A3B8]">Code: {v.code}</div>}
                            </td>

                            <td className="py-3.5 px-4 font-mono">
                              <div className="font-bold text-[#111827]">{v.panNo || "No PAN"}</div>
                              {v.gstNo && <div className="text-[10px] text-[#64748B]">GST: {v.gstNo}</div>}
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="text-[11px] font-bold px-2 py-0.5 bg-[#E7F1F2] text-[#25776F] rounded border border-[#D9E2E3]">
                                {v.tdsPercentage}% TDS
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-[#111827]">{v.contactPerson || "—"}</div>
                              <div className="text-[10px] text-[#64748B] font-mono">{v.mobile || v.phone || ""}</div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-medium text-[#111827]">{v.bankName || "—"}</div>
                              {v.accountNumber && (
                                <div className="text-[10px] text-[#64748B] font-mono">A/C: {v.accountNumber} ({v.ifscCode})</div>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => {
                                  setEditingVendor(v);
                                  setVendorModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-white hover:bg-[#E7F1F2] text-[#25776F] border border-[#D9E2E3] font-bold rounded-lg text-xs transition cursor-pointer inline-flex items-center gap-1"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <VendorModal
        isOpen={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        onSaved={fetchData}
        initialVendor={editingVendor}
      />

      <LorryHireModal
        isOpen={lorryHireModalOpen}
        onClose={() => setLorryHireModalOpen(false)}
        onSaved={fetchData}
      />
    </div>
  );
}
