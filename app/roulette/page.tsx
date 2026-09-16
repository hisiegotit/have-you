import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Dices } from "lucide-react";
import { getSession } from "@/lib/auth-helpers";
import { getWatchLaterMovies } from "@/lib/watch-later";
import { RoulettePageClient } from "@/components/roulette-page-client";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata: Metadata = { title: "Roulette — Have You" };

export default async function RoulettePage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const movies = await getWatchLaterMovies(session.user.id);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Dices className="h-6 w-6 text-amber-400" />
          Tonight&apos;s pick
        </h1>
        <p className="text-muted-foreground mt-1">
          {movies.length} title{movies.length === 1 ? "" : "s"} from your Watch Later list — one
          gets picked at random.
        </p>
      </div>

      <ErrorBoundary>
        <RoulettePageClient initialMovies={movies} />
      </ErrorBoundary>
    </div>
  );
}
