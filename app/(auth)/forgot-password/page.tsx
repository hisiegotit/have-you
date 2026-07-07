"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

const C = {
  fg:        "var(--foreground)",
  muted:     "var(--muted-foreground)",
  label:     "var(--foreground)",
  border:    "var(--border)",
  primary:   "var(--primary)",
  primaryFg: "var(--primary-foreground)",
  elevated:  "var(--muted)",
  elevFg:    "var(--foreground)",
};

const inputStyle: React.CSSProperties = {
  height: "44px",
  background: "var(--muted)",
  border: `1.5px solid ${C.border}`,
  borderRadius: "10px",
  padding: "0 14px",
  color: C.fg,
  fontSize: "0.875rem",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
};

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    setLoading(false);
    if (error) { toast.error(error.message ?? "Failed to send reset email"); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "56px", height: "56px", background: C.elevated, borderRadius: "14px",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.025em", color: C.fg, marginBottom: "10px" }}>
          Check your inbox
        </h1>
        <p style={{ fontSize: "0.875rem", color: C.muted, lineHeight: 1.7, marginBottom: "32px" }}>
          If an account exists for {email}, a password reset link is on its way. The link expires in 1 hour.
        </p>
        <Link
          href="/login"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: "44px", background: C.elevated, color: C.elevFg,
            border: `1.5px solid ${C.border}`, borderRadius: "10px",
            fontSize: "0.875rem", fontWeight: 500, textDecoration: "none",
          }}
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Link
        href="/login"
        style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8125rem", color: C.muted, textDecoration: "none", marginBottom: "32px" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to sign in
      </Link>

      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.025em", color: C.fg, marginBottom: "6px" }}>
          Reset your password
        </h1>
        <p style={{ fontSize: "0.875rem", color: C.muted }}>Enter your email and we'll send a reset link</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "7px", marginBottom: "20px" }}>
        <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: C.label }}>Email</label>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com" required autoComplete="email"
          style={inputStyle}
        />
      </div>

      <button
        type="submit" disabled={loading}
        style={{
          width: "100%", height: "44px", background: C.primary,
          color: C.primaryFg, border: "none", borderRadius: "10px",
          fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
          letterSpacing: "-0.01em", opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
