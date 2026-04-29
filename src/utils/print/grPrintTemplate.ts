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
  return `
    <div class="container">
      <!-- Company Letterhead -->
      <div class="letterhead">
        <div class="company-name">KESARI TRANSPORT</div>
        <div class="company-details">Logistics & Transportation Services</div>
        <div class="company-contact">Phone: +91-9430492601 | Email: info@kesaritransport.com</div>
      </div>
      
      <!-- Copy Type -->
      <div class="copy-type">${copyType}</div>
      
      <!-- Bill Title -->
      <div class="bill-title">
        <h2>GOODS RECEIPT BILL</h2>
      </div>
      
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
          <td class="label">Truck Number:</td>
          <td class="value">${entry.truckNo}</td>
          <td class="label">Delivery Status:</td>
          <td class="value">${entry.deliveryStatus}</td>
        </tr>
        <tr>
          <td class="label">Goods Value:</td>
          <td class="value">₹${entry.goodsValue.toFixed(2)}</td>
          <td class="label">GST Paid By:</td>
          <td class="value">${entry.gstPaidBy}</td>
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
      
      <!-- Footer -->
      <div class="bill-footer">
        <div class="footer-text">This is a computer generated document | Generated on: ${new Date(entry.createdAt).toLocaleString('en-IN')}</div>
      </div>
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
            font-family: 'Arial', 'Helvetica', sans-serif;
            padding: 10px;
            background: white;
            color: #000;
            font-size: 12px;
          }
          
          .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            background: white;
            border: 3px double #000;
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
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 5px;
          }
          
          .company-name {
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 2px;
            margin-bottom: 3px;
          }
          
          .company-details {
            font-size: 11px;
            margin-bottom: 2px;
          }
          
          .company-contact {
            font-size: 10px;
            color: #333;
          }
          
          /* Copy Type */
          .copy-type {
            position: absolute;
            top: 25px;
            right: 25px;
            border: 2px solid #000;
            padding: 5px 15px;
            font-weight: bold;
            font-size: 10px;
            background: white;
          }
          
          /* Bill Title */
          .bill-title {
            text-align: center;
            margin: 10px 0;
            padding: 8px;
            border: 2px solid #000;
            background: #f0f0f0;
          }
          
          .bill-title h2 {
            font-size: 16px;
            font-weight: bold;
            letter-spacing: 1px;
          }
          
          /* Tables */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          
          table td, table th {
            border: 1px solid #000;
            padding: 6px 8px;
            vertical-align: top;
          }
          
          /* Bill Details Table */
          .bill-details td {
            padding: 8px;
          }
          
          .bill-details .label {
            font-weight: bold;
            width: 20%;
            background: #f9f9f9;
          }
          
          .bill-details .value {
            width: 30%;
          }
          
          /* Section Headers */
          .section-header {
            background: #000;
            color: white;
            padding: 6px 10px;
            font-weight: bold;
            font-size: 11px;
            margin-top: 10px;
            margin-bottom: 5px;
            text-align: center;
            letter-spacing: 1px;
          }
          
          /* Info Table */
          .info-table .label {
            font-weight: bold;
            width: 22%;
            background: #f9f9f9;
          }
          
          .info-table .value {
            width: 28%;
          }
          
          /* Party Table */
          .party-table th {
            background: #000;
            color: white;
            padding: 8px;
            font-size: 11px;
            text-align: center;
            font-weight: bold;
          }
          
          .party-table .label {
            font-weight: bold;
            width: 18%;
            background: #f9f9f9;
          }
          
          .party-table .value {
            width: 32%;
          }
          
          /* Items Table */
          .items-table {
            margin-top: 5px;
          }
          
          .items-table thead th {
            background: #000;
            color: white;
            padding: 8px;
            font-size: 11px;
            text-align: center;
            font-weight: bold;
          }
          
          .items-table tbody td {
            padding: 6px 8px;
            font-size: 11px;
          }
          
          .items-table .text-center {
            text-align: center;
          }
          
          .items-table .text-right {
            text-align: right;
          }
          
          .items-table .items-total-row {
            background: #f0f0f0;
            border-top: 2px solid #000;
          }
          
          /* Payment Table */
          .payment-table {
            margin-top: 5px;
          }
          
          .payment-table .label {
            font-weight: bold;
            width: 22%;
            background: #f9f9f9;
          }
          
          .payment-table .amount {
            width: 28%;
            text-align: right;
            font-weight: bold;
          }
          
          .payment-table .total-label {
            background: #000;
            color: white;
            font-size: 13px;
          }
          
          .payment-table .total-amount {
            background: #000;
            color: white;
            font-size: 14px;
            font-weight: bold;
          }
          
          /* Signature Table */
          .signature-table {
            margin-top: 30px;
            border: none;
          }
          
          .signature-table td {
            border: none;
            text-align: center;
            padding: 0 10px;
          }
          
          .signature-line {
            border-top: 1px solid #000;
            margin-top: 50px;
            margin-bottom: 5px;
          }
          
          .signature-label {
            font-size: 10px;
            font-weight: bold;
          }
          
          /* Footer */
          .bill-footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #000;
          }
          
          .footer-text {
            font-size: 9px;
            color: #666;
          }
          
          /* Print Button */
          .print-btn {
            margin: 20px auto;
            display: block;
            padding: 12px 30px;
            background: #000;
            color: white;
            border: 2px solid #000;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
          }
          
          .print-btn:hover {
            background: white;
            color: #000;
          }
          
          @media print {
            body {
              padding: 0;
              background: white;
            }
            .container {
              border: 3px double #000;
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
            @page {
              margin: 1cm;
              size: A4;
            }
          }
        </style>
      </head>
      <body>
        <!-- Consigner Copy -->
        ${generateSingleCopy(entry, 'CONSIGNER COPY')}
        
        <!-- Consignee Copy -->
        ${generateSingleCopy(entry, 'CONSIGNEE COPY')}
        
        <!-- Driver Copy -->
        ${generateSingleCopy(entry, 'DRIVER COPY')}
        
        <button class="print-btn" onclick="window.print()">PRINT ALL COPIES</button>
      </body>
    </html>
  `;
}
