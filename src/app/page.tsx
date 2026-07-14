import HeroSection from "@/components/main/HeroSection";
import MovieSection from "@/components/movies/MovieSection";
import { getMoviesData } from "@/lib/api";

export default async function HomePage() {
  const [{ results: nowPlaying }, { results: popular }, { results: upcoming }] =
    await Promise.all([
      getMoviesData("now_playing"),
      getMoviesData("popular"),
      getMoviesData("upcoming"),
    ]);
  const heroMovie = nowPlaying.slice(0, 1)[0];
  return (
    <div className="min-h-screen bg-background">
      {/* Skeleton */}
      {/* <HeroSkeleton /> */}
      <HeroSection movie={heroMovie} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Skeleton */}
        {/* <MovieSectionSkeleton /> */}
        {/* Error */}
        {/* <MovieSectionError /> */}
        <MovieSection
          title="상영중인 영화"
          subTitle="Now Movies"
          movies={nowPlaying}
          moreUrl="/search?category=now_playing"
        />
        <MovieSection
          title="인기있는 영화"
          subTitle="Popular Movies"
          movies={popular}
          moreUrl="/search?category=popular"
        />
        <MovieSection
          title="개봉예정 영화"
          subTitle="UpComing Movies"
          movies={upcoming}
          moreUrl="/search?category=upcoming"
        />
      </div>
    </div>
  );
}
