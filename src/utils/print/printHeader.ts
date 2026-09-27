import { getTenantPrintProfile, TenantPrintProfile } from "./tenantProfile";
import { toast } from "@/context/ToastContext";

/**
 * Generic, logo-agnostic print letterhead shared by Bilty/GR, Challan, and Money Receipt.
 *
 * Design goals (TASK-031):
 * - Works with ANY logo: transparent or solid, light or dark, any aspect ratio. The logo sits in a
 *   fixed WHITE box with a thin neutral border and object-fit:contain, so it never fights a colored
 *   background and never distorts.
 * - Neutral color scheme (white background, near-black text, one thin grey rule) so it never clashes
 *   with the brand's own colors.
 * - Degrades gracefully when no logo is set (box is simply omitted).
 *
 * Returns an HTML string; callers embed it at the top of their print document and must include
 * PRINT_HEADER_CSS once in their <style>.
 */
export function renderPrintHeaderHtml(profile?: TenantPrintProfile): string {
  const p = profile ?? getTenantPrintProfile();

  const contactBits = [
    p.phone ? `Phone: ${p.phone}` : "",
    p.email ? `Email: ${p.email}` : "",
    p.gstin ? `GSTIN: ${p.gstin}` : "",
    p.panNumber ? `PAN: ${p.panNumber}` : "",
  ].filter(Boolean).join("  |  ");

  const logoHtml = p.logoUrl
    ? `<div class="kt-ph-logobox"><img class="kt-ph-logo" src="${p.logoUrl}" alt="Logo" onerror="this.parentNode.style.display='none'" /></div>`
    : "";

  return `
    <div class="kt-ph">
      ${logoHtml}
      <div class="kt-ph-info">
        <div class="kt-ph-name">${escapeHtml(p.companyName)}</div>
        ${p.tagline || p.address ? `<div class="kt-ph-sub">${escapeHtml(p.tagline || p.address || "")}</div>` : ""}
        ${p.address && p.tagline ? `<div class="kt-ph-sub">${escapeHtml(p.address)}</div>` : ""}
        ${contactBits ? `<div class="kt-ph-contact">${escapeHtml(contactBits)}</div>` : ""}
      </div>
    </div>`;
}

/** CSS for the generic header. Include once inside the print document's <style>. */
export const PRINT_HEADER_CSS = `
  .kt-ph {
    display: flex;
    align-items: center;
    gap: 14px;
    background: #ffffff;
    color: #111827;
    border-bottom: 2px solid #111827;
    padding: 10px 8px;
    margin-bottom: 10px;
  }
  .kt-ph-logobox {
    width: 64px; height: 64px;
    flex-shrink: 0;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .kt-ph-logo { max-width: 100%; max-height: 100%; object-fit: contain; }
  .kt-ph-info { flex: 1; text-align: left; }
  .kt-ph-name { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: #111827; }
  .kt-ph-sub { font-size: 11px; color: #374151; margin-top: 1px; }
  .kt-ph-contact { font-size: 10px; color: #6b7280; margin-top: 3px; }
  @media print {
    .kt-ph { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

/**
 * Opens a print preview window, writes the HTML, and waits for every image (including base64 data-URL
 * logos) to finish loading before printing — so the logo is never missing from the printed output.
 * The document should NOT auto-call window.print(); this injects a load-gated trigger instead.
 */
export function openPrintWindow(html: string, autoPrint = false): void {
  const win = window.open("", "_blank");
  if (!win) {
    toast.error("Please allow pop-ups for this site to print.");
    return;
  }

  const gate = `
    <script>
      (function () {
        function ready() {
          var imgs = Array.prototype.slice.call(document.images || []);
          return Promise.all(imgs.map(function (img) {
            if (img.complete) return Promise.resolve();
            return new Promise(function (res) { img.onload = img.onerror = res; });
          }));
        }
        window.__ktPrint = function () { ready().then(function () { window.focus(); window.print(); }); };
        ${autoPrint ? "ready().then(function(){ window.focus(); window.print(); });" : ""}
      })();
    <\/script>`;

  win.document.write(html.includes("</body>") ? html.replace("</body>", gate + "</body>") : html + gate);
  win.document.close();
}

function escapeHtml(s: string): string {
  return (s || "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string
  ));
}
