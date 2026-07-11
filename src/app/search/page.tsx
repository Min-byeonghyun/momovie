import { Suspense } from "react";
import SearchResults from "@/components/search/SearchResult";

export default async function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background pt-24 pb-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
