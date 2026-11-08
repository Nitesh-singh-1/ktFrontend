import { baseService } from "./baseservice";

// TASK-054 §C — platform-admin plan catalog + editor. A plan is the default
// grant (module/page ceiling + usage limits) a tenant is seeded with when a
// plan is assigned. `tier` / `code` are the plan tier string
// (Starter / Professional / Enterprise); limit fields are null = unlimited.

export interface Plan {
  code: string;
  name: string;
  tier: string;
  description?: string;
  monthlyPriceInr: number;
  maxUsers?: number;
  maxVehicles?: number;
  maxMonthlyShipments?: number;
  storageLimitMb?: number;
  moduleCodes: string[];
  pageRestrictions?: Record<string, string[]>;
  isActive: boolean;
}

export const planService = {
  // GET /api/admin/plans → Plan[]
  getPlans: () => baseService.get<Plan[]>("/admin/plans"),

  // PUT /api/admin/plans/{code} → 204. Edit a plan's default grant + limits.
  updatePlan: (code: string, plan: Plan) =>
    baseService.put<void>(`/admin/plans/${code}`, plan),
};
