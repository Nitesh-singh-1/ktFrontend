"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import Input from "@/app/components/ui/Input";
import Card from "@/app/components/ui/Card";
import ChallanDetailsTable from "@/app/components/challan/ChallanDetailsTable";
import { sweetAlert } from "@/app/components/ui/SweetAlert";
import { ChallanDetailRow } from "@/types/challan";
import { apiService } from "../../../../../services/apiservice";

function ChallanEntryContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    challanNo: "",
    challanDate: new Date().toISOString().split('T')[0],
    lorryNo: "",
    driverName: "",
    voiceDriverName: "",
    fromLocation: "Pahari Patna",
    toLocation: "",
    remarks: "",
  });

  const [rows, setRows] = useState<ChallanDetailRow[]>([
    {
      billNo: "",
      quantity: 0,
      destination: "",
      freightAmount: 0,
      billTypeId: 0,
      consigneeName: "",
      remarks: "",
    },
  ]);

  // Fetch data when editing
  useEffect(() => {
    if (editId) {
      fetchChallanData(Number(editId));
    }
  }, [editId]);

  const fetchChallanData = async (id: number) => {
    try {
      setLoading(true);
      const response: any = await apiService.getChallanById(id);
      
      if (response.success && response.data) {
        const data = response.data;
        
        // Bind form data
        setForm({
          challanNo: data.challanNo || "",
          challanDate: data.challanDate ? data.challanDate.split('T')[0] : "",
          lorryNo: data.lorryNo || "",
          driverName: data.driverName || "",
          voiceDriverName: data.voiceDriverName || "",
          fromLocation: data.fromLocation || "",
          toLocation: data.toLocation || "",
          remarks: data.remarks || "",
        });

        // Bind challan details
        if (data.challanDetails && data.challanDetails.length > 0) {
          setRows(data.challanDetails.map((item: any) => ({
            billNo: item.billNo || "",
            quantity: item.quantity || 0,
            destination: item.destination || "",
            freightAmount: item.freightAmount || 0,
            billTypeId: item.billTypeId || 0,
            consigneeName: item.consigneeName || "",
            remarks: item.remarks || "",
          })));
        }
      }
    } catch (error: any) {
      console.error("Error fetching challan data:", error);
      sweetAlert.error({
        title: "Failed to load challan",
        message: error?.message || "Failed to fetch challan data",
      });
    } finally {
      setLoading(false);
    }
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        billNo: "",
        quantity: 0,
        destination: "",
        freightAmount: 0,
        billTypeId: 0,
        consigneeName: "",
        remarks: "",
      },
    ]);
  };

  const deleteRow = (index: number) => {
    if (rows.length === 1) {
      sweetAlert.warning({
        title: "Cannot remove row",
        message: "At least one consignment row is required.",
      });
      return;
    }
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated);
  };

  const handleChange = (index: number, field: string, value: any) => {
    const updated = [...rows];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setRows(updated);
  };

  const handleFormChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const warn = (message: string) =>
      sweetAlert.warning({ title: "Validation", message });

    if (!form.challanNo.trim()) {
      warn("Challan Number is required.");
      return false;
    }
    if (!form.lorryNo.trim()) {
      warn("Lorry Number is required.");
      return false;
    }
    if (!form.driverName.trim()) {
      warn("Driver Name is required.");
      return false;
    }
    if (!form.toLocation.trim()) {
      warn("To Location is required.");
      return false;
    }

    // Validate rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.billNo.trim()) {
        warn(`Bill No is required in row ${i + 1}.`);
        return false;
      }
      if (row.quantity <= 0) {
        warn(`Quantity must be greater than 0 in row ${i + 1}.`);
        return false;
      }
      if (!row.destination.trim()) {
        warn(`Destination is required in row ${i + 1}.`);
        return false;
      }
      if (row.freightAmount <= 0) {
        warn(`Freight Amount must be greater than 0 in row ${i + 1}.`);
        return false;
      }
      if (!row.billTypeId || row.billTypeId === 0) {
        warn(`Bill Type is required in row ${i + 1}.`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const challanData = {
        challanNo: form.challanNo,
        challanDate: form.challanDate,
        lorryNo: form.lorryNo,
        driverName: form.driverName,
        voiceDriverName: form.voiceDriverName || null,
        fromLocation: form.fromLocation,
        toLocation: form.toLocation,
        remarks: form.remarks || null,
        challanDetails: rows.map((row) => ({
          billNo: row.billNo,
          quantity: Number(row.quantity),
          destination: row.destination,
          freightAmount: Number(row.freightAmount),
          billTypeId: Number(row.billTypeId),
          consigneeName: row.consigneeName || null,
          remarks: row.remarks || null,
        })),
      };

      let response: any;
      if (editId) {
        // Update existing challan
        response = await apiService.updateChallan(Number(editId), challanData);
      } else {
        // Create new challan
        response = await apiService.createChallan(challanData);
      }
      
      if (response.success) {
        sweetAlert.success({
          title: editId ? "Challan updated" : "Challan saved",
          message: editId
            ? "The challan was updated successfully."
            : "The challan was saved successfully.",
        });
      }

    } catch (error: any) {
      console.error(error);
      sweetAlert.error({
        title: "Something went wrong",
        message: error?.message || "An unexpected error occurred while saving the challan.",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const totalQuantity = rows.reduce((sum, row) => sum + (row.quantity || 0), 0);
    const totalFreight = rows.reduce((sum, row) => sum + (row.freightAmount || 0), 0);
    const totalBills = rows.length;
    
    return { totalQuantity, totalFreight, totalBills };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-[#E5EAEB] dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827] dark:text-white tracking-tight">
            {editId ? "Edit Challan" : "New Challan Entry"}
          </h1>
          <p className="text-[#64748B] dark:text-slate-400 text-xs mt-1">
            {editId ? `Editing Challan: ${form.challanNo}` : "Create a new trip dispatch challan"}
          </p>
        </div>

        <button 
          className="btn-primary" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Loading..." : editId ? "Update Challan" : "Save Challan"}
        </button>
      </div>

      {/* BASIC INFO */}
      <Card title="Trip Information">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input 
            label="Challan No" 
            value={form.challanNo} 
            onChange={(e) => handleFormChange("challanNo", e.target.value)} 
          />
          <Input 
            type="date" 
            label="Challan Date" 
            value={form.challanDate} 
            onChange={(e) => handleFormChange("challanDate", e.target.value)} 
            disabled 
          />
          <Input 
            label="Lorry No" 
            value={form.lorryNo} 
            onChange={(e) => handleFormChange("lorryNo", e.target.value)} 
            placeholder="Enter lorry/truck number"
          />
        </div>
      </Card>

      {/* DRIVER DETAILS */}
      <Card title="Driver Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Driver Name" 
            value={form.driverName} 
            onChange={(e) => handleFormChange("driverName", e.target.value)} 
          />
          <Input 
            label="Voice Driver Name" 
            value={form.voiceDriverName} 
            onChange={(e) => handleFormChange("voiceDriverName", e.target.value)} 
            placeholder="Optional"
          />
        </div>
      </Card>

      {/* ROUTE DETAILS */}
      <Card title="Route Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input 
            label="From Location" 
            value={form.fromLocation} 
            onChange={(e) => handleFormChange("fromLocation", e.target.value)} 
            disabled 
          />
          <Input 
            label="To Location" 
            value={form.toLocation} 
            onChange={(e) => handleFormChange("toLocation", e.target.value)} 
          />
          <Input 
            label="Remarks" 
            value={form.remarks} 
            onChange={(e) => handleFormChange("remarks", e.target.value)} 
            placeholder="Optional remarks"
          />
        </div>
      </Card>

      {/* CONSIGNMENT DETAILS TABLE */}
      <Card title="Consignment Details">
        <ChallanDetailsTable
          rows={rows}
          addRow={addRow}
          deleteRow={deleteRow}
          handleChange={handleChange}
        />
      </Card>

      {/* SUMMARY */}
      <Card title="Summary">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#F7F8F8] dark:bg-slate-800/60 p-4 rounded-xl border border-[#E5EAEB] dark:border-slate-700">
            <p className="text-xs text-[#64748B] uppercase font-semibold mb-1">Total Bills</p>
            <p className="text-2xl font-bold text-[#111827] dark:text-white font-mono">{totals.totalBills}</p>
          </div>
          
          <div className="bg-[#F7F8F8] dark:bg-slate-800/60 p-4 rounded-xl border border-[#E5EAEB] dark:border-slate-700">
            <p className="text-xs text-[#64748B] uppercase font-semibold mb-1">Total Quantity</p>
            <p className="text-2xl font-bold text-[#111827] dark:text-white font-mono">{totals.totalQuantity}</p>
          </div>
          
          <div className="bg-[#F7F8F8] dark:bg-slate-800/60 p-4 rounded-xl border border-[#E5EAEB] dark:border-slate-700">
            <p className="text-xs text-[#64748B] uppercase font-semibold mb-1">Total Freight</p>
            <p className="text-2xl font-bold text-[#2F9E8F] font-mono">₹{totals.totalFreight.toFixed(2)}</p>
          </div>

          <div className="bg-[#F7F8F8] dark:bg-slate-800/60 p-4 rounded-xl border border-[#E5EAEB] dark:border-slate-700">
            <p className="text-xs text-[#64748B] uppercase font-semibold mb-1">Avg Freight/Bill</p>
            <p className="text-2xl font-bold text-[#2F8E86] font-mono">
              ₹{totals.totalBills > 0 ? (totals.totalFreight / totals.totalBills).toFixed(2) : "0.00"}
            </p>
          </div>
        </div>
      </Card>

    </div>
  );
}

export default function ChallanEntryPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-400">Loading Challan Entry...</div>}>
      <ChallanEntryContent />
    </Suspense>
  );
}
