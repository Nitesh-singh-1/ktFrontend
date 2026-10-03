const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://81.0.248.82:8080/api";

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: RequestMethod;
  body?: any;
  headers?: Record<string, string>;
}

/**
 * ApiError carries the same `traceId` value the backend echoed in the `X-Request-Id`
 * response header (see TASK-010). Callers that show a user-facing error toast can pass
 * this to `toast.error(msg, { traceId })` so a support ticket includes the id needed to
 * find the exact log line on the server.
 */
export class ApiError extends Error {
  public readonly traceId?: string;
  public readonly status?: number;
  constructor(message: string, opts: { traceId?: string; status?: number } = {}) {
    super(message);
    this.name = "ApiError";
    this.traceId = opts.traceId;
    this.status = opts.status;
  }
}

/**
 * ASP.NET Core's [ApiController] attribute auto-validates the model BEFORE the action
 * method runs — so every DataAnnotation ([Required], [RegularExpression], [Range], etc.)
 * we add to a request DTO produces this exact response shape (RFC 9110 ProblemDetails),
 * not our own {success,message,traceId} envelope from ExceptionHandlingMiddleware:
 *
 *   {
 *     "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
 *     "title": "One or more validation errors occurred.",
 *     "status": 400,
 *     "errors": { "AdminMobile": ["Mobile number must be a valid 10-digit..."] },
 *     "traceId": "00-c563...-00"
 *   }
 *
 * Falling back to `error.title` alone (as we did before) shows the user the useless
 * generic "One or more validation errors occurred." — the actually useful message is
 * buried in `errors`. This pulls out the first field error and prefixes it with the
 * field name so multi-field responses still make sense.
 */
function extractValidationMessage(body: any): string | null {
  if (!body || typeof body !== "object" || !body.errors || typeof body.errors !== "object") {
    return null;
  }
  const fields = Object.keys(body.errors);
  if (fields.length === 0) return null;

  const firstField = fields[0];
  const messages = body.errors[firstField];
  const firstMessage = Array.isArray(messages) ? messages[0] : String(messages);
  if (!firstMessage) return null;

  const extra = fields.length > 1 ? ` (and ${fields.length - 1} other field${fields.length > 2 ? "s" : ""})` : "";
  return `${firstMessage}${extra}`;
}

// Generate a 12-hex-char id — same shape the backend uses when no header is present
// (see CorrelationIdMiddleware.GenerateId). Having the client mint the id means the
// user's browser DevTools also shows the same id BEFORE the response arrives, so a
// bug reporter can copy the header value straight from the Network tab.
function generateRequestId(): string {
  // crypto.getRandomValues is available in every modern browser + Node; fall back to
  // Math.random for SSR-early paths that shouldn't happen but shouldn't crash if they do.
  try {
    const buf = new Uint8Array(6);
    (globalThis.crypto || (globalThis as any).msCrypto).getRandomValues(buf);
    return Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return Math.floor(Math.random() * 0xffffffffffff).toString(16).padStart(12, "0");
  }
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
  localStorage.removeItem("isLoggedIn");
  sessionStorage.clear();
  const currentPath = window.location.pathname;
  if (!currentPath.startsWith("/login") && !currentPath.startsWith("/register") && !currentPath.startsWith("/onboard") && !currentPath.startsWith("/accept-invite")) {
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
  }
}

/**
 * Result envelope returned by `baseService.getPaginated` — the JSON body plus the
 * `X-Total-Count` header (parsed as a number when present) advertised by the
 * TASK-011c pagination helper on list endpoints. Existing callers that only care
 * about the array can keep using `baseService.get<T[]>()`; only pages that want
 * to show "showing N of M" bother with this envelope.
 */
export interface PaginatedResult<T> {
  data: T;
  total: number | null;
}

async function request<T>(endpoint: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const tenantId = typeof window !== "undefined" ? localStorage.getItem("tenantId") : null;

  // Per-request correlation id. Caller can override by passing headers["X-Request-Id"].
  const requestId = headers["X-Request-Id"] || headers["x-request-id"] || generateRequestId();

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": requestId,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(tenantId && { "X-Tenant-ID": tenantId }),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // Server echoes X-Request-Id back on both success and error paths (see TASK-010
    // CorrelationIdMiddleware). Fall back to the id we sent — the server accepts it
    // when supplied, so the sent-id IS the trace id.
    const serverTraceId = response.headers.get("x-request-id") || requestId;

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
      throw new ApiError("Session expired. Please log in again.", { traceId: serverTraceId, status: 401 });
    }

    // 403 Forbidden handling: Clean, user-friendly business message
    if (response.status === 403) {
      throw new ApiError(
        "This section is restricted for your role or organization subscription tier.",
        { traceId: serverTraceId, status: 403 },
      );
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message =
        error.message ||
        extractValidationMessage(error) ||
        error.title ||
        (typeof error === "string" ? error : "Something went wrong");
      // Prefer server-provided traceId (from the error envelope) over the header;
      // both should match now but the envelope wins if there's ever drift.
      throw new ApiError(message, { traceId: error?.traceId || serverTraceId, status: response.status });
    }

    // Handle 204 No Content or empty responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }
    return {} as T;
  } catch (err: any) {
    // Network-level failures (no response) also carry the request id so a user can
    // still report "the client thought it sent request X but never got a reply".
    if (err instanceof ApiError) throw err;
    if (err instanceof Error) {
      throw new ApiError(err.message || "Network error", { traceId: requestId });
    }
    throw new ApiError(String(err ?? "Unknown error"), { traceId: requestId });
  }
}

/**
 * GET a paginated list endpoint, returning both the array body and the
 * X-Total-Count header (parsed to a number) that the backend sets via
 * TASK-011c's PaginationHelper. Callers pass their `page` / `pageSize`
 * as normal query-string params on `endpoint`. Endpoints that don't set
 * the header (older ones, or paths not yet migrated) return `total: null`.
 *
 * This is a thin wrapper around the standard GET so all the ApiError,
 * refresh-on-401, and traceId plumbing still applies.
 */
async function getPaginatedRequest<T>(endpoint: string): Promise<PaginatedResult<T>> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const tenantId = typeof window !== "undefined" ? localStorage.getItem("tenantId") : null;
  const requestId = generateRequestId();

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": requestId,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(tenantId && { "X-Tenant-ID": tenantId }),
      },
    });

    const serverTraceId = response.headers.get("x-request-id") || requestId;

    if (response.status === 401) {
      const newToken = await tryRefreshToken();
      if (newToken) return getPaginatedRequest<T>(endpoint);
      clearSessionAndRedirect();
      throw new ApiError("Session expired. Please log in again.", { traceId: serverTraceId, status: 401 });
    }
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const message = err?.message || extractValidationMessage(err) || err?.title || "Something went wrong";
      throw new ApiError(message, { traceId: err?.traceId || serverTraceId, status: response.status });
    }

    const totalHeader = response.headers.get("X-Total-Count") || response.headers.get("x-total-count");
    const total = totalHeader ? Number.parseInt(totalHeader, 10) : NaN;
    const data = (await response.json()) as T;
    return { data, total: Number.isFinite(total) ? total : null };
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err?.message || "Network error", { traceId: requestId });
  }
}

export const baseService = {
  get: <T>(endpoint: string) => request<T>(endpoint),

  /** GET a paginated list endpoint and read the X-Total-Count header (TASK-011c). */
  getPaginated: <T>(endpoint: string) => getPaginatedRequest<T>(endpoint),

  post: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: "POST", body }),

  put: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: "PUT", body }),

  patch: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: "PATCH", body }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: "DELETE" }),
};