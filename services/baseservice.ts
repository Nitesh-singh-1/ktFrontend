const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://81.0.248.82:8080/api";

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: RequestMethod;
  body?: any;
  headers?: Record<string, string>;
}

// Shared in-flight refresh so concurrent 401s trigger only one /auth/refresh call.
let refreshInFlight: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data?.success && data?.token) {
          localStorage.setItem("token", data.token);
          if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
          return data.token as string;
        }
        return null;
      } catch {
        return null;
      } finally {
        // Clear after the microtask so all awaiters in this burst share this result.
        setTimeout(() => { refreshInFlight = null; }, 0);
      }
    })();
  }
  return refreshInFlight;
}

function clearSessionAndRedirect() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  sessionStorage.clear();
  const currentPath = window.location.pathname;
  if (!currentPath.startsWith("/login") && !currentPath.startsWith("/register") && !currentPath.startsWith("/onboard") && !currentPath.startsWith("/accept-invite")) {
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const tenantId = typeof window !== "undefined" ? localStorage.getItem("tenantId") : null;

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(tenantId && { "X-Tenant-ID": tenantId }),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // 401 Unauthorized: try a one-time silent refresh, then retry; otherwise sign out.
    if (response.status === 401) {
      const isAuthFlow = endpoint.includes("/auth/refresh") || endpoint.includes("/auth/login") || endpoint.includes("/auth/logout");
      if (!isRetry && !isAuthFlow && typeof window !== "undefined") {
        const newToken = await tryRefreshToken();
        if (newToken) {
          return request<T>(endpoint, options, true);
        }
      }
      clearSessionAndRedirect();
      throw new Error("Session expired. Please log in again.");
    }

    // 403 Forbidden handling: Clean, user-friendly business message
    if (response.status === 403) {
      throw new Error("This section is restricted for your role or organization subscription tier.");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message =
        error.message ||
        error.title ||
        (typeof error === "string" ? error : "Something went wrong");
      throw new Error(message);
    }

    // Handle 204 No Content or empty responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }
    return {} as T;
  } catch (err: any) {
    throw err;
  }
}

export const baseService = {
  get: <T>(endpoint: string) => request<T>(endpoint),

  post: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: "POST", body }),

  put: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: "PUT", body }),

  patch: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: "PATCH", body }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: "DELETE" }),
};