import { AuthBrandPanel } from "@/components/auth-brand-panel";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
      }}
    >
      <AuthBrandPanel />
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
          background: "oklch(0.145 0 0)",
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%", maxWidth: "352px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
