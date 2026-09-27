// ==========================================
// 1. ENUMS & CONSTANTS
// ==========================================

export enum ShipmentStatus {
  Draft = 0,
  Booked = 1,
  Manifested = 2,
  InTransit = 3,
  OutForDelivery = 4,
  Delivered = 5,
  Returned = 6,
  Cancelled = 7
}

export enum TaxTreatment {
  NonTaxable = 0,
  GST_Regular = 1,
  GST_RCM = 2,
  Exempt = 3,
  CustomTax = 4
}

export enum PaymentTerm {
  ToPay = 0,
  Paid = 1,
  TBB = 2 // To Be Billed
}

export enum PartyType {
  Both = 0,
  Consignor = 1,
  Consignee = 2,
  Transporter = 3,
  Agent = 4
}

export enum TripStatus {
  Draft = 0,
  Loading = 1,
  Dispatched = 2,
  InTransit = 3,
  Arrived = 4,
  Unloaded = 5,
  Completed = 6,
  Cancelled = 7
}

export enum TripExpenseType {
  Fuel = 0,
  Toll = 1,
  DriverAllowance = 2,
  PoliceKharcha = 3,
  VehicleRepair = 4,
  LoadingCharges = 5,
  UnloadingCharges = 6,
  Parking = 7,
  Misc = 8
}

export enum InvoicePaymentStatus {
  Unpaid = 0,
  PartiallyPaid = 1,
  Paid = 2,
  Cancelled = 3
}

export enum PodStatus {
  Pending = 0,
  Uploaded = 1,
  Verified = 2,
  Rejected = 3
}

export enum RateType {
  PerKg = 0,
  PerTon = 1,
  PerPackage = 2,
  PerTrip = 3,
  Fixed = 4
}

export enum TyreStatus {
  InStock = 0,
  Fitted = 1,
  UnderRetread = 2,
  Scrapped = 3,
}

export interface TyreDto {
  id: number;
  serialNo: string;
  brand?: string;
  size?: string;
  vehicleId?: number;
  vehicleNo?: string;
  position?: string;
  purchaseDate?: string;
  purchaseCost: number;
  purchaseOdometer: number;
  currentOdometer: number;
  kmRun?: number;
  retreadCount: number;
  status: TyreStatus;
  statusName?: string;
  disposalDate?: string;
  remarks?: string;
  isActive: boolean;
  createdAt?: string;
}

export enum MaintenanceType {
  RoutineService = 0,
  EngineRepair = 1,
  BrakeOverhaul = 2,
  TyreReplacement = 3,
  OilChange = 4,
  BatteryReplacement = 5,
  AccidentRepair = 6,
  FitnessInspection = 7,
  GeneralMaintenance = 8
}

export enum ClaimType {
  Damage = 0,
  Shortage = 1,
  TotalLoss = 2,
  Delay = 3,
  Accident = 4
}

export enum ClaimStatus {
  Reported = 0,
  Investigating = 1,
  Approved = 2,
  Rejected = 3,
  Settled = 4
}

// ==========================================
// 2. AUTHENTICATION CONTRACTS
// ==========================================

export interface LoginRequest {
  username: string;
  password: string; // Plaintext (e.g. "admin123")
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  tenantId?: string;
  organizationName?: string;
  user?: {
    id: number;
    username: string;
    fullName: string;
    role: string;
    mobile?: string;
  };
}

export interface ForgotPasswordRequest {
  username: string;
  mobile: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// ==========================================
// 3. SHIPMENT (LR/GR) CONTRACTS
// ==========================================

export interface ShipmentItemDto {
  id?: number;
  article?: string;
  description?: string;
  weight: number;
  rate: number;
  quantity: number;
  totalAmount: number;
}

export interface ShipmentChargeItemDto {
  id?: number;
  chargeTypeId?: number;
  chargeName: string;
  amount: number;
  isTaxable: boolean;
}

export interface ShipmentStatusHistoryDto {
  id: number;
  fromStatus: ShipmentStatus;
  toStatus: ShipmentStatus;
  location?: string;
  remarks?: string;
  changedByUserName?: string;
  changedAt: string;
}

export interface ShipmentDto {
  id: number;
  tenantId: string;
  shipmentNo: string;
  invoiceNo?: string;
  invoiceId?: number;
  shipmentDate: string; // YYYY-MM-DD
  invoiceDate?: string;
  fromLocation?: string;
  toLocation?: string;
  truckNo?: string;
  taxTreatment: TaxTreatment;
  gstPaidBy?: string;

