import { Metadata } from "next";
import { SearchPageClient } from "@/components/search-page-client";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata: Metadata = { title: "Search Movies — Have You" };

export default function SearchPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Search Movies</h1>
      <ErrorBoundary>
        <SearchPageClient />
      </ErrorBoundary>
    </div>
  );
}
