import { Quotation } from "@/types/quotation";
import { renderPrintHeaderHtml, PRINT_HEADER_CSS } from "./printHeader";

function esc(s?: string | null): string {
  return (s || "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string
  ));
}

function inr(n?: number): string {
  return `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function generateQuotationPrintTemplate(q: Quotation): string {
  const header = renderPrintHeaderHtml();

  const rateRow = (label: string, value: string) => `
    <tr><td class="q-lbl">${esc(label)}</td><td class="q-val">${value}</td></tr>`;

  const rateRows = [
    q.rateBasis ? rateRow("Rate Basis", esc(q.rateBasis)) : "",
    q.ratePerUnit ? rateRow("Rate", inr(q.ratePerUnit)) : "",
    q.weightKg ? rateRow("Chargeable Weight", `${q.weightKg} Kg`) : "",
    q.vehicleType ? rateRow("Vehicle Type", esc(q.vehicleType)) : "",
    q.goodsDescription ? rateRow("Commodity", esc(q.goodsDescription)) : "",
  ].filter(Boolean).join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Quotation ${esc(q.quoteNo)}</title>
  <style>
    ${PRINT_HEADER_CSS}
    @media print { body { margin: 0; padding: 10mm; } @page { size: A4 portrait; margin: 10mm; } }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; margin: 20px auto; max-width: 800px; line-height: 1.45; }
    .q-wrap { border: 1px solid #d1d5db; padding: 18px; border-radius: 6px; }
    .q-title { text-align: center; font-size: 16px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin: 6px 0 14px; color: #1e293b; }
    .q-meta { display: flex; justify-content: space-between; gap: 16px; font-size: 12px; margin-bottom: 14px; }
    .q-meta div { line-height: 1.6; }
    .q-label { color: #6b7280; }
    .q-strong { font-weight: 700; color: #111827; }
    .q-section { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #6b7280; margin: 16px 0 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; }
    table.q-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
    table.q-tbl td { padding: 5px 8px; border-bottom: 1px solid #f0f0f0; }
    td.q-lbl { color: #6b7280; width: 40%; }
    td.q-val { font-weight: 600; color: #111827; }
    .q-freight { margin-top: 14px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; }
    .q-freight .lbl { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #334155; }
    .q-freight .amt { font-size: 20px; font-weight: 900; color: #111827; }
    .q-terms { font-size: 11px; color: #374151; margin-top: 6px; white-space: pre-wrap; }
    .q-foot { margin-top: 26px; display: flex; justify-content: space-between; font-size: 11px; color: #6b7280; }
    .q-sign { margin-top: 42px; border-top: 1px solid #9ca3af; width: 200px; text-align: center; padding-top: 4px; }
  </style>
</head>
<body onload="(window.__ktPrint||window.print)()">
  <div class="q-wrap">
    ${header}
    <div class="q-title">Freight Quotation</div>

    <div class="q-meta">
      <div>
        <div><span class="q-label">Quotation No:</span> <span class="q-strong">${esc(q.quoteNo)}</span></div>
        <div><span class="q-label">Date:</span> ${fmtDate(q.quoteDate)}</div>
        <div><span class="q-label">Valid Until:</span> ${fmtDate(q.validUntil)}</div>
      </div>
      <div style="text-align:right;">
        <div class="q-label">To,</div>
        <div class="q-strong">${esc(q.partyName) || "—"}</div>
        ${q.partyMobile ? `<div>${esc(q.partyMobile)}</div>` : ""}
        ${q.partyGstNo ? `<div><span class="q-label">GSTIN:</span> ${esc(q.partyGstNo)}</div>` : ""}
      </div>
    </div>

    <div class="q-section">Route</div>
    <div style="font-size:13px; font-weight:700; color:#111827;">${esc(q.fromLocation) || "—"} &rarr; ${esc(q.toLocation) || "—"}</div>

    ${rateRows ? `<div class="q-section">Rate Details</div><table class="q-tbl">${rateRows}</table>` : ""}

    <div class="q-freight">
      <span class="lbl">Estimated Freight</span>
      <span class="amt">${inr(q.estimatedFreight)}</span>
    </div>

    ${q.terms ? `<div class="q-section">Terms &amp; Conditions</div><div class="q-terms">${esc(q.terms)}</div>` : ""}

    <div class="q-foot">
      <div>This is a computer-generated quotation and is subject to the terms above.</div>
      <div class="q-sign">Authorised Signatory</div>
    </div>
  </div>
</body>
</html>`;
}
