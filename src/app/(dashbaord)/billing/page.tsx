"use client";

import React from "react";

export default function BillingPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Billing & Invoices</h1>
        <p className="text-indigo-100 mt-2">Manage customer invoices, GST bills, and payment records.</p>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
        <p className="text-gray-600">Billing management module is ready.</p>
      </div>
    </div>
  );
}