  consignorPartyId?: number;
  consignorName?: string;
  consignorGstNo?: string;
  consignorMobile?: string;
  consignorAddress?: string;

  consigneePartyId?: number;
  consigneeName?: string;
  consigneeGstNo?: string;
  consigneeMobile?: string;
  consigneeAddress?: string;

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

  items: ShipmentItemDto[];
  chargeItems: ShipmentChargeItemDto[];
  statusHistory: ShipmentStatusHistoryDto[];
}

export interface CreateShipmentRequest {
  shipmentNo?: string; // Auto-generated if omitted
  invoiceNo?: string;
  invoiceId?: number;
  shipmentDate?: string;
  invoiceDate?: string;
  fromLocation?: string;
  toLocation?: string;
  truckNo?: string;
  taxTreatment: TaxTreatment;
  gstPaidBy?: string;

  consignorPartyId?: number;
  consignorName?: string;
  consignorGstNo?: string;
  consignorMobile?: string;
  consignorAddress?: string;
  saveConsignorAsParty?: boolean;

  consigneePartyId?: number;
  consigneeName?: string;
  consigneeGstNo?: string;
  consigneeMobile?: string;
  consigneeAddress?: string;
  saveConsigneeAsParty?: boolean;

  goodsValue: number;
  paymentTerm: PaymentTerm;
  totalFreight: number;
  totalTaxAmount: number;
  paidAmount: number;
  remarks?: string;
  bookingClerk?: string;

