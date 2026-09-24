const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://81.0.248.82:8080/api";

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: RequestMethod;
  body?: any;
  headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
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

    // 401 Unauthorized handling: Auto logout & redirect to login page
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.clear();

        const currentPath = window.location.pathname;
        if (!currentPath.startsWith("/login") && !currentPath.startsWith("/register") && !currentPath.startsWith("/onboard")) {
          // Redirect immediately to login
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
      }
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