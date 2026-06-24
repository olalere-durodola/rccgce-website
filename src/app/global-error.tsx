"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0b1436",
          color: "#f5f3ec",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "32rem" }}>
          <p
            style={{
              color: "#e8c66b",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontSize: "0.75rem",
            }}
          >
            RCCG Covenant Embassy
          </p>
          <h1 style={{ color: "#e8c66b", fontSize: "2rem", margin: "1rem 0" }}>
            Something went wrong
          </h1>
          <p style={{ opacity: 0.8, marginBottom: "1.5rem" }}>
            A critical error occurred. Please try again.
          </p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <button
            type="button"
            onClick={() => reset()}
            style={{
              backgroundColor: "#e8c66b",
              color: "#0b1436",
              border: "none",
              borderRadius: "9999px",
              padding: "0.625rem 1.5rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
