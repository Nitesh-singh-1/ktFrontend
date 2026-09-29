import { baseService } from "./baseservice";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  refreshToken?: string;
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
      authService.setSession(res.token, res.user, res.tenantId, res.organizationName, res.refreshToken);
    }

    return res;
  },

  setSession: (token: string, user?: any, tenantId?: string, organizationName?: string, refreshToken?: string) => {
    if (typeof window === "undefined") return;

    localStorage.setItem("token", token);
    localStorage.setItem("isLoggedIn", "true");
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }

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
    const refreshToken = localStorage.getItem("refreshToken");
    // Clear the session synchronously so callers can redirect immediately...
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("tenantId");
    localStorage.removeItem("organizationName");
    localStorage.removeItem("isLoggedIn");
    // ...then best-effort revoke the refresh token server-side in the background.
    if (refreshToken) {
      try { baseService.post("/auth/logout", { refreshToken }).catch(() => {}); } catch {}
    }
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

  /**
   * Anonymous username availability probe. Returns `{available, valid, message?}`.
   * The backend rate-limits this endpoint under the shared AuthPolicy and validates
   * the input before hitting the DB, so it is safe to call while the user is typing.
   * Callers should debounce (~400ms) and skip the call for short (< 3 char) inputs.
   */
  checkUsernameAvailable: async (
    username: string,
  ): Promise<{ available: boolean; valid: boolean; message?: string }> => {
    const clean = (username || "").trim();
    if (clean.length < 3) {
      return { available: false, valid: false, message: "Username must be at least 3 characters." };
    }
    try {
      const res = await baseService.get<{ available: boolean; valid: boolean; message?: string }>(
        `/auth/username-available?u=${encodeURIComponent(clean)}`,
      );
      return { available: !!res?.available, valid: !!res?.valid, message: res?.message };
    } catch {
      // Offline or 429 rate-limited — treat as unknown, don't block the form's Save button
      // just because the probe failed. Server-side duplicate check is still the authority.
      return { available: false, valid: false, message: undefined };
    }
  },

  verifyAndResetPassword: async (payload: { username: string; mobile: string; verificationCode: string; newPassword: string }): Promise<{ success: boolean; message?: string }> => {
    return await baseService.post("/auth/forgot-password/verify-and-reset", payload);
  },

  getMyProfile: async (): Promise<{ id: number; username: string; fullName: string; role: string; mobile?: string; email?: string; isPlatformAdmin?: boolean }> => {
    return await baseService.get("/auth/me");
  },

  updateMyProfile: async (payload: { fullName?: string; mobile?: string; email?: string }): Promise<{ success: boolean; message?: string; profile?: any }> => {
    return await baseService.put("/auth/profile", payload);
  },

  changePassword: async (payload: { oldPassword: string; newPassword: string }): Promise<{ success: boolean; message?: string }> => {
    return await baseService.post("/auth/change-password", payload);
  },

  getInvite: async (token: string): Promise<{ valid: boolean; email?: string; organizationName?: string; role?: string; message?: string }> => {
    return await baseService.get(`/auth/invite/${encodeURIComponent(token)}`);
  },

  acceptInvite: async (payload: { token: string; username: string; password: string; fullName: string; mobile?: string }): Promise<LoginResponse> => {
    const res = await baseService.post<LoginResponse>("/auth/accept-invite", payload);
    if (res.success && res.token) {
      authService.setSession(res.token, res.user, res.tenantId, res.organizationName, res.refreshToken);
    }
    return res;
  },
};