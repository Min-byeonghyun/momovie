import HeroSection from "@/components/main/HeroSection";
import MovieSection from "@/components/movies/MovieSection";
import { getMoviesData } from "@/lib/api";

export default async function HomePage() {
  const [{ results: nowPlayng }, { results: popular }, { results: upcoming }] =
    await Promise.all([
      getMoviesData("now_playing"),
      getMoviesData("popular"),
      getMoviesData("upcoming"),
    ]);
  console.log(nowPlayng);
  console.log(popular);
  console.log(upcoming);

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
