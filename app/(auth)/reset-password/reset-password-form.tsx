"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
};

const inputStyle: React.CSSProperties = {
  height: "44px",
  background: "var(--muted)",
  border: `1.5px solid ${C.border}`,
  borderRadius: "10px",
  padding: "0 44px 0 14px",
  color: C.fg,
  fontSize: "0.875rem",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
};

export function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { toast.error("Reset link is missing or invalid"); return; }
    setLoading(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setLoading(false);
    if (error) { toast.error(error.message ?? "Failed to reset password"); return; }
    toast.success("Password updated — sign in with your new password");
    router.push("/login");
  }

  if (!token) {
    return (
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.025em", color: C.fg, marginBottom: "10px" }}>
          Invalid or expired link
        </h1>
        <p style={{ fontSize: "0.875rem", color: C.muted, marginBottom: "28px" }}>
          Request a new password reset link and try again.
        </p>
        <Link href="/forgot-password" style={{ fontSize: "0.875rem", color: C.muted }}>
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.025em", color: C.fg, marginBottom: "6px" }}>
          Set a new password
        </h1>
        <p style={{ fontSize: "0.875rem", color: C.muted }}>Choose something you'll remember</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "7px", marginBottom: "20px" }}>
        <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: C.label }}>New password</label>
        <PasswordInput
          value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          required minLength={8} autoComplete="new-password"
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
        {loading ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
