"use client";

import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative h-[70vh] min-h-125 max-h-175 w-full overflow-hidden">
      <div className="absolute inset-0">
        {/* 이미지 없을 때 */}
        {/* /placeholder.svg */}
        <Image
          src="https://image.tmdb.org/t/p/original/zOpe0eHsq0A2NvNyBbtT6sj53qV.jpg"
          alt="원 배틀 애프터 어나더"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-xl">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-red-500 bg-red-500/10 rounded mb-4">
            NEW RELEASE
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 text-balance">
            원 배틀 애프터 어나더
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mb-6 line-clamp-3">
            과거를 뒤로 하고 망가진 삶을 살던 한 미지의 자신의 힘을 발견해 15년
            만에 조직 스티븐 J. 록조를 쫓는 추격 블록버스터
          </p>
          <Link
            href={`/movie/1`}
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors"
          >
            자세히보기
          </Link>
        </div>
      </div>
    </section>
  );
}
