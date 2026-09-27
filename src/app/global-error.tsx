"use client";

// Catches errors thrown in the root layout itself. Must render its own <html>/<body>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif", background: "#F7F8F8" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 420, width: "100%", background: "#fff", border: "1px solid #E5EAEB", borderRadius: 16, padding: 32, textAlign: "center" }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>Application error</h1>
            <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 20px" }}>
              A critical error occurred. Please reload the application.
            </p>
            {error?.digest && <p style={{ fontSize: 11, color: "#94A3B8", fontFamily: "monospace", margin: "0 0 16px" }}>Ref: {error.digest}</p>}
            <button
              onClick={reset}
              style={{ background: "#2F8E86", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
