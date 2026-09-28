import { Shipment, TaxTreatment, PaymentTerm } from "@/types/shipment";
import { numberToWords } from "@/utils/numberToWords";
import { getTenantPrintProfile } from "./tenantProfile";

export type BiltyCopyKind = "consignor" | "consignee" | "office" | "driver";

export interface BiltyCopyDef {
  kind: BiltyCopyKind;
  label: string;
}

export const DEFAULT_BILTY_COPIES: BiltyCopyDef[] = [
  { kind: "consignor", label: "CONSIGNOR COPY" },
  { kind: "consignee", label: "CONSIGNEE COPY" },
  { kind: "office", label: "OFFICE COPY" },
];

export type BiltyPrintLayout = "3-up" | "one-per-page";
export type BiltyPaperSize = "A4" | "A5";

/** Which visual template to use. Chosen per tenant in Settings → General & Branding. */
export type BiltyPreset = "standard" | "dense";

export interface BiltyPrintOptions {
  copies: BiltyCopyDef[];
  layout: BiltyPrintLayout;
  paper: BiltyPaperSize;
  preset?: BiltyPreset; // optional; falls back to tenant setting → "standard"
}

export const DEFAULT_BILTY_PRINT_OPTIONS: BiltyPrintOptions = {
  copies: DEFAULT_BILTY_COPIES,
  layout: "3-up",
  paper: "A4",
};

const BANNER_COLORS: Record<BiltyCopyKind, string> = {
  consignor: "#1d4ed8",
  consignee: "#b45309",
  office: "#065f46",
  driver: "#6b21a8",
};

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
  );
}

// ============================================================================
// STANDARD PRESET — original spacious per-copy template (pre-2026-09-28).
// Kept as the default so existing clients get exactly what they had before.
// ============================================================================

