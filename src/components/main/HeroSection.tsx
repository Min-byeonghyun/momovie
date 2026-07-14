"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function HeroSection({ movie }: { movie: Movie }) {
  const [imgSrc, setImgSrc] = useState(
    `https://image.tmdb.org/t/p/original/${movie.poster_path}`,
  );
  return (
    <section className="relative h-[70vh] min-h-125 max-h-175 w-full overflow-hidden">
      <div className="absolute inset-0">
        {/* 이미지 없을 때 */}
        {/* /placeholder.svg */}
        <Image
          src={imgSrc || "/placeholder.svg"}
          alt={movie.title}
          fill
          className="object-cover"
          priority
          onError={() => setImgSrc("/placeholder.svg")}
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
            {movie.title}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mb-6 line-clamp-3">
            {movie.overview}
          </p>
          <Link
            href={`/movie/${movie.id}`}
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors"
          >
            자세히보기
          </Link>
        </div>
      </div>
    </section>
  );
}
