"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { PasswordInput } from "@/components/password-input";

const C = {
  fg:        "var(--foreground)",
  muted:     "var(--muted-foreground)",
  label:     "var(--foreground)",
  border:    "var(--border)",
  primary:   "var(--primary)",
  primaryFg: "var(--primary-foreground)",
  subtle:    "var(--border)",
  link:      "var(--foreground)",
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

export default function SignupPage() {
  const router = useRouter();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.signUp.email({ name, email, password });
    setLoading(false);
    if (error) { toast.error(error.message ?? "Sign up failed"); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.025em", color: C.fg, marginBottom: "6px" }}>
          Join the crew
        </h1>
        <p style={{ fontSize: "0.875rem", color: C.muted }}>Start tracking the films you love</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: C.label }}>Name</label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Your name" required autoComplete="name"
            style={inputStyle}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: C.label }}>Email</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" required autoComplete="email"
            style={inputStyle}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: C.label }}>Password</label>
          <PasswordInput
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            required minLength={8} autoComplete="new-password"
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
        {loading ? "Creating account…" : "Create account"}
      </button>

      <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: `1px solid ${C.subtle}`, textAlign: "center" }}>
        <span style={{ fontSize: "0.875rem", color: C.muted }}>Already a member? </span>
        <Link href="/login" style={{ fontSize: "0.875rem", fontWeight: 500, color: C.link }}>
          Sign in
        </Link>
      </div>
    </form>
  );
}
