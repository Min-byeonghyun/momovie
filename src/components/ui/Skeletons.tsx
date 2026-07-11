"use client";

export function HeroSkeleton() {
  return (
    <section className="relative h-[70vh] min-h-125 max-h-175 w-full overflow-hidden bg-secondary">
      <div className="absolute inset-0 bg-linear-to-r from-background via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent" />

      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-xl w-full">
          <div className="h-6 w-24 bg-muted-foreground rounded animate-pulse mb-4" />
          <div className="h-12 w-3/4 bg-muted-foreground rounded animate-pulse mb-2" />
          <div className="h-12 w-1/2 bg-muted-foreground rounded animate-pulse mb-4" />
          <div className="space-y-2 mb-6">
            <div className="h-4 w-full bg-muted-foreground rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-muted-foreground rounded animate-pulse" />
            <div className="h-4 w-4/6 bg-muted-foreground rounded animate-pulse" />
          </div>
          <div className="h-12 w-32 bg-muted-foreground rounded-md animate-pulse" />
        </div>
      </div>
    </section>
  );
}

export function MovieCardSkeleton() {
  return (
    <div className="block">
      <div className="relative aspect-2/3 rounded-lg overflow-hidden bg-muted-foreground animate-pulse" />
    </div>
  );
}

export function MovieSectionSkeleton({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          {subtitle ? (
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              {subtitle}
            </p>
          ) : (
            <div className="h-3 w-20 bg-muted rounded animate-pulse mb-1" />
          )}
          {title ? (
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {title}
            </h2>
          ) : (
            <div className="h-7 w-32 bg-muted rounded animate-pulse" />
          )}
        </div>
        <div className="h-4 w-12 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export function MovieDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Video Section Skeleton */}
      <section className="bg-secondary">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted-foreground animate-pulse" />
        </div>
      </section>

      {/* Movie Info Section Skeleton */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="h-10 w-3/4 bg-muted rounded animate-pulse mb-4" />

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
              <div className="h-4 w-40 bg-muted rounded animate-pulse" />
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                <div className="h-5 w-32 bg-muted rounded animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                <div className="h-5 w-64 bg-muted rounded animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                <div className="h-5 w-48 bg-muted rounded animate-pulse" />
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
            </div>
          </div>

          <div className="lg:w-64 shrink-0">
            <div className="relative aspect-2/3 rounded-lg overflow-hidden bg-muted animate-pulse" />
          </div>
        </div>
      </section>

      {/* Related Movies Section Skeleton */}
      <section className="bg-secondary py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="h-3 w-16 bg-muted-foreground rounded animate-pulse mb-1" />
            <div className="h-7 w-32 bg-muted-foreground rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function MovieVideoSectionSkeleton() {
  return (
    <section className="bg-secondary">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted-foreground animate-pulse" />
      </div>
    </section>
  );
}

export function MovieRelatedSectionSkeleton() {
  return (
    <section className="bg-secondary py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="h-3 w-16 bg-muted-foreground rounded animate-pulse mb-1" />
          <div className="h-7 w-32 bg-muted-foreground rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PosterModalSkeleton() {
  return (
    <div className="bg-secondary rounded-lg overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Poster Image Skeleton */}
        <div className="relative w-full md:w-1/2 aspect-2/3 bg-muted-foreground animate-pulse" />

        {/* Movie Info Skeleton */}
        <div className="p-6 md:w-1/2 flex flex-col justify-between">
          <div>
            {/* Title */}
            <div className="h-8 w-3/4 bg-muted-foreground rounded animate-pulse mb-2" />
            {/* Original Title */}
            <div className="h-5 w-1/2 bg-muted-foreground rounded animate-pulse mb-6" />

            {/* Rating & Info */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-muted-foreground animate-pulse" />
              <div className="h-4 w-32 bg-muted-foreground rounded animate-pulse" />
            </div>

            {/* Overview */}
            <div className="space-y-2 mb-6">
              <div className="h-4 w-full bg-muted-foreground rounded animate-pulse" />
              <div className="h-4 w-full bg-muted-foreground rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-muted-foreground rounded animate-pulse" />
              <div className="h-4 w-4/6 bg-muted-foreground rounded animate-pulse" />
            </div>

            {/* Details */}
            <div className="space-y-3 mb-8">
              <div className="flex gap-2">
                <div className="h-4 w-16 bg-muted-foreground rounded animate-pulse" />
                <div className="h-4 w-24 bg-muted-foreground rounded animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="h-4 w-12 bg-muted-foreground rounded animate-pulse" />
                <div className="h-4 w-20 bg-muted-foreground rounded animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="h-4 w-12 bg-muted-foreground rounded animate-pulse" />
                <div className="h-4 w-40 bg-muted-foreground rounded animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="h-4 w-12 bg-muted-foreground rounded animate-pulse" />
                <div className="h-4 w-40 bg-muted-foreground rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="w-full h-12 bg-muted-foreground rounded-lg animate-pulse mt-6 inline-flex items-center justify-center px-6 py-3 text-primary-foreground  font-medium hover:bg-primary/90 transition-colors"></div>
        </div>
      </div>
    </div>
  );
}

export function PosterPageSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="flex flex-col md:flex-row">
          {/* Poster Image Skeleton */}
          <div className="relative w-full md:w-1/2 aspect-2/3 rounded-lg overflow-hidden bg-muted-foreground animate-pulse shadow-2xl" />

          {/* Movie Info Skeleton */}
          <div className="p-6 md:w-1/2 flex flex-col justify-between">
            <div>
              {/* Title */}
              <div className="h-9 w-3/4 bg-muted-foreground rounded animate-pulse mb-2" />
              {/* Original Title */}
              <div className="h-5 w-1/2 bg-muted-foreground rounded animate-pulse mb-5" />

              {/* Rating & Info */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-muted-foreground animate-pulse" />
                <div className="h-4 w-40 bg-muted-foreground rounded animate-pulse" />
              </div>

              {/* Overview */}
              <div className="space-y-2 mb-8">
                <div className="h-4 w-full bg-muted-foreground rounded animate-pulse" />
                <div className="h-4 w-full bg-muted-foreground rounded animate-pulse" />
                <div className="h-4 w-full bg-muted-foreground rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-muted-foreground rounded animate-pulse" />
              </div>

              {/* Details */}
              <div className="space-y-3 mb-8">
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-muted-foreground rounded animate-pulse" />
                  <div className="h-5 w-28 bg-muted-foreground rounded animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="h-5 w-12 bg-muted-foreground rounded animate-pulse" />
                  <div className="h-5 w-24 bg-muted-foreground rounded animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="h-5 w-12 bg-muted-foreground rounded animate-pulse" />
                  <div className="h-5 w-48 bg-muted-foreground rounded animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="h-5 w-12 bg-muted-foreground rounded animate-pulse" />
                  <div className="h-5 w-48 bg-muted-foreground rounded animate-pulse" />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <div className="h-12 w-36 bg-muted-foreground rounded-lg animate-pulse" />
              <div className="h-12 w-24 bg-muted-foreground rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
