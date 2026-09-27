// Enums
export enum TaxTreatment {
  NonTaxable = 0,
  GST_Regular = 1,
  GST_RCM = 2,
  Exempt = 3,
  CustomTax = 4,
}

export enum PaymentTerm {
  ToPay = 0,
  Paid = 1,
  TBB = 2, // To Be Billed
}

export enum ShipmentStatus {
  Draft = 0,
  Booked = 1,
  Manifested = 2,
  InTransit = 3,
  OutForDelivery = 4,
  Delivered = 5,
  Returned = 6,
  Cancelled = 7,
}

export enum PartyType {
  Both = 0,
  Consignor = 1,
  Consignee = 2,
  Transporter = 3,
  Agent = 4,
}

export enum InvoicePaymentStatus {
  Unpaid = 0,
  PartiallyPaid = 1,
  Paid = 2,
  Cancelled = 3,
}

// Master Data Models
export interface Party {
  id: number;
  tenantId?: string;
  name: string;
  code?: string;
  gstNo?: string;
  panNo?: string;
  contactPerson?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  partyType: PartyType;
  defaultPaymentTerm?: PaymentTerm;
  creditLimit?: number;
  isActive: boolean;
  createdAt?: string;
}

export interface PartyLookupItem {
  id: number;
  name: string;
  code?: string;
  gstNo?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  partyType: PartyType;
  defaultPaymentTerm?: PaymentTerm;
}

