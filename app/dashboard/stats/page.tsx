import { redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Stats — Have You" };

export default async function StatsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const watched = await prisma.watchedMovie.findMany({
    where: { userId: session.user.id },
    select: { mediaType: true, userRating: true, genres: true, watchedAt: true },
  });

  if (watched.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
        </div>
        <p className="text-muted-foreground text-center py-20">No data yet — start watching movies!</p>
      </div>
    );
  }

  const total = watched.length;
  const moviesCount = watched.filter((m) => m.mediaType !== "tv").length;
  const tvCount = watched.filter((m) => m.mediaType === "tv").length;

  const rated = watched.filter((m) => m.userRating !== null);
  const avgRating =
    rated.length > 0
      ? rated.reduce((sum, m) => sum + (m.userRating ?? 0), 0) / rated.length
      : null;

  // Genre counts
  const genreCounts: Record<string, number> = {};
  watched.forEach((m) => {
    m.genres.forEach((g) => {
      genreCounts[g] = (genreCounts[g] ?? 0) + 1;
    });
  });
  const topGenres = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);
  const maxGenreCount = topGenres[0]?.[1] ?? 1;

  // Monthly activity — last 12 months
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const count = watched.filter((m) => {
      const w = new Date(m.watchedAt);
      return w.getFullYear() === d.getFullYear() && w.getMonth() === d.getMonth();
    }).length;
    return {
      label: d.toLocaleString("default", { month: "short" }),
      count,
    };
  });
  const maxMonthCount = Math.max(...months.map((m) => m.count), 1);

  // Rating distribution
  const ratingDist = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: watched.filter((m) => m.userRating === stars).length,
  }));
  const maxRatingCount = Math.max(...ratingDist.map((r) => r.count), 1);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard" className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Link>
        <h1 className="text-2xl font-bold">Your Stats</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Watched" value={total} />
        <StatCard label="Movies" value={moviesCount} />
        <StatCard label="TV Shows" value={tvCount} />
        <StatCard
          label="Avg Rating"
          value={avgRating !== null ? `${avgRating.toFixed(1)} ★` : "—"}
          sub={rated.length > 0 ? `${rated.length} rated` : "none rated"}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Monthly activity */}
        <div className="bg-card border rounded-xl p-5">
          <h2 className="text-xs font-semibold mb-4 text-muted-foreground uppercase tracking-widest">
            Monthly Activity
          </h2>
          <div className="flex items-end gap-1 h-28">
            {months.map(({ label, count }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1 group">
                {count > 0 && (
                  <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {count}
                  </span>
                )}
                <div
                  className="w-full bg-primary/20 rounded-sm hover:bg-primary/50 transition-colors"
                  style={{
                    height: count > 0 ? `${Math.max((count / maxMonthCount) * 100, 4)}%` : "2px",
                    opacity: count === 0 ? 0.3 : 1,
                  }}
                />
                <span className="text-[9px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Movie vs TV */}
        <div className="bg-card border rounded-xl p-5">
          <h2 className="text-xs font-semibold mb-4 text-muted-foreground uppercase tracking-widest">
            Movie vs TV
          </h2>
          <div className="flex items-end gap-8 h-28 px-4">
            {[
              { label: "Movies", count: moviesCount, cls: "bg-primary/60 hover:bg-primary/80" },
              { label: "TV Shows", count: tvCount, cls: "bg-chart-2/60 hover:bg-chart-2/80" },
            ].map(({ label, count, cls }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-lg font-bold">{count}</span>
                <div className="w-full flex flex-col justify-end" style={{ height: "64px" }}>
                  <div
                    className={cn("w-full rounded-t-md transition-colors", cls)}
                    style={{
                      height: total > 0 ? `${Math.max((count / total) * 100, count > 0 ? 6 : 0)}%` : "0%",
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top genres */}
        {topGenres.length > 0 && (
          <div className="bg-card border rounded-xl p-5">
            <h2 className="text-xs font-semibold mb-4 text-muted-foreground uppercase tracking-widest">
              Top Genres
            </h2>
            <div className="space-y-3">
              {topGenres.map(([genre, count]) => (
                <div key={genre} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{genre}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(count / maxGenreCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rating distribution */}
        {rated.length > 0 && (
          <div className="bg-card border rounded-xl p-5">
            <h2 className="text-xs font-semibold mb-4 text-muted-foreground uppercase tracking-widest">
              Rating Distribution
            </h2>
            <div className="space-y-3">
              {ratingDist.map(({ stars, count }) => (
                <div key={stars} className="flex items-center gap-3">
                  <span className="text-xs text-amber-500 w-10 shrink-0 font-medium">
                    {"★".repeat(stars)}
                  </span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${(count / maxRatingCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-5 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-card border rounded-xl p-4">
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
