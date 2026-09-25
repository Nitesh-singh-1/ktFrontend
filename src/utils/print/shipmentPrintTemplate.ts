import { Shipment, TaxTreatment, PaymentTerm } from "@/types/shipment";
import { numberToWords } from "@/utils/numberToWords";
import { getTenantPrintProfile } from "./tenantProfile";

export function generateShipmentPrintTemplate(shipment: Shipment): string {
  const profile = getTenantPrintProfile();

  const taxTreatmentLabel =
    shipment.taxTreatment === TaxTreatment.GST_Regular
      ? "TAX INVOICE / CONSIGNMENT NOTE (GST REGULAR)"
      : shipment.taxTreatment === TaxTreatment.GST_RCM
      ? "CONSIGNMENT NOTE (UNDER REVERSE CHARGE MECHANISM)"
      : shipment.taxTreatment === TaxTreatment.Exempt
      ? "CONSIGNMENT NOTE (EXEMPTED COMMODITY)"
      : "CONSIGNMENT NOTE / WAYBILL";

  const paymentTermLabel =
    shipment.paymentTerm === PaymentTerm.Paid
      ? "PAID"
      : shipment.paymentTerm === PaymentTerm.TBB
      ? "TO BE BILLED (TBB)"
      : "TO PAY";

  const displayInvoiceDate = shipment.invoiceDate
    ? new Date(shipment.invoiceDate).toLocaleDateString("en-IN")
    : shipment.invoiceReferences && shipment.invoiceReferences.length > 0 && shipment.invoiceReferences[0].customerInvoiceDate
    ? new Date(shipment.invoiceReferences[0].customerInvoiceDate).toLocaleDateString("en-IN")
    : "-";

  const itemsHtml = (shipment.items || [])
    .map(
      (item, index) => `
      <tr>
        <td style="border: 1px solid #333; padding: 6px; text-align: center;">${index + 1}</td>
        <td style="border: 1px solid #333; padding: 6px;">${item.article || "-"}</td>
        <td style="border: 1px solid #333; padding: 6px;">${item.description || "-"}</td>
        <td style="border: 1px solid #333; padding: 6px; text-align: right;">${item.weight || 0}</td>
        <td style="border: 1px solid #333; padding: 6px; text-align: right;">${(item.rate || 0).toFixed(2)}</td>
        <td style="border: 1px solid #333; padding: 6px; text-align: center;">${item.quantity || 1}</td>
        <td style="border: 1px solid #333; padding: 6px; text-align: right; font-weight: bold;">${(item.totalAmount || 0).toFixed(2)}</td>
      </tr>
    `
    )
    .join("");

  const chargesHtml = (shipment.chargeItems || [])
    .map(
      (charge) => `
      <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px;">
        <span>${charge.chargeName}:</span>
        <span style="font-weight: bold;">₹${(charge.amount || 0).toFixed(2)}</span>
      </div>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Waybill / GR - ${shipment.shipmentNo}</title>
  <style>
    @media print {
      body { margin: 0; padding: 10mm; font-size: 12px; }
      @page { size: A4 portrait; margin: 8mm; }
    }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #111;
      margin: 20px auto;
      max-width: 800px;
      line-height: 1.4;
    }
    .bill-wrapper {
      border: 2px solid #222;
      padding: 16px;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #222;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #1e293b;
    }
    .doc-badge {
      display: inline-block;
      background: #1e293b;
      color: #fff;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: bold;
      border-radius: 4px;
      margin-top: 4px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .info-box {
      border: 1px solid #666;
      padding: 8px;
      border-radius: 4px;
      background: #fdfdfd;
      font-size: 12px;
    }
    .info-box-title {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 11px;
      color: #475569;
      border-bottom: 1px solid #ddd;
      padding-bottom: 3px;
      margin-bottom: 4px;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 12px;
    }
    table.data-table th {
      background: #f1f5f9;
      border: 1px solid #333;
      padding: 6px;
      font-weight: bold;
      text-align: left;
    }
    .ledger-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 12px;
      border-top: 1px solid #333;
      padding-top: 10px;
    }
    .ledger-box {
      border: 1px solid #444;
      padding: 10px;
      border-radius: 4px;
      background: #f8fafc;
    }
    .ledger-line {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-size: 12px;
    }
    .grand-total-line {
      display: flex;
      justify-content: space-between;
      border-top: 2px solid #222;
      border-bottom: 2px solid #222;
      padding: 6px 0;
      margin-top: 6px;
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
    }
    .signature-area {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      margin-top: 30px;
      text-align: center;
      font-size: 11px;
    }
    .sig-line {
      border-top: 1px dashed #444;
      padding-top: 4px;
      margin-top: 35px;
      font-weight: bold;
    }
  </style>
</head>
<body onload="window.print()">
  <div class="bill-wrapper">
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="vertical-align: top;">
          <div class="brand-title">${profile.companyName}</div>
          <div style="font-size: 12px; color: #475569; font-weight: 500;">
            ${profile.tagline || "Fleet & Logistics Management Platform"}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
            ${profile.address ? `Head Office: ${profile.address}` : ""} ${profile.phone ? `• Ph: ${profile.phone}` : ""} ${profile.gstin ? `• GSTIN: ${profile.gstin}` : ""}
          </div>
        </td>
        <td style="text-align: right; vertical-align: top;">
          <div style="font-size: 16px; font-weight: bold; color: #1e293b;">
            GR / WAYBILL NO: <span style="font-family: monospace; font-size: 18px;">${shipment.shipmentNo}</span>
          </div>
          <div style="font-size: 12px; margin-top: 2px;">
            Date: <strong>${new Date(shipment.shipmentDate || shipment.createdAt).toLocaleDateString('en-IN')}</strong>
          </div>
          <div class="doc-badge">${taxTreatmentLabel}</div>
        </td>
      </tr>
    </table>

    <!-- Route & Movement Meta -->
    <div style="display: flex; justify-content: space-between; background: #f1f5f9; padding: 6px 10px; border-radius: 4px; margin-bottom: 10px; font-size: 12px; font-weight: bold;">
      <div>ORIGIN: <span style="color: #4338ca;">${shipment.fromLocation || "-"}</span></div>
      <div>&rarr;</div>
      <div>DESTINATION: <span style="color: #4338ca;">${shipment.toLocation || "-"}</span></div>
      <div>VEHICLE NO: <span style="font-family: monospace;">${shipment.truckNo || "NOT ASSIGNED"}</span></div>
      <div>PAYMENT: <span style="color: #b91c1c;">${paymentTermLabel}</span></div>
    </div>

    <!-- Consignor & Consignee -->
    <div class="info-grid">
      <div class="info-box">
        <div class="info-box-title">CONSIGNOR (SENDER)</div>
        <div style="font-size: 13px; font-weight: bold;">${shipment.consignorName || "-"}</div>
        ${shipment.consignorGstNo ? `<div><strong>GSTIN:</strong> ${shipment.consignorGstNo}</div>` : ""}
        <div><strong>Mobile:</strong> ${shipment.consignorMobile || "-"}</div>
        <div><strong>Address:</strong> ${shipment.consignorAddress || "-"}</div>
      </div>

      <div class="info-box">
        <div class="info-box-title">CONSIGNEE (RECEIVER)</div>
        <div style="font-size: 13px; font-weight: bold;">${shipment.consigneeName || "-"}</div>
        ${shipment.consigneeGstNo ? `<div><strong>GSTIN:</strong> ${shipment.consigneeGstNo}</div>` : ""}
        <div><strong>Mobile:</strong> ${shipment.consigneeMobile || "-"}</div>
        <div><strong>Address:</strong> ${shipment.consigneeAddress || "-"}</div>
      </div>
    </div>

    <!-- Additional Doc Meta -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; font-size: 11px; background: #fff; border: 1px solid #ddd; padding: 6px; border-radius: 4px;">
      <div>Party Inv No: <strong>${shipment.invoiceNo || "-"}</strong></div>
      <div>Inv Date: <strong>${displayInvoiceDate}</strong></div>
      <div>Declared Goods Value: <strong>₹${(shipment.goodsValue || 0).toLocaleString('en-IN')}</strong></div>
    </div>

    <!-- Cargo Goods Items Table -->
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 30px; text-align: center;">#</th>
          <th>Package / Article</th>
          <th>Description of Goods</th>
          <th style="text-align: right; width: 70px;">Weight (KG)</th>
          <th style="text-align: right; width: 70px;">Rate (₹)</th>
          <th style="text-align: center; width: 50px;">Qty</th>
          <th style="text-align: right; width: 90px;">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml || `<tr><td colspan="7" style="text-align: center; padding: 10px;">No cargo items specified</td></tr>`}
      </tbody>
    </table>

    <!-- Ledger & Dynamic Charges Breakdown -->
    <div class="ledger-grid">
      <div>
        <div class="info-box-title" style="font-weight: bold; margin-bottom: 6px;">ANCILLARY CHARGES BREAKDOWN</div>
        ${chargesHtml || `<div style="font-size: 11px; color: #64748b;">No extra charges attached.</div>`}

        ${shipment.remarks ? `
          <div style="margin-top: 10px; font-size: 11px; background: #fff; border: 1px solid #ddd; padding: 6px; border-radius: 4px;">
            <strong>Remarks:</strong> ${shipment.remarks}
          </div>
        ` : ""}
      </div>

      <div class="ledger-box">
        <div class="ledger-line">
          <span>Freight Amount:</span>
          <span>₹${(shipment.totalFreight || 0).toFixed(2)}</span>
        </div>
        <div class="ledger-line">
          <span>Other / Hamali / Misc:</span>
          <span>₹${(shipment.totalOtherCharges || 0).toFixed(2)}</span>
        </div>
        ${shipment.totalTaxAmount ? `
          <div class="ledger-line">
            <span>GST / Tax Amount:</span>
            <span>₹${(shipment.totalTaxAmount || 0).toFixed(2)}</span>
          </div>
        ` : ""}

        <div class="grand-total-line">
          <span>GRAND TOTAL:</span>
          <span>₹${(shipment.grandTotal || 0).toFixed(2)}</span>
        </div>

        <div class="ledger-line" style="margin-top: 4px;">
          <span>Paid / Advance:</span>
          <span>₹${(shipment.paidAmount || 0).toFixed(2)}</span>
        </div>
        <div class="ledger-line" style="font-weight: bold; color: #b91c1c;">
          <span>Balance Due:</span>
          <span>₹${(shipment.dueAmount || 0).toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- In words -->
    <div style="margin-top: 8px; font-size: 11px; font-weight: bold; color: #1e293b;">
      Amount in Words: <span style="font-style: italic; font-weight: normal;">${numberToWords(shipment.grandTotal || 0)}</span>
    </div>

    <!-- Signatures -->
    <div class="signature-area">
      <div>
        <div class="sig-line">Consignor's Signature</div>
      </div>
      <div>
        <div class="sig-line">Driver's Signature</div>
      </div>
      <div>
        <div class="sig-line">For ${profile.companyName} (Auth Sign)</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