export function renderBiltyBodyStandard(shipment: Shipment, copy?: BiltyCopyDef): string {
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
        <td style="border: 1px solid #333; padding: 6px;">${esc(item.article || "-")}</td>
        <td style="border: 1px solid #333; padding: 6px;">${esc(item.description || "-")}</td>
        <td style="border: 1px solid #333; padding: 6px; text-align: right;">${item.weight || 0}</td>
        <td style="border: 1px solid #333; padding: 6px; text-align: right;">${(item.rate || 0).toFixed(2)}</td>
        <td style="border: 1px solid #333; padding: 6px; text-align: center;">${item.quantity || 1}</td>
        <td style="border: 1px solid #333; padding: 6px; text-align: right; font-weight: bold;">${(item.totalAmount || 0).toFixed(2)}</td>
      </tr>
    `,
    )
    .join("");

  const chargesHtml = (shipment.chargeItems || [])
    .map(
      (charge) => `
      <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px;">
        <span>${esc(charge.chargeName)}:</span>
        <span style="font-weight: bold;">₹${(charge.amount || 0).toFixed(2)}</span>
      </div>
    `,
    )
    .join("");

  const banner = copy
    ? `<div class="copy-banner" style="background:${BANNER_COLORS[copy.kind]};">${esc(copy.label)}</div>`
    : "";

  return `
  <div class="bill-wrapper">
    ${banner}
    <table class="header-table">
      <tr>
        <td style="vertical-align: top;">
          <div style="display:flex; align-items:center; gap:12px;">
            ${profile.logoUrl ? `<div style="width:60px;height:60px;background:#ffffff;border:1px solid #e5e7eb;border-radius:6px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;"><img src="${profile.logoUrl}" alt="Logo" style="max-width:100%;max-height:100%;object-fit:contain;" onerror="this.parentNode.style.display='none'" /></div>` : ""}
            <div>
              <div class="brand-title">${esc(profile.companyName)}</div>
              <div style="font-size: 12px; color: #475569; font-weight: 500;">
                ${esc(profile.tagline || "Fleet & Logistics Management Platform")}
              </div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                ${profile.address ? `Head Office: ${esc(profile.address)}` : ""} ${profile.phone ? `• Ph: ${esc(profile.phone)}` : ""} ${profile.gstin ? `• GSTIN: ${esc(profile.gstin)}` : ""}
              </div>
            </div>
          </div>
        </td>
        <td style="text-align: right; vertical-align: top;">
          <div style="font-size: 16px; font-weight: bold; color: #1e293b;">
            GR / WAYBILL NO: <span style="font-family: monospace; font-size: 18px;">${esc(shipment.shipmentNo)}</span>
          </div>
          <div style="font-size: 12px; margin-top: 2px;">
            Date: <strong>${new Date(shipment.shipmentDate || shipment.createdAt).toLocaleDateString('en-IN')}</strong>
          </div>
          <div class="doc-badge">${taxTreatmentLabel}</div>
        </td>
      </tr>
    </table>

    <div style="display: flex; justify-content: space-between; background: #f1f5f9; padding: 6px 10px; border-radius: 4px; margin-bottom: 10px; font-size: 12px; font-weight: bold;">
      <div>ORIGIN: <span style="color: #4338ca;">${esc(shipment.fromLocation || "-")}</span></div>
      <div>&rarr;</div>
      <div>DESTINATION: <span style="color: #4338ca;">${esc(shipment.toLocation || "-")}</span></div>
      <div>VEHICLE NO: <span style="font-family: monospace;">${esc(shipment.truckNo || "NOT ASSIGNED")}</span></div>
      <div>PAYMENT: <span style="color: #b91c1c;">${paymentTermLabel}</span></div>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <div class="info-box-title">CONSIGNOR (SENDER)</div>
        <div style="font-size: 13px; font-weight: bold;">${esc(shipment.consignorName || "-")}</div>
        ${shipment.consignorGstNo ? `<div><strong>GSTIN:</strong> ${esc(shipment.consignorGstNo)}</div>` : ""}
        <div><strong>Mobile:</strong> ${esc(shipment.consignorMobile || "-")}</div>
        <div><strong>Address:</strong> ${esc(shipment.consignorAddress || "-")}</div>
      </div>

      <div class="info-box">
        <div class="info-box-title">CONSIGNEE (RECEIVER)</div>
        <div style="font-size: 13px; font-weight: bold;">${esc(shipment.consigneeName || "-")}</div>
        ${shipment.consigneeGstNo ? `<div><strong>GSTIN:</strong> ${esc(shipment.consigneeGstNo)}</div>` : ""}
        <div><strong>Mobile:</strong> ${esc(shipment.consigneeMobile || "-")}</div>
        <div><strong>Address:</strong> ${esc(shipment.consigneeAddress || "-")}</div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; font-size: 11px; background: #fff; border: 1px solid #ddd; padding: 6px; border-radius: 4px;">
      <div>Party Inv No: <strong>${esc(shipment.invoiceNo || "-")}</strong></div>
      <div>Inv Date: <strong>${displayInvoiceDate}</strong></div>
      <div>Declared Goods Value: <strong>₹${(shipment.goodsValue || 0).toLocaleString('en-IN')}</strong></div>
    </div>

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

    <div class="ledger-grid">
      <div>
        <div class="info-box-title" style="font-weight: bold; margin-bottom: 6px;">ANCILLARY CHARGES BREAKDOWN</div>
        ${chargesHtml || `<div style="font-size: 11px; color: #64748b;">No extra charges attached.</div>`}
        ${shipment.remarks ? `<div style="margin-top: 10px; font-size: 11px; background: #fff; border: 1px solid #ddd; padding: 6px; border-radius: 4px;"><strong>Remarks:</strong> ${esc(shipment.remarks)}</div>` : ""}
      </div>

      <div class="ledger-box">
        <div class="ledger-line"><span>Freight Amount:</span><span>₹${(shipment.totalFreight || 0).toFixed(2)}</span></div>
        <div class="ledger-line"><span>Other / Hamali / Misc:</span><span>₹${(shipment.totalOtherCharges || 0).toFixed(2)}</span></div>
        ${shipment.totalTaxAmount ? `<div class="ledger-line"><span>GST / Tax Amount:</span><span>₹${(shipment.totalTaxAmount || 0).toFixed(2)}</span></div>` : ""}
        <div class="grand-total-line"><span>GRAND TOTAL:</span><span>₹${(shipment.grandTotal || 0).toFixed(2)}</span></div>
        <div class="ledger-line" style="margin-top: 4px;"><span>Paid / Advance:</span><span>₹${(shipment.paidAmount || 0).toFixed(2)}</span></div>
        <div class="ledger-line" style="font-weight: bold; color: #b91c1c;"><span>Balance Due:</span><span>₹${(shipment.dueAmount || 0).toFixed(2)}</span></div>
      </div>
    </div>

    <div style="margin-top: 8px; font-size: 11px; font-weight: bold; color: #1e293b;">
      Amount in Words: <span style="font-style: italic; font-weight: normal;">${esc(numberToWords(shipment.grandTotal || 0))}</span>
    </div>

    <div class="signature-area">
      <div><div class="sig-line">Consignor's Signature</div></div>
      <div><div class="sig-line">Driver's Signature</div></div>
      <div><div class="sig-line">For ${esc(profile.companyName)} (Auth Sign)</div></div>
    </div>
  </div>`;
}

function biltyCssStandard(paper: BiltyPaperSize, layout: BiltyPrintLayout): string {
  const pageSize = paper === "A5" ? "A5 portrait" : "A4 portrait";
  const isCompact = layout === "3-up";

  return `
    @page { size: ${pageSize}; margin: ${isCompact ? "8mm" : "10mm"}; }
    @media print { body { margin: 0; padding: 0; } }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #111;
      margin: ${isCompact ? "0" : "20px auto"};
      max-width: ${isCompact ? "none" : "800px"};
      line-height: 1.4;
      font-size: ${isCompact ? "10px" : "12px"};
    }
    .copies-container { display: flex; flex-direction: column; gap: ${isCompact ? "4mm" : "0"}; }
    .copy-slot { ${isCompact ? "" : "page-break-after: always;"} }
    .copy-slot:last-child { page-break-after: auto; }
    .bill-wrapper {
      border: 2px solid #222;
      padding: ${isCompact ? "10px" : "16px"};
      position: relative;
    }
    .copy-banner {
      position: absolute; top: -1px; right: -1px;
      color: white; font-weight: 900;
      font-size: ${isCompact ? "10px" : "11px"};
      letter-spacing: 1px;
      padding: ${isCompact ? "3px 10px" : "3px 12px"};
      border-bottom-left-radius: 6px;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #222;
      padding-bottom: ${isCompact ? "6px" : "10px"};
      margin-bottom: ${isCompact ? "6px" : "10px"};
    }
    .brand-title {
      font-size: ${isCompact ? "18px" : "22px"};
      font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #1e293b;
    }
    .doc-badge {
      display: inline-block; background: #1e293b; color: #fff;
      padding: 4px 10px; font-size: ${isCompact ? "10px" : "11px"};
      font-weight: bold; border-radius: 4px; margin-top: 4px;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: ${isCompact ? "8px" : "12px"}; margin-bottom: ${isCompact ? "8px" : "12px"}; }
    .info-box { border: 1px solid #666; padding: ${isCompact ? "6px" : "8px"}; border-radius: 4px; background: #fdfdfd; font-size: ${isCompact ? "10px" : "12px"}; }
    .info-box-title { font-weight: bold; text-transform: uppercase; font-size: ${isCompact ? "10px" : "11px"}; color: #475569; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin-bottom: 4px; }
    table.data-table { width: 100%; border-collapse: collapse; margin-bottom: ${isCompact ? "8px" : "12px"}; font-size: ${isCompact ? "10px" : "12px"}; }
    table.data-table th { background: #f1f5f9; border: 1px solid #333; padding: ${isCompact ? "4px" : "6px"}; font-weight: bold; text-align: left; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .ledger-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: ${isCompact ? "8px" : "12px"}; border-top: 1px solid #333; padding-top: ${isCompact ? "6px" : "10px"}; }
    .ledger-box { border: 1px solid #444; padding: ${isCompact ? "6px" : "10px"}; border-radius: 4px; background: #f8fafc; }
    .ledger-line { display: flex; justify-content: space-between; padding: 3px 0; font-size: ${isCompact ? "10px" : "12px"}; }
    .grand-total-line { display: flex; justify-content: space-between; border-top: 2px solid #222; border-bottom: 2px solid #222; padding: ${isCompact ? "4px 0" : "6px 0"}; margin-top: 6px; font-size: ${isCompact ? "12px" : "15px"}; font-weight: 900; color: #0f172a; }
    .signature-area { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: ${isCompact ? "16px" : "30px"}; text-align: center; font-size: ${isCompact ? "10px" : "11px"}; }
    .sig-line { border-top: 1px dashed #444; padding-top: 4px; margin-top: ${isCompact ? "16px" : "35px"}; font-weight: bold; }
  `;
}

// ============================================================================
// DENSE PRESET — adapted from client's Rohtas-style HTML template.
// Fits 3 fixed-height copies (~93mm each) on one A4 with generous data density.
// Opt-in per tenant via Settings → General & Branding.
// ============================================================================

function pickCharge(shipment: Shipment, needle: RegExp): number {
  const c = (shipment.chargeItems || []).find((x) => x.chargeName && needle.test(x.chargeName));
  return c ? Number(c.amount) || 0 : 0;
}

function firstLetters(name: string): string {
  return (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "LR";
}

function inr(n: number): string {
  return (n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function renderBiltyBodyDense(shipment: Shipment, copy?: BiltyCopyDef): string {
  const profile = getTenantPrintProfile();

  const items = shipment.items || [];
  const totalPackages = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0) || 0;
  const totalWeight = items.reduce((sum, it) => sum + (Number(it.weight) || 0), 0);
  const packageType = items.length > 0 ? items[0].article || "-" : "-";
  const goodsDescription =
    items.length === 0
      ? "-"
      : items.map((it) => `${it.article || it.description || "Item"} × ${it.quantity || 1}`).join(", ");

  const freight = shipment.totalFreight || 0;
  const hamali = pickCharge(shipment, /hamali/i);
  // Other = totalOtherCharges - hamali (avoid double counting), floor at 0
  const otherCharges = Math.max(0, (shipment.totalOtherCharges || 0) - hamali);
  const grandTotal = shipment.grandTotal || 0;

  const disclaimer = profile.printDisclaimer || "";
  const jurisdiction = "the applicable local jurisdiction";

  const copyLabel = copy?.label || "OFFICE COPY";
  const logoInitials = firstLetters(profile.companyName);

  const dateStr = new Date(shipment.shipmentDate || shipment.createdAt).toLocaleDateString("en-IN");

  // Location shorthand — user may store a full address; show only the last comma-segment
  // (typically the city/hub name) so the bill reads "PATNA -> PUNE" not the whole street.
  const shortLoc = (loc?: string): string => {
    if (!loc) return "-";
    const parts = loc.split(",").map((s) => s.trim()).filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1] : loc.trim();
  };

  // Footer strip: list of station names pulled from tenant profile. Names only, no codes.
  const stationsRaw = profile.activeStations || [];
  const stationNames = stationsRaw
    .map((s) => (s.includes("·") ? s.split("·").slice(1).join("·").trim() : s.trim()))
    .filter(Boolean);
  const stationsStrip =
    stationNames.length > 0
      ? `<span class="stations-label">STATIONS:</span> ${stationNames.map(esc).join(" &nbsp;·&nbsp; ")}`
      : `For ${esc(profile.companyName)}`;

  return `
  <div class="copy">
    <div class="header">
      <div class="logo-box">
        ${profile.logoUrl
          ? `<img src="${profile.logoUrl}" alt="Logo" style="max-width:100%;max-height:100%;object-fit:contain;" onerror="this.style.display='none';this.parentNode.innerHTML='<div class=\\'logo-circle\\'>${esc(logoInitials)}</div>'" />`
          : `<div class="logo-circle">${esc(logoInitials)}</div>`}
      </div>

      <div class="company">
        <div class="company-name">${esc(profile.companyName)}</div>
        <div class="company-subtitle">H.O.: ${esc(profile.address || "-")}</div>
        <div class="company-contact">
          ${profile.phone ? `Phone: ${esc(profile.phone)}` : ""}
          ${profile.email ? ` &nbsp;|&nbsp; ${esc(profile.email)}` : ""}
        </div>
        ${profile.gstin ? `<div class="company-gstin">GSTIN: ${esc(profile.gstin)}${profile.panNumber ? ` &nbsp;·&nbsp; PAN: ${esc(profile.panNumber)}` : ""}</div>` : ""}
      </div>

      <div class="copy-meta">
        <div class="copy-label">${esc(copyLabel)}</div>
        <div class="lr-number">
          <div class="lr-label">LR / BILTY NO.</div>
          <div class="lr-value">${esc(shipment.shipmentNo)}</div>
        </div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <div class="field-label">Consignor's Name</div>
        <div class="field-value">${esc(shipment.consignorName || "-")}</div>
        <div class="field-label" style="margin-top:1mm;">Address</div>
        <div class="field-value small-value party-addr">${esc(shipment.consignorAddress || "-")}</div>
        <div class="party-meta">
          ${shipment.consignorGstNo ? `GSTIN: ${esc(shipment.consignorGstNo)}` : ""}
          ${shipment.consignorMobile ? `${shipment.consignorGstNo ? " &nbsp;·&nbsp; " : ""}Mob: ${esc(shipment.consignorMobile)}` : ""}
        </div>
      </div>

      <div class="party">
        <div class="field-label">Consignee's Name</div>
        <div class="field-value">${esc(shipment.consigneeName || "-")}</div>
        <div class="field-label" style="margin-top:1mm;">Address</div>
        <div class="field-value small-value party-addr">${esc(shipment.consigneeAddress || "-")}</div>
        <div class="party-meta">
          ${shipment.consigneeGstNo ? `GSTIN: ${esc(shipment.consigneeGstNo)}` : ""}
          ${shipment.consigneeMobile ? `${shipment.consigneeGstNo ? " &nbsp;·&nbsp; " : ""}Mob: ${esc(shipment.consigneeMobile)}` : ""}
        </div>
      </div>

      <div class="route-box">
        <div class="field-label">Date</div>
        <div class="field-value">${dateStr}</div>
        <div class="route">FROM: <span>${esc(shortLoc(shipment.fromLocation))}</span></div>
        <div class="route">TO: <span>${esc(shortLoc(shipment.toLocation))}</span></div>
      </div>
    </div>

    <div class="goods">
      <div class="th">PACKAGES</div>
      <div class="th">PACKAGE TYPE</div>
      <div class="th">SAID TO CONTAIN / DESCRIPTION</div>
      <div class="th">ACTUAL WT.<br>(KG)</div>
      <div class="th">SIGNATURES</div>

      <div class="td"><div class="goods-main">${totalPackages}</div></div>
      <div class="td"><div class="goods-main">${esc(packageType)}</div></div>
      <div class="td">
        <div class="goods-main">${esc(goodsDescription)}</div>
        <div class="goods-sub">
          ${shipment.invoiceNo ? `Invoice No: ${esc(shipment.invoiceNo)}` : ""}
          ${shipment.ewayBillNo ? `${shipment.invoiceNo ? "<br>" : ""}E-Way Bill: ${esc(shipment.ewayBillNo)}` : ""}
        </div>
      </div>
      <div class="td"><div class="goods-main">${totalWeight}</div><div class="goods-sub">Kg</div></div>
      <div class="td sig-cell">
        <div class="sig-row">
          <div class="sig-line-label">Consignor's Signature</div>
        </div>
        <div class="sig-row sig-row-last">
          <div class="sig-line-label">For ${esc(profile.companyName)}<br>(Auth. Signatory)</div>
        </div>
      </div>
    </div>

    <div class="bottom">
      <div class="remarks">
        <div class="remarks-title">REMARKS / TERMS</div>
        <div class="remarks-text">
          ${shipment.remarks ? `${esc(shipment.remarks)}<br>` : ""}
          ${disclaimer ? esc(disclaimer) : `Received goods for carriage by road subject to transporter terms. Quantity, value, marks and weight are as declared by consignor. Subject to ${esc(jurisdiction)}.`}
        </div>
      </div>

      <div class="charges">
        <div class="charge-label">Freight</div><div class="charge-value">₹ ${inr(freight)}</div>
        <div class="charge-label">Hamali</div><div class="charge-value">₹ ${inr(hamali)}</div>
        <div class="charge-label">Other</div><div class="charge-value">₹ ${inr(otherCharges)}</div>
        <div class="charge-label charge-total">GRAND TOTAL</div><div class="charge-value charge-total">₹ ${inr(grandTotal)}</div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-stations">${stationsStrip}</div>
    </div>
  </div>`;
}

function biltyCssDense(paper: BiltyPaperSize, layout: BiltyPrintLayout): string {
  const pageSize = paper === "A5" ? "A5 portrait" : "A4 portrait";
  const isCompact = layout === "3-up";
  const copyHeight = isCompact ? "93mm" : "auto";
  const copyGap = isCompact ? "3.5mm" : "0";

  // Standardized border weights so every rule prints identically.
  const B_OUTER = "0.35mm solid #222";
  const B_INNER = "0.3mm solid #333";
  const B_HAIR = "0.25mm solid #555";

  return `
    @page { size: ${pageSize}; margin: 0; }
    * { box-sizing: border-box; }
    @media print { html, body { background: #fff; } }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
    }
    .copies-container {
      width: 210mm;
      min-height: 297mm;
      padding: 5mm 5mm 4mm;
      margin: 0 auto;
      background: #fff;
    }
    .copy-slot {
      margin-bottom: ${copyGap};
      ${isCompact ? "" : "page-break-after: always;"}
    }
    .copy-slot:last-child { margin-bottom: 0; page-break-after: auto; }

    /* Card is a rigid flex column. Section heights sum to exactly ${copyHeight}
       so nothing overlaps the footer or spills past the border. */
    .copy {
      width: 200mm;
      height: ${copyHeight};
      border: ${B_OUTER};
      display: flex;
      flex-direction: column;
      overflow: hidden;
      page-break-inside: avoid;
      background: #fff;
    }

    /* ---------- HEADER (18mm) ---------- */
    .header {
      flex: 0 0 18mm;
      display: grid;
      grid-template-columns: 24mm 1fr 46mm;
      border-bottom: ${B_INNER};
      overflow: hidden;
    }
    .logo-box {
      border-right: ${B_INNER};
      display: flex; align-items: center; justify-content: center;
      padding: 1.5mm;
      overflow: hidden;
    }
    .logo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .logo-circle {
      width: 14mm; height: 14mm;
      border: 0.5mm solid #333; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 6mm; font-weight: bold;
    }
    .company {
      padding: 1.5mm 3mm;
      text-align: center;
      overflow: hidden;
      display: flex; flex-direction: column; justify-content: center;
    }
    .company-name {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 6.4mm; font-weight: 700;
      line-height: 6.6mm;
      letter-spacing: 0.4mm;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .company-subtitle {
      font-size: 2.5mm; line-height: 3mm; margin-top: 0.5mm;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .company-contact {
      font-size: 2.2mm; line-height: 2.8mm;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .company-gstin {
      font-size: 2.3mm; line-height: 2.8mm;
      font-weight: 700; color: #111;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      margin-top: 0.3mm;
    }

    .copy-meta {
      border-left: ${B_INNER};
      display: grid;
      grid-template-rows: 7mm 11mm;
      overflow: hidden;
    }
    .copy-label {
      font-size: 2.9mm; font-weight: 800;
      text-align: center;
      display: flex; align-items: center; justify-content: center;
      border-bottom: ${B_INNER};
      background: #fff;
      color: #111;
      letter-spacing: 0.4mm;
      text-transform: uppercase;
    }
    .lr-number {
      display: grid; grid-template-columns: 14mm 1fr;
      align-items: center;
      overflow: hidden;
    }
    .lr-label { font-size: 2.3mm; padding-left: 2mm; line-height: 1.15; }
    .lr-value {
      font-size: 4.4mm; font-weight: 700;
      text-align: center; padding: 0 1mm;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    /* ---------- PARTIES (20mm) ---------- */
    .parties {
      flex: 0 0 20mm;
      display: grid;
      grid-template-columns: 1fr 1fr 40mm;
      border-bottom: ${B_INNER};
      overflow: hidden;
    }
    .party {
      padding: 1.1mm 2mm;
      border-right: ${B_INNER};
      overflow: hidden;
      display: flex; flex-direction: column;
    }
    .party:last-child { border-right: 0; }
    .field-label {
      font-size: 2.2mm; font-weight: 700;
      text-transform: uppercase; color: #333;
      margin-bottom: 0.4mm; line-height: 1.15;
    }
    .field-value {
      font-size: 2.8mm; font-weight: 600; line-height: 3.1mm;
      overflow: hidden;
    }
    .small-value { font-size: 2.4mm; font-weight: 500; line-height: 2.8mm; }
    .party-addr {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      color: #1f2937;
    }
    .party-meta {
      font-size: 2.3mm;
      line-height: 2.7mm;
      color: #374151;
      margin-top: 0.4mm;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .route-box {
      padding: 1.1mm 2mm;
      overflow: hidden;
      display: flex; flex-direction: column; gap: 0.4mm;
    }
    .route {
      font-size: 2.8mm; font-weight: 700;
      line-height: 3.2mm;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .route span { font-weight: 400; }

    /* ---------- GOODS (30mm) ---------- */
    .goods {
      flex: 0 0 30mm;
      display: grid;
      grid-template-columns: 20mm 40mm 1fr 25mm 40mm;
      grid-template-rows: 5mm 1fr;
      border-bottom: ${B_INNER};
      overflow: hidden;
    }
    .th {
      background: #eee;
      border-right: ${B_INNER};
      border-bottom: ${B_INNER};
      font-size: 2.2mm; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      text-align: center; padding: 0.4mm;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .th:last-child { border-right: 0; }
    .td {
      border-right: ${B_INNER};
      padding: 1mm 1.5mm;
      font-size: 2.6mm; line-height: 3mm;
      overflow: hidden;
    }
    .td:last-child { border-right: 0; }
    .goods-main { font-size: 2.9mm; font-weight: 600; }
    .goods-sub { font-size: 2.2mm; margin-top: 0.8mm; line-height: 2.7mm; }

    /* Signature cell — the rightmost goods column. Two stacked rows: consignor sig
       on top, transporter auth sig on the bottom, each ending in a dashed line. */
    .sig-cell {
      padding: 0 !important;
      display: flex;
      flex-direction: column;
    }
    .sig-row {
      flex: 1 1 0;
      border-bottom: ${B_HAIR};
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 1mm 1.5mm 0.8mm;
      overflow: hidden;
    }
    .sig-row-last { border-bottom: 0; }
    .sig-line-label {
      font-size: 2.2mm;
      font-weight: 700;
      color: #111;
      border-top: 0.3mm dashed #333;
      padding-top: 0.6mm;
      line-height: 2.6mm;
      text-align: center;
    }

    /* ---------- BOTTOM (18mm) — remarks + charges ---------- */
    .bottom {
      flex: 0 0 18mm;
      display: grid;
      grid-template-columns: 1fr 50mm;
      border-bottom: ${B_INNER};
      overflow: hidden;
    }
    .remarks {
      padding: 1mm 2mm;
      border-right: ${B_INNER};
      overflow: hidden;
    }
    .remarks-title {
      font-size: 2.3mm; font-weight: 700;
      margin-bottom: 0.4mm;
    }
    .remarks-text {
      font-size: 2.1mm;
      line-height: 2.6mm;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 5;
      -webkit-box-orient: vertical;
    }
    .charges {
      display: grid;
      grid-template-columns: 1fr 22mm;
      grid-auto-rows: min-content;
      font-size: 2.3mm;
      overflow: hidden;
    }
    .charge-label, .charge-value {
      padding: 0.5mm 1.3mm;
      border-bottom: ${B_HAIR};
      line-height: 1.2;
    }
    .charge-label { border-right: ${B_HAIR}; }
    .charge-value { font-variant-numeric: tabular-nums; text-align: right; }
    .charge-total {
      font-weight: 700;
      font-size: 2.5mm;
      background: #f5f5f5;
      border-bottom: 0;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }

    /* ---------- FOOTER (7mm) — stations horizontal strip ---------- */
    .footer {
      flex: 0 0 7mm;
      display: flex;
      align-items: center;
      padding: 0 2.5mm;
      overflow: hidden;
      background: #f6f6f6;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .footer-stations {
      font-size: 2mm;
      line-height: 2.4mm;
      color: #1f2937;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 100%;
      letter-spacing: 0.1mm;
    }
    .footer-stations .stations-label {
      font-weight: 800;
      color: #111;
      margin-right: 1.5mm;
      letter-spacing: 0.3mm;
    }
  `;
}

// ============================================================================
// Document assembly
// ============================================================================

function biltyDocument(shipment: Shipment, options: BiltyPrintOptions): string {
  const { copies, layout, paper } = options;
  const preset: BiltyPreset =
    options.preset || getTenantBiltyPreset() || "standard";

  const renderBody =
    preset === "dense" ? renderBiltyBodyDense : renderBiltyBodyStandard;
  const css = preset === "dense" ? biltyCssDense(paper, layout) : biltyCssStandard(paper, layout);

  const copiesHtml = copies
    .map((c) => `<div class="copy-slot">${renderBody(shipment, c)}</div>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Waybill / GR - ${esc(shipment.shipmentNo)}</title>
  <style>${css}</style>
</head>
<body onload="(window.__ktPrint||window.print)()">
  <div class="copies-container">
    ${copiesHtml}
  </div>
</body>
</html>`;
}

/** Reads the tenant's preferred Bilty preset from tenant_config; defaults to "standard". */
function getTenantBiltyPreset(): BiltyPreset {
  if (typeof window === "undefined") return "standard";
  try {
    const raw = localStorage.getItem("tenant_config");
    if (!raw) return "standard";
    const parsed = JSON.parse(raw);
    const val = parsed?.general?.biltyPreset;
    return val === "dense" ? "dense" : "standard";
  } catch {
    return "standard";
  }
}

/** Backwards-compatible single-copy print (Office Copy on its own page). */
export function generateShipmentPrintTemplate(shipment: Shipment): string {
  return biltyDocument(shipment, {
    copies: [{ kind: "office", label: "OFFICE COPY" }],
    layout: "one-per-page",
    paper: "A4",
  });
}

export function generateShipmentPrintTemplateWithOptions(
  shipment: Shipment,
  options: BiltyPrintOptions,
): string {
  const copies = options.copies.length > 0 ? options.copies : DEFAULT_BILTY_COPIES;
  return biltyDocument(shipment, { ...options, copies });
}
