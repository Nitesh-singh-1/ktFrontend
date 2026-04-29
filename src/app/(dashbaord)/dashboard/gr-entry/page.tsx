"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";

// import your reusable components
import TextInput from "@/app/components/ui/Input";
import Select from "@/app/components/ui/Select";
import Input from "@/app/components/ui/Input";
import Card from "@/app/components/ui/Card";
import GoodsTable from "@/app/components/gr/GoodsTable";
import { GoodsRow } from "@/types/gr"
import ChargesTable from "@/app/components/gr/ChargesTable";
import { apiService } from "../../../../../services/apiservice";
import { numberToWords } from "@/utils/numberToWords";


export default function GREntryPage() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    grNo: "",
    invoiceNo: "",
    fromLocation: "",
    toLocation: "",
    grDate: "",
    invoiceDate: "",
    goodsValue: 0,
    gstPaidBy: "",
    consignerName: "",
    consignerGstNo: "",
    consignerMobile: "",
    consigneeName: "",
    consigneeGstNo: "",
    consigneeMobile: "",
    consigneeAddress: "",
    consignerAddress:"",
    truckNo: "",
    deliveryStatus: "",
    remarks: "",
    paid: 0,
    tbb: 0,
    toPay: 0,
    totalAmount: 0,
    bookingClerk: "",
  });

  const [rows, setRows] = useState<GoodsRow[]>([
    {
      article: "",
      description: "",
      weight: 0,
      rate: 0,
    },
  ]);

  const [charges, setCharges] = useState({
    freight: 0,
    sCharge: 0,
    ddCharge: 0,
    hamali: 0,
    other: 0,
    stCharge: 0,
    grandTotal: 0,
  });

  // Fetch data when editing
  useEffect(() => {
    if (editId) {
      fetchGRData(Number(editId));
    }
  }, [editId]);

  const fetchGRData = async (id: number) => {
    try {
      setLoading(true);
      const response: any = await apiService.getGstBillById(id);
      
      if (response.success && response.data) {
        const data = response.data;
        
        // Bind form data
        setForm({
          grNo: data.grNo || "",
          invoiceNo: data.invoiceNo || "",
          fromLocation: data.fromLocation || "",
          toLocation: data.toLocation || "",
          grDate: data.grDate ? data.grDate.split('T')[0] : "",
          invoiceDate: data.invoiceDate ? data.invoiceDate.split('T')[0] : "",
          goodsValue: data.goodsValue || 0,
          gstPaidBy: data.gstPaidBy || "",
          consignerName: data.consignerName || "",
          consignerGstNo: data.consignerGstNo || "",
          consignerMobile: data.consignerMobile || "",
          consigneeName: data.consigneeName || "",
          consigneeGstNo: data.consigneeGstNo || "",
          consigneeMobile: data.consigneeMobile || "",
          consigneeAddress: data.consigneeAddress || "",
          consignerAddress: data.consignerAddress || "",
          truckNo: data.truckNo || "",
          deliveryStatus: data.deliveryStatus || "",
          remarks: data.remarks || "",
          paid: data.paid || 0,
          tbb: data.tbb || 0,
          toPay: data.toPay || 0,
          totalAmount: data.totalAmount || 0,
          bookingClerk: data.bookingClerk || "",
        });

        // Bind goods details
        if (data.goodsDetails && data.goodsDetails.length > 0) {
          setRows(data.goodsDetails.map((item: any) => ({
            article: item.article || "",
            description: item.description || "",
            weight: item.weight || 0,
            rate: item.rate || 0,
          })));
        }

        // Bind charges
        if (data.charge) {
          setCharges({
            freight: data.charge.freight || 0,
            sCharge: data.charge.serviceCharge || 0,
            ddCharge: data.charge.ddCharge || 0,
            hamali: data.charge.hamali || 0,
            other: data.charge.otherCharge || 0,
            stCharge: data.charge.stCharge || 0,
            grandTotal: data.charge.grandTotal || 0,
          });
        }
      }
    } catch (error: any) {
      console.error("Error fetching GR data:", error);
      alert(error.message || "Failed to fetch GR data");
    } finally {
      setLoading(false);
    }
  };
  const addRow = () => {
    setRows([
      ...rows,
      {
        article: "",
        description: "",
        weight: 0,
        rate: 0,
      },
    ]);
  };

  const deleteRow = (index: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

const handleChange = <K extends keyof GoodsRow>(
  index: number,
  field: K,
  value: GoodsRow[K]
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

const handleSubmit = async () => {
  try {
    const billRes: any = await apiService.createGstBill(form);
    const billId = billRes.data.id;

    // Goods (cleaner)
    await apiService.createMultipleGoods(
      rows.map((row) => ({
        billId,
        article: row.article,
        description: row.description,
        weight: row.weight,
        rate: row.rate,
      })),
    );

    // Charge
    await apiService.createCharge({
      billId,
      freight: charges.freight,
      serviceCharge: charges.sCharge,
      ddCharge: charges.ddCharge,
      hamali: charges.hamali,
      otherCharge: charges.other,
      stCharge: charges.stCharge,
      grandTotal: charges.grandTotal,
    });
  } catch (error: any) {
    console.error(error);
    alert(error.message || "Something went wrong ❌");
  }
};

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen space-y-6">

  {/* HEADER */}
  <div className="flex justify-between items-center">
    <div>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        {editId ? "Edit GR Entry" : "New GR Entry"}
      </h1>
      <p className="text-gray-500 text-sm mt-1">
        {editId ? `Editing GR: ${form.grNo}` : "Create a new goods receipt entry"}
      </p>
    </div>

    <button 
      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
      onClick={handleSubmit}
      disabled={loading}
    >
      {loading ? "Loading..." : editId ? "Update GR" : "Save GR"}
    </button>
  </div>

  {/* BASIC INFO */}
  <Card title="Basic Information">
    <div className="grid grid-cols-3 gap-4">
      <Input type="date" label="Date" value={form.grDate} onChange={(e) => handleFormChange("grDate", e.target.value)} />
      <Input label="Invoice No" value={form.invoiceNo} onChange={(e) => handleFormChange("invoiceNo", e.target.value)} />

      <Input type="date" label="Invoice Date" value={form.invoiceDate} onChange={(e) => handleFormChange("invoiceDate", e.target.value)} />
      <Input label="From" value={form.fromLocation} onChange={(e) => handleFormChange("fromLocation", e.target.value)} />
      <Input label="To" value={form.toLocation} onChange={(e) => handleFormChange("toLocation", e.target.value)} />
    </div>
  </Card>

  {/* TRANSPORT DETAILS */}
  <Card title="Transport Details">
    <div className="grid grid-cols-3 gap-4">
      <Input label="Value" value={form.goodsValue} onChange={(e) => handleFormChange("goodsValue", Number(e.target.value))} />
      <Input label="Truck No" value={form.truckNo} onChange={(e) => handleFormChange("truckNo", e.target.value)} />
      <Input label="GST Paid By" value={form.gstPaidBy} onChange={(e) => handleFormChange("gstPaidBy", e.target.value)} />
      <Input label="Delivery Status" value={form.deliveryStatus} onChange={(e) => handleFormChange("deliveryStatus", e.target.value)} />
    </div>
  </Card>

  {/* CONSIGNER */}
  <Card title="Consigner Details">
    <div className="grid grid-cols-3 gap-4">
      <Input label="Consigner Name" value={form.consignerName} onChange={(e) => handleFormChange("consignerName", e.target.value)} />
      <Input label="GST No" value={form.consignerGstNo} onChange={(e) => handleFormChange("consignerGstNo", e.target.value)} />
      <Input label="Mobile" value={form.consignerMobile} onChange={(e) => handleFormChange("consignerMobile", e.target.value)} />

      <Input label="Address" value={form.consignerAddress} onChange={(e) => handleFormChange("consignerAddress", e.target.value)} containerClass="col-span-3" />
    </div>
  </Card>

  {/* CONSIGNEE */}
  <Card title="Consignee Details">
    <div className="grid grid-cols-3 gap-4">
      <Input label="Consignee Name" value={form.consigneeName} onChange={(e) => handleFormChange("consigneeName", e.target.value)} />
      <Input label="GST No" value={form.consigneeGstNo} onChange={(e) => handleFormChange("consigneeGstNo", e.target.value)} />
      <Input label="Mobile" value={form.consigneeMobile} onChange={(e) => handleFormChange("consigneeMobile", e.target.value)} />

      <Input label="Address" value={form.consigneeAddress} onChange={(e) => handleFormChange("consigneeAddress", e.target.value)} containerClass="col-span-3" />
    </div>
  </Card>

  {/* GOODS TABLE */}
  <Card title="" >
    <GoodsTable
    rows={rows}
    addRow={addRow}
    deleteRow={deleteRow}
    handleChange={handleChange}
  />
  </Card>
    <Card title="Charges & Calculation">
    <ChargesTable
        charges={charges}
        setCharges={setCharges}
    />
    </Card>
  {/* FOOTER */}
  <Card title="Summary">
    <div className="grid grid-cols-2 gap-4">
      <Input label="Remarks" containerClass="col-span-2" />

      <div className="flex gap-6 items-center">
        <label className="flex items-center gap-2">
          <input type="checkbox" /> Paid
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" /> T.B.B
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" /> To Pay
        </label>
      </div>

      <Input label="Total Amount" value={charges.grandTotal} readOnly />
      <Input label="Booking Clerk" />
      
      <div className="col-span-2 mt-2">
        <label className="text-sm font-medium text-gray-700 block mb-1">Amount in Words:</label>
        <div className="p-3 bg-gray-50 border border-gray-300 rounded-md text-sm font-semibold text-gray-800">
          {numberToWords(charges.grandTotal)}
        </div>
      </div>
    </div>

    <button className="bg-blue-600 text-white px-4 py-2 rounded-md mt-4">
      Submit GR
    </button>
  </Card>

</div>
  );
}