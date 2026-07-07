import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getSession } from "@/lib/auth-helpers";
import { ChangePasswordForm } from "@/components/settings/change-password-form";

export const metadata: Metadata = { title: "Settings — Have You" };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account</p>
      </div>

      <ChangePasswordForm />
    </div>
  );
}
