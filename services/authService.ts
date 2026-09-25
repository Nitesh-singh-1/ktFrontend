import { baseService } from "./baseservice";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
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

function parseJwt(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const authService = {
  login: async (data: LoginPayload): Promise<LoginResponse> => {
    const res = await baseService.post<LoginResponse>("/auth/login", data);

    if (res.success && res.token) {
      authService.setSession(res.token, res.user, res.tenantId, res.organizationName);
    }

    return res;
  },

  setSession: (token: string, user?: any, tenantId?: string, organizationName?: string) => {
    if (typeof window === "undefined") return;

    localStorage.setItem("token", token);
    localStorage.setItem("isLoggedIn", "true");

    const decoded = parseJwt(token);
    const resolvedTenantId = tenantId || decoded?.tenant_id || decoded?.tenantId;
    const resolvedOrgName = organizationName || decoded?.organizationName || decoded?.org_name;

    if (resolvedTenantId) {
      localStorage.setItem("tenantId", resolvedTenantId);
    }
    if (resolvedOrgName) {
      localStorage.setItem("organizationName", resolvedOrgName);
    }

    const resolvedUser = user || {
      username: decoded?.username || decoded?.sub || decoded?.unique_name || "User",
      fullName: decoded?.fullName || decoded?.name || "Administrator",
      role: decoded?.role || "Admin",
    };
    localStorage.setItem("user", JSON.stringify(resolvedUser));
  },

  logout: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tenantId");
    localStorage.removeItem("organizationName");
    localStorage.removeItem("isLoggedIn");
  },

  getToken: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  },

  getTenantId: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("tenantId");
  },

  getOrganizationName: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("organizationName");
  },

  getUser: () => {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("token") || localStorage.getItem("isLoggedIn") === "true";
  },

  requestPasswordResetCode: async (payload: { username: string; mobile: string }): Promise<{ success: boolean; message?: string; verificationCode?: string; expiresInSeconds?: number }> => {
    return await baseService.post("/auth/forgot-password/request-code", payload);
  },

  verifyAndResetPassword: async (payload: { username: string; mobile: string; verificationCode: string; newPassword: string }): Promise<{ success: boolean; message?: string }> => {
    return await baseService.post("/auth/forgot-password/verify-and-reset", payload);
  },
};