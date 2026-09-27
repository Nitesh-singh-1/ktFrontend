const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://81.0.248.82:8080/api";

/**
 * Downloads the current tenant's data export (JSON) as a file. Uses a raw fetch (not baseService)
 * because the response is a binary/file download, not JSON. Tenant-admin only on the server.
 */
export async function downloadTenantExport(): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const tenantId = typeof window !== "undefined" ? localStorage.getItem("tenantId") : null;

  const res = await fetch(`${BASE_URL}/dataexport`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(tenantId && { "X-Tenant-ID": tenantId }),
    },
  });

  if (!res.ok) {
    let msg = "Failed to export data.";
    try {
      const err = await res.json();
      msg = err.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const blob = await res.blob();
  const cd = res.headers.get("content-disposition") || "";
  const match = cd.match(/filename=([^;]+)/);
  const fileName = match ? match[1].trim() : "ktransport-export.json";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
