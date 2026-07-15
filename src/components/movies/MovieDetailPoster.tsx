"use client";

import Image from "next/image";
import { useState } from "react";

export default function MovieDetailPoster({ img }: { img: string }) {
  const [imgSrc, setImgSrc] = useState(img);

  return (
    <>
      {/* 포스터 이미지 없을 때 */}
      {/* /placeholder.svg */}
      <Image
        src={imgSrc || "/placeholder.svg"}
        alt="포스터 이미지"
        fill
        className="object-cover"
        onError={() => setImgSrc("/placeholder.svg")}
      />
    </>
  );
}
