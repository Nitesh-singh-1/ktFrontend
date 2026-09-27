"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import UnifiedShipmentForm from "@/app/components/shipment/UnifiedShipmentForm";
import { Shipment } from "@/types/shipment";

function CreateShipmentContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  // Prefill from a converted quotation (see Quotations → "Convert to Booking").
  const consignor = searchParams.get("consignor");
  const mobile = searchParams.get("mobile");
  const gst = searchParams.get("gst");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const freight = searchParams.get("freight");
  const fromQuote = searchParams.get("quote");

  const hasPrefill = !editId && (consignor || from || to || freight);
  const prefill: Partial<Shipment> | undefined = hasPrefill
    ? {
        consignorName: consignor || undefined,
        consignorMobile: mobile || undefined,
        consignorGstNo: gst || undefined,
        fromLocation: from || undefined,
        toLocation: to || undefined,
        totalFreight: freight ? Number(freight) : undefined,
        shipmentDate: new Date().toISOString(),
        remarks: fromQuote ? `Converted from quotation ${fromQuote}` : undefined,
      }
    : undefined;

  return (
    <UnifiedShipmentForm
      initialId={editId ? Number(editId) : undefined}
      initialData={prefill as Shipment | undefined}
    />
  );
}

export default function CreateShipmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
        </div>
      }
    >
      <CreateShipmentContent />
    </Suspense>
  );
}
