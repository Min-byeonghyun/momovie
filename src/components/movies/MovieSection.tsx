"use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";
import MovieCard from "./MovieCard";
import { useState } from "react";

interface MovieSectionProps {
  title: string;
  subTitle: string;
  movies: Movie[];
  moreUrl: string;
}
export default function MovieSection({
  title,
  subTitle,
  movies,
  moreUrl,
}: MovieSectionProps) {
  const [ready, setReady] = useState(false);
  return (
    <section className="py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {subTitle}
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {title}
          </h2>
        </div>
        <Link
          href={moreUrl}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          더보기
        </Link>
      </div>
      <Swiper
        modules={[Navigation, FreeMode]}
        spaceBetween={16}
        slidesPerView={2}
        navigation
        freeMode
        onInit={() => setReady(true)}
        breakpoints={{
          640: {
            slidesPerView: 3,
            spaceBetween: 16,
          },
          768: {
            slidesPerView: 4,
            spaceBetween: 16,
          },
          1024: {
            slidesPerView: 5,
            spaceBetween: 20,
          },
        }}
        className={`movie-swiper transition-opacity duration-200 ${ready ? "opacity-100" : "opacity-0"}`}
      >
        {movies.map((movie) => (
          <SwiperSlide key={movie.id}>
            <MovieCard movie={movie} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
