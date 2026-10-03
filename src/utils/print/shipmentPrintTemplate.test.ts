import { describe, expect, it } from "vitest";
import { renderBiltyBodyDense, renderBiltyBodyStandard } from "./shipmentPrintTemplate";
import { Shipment, TaxTreatment, PaymentTerm, ShipmentStatus } from "@/types/shipment";

const mockShipmentSingleItem: Shipment = {
  id: 1,
  shipmentNo: "LR-1001",
  shipmentDate: "2026-10-03T10:00:00Z",
  createdAt: "2026-10-03T10:00:00Z",
  updatedAt: "2026-10-03T10:00:00Z",
  status: ShipmentStatus.Booked,
  fromLocation: "Mumbai",
  toLocation: "Pune",
  consignorName: "Acme Logistics",
  consigneeName: "Best Retailers",
  taxTreatment: TaxTreatment.GST_Regular,
  paymentTerm: PaymentTerm.ToPay,
  invoiceNo: "INV-999",
  invoiceReferences: [
    {
      customerInvoiceNo: "INV-999",
      privateMarka: "PM-456",
      itemCount: 5,
      declaredValue: 50000,
    },
  ],
  items: [
    {
      id: 1,
      article: "Boxes",
      description: "Electronic Components",
      weight: 120,
      quantity: 5,
      rate: 10,
      totalAmount: 1200,
    },
  ],
  totalFreight: 1200,
  grandTotal: 1200,
};

const mockShipmentMultiItems: Shipment = {
  ...mockShipmentSingleItem,
  items: [
    {
      id: 1,
      article: "Boxes",
      description: "Electronic Components",
      weight: 120,
      quantity: 5,
      rate: 10,
      totalAmount: 1200,
    },
    {
      id: 2,
      article: "Cartons",
      description: "Spare Parts",
      weight: 45,
      quantity: 3,
      rate: 15,
      totalAmount: 675,
    },
  ],
  grandTotal: 1875,
};

describe("Bilty print templates", () => {
  it("renderBiltyBodyDense displays single item without quantity in description, stacks Inv No & P-Marka in route box, and shows BILL TYPE", () => {
    const html = renderBiltyBodyDense(mockShipmentSingleItem);
    expect(html).toContain("Electronic Components");
    expect(html).not.toContain("Electronic Components × 5");
    expect(html).not.toContain("Electronic Components X 5");
    // Inv No and P-Marka in route-box
    expect(html).toContain('<span class="route-label">Inv No</span><span class="route-value">INV-999</span>');
    expect(html).toContain('<span class="route-label">P-Marka</span><span class="route-value">PM-456</span>');
    // Bill Type under grand total in charges
    expect(html).toContain('<div class="charge-label charge-pay-type">BILL TYPE</div><div class="charge-value charge-pay-type">TO PAY</div>');
  });

  it("renderBiltyBodyDense renders multiple items as individual distinct line items", () => {
    const html = renderBiltyBodyDense(mockShipmentMultiItems);
    // Should NOT combine them with comma in a single description string
    expect(html).not.toContain("Electronic Components, Spare Parts");
    // Should render separate rows with their own individual quantities, package types, descriptions, and weights
    expect(html).toContain('<div class="td col-pkg">5</div>');
    expect(html).toContain('<div class="td col-type">Boxes</div>');
    expect(html).toContain('<div class="td col-desc">Electronic Components</div>');
    expect(html).toContain('<div class="td col-wt">120</div>');

    expect(html).toContain('<div class="td col-pkg">3</div>');
    expect(html).toContain('<div class="td col-type">Cartons</div>');
    expect(html).toContain('<div class="td col-desc">Spare Parts</div>');
    expect(html).toContain('<div class="td col-wt">45</div>');
  });

  it("renderBiltyBodyStandard labels P-Marka", () => {
    const html = renderBiltyBodyStandard(mockShipmentSingleItem);
    expect(html).toContain("P-Marka: <strong>PM-456</strong>");
    expect(html).not.toContain("Private Marka: <strong>PM-456</strong>");
  });
});
