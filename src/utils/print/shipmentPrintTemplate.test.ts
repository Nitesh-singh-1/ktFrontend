import { describe, expect, it } from "vitest";
import { renderBiltyBodyDense, renderBiltyBodyStandard, formatStationsList } from "./shipmentPrintTemplate";
import { Shipment, TaxTreatment, PaymentTerm, ShipmentStatus } from "@/types/shipment";

const mockShipmentSingleItem = {
  id: 1,
  shipmentNo: "LR-1001",
  shipmentDate: "2026-10-03T10:00:00Z",
  createdAt: "2026-10-03T10:00:00Z",
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
      customerInvoiceDate: "2026-10-03",
      privateMarka: "PM-456",
      packageCount: 5,
      declaredGoodsValue: 50000,
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
  goodsValue: 50000,
  totalFreight: 1200,
  totalOtherCharges: 0,
  totalTaxAmount: 0,
  grandTotal: 1200,
  paidAmount: 0,
  dueAmount: 1200,
  isActive: true,
  chargeItems: [],
  statusHistory: [],
} as unknown as Shipment;

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

  it("prints GST PAID BY TRANSPORTER when Transporter is selected for GST liability", () => {
    const shipmentTransporterGst = {
      ...mockShipmentSingleItem,
      taxTreatment: TaxTreatment.GST_Regular,
      gstPaidBy: "Transporter",
      totalTaxAmount: 60,
    } as unknown as Shipment;

    const standardHtml = renderBiltyBodyStandard(shipmentTransporterGst);
    expect(standardHtml).toContain("GST PAID BY TRANSPORTER");
    expect(standardHtml).toContain("GST / Tax Amount:");

    const denseHtml = renderBiltyBodyDense(shipmentTransporterGst);
    expect(denseHtml).toContain('<div class="gst-paid-badge">GST PAID BY TRANSPORTER</div>');
    expect(denseHtml).toContain('<div class="charge-label">GST / Tax</div>');
  });

  it("prints GST PAID BY CONSIGNOR when Consignor is selected for GST liability", () => {
    const shipmentConsignorGst = {
      ...mockShipmentSingleItem,
      taxTreatment: TaxTreatment.GST_Regular,
      gstPaidBy: "Consignor",
      totalTaxAmount: 60,
    } as unknown as Shipment;

    const standardHtml = renderBiltyBodyStandard(shipmentConsignorGst);
    expect(standardHtml).toContain("GST PAID BY CONSIGNOR");

    const denseHtml = renderBiltyBodyDense(shipmentConsignorGst);
    expect(denseHtml).toContain('<div class="gst-paid-badge">GST PAID BY CONSIGNOR</div>');
  });

  it("does NOT print GST or GST PAID BY badge when Without GST (NonTaxable) is selected", () => {
    const shipmentWithoutGst = {
      ...mockShipmentSingleItem,
      taxTreatment: TaxTreatment.NonTaxable,
      gstPaidBy: undefined,
      totalTaxAmount: 0,
    } as unknown as Shipment;

    const standardHtml = renderBiltyBodyStandard(shipmentWithoutGst);
    expect(standardHtml).not.toContain("GST PAID BY");
    expect(standardHtml).not.toContain("GST / Tax Amount:");

    const denseHtml = renderBiltyBodyDense(shipmentWithoutGst);
    expect(denseHtml).not.toContain("gst-paid-badge");
    expect(denseHtml).not.toContain('<div class="charge-label">GST / Tax</div>');
  });

  describe("Station strip rules", () => {
    it("shows up to 5 stations WITH phone number when stations count is <= 5", () => {
      const stations = [
        "PAT · Patna (Ph: 9430492601)",
        "GAY · Gaya (Ph: 9430492602)",
        "RAN · Ranchi (Ph: 9430492603)",
      ];

      const html = formatStationsList(stations, 12);
      expect(html).toContain("<strong>Patna</strong> (<strong>9430492601</strong>)");
      expect(html).toContain("<strong>Gaya</strong> (<strong>9430492602</strong>)");
      expect(html).toContain("<strong>Ranchi</strong> (<strong>9430492603</strong>)");
    });

    it("does NOT show phone numbers when stations count is > 5 (only station names)", () => {
      const stations = [
        "PAT · Patna (Ph: 9430492601)",
        "GAY · Gaya (Ph: 9430492602)",
        "RAN · Ranchi (Ph: 9430492603)",
        "MUZ · Muzaffarpur (Ph: 9430492604)",
        "BHA · Bhagalpur (Ph: 9430492605)",
        "DAR · Darbhanga (Ph: 9430492606)",
        "PUR · Purnia (Ph: 9430492607)",
      ];

      const html = formatStationsList(stations, 12);
      // All station names are present
      expect(html).toContain("<strong>Patna</strong>");
      expect(html).toContain("<strong>Gaya</strong>");
      expect(html).toContain("<strong>Darbhanga</strong>");
      expect(html).toContain("<strong>Purnia</strong>");

      // ZERO phone numbers should be printed
      expect(html).not.toContain("9430492601");
      expect(html).not.toContain("9430492606");
      expect(html).not.toContain("(");
      expect(html).not.toContain(")");
    });

    it("caps displayed stations at maxLimit when stations count exceeds limit to prevent print layout failure", () => {
      const stations = Array.from({ length: 20 }, (_, i) => `ST${i + 1} · Station ${i + 1} (Ph: 900000000${i})`);

      const html = formatStationsList(stations, 10);
      // Top 10 are rendered
      expect(html).toContain("<strong>Station 1</strong>");
      expect(html).toContain("<strong>Station 10</strong>");

      // Stations past limit 10 are NOT rendered
      expect(html).not.toContain("<strong>Station 11</strong>");
      expect(html).not.toContain("<strong>Station 20</strong>");

      // No phone numbers since count > 5
      expect(html).not.toContain("900000000");
    });
  });
});
