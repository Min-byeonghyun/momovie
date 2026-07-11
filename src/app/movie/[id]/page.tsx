import Image from "next/image";
import Link from "next/link";
import MovieSection from "@/components/movies/MovieSection";

export default async function MovieDetailPage() {
  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Video Section */}
      <section className="bg-secondary">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
            {/* 비메오는 `https://player.vimeo.com/video/${video.key}` */}
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title={`원 배틀 애프터 어나더 트레일러`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
            {/* 트레일러가 없을 때 */}
            {/* <div className="flex items-center justify-center min-h-full">
              <p className="text-xl">트레일러 정보가 없습니다.</p>
            </div> */}
          </div>
        </div>
      </section>

      {/* Movie Info Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              원 배틀 애프터 어나더
            </h1>

            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-600 text-white text-sm font-bold">
                78%
              </span>
              <span className="text-muted-foreground">
                액션, 스릴러, 드라마 · 2h 15m
              </span>
            </div>

            <div className="space-y-4 text-foreground">
              <p>
                <span className="font-semibold">Director:</span>
                <span className="text-muted-foreground ml-1">
                  폴 토마스 앤더슨
                </span>
              </p>
              <p>
                <span className="font-semibold">Casting:</span>
                <span className="text-muted-foreground ml-1">
                  마동석 · 송중기 · 전지현 · 이정재
                </span>
              </p>
              <p>
                <span className="font-semibold">Production:</span>
                <span className="text-muted-foreground ml-1">
                  CJ엔터테인먼트 · 쇼박스
                </span>
              </p>
            </div>

            <p className="mt-6 text-muted-foreground leading-relaxed">
              과거를 뒤로 하고 망가진 삶을 살던 한 미지의 자신의 힘을 발견해
              15년 만에 조직 스티븐 J. 록조를 쫓는 추격 블록버스터
            </p>
          </div>

          <div className="md:w-64 shrink-0">
            <div className="relative aspect-2/3 rounded-lg overflow-hidden bg-secondary">
              {/* 포스터 이미지 없을 때 */}
              {/* /placeholder.svg */}
              <Image
                src="https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg"
                alt="원 배틀 애프터 어나더"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Related Movies Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-muted">
        <MovieSection />
      </section>

      {/* Back Link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
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
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
