import HeroSection from "@/components/main/HeroSection";
import MovieSection from "@/components/movies/MovieSection";

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Skeleton */}
      {/* <HeroSkeleton /> */}
      <HeroSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Skeleton */}
        {/* <MovieSectionSkeleton /> */}
        {/* Error */}
        {/* <MovieSectionError /> */}
        <MovieSection />
      </div>
    </div>
  );
}
