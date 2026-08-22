"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import Input from "@/app/components/ui/Input";
import Card from "@/app/components/ui/Card";
import ChallanDetailsTable from "@/app/components/challan/ChallanDetailsTable";
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
      alert(error.message || "Failed to fetch challan data");
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
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleChange = <K extends keyof ChallanDetailRow>(
    index: number,
    field: K,
    value: ChallanDetailRow[K]
  ) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const handleFormChange = (key: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    // Challan Header validations
    if (!form.challanNo.trim()) errors.push("Challan No is required");
    if (!form.challanDate) errors.push("Challan Date is required");
    if (!form.lorryNo.trim()) errors.push("Lorry No is required");
    if (!form.driverName.trim()) errors.push("Driver Name is required");
    if (!form.toLocation.trim()) errors.push("To Location is required");

    // Challan Details validation
    if (rows.length === 0) errors.push("At least one consignment is required");
    rows.forEach((row, index) => {
      if (!row.billNo.trim()) errors.push(`Bill No is required for row ${index + 1}`);
      if (!row.quantity || row.quantity <= 0) errors.push(`Quantity must be greater than 0 for row ${index + 1}`);
      if (!row.destination.trim()) errors.push(`Destination is required for row ${index + 1}`);
      if (!row.freightAmount || row.freightAmount <= 0) errors.push(`Freight Amount must be greater than 0 for row ${index + 1}`);
      if (!row.billTypeId) errors.push(`Bill Type is required for row ${index + 1}`);
      if (!row.consigneeName.trim()) errors.push(`Consignee Name is required for row ${index + 1}`);
    });

    return errors;
  };

  const handleSubmit = async () => {
    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      alert("Please fix the following errors:\\n\\n" + errors.join("\\n"));
      return;
    }

    try {
      setLoading(true);
      
      // Prepare challan data
      const challanData = {
        challanNo: form.challanNo,
        challanDate: form.challanDate,
        lorryNo: form.lorryNo,
        driverName: form.driverName,
        voiceDriverName: form.voiceDriverName,
        fromLocation: form.fromLocation,
        toLocation: form.toLocation,
        remarks: form.remarks,
        challanDetails: rows.map((row) => ({
          billNo: row.billNo,
          quantity: row.quantity,
          destination: row.destination,
          freightAmount: row.freightAmount,
          billTypeId: row.billTypeId,
          consigneeName: row.consigneeName,
          remarks: row.remarks,
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
        alert(editId ? "Challan updated successfully! ✓" : "Challan saved successfully! ✓");
        // Optionally reset form or redirect
      }
      
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Something went wrong ❌");
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
    <div className="p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {editId ? "Edit Challan" : "New Challan Entry"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {editId ? `Editing Challan: ${form.challanNo}` : "Create a new trip challan"}
          </p>
        </div>

        <button 
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Loading..." : editId ? "Update Challan" : "Save Challan"}
        </button>
      </div>

      {/* BASIC INFO */}
      <Card title="Trip Information">
        <div className="grid grid-cols-3 gap-4">
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
        <div className="grid grid-cols-3 gap-4">
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
        <div className="grid grid-cols-3 gap-4">
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
      <Card title="">
        <ChallanDetailsTable
          rows={rows}
          addRow={addRow}
          deleteRow={deleteRow}
          handleChange={handleChange}
        />
      </Card>

      {/* SUMMARY */}
      <Card title="Summary">
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-600 uppercase font-medium mb-1">Total Bills</p>
            <p className="text-2xl font-bold text-blue-700">{totals.totalBills}</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <p className="text-xs text-gray-600 uppercase font-medium mb-1">Total Quantity</p>
            <p className="text-2xl font-bold text-green-700">{totals.totalQuantity}</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <p className="text-xs text-gray-600 uppercase font-medium mb-1">Total Freight</p>
            <p className="text-2xl font-bold text-purple-700">₹{totals.totalFreight.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <p className="text-xs text-gray-600 uppercase font-medium mb-1">Avg Freight/Bill</p>
            <p className="text-2xl font-bold text-orange-700">
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
    <Suspense fallback={<div className="p-6 text-center text-gray-500">Loading Challan Entry...</div>}>
      <ChallanEntryContent />
    </Suspense>
  );
}
