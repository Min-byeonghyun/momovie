"use client";

import Image from "next/image";
import Link from "next/link";

export default function MovieCard() {
  return (
    <div className="group relative overflow-hidden">
      <Link href={`/movie/1`} className="block">
        <div className="relative aspect-2/3 rounded-lg overflow-hidden bg-secondary">
          {/* 이미지가 없는 경우 */}
          {/* /placeholder.svg */}
          <Image
            src="https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg"
            alt="원 배틀 애프터 어나더"
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </Link>
      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
        <p className="text-white text-sm font-medium line-clamp-2">
          원 배틀 애프터 어나더
        </p>
      </div>
      <Link
        href={`/movie/1`}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm text-foreground p-2 rounded-full hover:bg-background"
        title="상세정보"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </Link>
    </div>
  );
}