  items?: ShipmentItemDto[];
  chargeItems?: ShipmentChargeItemDto[];
}

// ==========================================
// 4. PARTY MASTER (CONSIGNOR / CONSIGNEE)
// ==========================================

export interface PartyDto {
  id: number;
  tenantId?: string;
  name: string;
  code?: string;
  gstNo?: string;
  panNo?: string;
  mobile?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  partyType: PartyType;
  partyTypeName?: string;
  defaultPaymentTerm: PaymentTerm;
  defaultPaymentTermName?: string;
  creditLimit: number;
  isActive: boolean;
  createdAt?: string;
}

export interface PartyLookupDto {
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
  defaultPaymentTerm: PaymentTerm;
}

export interface CreatePartyRequest {
  name: string;
  code?: string;
  gstNo?: string;
  panNo?: string;
  mobile?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  partyType?: PartyType;
  defaultPaymentTerm?: PaymentTerm;
  creditLimit?: number;
}

// ==========================================
// 5. TRIP & DISPATCH MANIFEST CONTRACTS
// ==========================================

export interface TripShipmentDto {
  id: number;
  tripId: number;
  shipmentId: number;
  shipmentNo?: string;
  loadedWeight: number;
  loadedPackages: number;
  freightAmount: number;
  loadedAt: string;
  unloadedAt?: string;
  remarks?: string;
}

export interface TripExpenseDto {
  id: number;
  tripId: number;
  expenseType: TripExpenseType;
  expenseTypeName?: string;
  amount: number;
  receiptNo?: string;
  paymentMode?: string;
  paidTo?: string;
  remarks?: string;
  expenseDate: string;
  createdAt?: string;
}

export interface TripDto {
  id: number;
  tenantId?: string;
  tripNo: string;
  tripDate: string;
  vehicleId?: number;
  vehicleNo?: string;
  driverId?: number;
  driverName?: string;
  driverMobile?: string;
  originLocationId?: number;
  originLocationName?: string;
  destinationLocationId?: number;
  destinationLocationName?: string;
  status: TripStatus;
  statusName?: string;
  departureTime?: string;
  arrivalTime?: string;
  startOdometer: number;
  endOdometer: number;
  sealNo?: string;
  remarks?: string;
  totalWeightTons: number;
  totalPackages: number;
  totalFreightRevenue: number;
  driverAdvanceCash: number;
  driverAdvanceFuel: number;
  totalExpenses: number;
  netProfitMargin: number;
  isActive: boolean;
  createdAt?: string;
  shipments: TripShipmentDto[];
  expenses: TripExpenseDto[];
}

export interface CreateTripRequest {
  tripNo?: string;
  tripDate?: string;
  vehicleId?: number;
  vehicleNo?: string;
  driverId?: number;
  driverName?: string;
  driverMobile?: string;
  originLocationId?: number;
  originLocationName?: string;
  destinationLocationId?: number;
  destinationLocationName?: string;
  startOdometer?: number;
  sealNo?: string;
  remarks?: string;
  driverAdvanceCash?: number;
  driverAdvanceFuel?: number;
  shipmentIdsToLoad?: number[];
}

// ==========================================
// 6. INVOICING & FREIGHT BILLING
// ==========================================

export interface InvoiceItemDto {
  id: number;
  invoiceId: number;
  shipmentId?: number;
  shipmentNo?: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface InvoiceDto {
  id: number;
  tenantId?: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate?: string;
  partyId?: number;
  partyName?: string;
  partyGstNo?: string;
  partyAddress?: string;
  subTotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  otherCharges: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  balanceAmount?: number;
  paymentStatus: InvoicePaymentStatus;
  paymentStatusName?: string;
  paymentMode?: string;
  remarks?: string;
  isActive: boolean;
  createdAt?: string;
  items: InvoiceItemDto[];
  linkedShipmentNos?: string[];
}

export interface CreateInvoiceRequest {
  invoiceNo?: string;
  invoiceDate?: string;
  dueDate?: string;
  partyId?: number;
  partyName?: string;
  partyGstNo?: string;
  partyAddress?: string;
  taxRate?: number;
  discount?: number;
  otherCharges?: number;
  paidAmount?: number;
  paymentMode?: string;
  remarks?: string;
  items: {
    shipmentId?: number;
    shipmentNo?: string;
    description: string;
    quantity: number;
    rate: number;
    amount?: number;
    taxRate?: number;
    taxAmount?: number;
  }[];
  shipmentIdsToLink?: number[];
}

// ==========================================
// 7. VENDORS & LORRY HIRE CONTRACTS
// ==========================================

export interface VendorDto {
  id: number;
  name: string;
  code?: string;
  panNo?: string;
  gstNo?: string;
  contactPerson?: string;
  mobile?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  tdsPercentage: number;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface LorryHireContractDto {
  id: number;
  contractNo: string;
  contractDate: string;
  tripId?: number;
  vendorId?: number;
  vendorName?: string;
  vehicleNo?: string;
  driverName?: string;
  driverMobile?: string;
  fromLocation?: string;
  toLocation?: string;
  totalHireAmount: number;
  advanceCashPaid: number;
  dieselAdvanceAmount: number;
  tdsAmount: number;
  otherDeductions: number;
  balancePayable: number;
  paidBalanceAmount: number;
  paymentStatus: string;
  paymentReference?: string;
  remarks?: string;
}

export interface CreateLorryHireRequest {
  contractDate: string;
  tripId?: number;
  vendorId?: number;
  vendorName?: string;
  vehicleNo: string;
  driverName?: string;
  driverMobile?: string;
  fromLocation?: string;
  toLocation?: string;
  totalHireAmount: number;
  advanceCashPaid?: number;
  dieselAdvanceAmount?: number;
  tdsPercentage?: number;
  otherDeductions?: number;
  remarks?: string;
}

// ==========================================
// 8. PROOF OF DELIVERY (POD)
// ==========================================

export interface PodRecordDto {
  id: number;
  shipmentId: number;
  shipmentNo?: string;
  deliveryDate: string;
  receiverName: string;
  receiverMobile?: string;
  receiverAadharOrId?: string;
  documentUrl?: string;
  signatureUrl?: string;
  status: PodStatus;
  statusName?: string;
  rejectionReason?: string;
  remarks?: string;
  verifiedByUserId?: number;
  verifiedAt?: string;
}

export interface UploadPodRequest {
  shipmentId: number;
  deliveryDate?: string;
  receiverName: string;
  receiverMobile?: string;
  receiverAadharOrId?: string;
  documentUrl?: string;
  signatureUrl?: string;
  remarks?: string;
}

export interface PodPendingShipmentDto {
  id: number;
  shipmentNo?: string;
  consignorName?: string;
  consigneeName?: string;
  fromLocation?: string;
  toLocation?: string;
  status: number;
  statusName?: string;
}

// ==========================================
// 9. PUBLIC TRACKING CONTRACT
// ==========================================

export interface TrackingTimelineEventDto {
  eventTitle: string;
  location?: string;
  description?: string;
  timestamp: string;
  isCompleted: boolean;
}

export interface PublicTrackingDto {
  trackingNumber: string;
  bookingDate: string;
  fromLocation: string;
  toLocation: string;
  currentStatus: string;
  consignorMasked: string;
  consigneeMasked: string;
  totalPackages: number;
  totalWeightKg: number;
  expectedDeliveryDate?: string;
  deliveredAt?: string;
  deliveredToPerson?: string;
  timeline: TrackingTimelineEventDto[];
}

// ==========================================
// 10. RATE CARD & TARIFF CALCULATOR
// ==========================================

export interface RateCardDto {
  id: number;
  partyId?: number;
  partyName?: string;
  fromLocation: string;
  toLocation: string;
  commodityType?: string;
  rateType: RateType;
  rateTypeName?: string;
  baseRate: number;
  minFreightAmount: number;
  hamaliRatePerKg: number;
  doorDeliveryCharge: number;
  stationaryCharge: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface VendorRateContractDto {
  id: number;
  vendorId?: number;
  vendorName?: string;
  fromLocation: string;
  toLocation: string;
  vehicleType?: string;
  rateType: RateType;
  rateTypeName?: string;
  hireRate: number;
  minGuaranteeAmount: number;
  loadingCharge: number;
  unloadingCharge: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  remarks?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface CalculateFreightRequest {
  partyId?: number;
  fromLocation: string;
  toLocation: string;
  weightKg: number;
  packagesCount?: number;
  includeDoorDelivery?: boolean;
  includeHamali?: boolean;
}

export interface CalculatedFreightResponse {
  matchedRateCard: boolean;
  rateCardId?: number;
  baseRate: number;
  rateType: RateType;
  freightAmount: number;
  hamaliAmount: number;
  doorDeliveryAmount: number;
  stationaryAmount: number;
  totalEstimatedFreight: number;
  calculationBreakdown?: string;
}

// ==========================================
// 11. CLAIMS & MAINTENANCE
// ==========================================

export interface ClaimDto {
  id: number;
  claimNo: string;
  shipmentId?: number;
  shipmentNo?: string;
  claimDate: string;
  claimType: ClaimType;
  claimTypeName?: string;
  claimedAmount: number;
  settledAmount: number;
  status: ClaimStatus;
  statusName?: string;
  description: string;
  claimantName?: string;
  claimantMobile?: string;
  resolutionRemarks?: string;
  createdAt?: string;
}

export interface CreateClaimRequest {
  shipmentId?: number;
  shipmentNo?: string;
  claimDate?: string;
  claimType: ClaimType;
  claimedAmount: number;
  description: string;
  claimantName?: string;
  claimantMobile?: string;
}

export interface MaintenanceLogDto {
  id: number;
  vehicleId: number;
  vehicleNo?: string;
  maintenanceType: MaintenanceType;
  maintenanceTypeName?: string;
  serviceDate: string;
  odometerReading?: number;
  cost: number;
  serviceCenter?: string;
  invoiceNo?: string;
  description: string;
  nextServiceDueDate?: string;
  nextServiceOdometer?: number;
}

// ==========================================
// 12. REPORTS & LEDGERS
// ==========================================

export interface BookingRegisterReportDto {
  totalBookings: number;
  totalFreightAmount: number;
  totalOtherCharges: number;
  totalTaxAmount: number;
  totalGrandTotal: number;
  totalPaidAmount: number;
  totalDueAmount: number;
  records: import("@/types/shipment").Shipment[];
}

export interface TripProfitabilityReportDto {
  totalTrips: number;
  totalFreightRevenue: number;
  totalDriverCashAdvance: number;
  totalDieselAdvance: number;
  totalOnRoadExpenses: number;
  totalLorryHireVendorCost: number;
  netTripProfit: number;
  profitMarginPercentage: number;
  tripDetails: {
    tripId: number;
    tripNo: string;
    tripDate: string;
    vehicleNo?: string;
    driverName?: string;
    originLocation?: string;
    destinationLocation?: string;
    revenue: number;
    totalCost: number;
    netProfit: number;
    profitMarginPct: number;
  }[];
}

export interface TaxSummaryReportDto {
  totalTaxableFreight: number;
  totalNonTaxableFreight: number;
  totalGstRcmFreight: number;
  totalTaxCollected: number;
  totalShipmentsCount: number;
}

export interface PartyOutstandingReportDto {
  partyId: number;
  partyName: string;
  mobile?: string;
  gstNo?: string;
  totalBilledAmount: number;
  totalPaidAmount: number;
  totalOutstandingDue: number;
  pendingShipmentsCount: number;
}

export interface VendorPayableReportDto {
  vendorId: number;
  vendorName: string;
  mobile?: string;
  panNo?: string;
  totalHireAmount: number;
  totalAdvancePaid: number;
  totalTdsDeducted: number;
  totalBalancePayable: number;
  activeContractsCount: number;
}

// ==========================================
// 13. FLEET LOOKUP CONTRACTS & MODEL ALIASES
// ==========================================

export interface VehicleLookupItem {
  id: number;
  vehicleNo: string;
  vehicleType?: string;
  driverName?: string;
  driverMobile?: string;
}

export interface DriverLookupItem {
  id: number;
  name: string;
  licenseNo?: string;
  mobile?: string;
}

export interface LocationLookupItem {
  id: number;
  name: string;
  code?: string;
  city?: string;
  state?: string;
}

export interface VehicleMaster {
  id: number;
  vehicleNo: string;
  vehicleType?: string;
  capacity?: string | number;
  ownerName?: string;
  ownerMobile?: string;
  driverId?: number;
  driverName?: string;
  driverMobile?: string;
  isActive: boolean;
}

export interface DriverMaster {
  id: number;
  name: string;
  licenseNo?: string;
  mobile?: string;
  address?: string;
  isActive: boolean;
}

export interface LocationMaster {
  id: number;
  name: string;
  code?: string;
  city?: string;
  state?: string;
  isActive: boolean;
}

// Aliases for compatibility
export type Shipment = ShipmentDto;
export type ShipmentItem = ShipmentItemDto;
export type ShipmentChargeItem = ShipmentChargeItemDto;
export type ShipmentStatusHistory = ShipmentStatusHistoryDto;
export type Party = PartyDto;
export type PartyLookupItem = PartyLookupDto;
export type Trip = TripDto;
export type TripShipment = TripShipmentDto;
export type TripExpense = TripExpenseDto;
export type Invoice = InvoiceDto;
export type InvoiceItem = InvoiceItemDto;
export type Vendor = VendorDto;
export type LorryHireContract = LorryHireContractDto;
export type PodRecord = PodRecordDto;
export type RateCard = RateCardDto;
export type Claim = ClaimDto;

