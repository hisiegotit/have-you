/** Skeleton placeholder matching MovieCard dimensions — used while dashboard loads */
export function MovieCardSkeleton() {
  return (
    <div className="flex flex-col rounded-lg overflow-hidden border bg-card shadow-sm animate-pulse">
      {/* Poster placeholder */}
      <div className="aspect-[2/3] bg-muted" />
      {/* Info placeholder */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        <div className="h-3 bg-muted rounded w-4/5" />
        <div className="h-3 bg-muted rounded w-2/5 mt-auto" />
        <div className="h-8 bg-muted rounded w-full mt-1" />
      </div>
    </div>
  );
}
