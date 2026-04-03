import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// Wrapper to get session in server components/actions
// NOTE: In Next.js 15, headers() returns a Promise — must be awaited
export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}
