"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { PasswordInput } from "@/components/password-input";

const C = {
  bg:        "oklch(0.145 0 0)",
  card:      "oklch(0.205 0 0)",
  fg:        "oklch(0.985 0 0)",
  muted:     "oklch(0.56 0 0)",
  label:     "oklch(0.75 0 0)",
  border:    "oklch(1 0 0 / 12%)",
  primary:   "oklch(0.922 0 0)",
  primaryFg: "oklch(0.12 0 0)",
  subtle:    "oklch(1 0 0 / 8%)",
  link:      "oklch(0.78 0 0)",
};

const inputStyle: React.CSSProperties = {
  height: "44px",
  background: C.card,
  border: `1.5px solid ${C.border}`,
  borderRadius: "10px",
  padding: "0 14px",
  color: C.fg,
  fontSize: "0.875rem",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message ?? "Sign in failed"); return; }
    router.push("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.025em", color: C.fg, marginBottom: "6px" }}>
          Welcome back
        </h1>
        <p style={{ fontSize: "0.875rem", color: C.muted }}>Sign in to continue tracking</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: C.label }}>Email</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" required autoComplete="email"
            style={inputStyle}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: C.label }}>Password</label>
            <Link href="/forgot-password" style={{ fontSize: "0.8rem", color: C.muted, textDecoration: "none" }}>
              Forgot?
            </Link>
          </div>
          <PasswordInput
            value={password} onChange={e => setPassword(e.target.value)}
            required minLength={8} autoComplete="current-password"
            style={{ ...inputStyle, padding: "0 44px 0 14px" } as React.CSSProperties}
          />
        </div>
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
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: `1px solid ${C.subtle}`, textAlign: "center" }}>
        <span style={{ fontSize: "0.875rem", color: C.muted }}>New here? </span>
        <Link href="/signup" style={{ fontSize: "0.875rem", fontWeight: 500, color: C.link }}>
          Create an account
        </Link>
      </div>
    </form>
  );
}
