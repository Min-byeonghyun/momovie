import Link from "next/link";
import MovieCard from "../movies/MovieCard";

export default function SearchResults() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            홈으로
          </Link>

          {/* 검색 결과가 있을 때 */}
          <h1 className="text-3xl font-bold text-foreground mb-2">검색 결과</h1>
          <p className="text-muted-foreground">
            &quot;슈퍼맨&quot;에 대한 검색 결과 1건
          </p>
          {/* 영화 더보기 일 때 */}
          {/* <h1 className="text-3xl font-bold text-foreground mb-2">
            인기있는 영화
          </h1>
          <p className="text-muted-foreground">총 10개의 영화</p> */}
        </div>
        {/* 검색된 영화가 있으면 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <MovieCard />
        </div>
        {/* 검색된 영화가 없으면 */}
        {/* <div className="flex flex-col items-center justify-center py-20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground mb-4"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            검색 결과가 없습니다
          </h2>
          <p className="text-muted-foreground text-center">
            다른 검색어로 다시 시도해보세요.
          </p>
        </div> */}
      </div>
    </div>
  );
}
