export interface MonthlyTrendPoint {
  month: string;
  label: string;
  billed: number;
  collected: number;
}

export interface TopCustomer {
  name: string;
  billed: number;
  collected: number;
  outstanding: number;
  invoiceCount: number;
}

export interface StatusAmount {
  status: string;
  count: number;
  amount: number;
}

export interface VehicleProfit {
  vehicleNo: string;
  trips: number;
  revenue: number;
  expenses: number;
  profit: number;
  marginPct: number;
}

export interface BranchProfit {
  branch: string;
  trips: number;
  revenue: number;
  expenses: number;
  profit: number;
  marginPct: number;
}

export interface CashFlowMode {
  mode: string;
  inflow: number;
  outflow: number;
  net: number;
}

export interface BusinessAnalytics {
  months: number;
  periodLabel: string;
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  invoiceCount: number;
  cancelledCount: number;
  collectionRatePct: number;
  operatingExpenses: number;
  grossMargin: number;
  grossMarginPct: number;
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  monthlyTrend: MonthlyTrendPoint[];
  topCustomers: TopCustomer[];
  paymentStatusBreakdown: StatusAmount[];
  vehicleProfitability: VehicleProfit[];
  branchProfitability: BranchProfit[];
  cashFlowByMode: CashFlowMode[];
}
