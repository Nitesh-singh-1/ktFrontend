import React, { Suspense } from "react";
import EditShipmentClient from "./EditShipmentClient";

export function generateStaticParams() {
  return [{ id: "1" }];
}

export default function EditShipmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
        </div>
      }
    >
      <EditShipmentClient />
    </Suspense>
  );
}
