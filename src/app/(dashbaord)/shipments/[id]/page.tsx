import React, { Suspense } from "react";
import ShipmentDetailsClient from "./ShipmentDetailsClient";

export function generateStaticParams() {
  return [{ id: "1" }];
}

export default function ShipmentDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
        </div>
      }
    >
      <ShipmentDetailsClient />
    </Suspense>
  );
}
