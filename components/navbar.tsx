"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { HaveYouLogo } from "@/components/have-you-logo";

export function Navbar() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href={session ? "/dashboard" : "/"} className="flex items-center gap-2 font-semibold">
          <HaveYouLogo className="h-5 w-5" />
          <span>have you<span className="text-muted-foreground">...</span> watched?</span>
        </Link>
        <div className="flex items-center gap-2">
          {session ? (
            <nav className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm hover:underline">
                Dashboard
              </Link>
              <Link href="/search" className="text-sm hover:underline">
                Search
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </nav>
          ) : (
            <nav className="flex items-center gap-2">
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                Sign in
              </Link>
              <Link href="/signup" className={cn(buttonVariants({ size: "sm" }))}>
                Sign up
              </Link>
            </nav>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