export interface VehicleMaster {
  id: number;
  tenantId?: string;
  vehicleNo: string;
  vehicleType?: string;
  ownerType?: string;
  ownerName?: string;
  ownerMobile?: string;
  driverName?: string;
  driverMobile?: string;
  capacity?: string | number;
  capacityTons?: number;
  engineNo?: string;
  chassisNo?: string;
  rcNumber?: string;
  insurancePolicyNo?: string;
  pucValidUntil?: string;
  taxValidUntil?: string;
  fitnessValidUntil?: string;
  insuranceValidUntil?: string;
  permitValidUntil?: string;
  currentOdometerKm?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleLookupItem {
  id: number;
  vehicleNo: string;
  vehicleType?: string;
  ownerType?: string;
  capacityTons?: number;
  driverName?: string;
  driverMobile?: string;
}

export type ComplianceStatus = "Expired" | "Critical" | "Warning" | "Upcoming";

export interface ComplianceAlert {
  entityType: "Vehicle" | "Driver";
  entityId: number;
  entityName: string;
  documentType: string;
  expiryDate: string;
  daysToExpiry: number;
  status: ComplianceStatus;
}

export interface ComplianceOverview {
  expiredCount: number;
  criticalCount: number;
  warningCount: number;
  upcomingCount: number;
  trackedDocuments: number;
  alerts: ComplianceAlert[];
}

export interface DriverMaster {
  id: number;
  tenantId?: string;
  name: string;
  mobile?: string;
  licenseNo?: string;
  licenseValidUntil?: string;
  aadharNo?: string;
  address?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DriverLookupItem {
  id: number;
  name: string;
  licenseNo?: string;
  mobile?: string;
}

export interface LocationMaster {
  id: number;
  tenantId?: string;
  code?: string;
  name: string;
  city?: string;
  state?: string;
  address?: string;
  pincode?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationLookupItem {
  id: number;
  name: string;
  code?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

// Invoicing Models
export interface InvoiceItem {
  id?: number;
  shipmentId?: number;
  shipmentNo?: string;
  description: string;
  quantity: number;
  rate: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount?: number;
}

export interface InvoicePayment {
  id: number;
  invoiceId: number;
  paymentDate: string;
  amount: number;
  paymentMode: string;
  referenceNo?: string;
  notes?: string;
  createdByName?: string;
}

export interface Invoice {
  id: number;
  tenantId?: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate?: string;
  partyId: number;
  partyName?: string;
  partyGstNo?: string;
  partyAddress?: string;
  partyMobile?: string;
  party?: Party;
  subTotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  otherCharges: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: InvoicePaymentStatus;
  remarks?: string;
  items?: InvoiceItem[];
  payments?: InvoicePayment[];
  linkedShipments?: Shipment[];
  createdAt?: string;
}

export interface InvoiceLookupItem {
  id: number;
  invoiceNo: string;
  invoiceDate: string;
  partyName?: string;
  grandTotal: number;
  balanceAmount: number;
  paymentStatus: InvoicePaymentStatus;
}

export interface CreateInvoiceRequest {
  invoiceDate: string;
  dueDate?: string;
  partyId: number;
  taxRate?: number;
  discount?: number;
  otherCharges?: number;
  paidAmount?: number;
  paymentMode?: string;
  remarks?: string;
  shipmentIdsToLink?: number[];
  items?: {
    shipmentId?: number;
    shipmentNo?: string;
    description: string;
    quantity: number;
    rate: number;
    taxRate?: number;
  }[];
}

export interface RecordPaymentRequest {
  amount: number;
  paymentDate?: string;
  paymentMode?: string;
  referenceNo?: string;
  notes?: string;
}

export interface ConsignmentInvoiceReference {
  id?: number;
  customerInvoiceNo: string;
  customerInvoiceDate: string;
  declaredGoodsValue: number;
  ewayBillNo?: string;
  ewayBillDate?: string;
  ewayBillValidUpto?: string;
  documentType?: string;
  packageCount?: number;
  weightKg?: number;
  commodityDescription?: string;
  documentUrl?: string; // Digital copy / photo of customer paper bill
}

export interface CreateConsignmentInvoiceReferenceRequest {
  customerInvoiceNo: string;
  customerInvoiceDate: string;
  declaredGoodsValue: number;
  ewayBillNo?: string;
  ewayBillDate?: string;
  ewayBillValidUpto?: string;
  documentType?: string;
  packageCount?: number;
  weightKg?: number;
  commodityDescription?: string;
  documentUrl?: string; // Digital copy / photo of customer paper bill
}

// Line Items
export interface ShipmentItem {
  id?: number;
  article?: string;
  description?: string;
  weight: number;
  rate: number;
  quantity: number;
  totalAmount: number;
}

export interface ShipmentChargeItem {
  id?: number;
  chargeTypeId?: number;
  chargeName: string;
  amount: number;
  isTaxable: boolean;
}

export interface ShipmentStatusHistory {
  id: number;
  fromStatus: ShipmentStatus;
  toStatus: ShipmentStatus;
  location?: string;
  remarks?: string;
  changedByUserName?: string;
  changedAt: string;
}

// Full Shipment Model
export interface Shipment {
  id: number;
  tenantId: string;
  shipmentNo: string;
  invoiceId?: number;
  invoiceNo?: string;
  shipmentDate: string;
  invoiceDate?: string;
  fromLocation?: string;
  toLocation?: string;
  truckNo?: string;
  taxTreatment: TaxTreatment;
  gstPaidBy?: string;
  
  // Consignor (Sender)
  consignorPartyId?: number;
  consignorName?: string;
  consignorGstNo?: string;
  consignorMobile?: string;
  consignorAddress?: string;
  consignorCity?: string;
  consignorState?: string;
  consignorPincode?: string;
  
  // Consignee (Receiver)
  consigneePartyId?: number;
  consigneeName?: string;
  consigneeGstNo?: string;
  consigneeMobile?: string;
  consigneeAddress?: string;
  consigneeCity?: string;
  consigneeState?: string;
  consigneePincode?: string;
  
  // Hubs & Routing
  originHubId?: number;
  originHubName?: string;
  destinationHubId?: number;
  destinationHubName?: string;
  currentHubId?: number;
  currentHubName?: string;
  deliveryType?: string;
  ewayBillNo?: string;
  ewayBillValidUpto?: string;

  // Financials
  goodsValue: number;
  paymentTerm: PaymentTerm;
  totalFreight: number;
  totalOtherCharges: number;
  totalTaxAmount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  status: ShipmentStatus;
  remarks?: string;
  bookingClerk?: string;
  isActive: boolean;
  createdAt: string;
  createdByName?: string;
  invoiceReferences?: ConsignmentInvoiceReference[];
  items: ShipmentItem[];
  chargeItems: ShipmentChargeItem[];
  statusHistory: ShipmentStatusHistory[];
}

// Requests & Responses
export interface CreateShipmentRequest {
  shipmentNo?: string; // Optional: auto-generated if omitted
  invoiceId?: number;
  invoiceNo?: string;
  shipmentDate?: string;
  invoiceDate?: string;
  fromLocation?: string;
  toLocation?: string;
  truckNo?: string;
  taxTreatment: TaxTreatment;
  gstPaidBy?: string;
  
  // Consignor Party
  consignorPartyId?: number;
  consignorName?: string;
  consignorGstNo?: string;
  consignorMobile?: string;
  consignorAddress?: string;
  saveConsignorAsParty?: boolean;

  // Consignee Party
  consigneePartyId?: number;
  consigneeName?: string;
  consigneeGstNo?: string;
  consigneeMobile?: string;
  consigneeAddress?: string;
  saveConsigneeAsParty?: boolean;

  // Hubs & Routing
  originHubId?: number;
  destinationHubId?: number;
  deliveryType?: string;
  ewayBillNo?: string;
  ewayBillValidUpto?: string;

  goodsValue: number;
  paymentTerm: PaymentTerm;
  totalFreight: number;
  totalTaxAmount: number;
  paidAmount: number;
  remarks?: string;
  bookingClerk?: string;
  customerInvoices?: CreateConsignmentInvoiceReferenceRequest[];
  items?: ShipmentItem[];
  chargeItems?: ShipmentChargeItem[];
}

export interface UpdateShipmentStatusRequest {
  newStatus: ShipmentStatus;
  location?: string;
  remarks?: string;
}

export interface TenantOnboardingRequest {
  organizationName: string;
  organizationCode: string;
  adminUsername: string;
  adminPassword: string;
  adminFullName: string;
  adminMobile?: string;
}

export interface UserDto {
  id?: number | string;
  username: string;
  fullName: string;
  role?: string;
  mobile?: string;
  email?: string;
}

export interface TenantOnboardingResponse {
  success: boolean;
  message?: string;
  tenantId?: string;
  organizationName?: string;
  organizationCode?: string;
  token?: string;
  adminUser?: UserDto;
  user?: UserDto; // fallback for backwards compatibility
}

export interface ShipmentFilterParams {
  status?: ShipmentStatus | string;
  taxTreatment?: TaxTreatment | string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedShipmentsResponse {
  success: boolean;
  message?: string;
  data: Shipment[];
  totalCount: number;
  page?: number;
  pageSize?: number;
}
