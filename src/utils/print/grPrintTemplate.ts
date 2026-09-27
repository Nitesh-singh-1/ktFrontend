import { getTenantPrintProfile } from "./tenantProfile";
import { renderPrintHeaderHtml, PRINT_HEADER_CSS } from "./printHeader";

interface GREntryData {
  id: number;
  grNo: string;
  invoiceNo: string;
  fromLocation: string;
  toLocation: string;
  grDate: string;
  invoiceDate: string;
  goodsValue: number;
  gstPaidBy: string;
  consignerName: string;
  consignerGstNo: string;
  consignerMobile: string;
  consigneeName: string;
  consigneeGstNo: string;
  consigneeMobile: string;
  consigneeAddress: string;
  truckNo: string;
  deliveryStatus: string;
  remarks: string;
  paid: number;
  tbb: number;
  toPay: number;
  totalAmount: number;
  bookingClerk: string;
  createdByName: string;
  updatedByName: string | null;
  createdAt: string;
  goodsDetails?: Array<{
    article: string;
    description: string;
    weight: number;
    rate: number;
  }>;
  charge?: {
    freight: number;
    serviceCharge: number;
    ddCharge: number;
    hamali: number;
    otherCharge: number;
    stCharge: number;
    grandTotal: number;
  };
}

function generateSingleCopy(entry: GREntryData, copyType: string): string {
  const profile = getTenantPrintProfile();

  return `
    <div class="container">
      <!-- Company Letterhead (generic, logo-agnostic) -->
      ${renderPrintHeaderHtml(profile)}

      <!-- Copy Type -->
      <div class="copy-type">${copyType}</div>

      <!-- Bill Details Table -->
      <table class="bill-details">
        <tr>
          <td class="label">GR No:</td>
          <td class="value"><strong>${entry.grNo}</strong></td>
          <td class="label">Invoice No:</td>
          <td class="value"><strong>${entry.invoiceNo}</strong></td>
        </tr>
        <tr>
          <td class="label">GR Date:</td>
          <td class="value">${new Date(entry.grDate).toLocaleDateString('en-IN')}</td>
          <td class="label">Invoice Date:</td>
          <td class="value">${new Date(entry.invoiceDate).toLocaleDateString('en-IN')}</td>
        </tr>
      </table>

      <!-- Transport Details -->
      <div class="section-header">TRANSPORT DETAILS</div>
      <table class="info-table">
        <tr>
          <td class="label">From Location:</td>
          <td class="value">${entry.fromLocation}</td>
          <td class="label">To Location:</td>
          <td class="value">${entry.toLocation}</td>
        </tr>
        <tr>
          <td class="label" style="display: none;">Truck Number:</td>
          <td class="value" style="display: none;">${entry.truckNo}</td>
          <td class="label" style="display: none;">Delivery Status:</td>
          <td class="value" style="display: none;">${entry.deliveryStatus}</td>
        </tr>
        <tr>
          <td class="label">Goods Value:</td>
          <td class="value">₹${entry.goodsValue.toFixed(2)}</td>
          <td class="label">GST Paid By:</td>
          <td class="value">${entry.gstPaidBy}</td>
        </tr>
      </table>

      <!-- Party Details -->
      <table class="party-table">
        <tr>
          <th colspan="2">CONSIGNER DETAILS</th>
          <th colspan="2">CONSIGNEE DETAILS</th>
        </tr>
        <tr>
          <td class="label">Name:</td>
          <td class="value">${entry.consignerName}</td>
          <td class="label">Name:</td>
          <td class="value">${entry.consigneeName}</td>
        </tr>
        <tr>
          <td class="label">GST No:</td>
          <td class="value">${entry.consignerGstNo}</td>
          <td class="label">GST No:</td>
          <td class="value">${entry.consigneeGstNo}</td>
        </tr>
        <tr>
          <td class="label">Mobile:</td>
          <td class="value">${entry.consignerMobile || 'N/A'}</td>
          <td class="label">Mobile:</td>
          <td class="value">${entry.consigneeMobile}</td>
        </tr>
        <tr>
          <td class="label">Address:</td>
          <td class="value">-</td>
          <td class="label">Address:</td>
          <td class="value">${entry.consigneeAddress}</td>
        </tr>
      </table>

      <!-- Items Details -->
      <div class="section-header">ITEMS DETAILS</div>
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 8%">Sr. No.</th>
            <th style="width: 25%">Article</th>
            <th style="width: 37%">Description</th>
            <th style="width: 15%">Weight (kg)</th>
            <th style="width: 15%">Rate (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${entry.goodsDetails && entry.goodsDetails.length > 0 ? entry.goodsDetails.map((item, index) => `
            <tr>
              <td class="text-center">${index + 1}</td>
              <td>${item.article || '-'}</td>
              <td>${item.description || '-'}</td>
              <td class="text-right">${item.weight ? item.weight.toFixed(2) : '0.00'}</td>
              <td class="text-right">₹${item.rate ? item.rate.toFixed(2) : '0.00'}</td>
            </tr>
          `).join('') : `
            <tr>
              <td colspan="5" class="text-center" style="color: #666; font-style: italic;">No items recorded</td>
            </tr>
          `}
          ${entry.goodsDetails && entry.goodsDetails.length > 0 ? `
            <tr class="items-total-row">
              <td colspan="3" class="text-right" style="font-weight: bold;">Total:</td>
              <td class="text-right" style="font-weight: bold;">${entry.goodsDetails.reduce((sum, item) => sum + (item.weight || 0), 0).toFixed(2)} kg</td>
              <td></td>
            </tr>
          ` : ''}
        </tbody>
      </table>

      <!-- Charges Details -->
      ${entry.charge ? `
      <div class="section-header">CHARGES BREAKDOWN</div>
      <table class="payment-table">
        <tr>
          <td class="label">Freight Charge:</td>
          <td class="amount">₹${entry.charge.freight.toFixed(2)}</td>
          <td class="label">Service Charge:</td>
          <td class="amount">₹${entry.charge.serviceCharge.toFixed(2)}</td>
        </tr>
        <tr>
          <td class="label">DD Charge:</td>
          <td class="amount">₹${entry.charge.ddCharge.toFixed(2)}</td>
          <td class="label">Hamali:</td>
          <td class="amount">₹${entry.charge.hamali.toFixed(2)}</td>
        </tr>
        <tr>
          <td class="label">Other Charge:</td>
          <td class="amount">₹${entry.charge.otherCharge.toFixed(2)}</td>
          <td class="label">ST Charge:</td>
          <td class="amount">₹${entry.charge.stCharge.toFixed(2)}</td>
        </tr>
        <tr>
          <td class="label total-label" colspan="3">GRAND TOTAL (Charges):</td>
          <td class="amount total-amount">₹${entry.charge.grandTotal.toFixed(2)}</td>
        </tr>
      </table>
      ` : ''}

      <!-- Payment Details -->
      <div class="section-header">PAYMENT DETAILS</div>
      <table class="payment-table">
        <tr>
          <td class="label">Paid Amount:</td>
          <td class="amount">₹${entry.paid.toFixed(2)}</td>
          <td class="label">TBB (To Be Billed):</td>
          <td class="amount">₹${entry.tbb.toFixed(2)}</td>
        </tr>
        <tr>
          <td class="label">To Pay:</td>
          <td class="amount">₹${entry.toPay.toFixed(2)}</td>
          <td class="label total-label">TOTAL AMOUNT:</td>
          <td class="amount total-amount">₹${entry.totalAmount.toFixed(2)}</td>
        </tr>
      </table>

      <!-- Additional Information -->
      <table class="info-table">
        <tr>
          <td class="label">Booking Clerk:</td>
          <td class="value">${entry.bookingClerk || 'N/A'}</td>
          <td class="label">Created By:</td>
          <td class="value">${entry.createdByName}</td>
        </tr>
        ${entry.remarks ? `
        <tr>
          <td class="label">Remarks:</td>
          <td class="value" colspan="3">${entry.remarks}</td>
        </tr>
        ` : ''}
      </table>

      <!-- Terms and Conditions -->
      <div class="section-header">TERMS & CONDITIONS</div>
      <div class="terms-conditions-wrapper">
        <div class="terms-conditions">
          <ol>
            <li>No Claim on Broken, Damage and Leakage.</li>
            <li>All Disputes to Patna Jurisdiction Only.</li>
            <li>Insured by Party. Not liable for Damage, Shorting and Leakage.</li>
            <li>Any sort of enquiry delivery of booking will be entertained within 45 days.</li>
            <li>Demurrage chargeable after 7 days from the date of arrival @ Rs. 5 per day quintale on charged weight.</li>
          </ol>
        </div>
        <div class="qr-code-container">
          <img src="/QR.png" alt="QR Code" class="qr-code" />
        </div>
      </div>

      <!-- Signatures -->
      <table class="signature-table">
        <tr>
          <td>
            <div class="signature-line"></div>
            <div class="signature-label">Consigner's Signature</div>
          </td>
          <td>
            <div class="signature-line"></div>
            <div class="signature-label">Consignee's Signature</div>
          </td>
          <td>
            <div class="signature-line"></div>
            <div class="signature-label">For KESARI TRANSPORT</div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export function generateGRPrintTemplate(entry: GREntryData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>GR Entry - ${entry.grNo}</title>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Segoe UI', 'Arial', 'Helvetica', sans-serif;
            padding: 10px;
            background: white;
            color: #222;
            font-size: 12px;
            line-height: 1.4;
          }

          .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 15px;
            background: white;
            border: 2px solid #2c3e50;
            box-shadow: 0 0 0 1px #95a5a6;
            page-break-after: always;
            position: relative;
          }

          .container:first-of-type {
            page-break-before: auto;
          }

          .container:last-of-type {
            page-break-after: auto;
          }

          /* Letterhead */
          .letterhead {
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 3px solid #2c3e50;
            padding-bottom: 8px;
            margin-bottom: 8px;
            background: linear-gradient(to bottom, #f8f9fa 0%, white 100%);
            padding: 8px;
            border-radius: 4px 4px 0 0;
          }

          .company-logo {
            width: 60px;
            height: 60px;
            object-fit: contain;
            flex-shrink: 0;
          }

          .company-info {
            flex: 1;
            text-align: center;
          }

          .company-name {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: 2px;
            margin-bottom: 2px;
            color: #2c3e50;
            text-transform: uppercase;
          }

          .company-details {
            font-size: 10px;
            margin-bottom: 2px;
            color: #34495e;
            font-weight: 500;
          }

          .company-contact {
            font-size: 9px;
            color: #7f8c8d;
          }

          /* Copy Type */
          .copy-type {
            position: absolute;
            top: 18px;
            right: 18px;
            border: 2px solid #3498db;
            padding: 4px 12px;
            font-weight: 700;
            font-size: 9px;
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            border-radius: 3px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            letter-spacing: 0.5px;
          }

          /* Tables */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
          }

          table td, table th {
            border: 1px solid #bdc3c7;
            padding: 4px 6px;
            vertical-align: top;
            font-size: 10px;
          }

          /* Bill Details Table */
          .bill-details td {
            padding: 5px 6px;
          }

          .bill-details .label {
            font-weight: 600;
            width: 20%;
            background: linear-gradient(to right, #ecf0f1 0%, #f8f9fa 100%);
            color: #2c3e50;
          }

          .bill-details .value {
            width: 30%;
          }

          /* Section Headers */
          .section-header {
            background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
            color: white;
            padding: 5px 10px;
            font-weight: 700;
            font-size: 10px;
            margin-top: 8px;
            margin-bottom: 4px;
            text-align: left;
            letter-spacing: 1px;
            border-left: 3px solid #3498db;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }

          /* Info Table */
          .info-table .label {
            font-weight: 600;
            width: 22%;
            background: linear-gradient(to right, #ecf0f1 0%, #f8f9fa 100%);
            color: #2c3e50;
          }

          .info-table .value {
            width: 28%;
          }

          /* Party Table */
          .party-table th {
            background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
            color: white;
            padding: 5px 6px;
            font-size: 9px;
            text-align: center;
            font-weight: 700;
            letter-spacing: 0.5px;
          }

          .party-table .label {
            font-weight: 600;
            width: 18%;
            background: linear-gradient(to right, #ecf0f1 0%, #f8f9fa 100%);
            color: #2c3e50;
          }

          .party-table .value {
            width: 32%;
          }

          /* Items Table */
          .items-table {
            margin-top: 4px;
            border: 1px solid #95a5a6;
          }

          .items-table thead th {
            background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
            color: white;
            padding: 5px 6px;
            font-size: 9px;
            text-align: center;
            font-weight: 700;
            letter-spacing: 0.3px;
            border-color: #2c3e50;
          }

          .items-table tbody td {
            padding: 4px 6px;
            font-size: 10px;
            border-color: #bdc3c7;
          }

          .items-table .text-center {
            text-align: center;
          }

          .items-table .text-right {
            text-align: right;
          }

          .items-table .items-total-row {
            background: linear-gradient(to right, #d5dbdb 0%, #ecf0f1 100%);
            border-top: 2px solid #34495e;
            font-weight: 700;
            color: #2c3e50;
          }

          /* Payment Table */
          .payment-table {
            margin-top: 4px;
          }

          .payment-table .label {
            font-weight: 600;
            width: 22%;
            background: linear-gradient(to right, #ecf0f1 0%, #f8f9fa 100%);
            color: #2c3e50;
          }

          .payment-table .amount {
            width: 28%;
            text-align: right;
            font-weight: 600;
            color: #1a5490;
          }

          .payment-table .total-label {
            background: linear-gradient(135deg, #1a5490 0%, #154478 100%);
            color: white;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }

          .payment-table .total-amount {
            background: linear-gradient(135deg, #1a5490 0%, #154478 100%);
            color: white;
            font-size: 12px;
            font-weight: 700;
          }

          /* Terms and Conditions */
          .terms-conditions-wrapper {
            display: flex;
            gap: 15px;
            margin-bottom: 15px;
            align-items: flex-start;
          }

          .terms-conditions {
            flex: 1;
            border: 1px solid #95a5a6;
            padding: 8px 10px;
            background: linear-gradient(to bottom, #fdfefe 0%, #f8f9fa 100%);
            font-size: 9px;
            line-height: 1.5;
            border-radius: 3px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          }

          .terms-conditions ol {
            margin: 0;
            padding-left: 16px;
          }

          .terms-conditions li {
            margin-bottom: 4px;
            text-align: justify;
            color: #34495e;
          }

          .terms-conditions li:last-child {
            margin-bottom: 0;
          }

          .qr-code-container {
            flex-shrink: 0;
            text-align: center;
            border: 1px solid #95a5a6;
            padding: 8px;
            background: white;
            border-radius: 3px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.08);
          }

          .qr-code {
            width: 100px;
            height: 100px;
            display: block;
            margin: 0 auto;
          }

          /* Signature Table */
          .signature-table {
            margin-top: 12px;
            border: none;
          }

          .signature-table td {
            border: none;
            text-align: center;
            padding: 0 10px;
          }

          .signature-line {
            border-top: 2px solid #34495e;
            margin-top: 35px;
            margin-bottom: 4px;
          }

          .signature-label {
            font-size: 9px;
            font-weight: 600;
            color: #2c3e50;
          }

          /* Print Button */
          .print-btn {
            margin: 20px auto;
            display: block;
            padding: 14px 35px;
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            border: none;
            cursor: pointer;
            font-size: 14px;
            font-weight: 700;
            border-radius: 6px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            letter-spacing: 1px;
          }

          .print-btn:hover {
            background: linear-gradient(135deg, #2980b9 0%, #3498db 100%);
            box-shadow: 0 6px 10px rgba(0,0,0,0.15);
            transform: translateY(-2px);
          }

          @media print {
            body {
              padding: 0;
              background: white;
            }
            .container {
              border: 2px solid #2c3e50;
              box-shadow: none;
              max-width: 100%;
              margin: 0;
              page-break-before: always;
            }
            .container:first-of-type {
              page-break-before: avoid;
            }
            .print-btn {
              display: none;
            }

            /* Ensure colors print well in grayscale */
            .section-header,
            .party-table th,
            .items-table thead th {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .copy-type {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .payment-table .total-label,
            .payment-table .total-amount {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            @page {
              margin: 1cm;
              size: A4;
            }
          }
          ${PRINT_HEADER_CSS}
        </style>
      </head>
      <body>
        <!-- Consigner Copy -->
        ${generateSingleCopy(entry, 'CONSIGNER COPY')}

        <!-- Consignee Copy -->
        ${generateSingleCopy(entry, 'CONSIGNEE COPY')}

        <!-- Driver Copy -->
        ${generateSingleCopy(entry, 'DRIVER COPY')}

        <button class="print-btn" onclick="(window.__ktPrint||window.print)()">PRINT ALL COPIES</button>
      </body>
    </html>
  `;
}
