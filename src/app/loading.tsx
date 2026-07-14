import { HeroSkeleton, MovieSectionSkeleton } from "@/components/ui/Skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSkeleton />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MovieSectionSkeleton subtitle="Now Movies" title="상영중인 영화" />
        <MovieSectionSkeleton subtitle="Popular Movies" title="인기있는 영화" />
        <MovieSectionSkeleton
          subtitle="UpComing Movies"
          title="개봉예정 영화"
        />
      </div>
    </div>
  );
}
