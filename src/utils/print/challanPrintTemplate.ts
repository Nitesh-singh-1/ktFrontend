import { getTenantPrintProfile } from "./tenantProfile";

interface ChallanDetail {
  id: number;
  challanId: number;
  billNo: string;
  quantity: number;
  destination: string;
  freightAmount: number;
  billTypeId: number;
  billTypeName: string;
  consigneeName: string;
  remarks: string;
  isDeleted: boolean;
  createdDate: string;
}

interface ChallanData {
  id: number;
  challanNo: string;
  challanDate: string;
  lorryNo: string;
  driverName: string;
  voiceDriverName?: string;
  fromLocation: string;
  toLocation: string;
  driverAdvanceCash?: number;
  driverAdvanceFuel?: number;
  advanceCash?: number;
  advanceFuel?: number;
  remarks?: string;
  isDeleted?: boolean;
  createdDate: string;
  createdBy?: number;
  createdByName?: string;
  modifiedDate?: string | null;
  modifiedBy?: number | null;
  modifiedByName?: string | null;
  challanDetails: ChallanDetail[];
}

function generateSingleCopy(challan: ChallanData, copyType: string): string {
  const profile = getTenantPrintProfile();
  const totalQuantity = challan.challanDetails ? challan.challanDetails.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
  const totalFreight = challan.challanDetails ? challan.challanDetails.reduce((sum, item) => sum + (item.freightAmount || 0), 0) : 0;
  const cashAdvance = (challan.driverAdvanceCash ?? challan.advanceCash ?? 0);
  const fuelAdvance = (challan.driverAdvanceFuel ?? challan.advanceFuel ?? 0);
  
  return `
    <div class="container">
      <!-- Company Letterhead -->
      <div class="letterhead">
        <img src="${profile.logoUrl || '/logo.jpeg'}" alt="Company Logo" class="company-logo" onerror="this.style.display='none'" />
        <div class="company-info">
          <div class="company-name">${profile.companyName}</div>
          <div class="company-details">${profile.tagline || profile.address || 'Logistics & Transportation Services'}</div>
          <div class="company-contact">${[
            profile.phone ? `Phone: ${profile.phone}` : '',
            profile.email ? `Email: ${profile.email}` : '',
            profile.gstin ? `GSTIN: ${profile.gstin}` : '',
            profile.panNumber ? `PAN: ${profile.panNumber}` : '',
          ].filter(Boolean).join(' | ')}</div>
        </div>
      </div>
      
      <!-- Copy Type -->
      <div class="copy-type">${copyType}</div>
      
      <!-- Challan Details Table -->
      <table class="bill-details">
        <tr>
          <td class="label">Challan No:</td>
          <td class="value"><strong>${challan.challanNo}</strong></td>
          <td class="label">Challan Date:</td>
          <td class="value"><strong>${new Date(challan.challanDate).toLocaleDateString('en-IN')}</strong></td>
        </tr>
        <tr>
          <td class="label">Lorry No:</td>
          <td class="value"><strong>${challan.lorryNo}</strong></td>
          <td class="label">Driver Name:</td>
          <td class="value">${challan.driverName}</td>
        </tr>
        ${challan.voiceDriverName ? `
        <tr>
          <td class="label">Voice Driver:</td>
          <td class="value" colspan="3">${challan.voiceDriverName}</td>
        </tr>
        ` : ''}
      </table>
      
      <!-- Route Details -->
      <div class="section-header">ROUTE DETAILS</div>
      <table class="info-table">
        <tr>
          <td class="label">From Location:</td>
          <td class="value">${challan.fromLocation}</td>
          <td class="label">To Location:</td>
          <td class="value">${challan.toLocation}</td>
        </tr>
        ${challan.remarks ? `
        <tr>
          <td class="label">Remarks:</td>
          <td class="value" colspan="3">${challan.remarks}</td>
        </tr>
        ` : ''}
      </table>
      
      <!-- Consignment Details -->
      <div class="section-header">CONSIGNMENT DETAILS</div>
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 6%">Sr. No.</th>
            <th style="width: 12%">Bill No</th>
            <th style="width: 10%">Quantity</th>
            <th style="width: 18%">Destination</th>
            <th style="width: 15%">Freight (₹)</th>
            <th style="width: 12%">Bill Type</th>
            <th style="width: 20%">Consignee Name</th>
            <th style="width: 7%">Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${challan.challanDetails && challan.challanDetails.length > 0 ? challan.challanDetails.map((item, index) => `
            <tr>
              <td class="text-center">${index + 1}</td>
              <td>${item.billNo || '-'}</td>
              <td class="text-center">${item.quantity || 0}</td>
              <td>${item.destination || '-'}</td>
              <td class="text-right">₹${item.freightAmount ? item.freightAmount.toFixed(2) : '0.00'}</td>
              <td class="text-center">${item.billTypeName || '-'}</td>
              <td>${item.consigneeName || '-'}</td>
              <td class="text-center">${item.remarks || '-'}</td>
            </tr>
          `).join('') : `
            <tr>
              <td colspan="8" class="text-center" style="color: #666; font-style: italic;">No consignments recorded</td>
            </tr>
          `}
          ${challan.challanDetails && challan.challanDetails.length > 0 ? `
            <tr class="items-total-row">
              <td colspan="2" class="text-right" style="font-weight: bold;">Total:</td>
              <td class="text-center" style="font-weight: bold;">${totalQuantity}</td>
              <td></td>
              <td class="text-right" style="font-weight: bold;">₹${totalFreight.toFixed(2)}</td>
              <td colspan="3"></td>
            </tr>
          ` : ''}
        </tbody>
      </table>
      
      <!-- Summary & Advance Details (Individual Cash & Fuel Advance) -->
      <div class="section-header">SUMMARY & ADVANCE DETAILS</div>
      <table class="payment-table">
        <tr>
          <td class="label">Total Bills:</td>
          <td class="amount">${challan.challanDetails ? challan.challanDetails.length : 0}</td>
          <td class="label">Total Quantity:</td>
          <td class="amount">${totalQuantity}</td>
        </tr>
        <tr>
          <td class="label">Cash Advance:</td>
          <td class="amount">₹${cashAdvance.toFixed(2)}</td>
          <td class="label">Fuel / Diesel Advance:</td>
          <td class="amount">₹${fuelAdvance.toFixed(2)}</td>
        </tr>
        <tr>
          <td class="label total-label" colspan="2">TOTAL FREIGHT:</td>
          <td class="amount total-amount" colspan="2">₹${totalFreight.toFixed(2)}</td>
        </tr>
      </table>
      
      <!-- Additional Information -->
      <table class="info-table">
        <tr>
          <td class="label">Created By:</td>
          <td class="value">${challan.createdByName || '-'}</td>
          <td class="label">Created Date:</td>
          <td class="value">${challan.createdDate ? new Date(challan.createdDate).toLocaleString('en-IN') : '-'}</td>
        </tr>
      </table>
      
      <!-- Signatures -->
      <table class="signature-table">
        <tr>
          <td>
            <div class="signature-line"></div>
            <div class="signature-label">Driver's Signature</div>
          </td>
          <td>
            <div class="signature-line"></div>
            <div class="signature-label">Received By</div>
          </td>
          <td>
            <div class="signature-line"></div>
            <div class="signature-label">For ${profile.companyName}</div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export function generateChallanPrintTemplate(challan: ChallanData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Challan - ${challan.challanNo}</title>
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
        </style>
      </head>
      <body>
        <!-- Office Copy -->
        ${generateSingleCopy(challan, 'OFFICE COPY')}
        
        <!-- Driver Copy -->
        ${generateSingleCopy(challan, 'DRIVER COPY')}
        
        <!-- Account Copy -->
        ${generateSingleCopy(challan, 'ACCOUNT COPY')}
        
        <button class="print-btn" onclick="window.print()">PRINT ALL COPIES</button>
      </body>
    </html>
  `;
}
