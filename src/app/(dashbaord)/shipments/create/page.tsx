"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import UnifiedShipmentForm from "@/app/components/shipment/UnifiedShipmentForm";

function CreateShipmentContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  return <UnifiedShipmentForm initialId={editId ? Number(editId) : undefined} />;
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
