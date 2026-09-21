"use client";

import React from "react";
import { useParams, useSearchParams } from "next/navigation";
import UnifiedShipmentForm from "@/app/components/shipment/UnifiedShipmentForm";

export default function EditShipmentClient() {
  const params = useParams();
  const searchParams = useSearchParams();

  const idFromParam = params?.id ? Number(params.id) : null;
  const idFromQuery = searchParams?.get("id") ? Number(searchParams.get("id")) : null;
  const id = idFromParam || idFromQuery;

  if (!id || isNaN(id)) {
    return (
      <div className="p-8 text-center text-red-600 font-bold">
        Invalid Shipment ID provided.
      </div>
    );
  }

  return <UnifiedShipmentForm initialId={id} />;
}
