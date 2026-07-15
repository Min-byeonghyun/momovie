const API_URL = process.env.NEXT_PUBLIC_API_URL;
const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_KEY}`,
  },
};

// 영화 정보 불러오기
export async function getMoviesData(category: string, page = "1") {
  try {
    const res = await fetch(
      `${API_URL}/movie/${category}?language=ko-KR&page=${page}`,
      {
        ...options,
      },
    );

    if (!res.ok) {
      throw new Error(
        `TMDB API 요청 실패 (상태 코드 :${res.status} ${res.statusText}) - ${category} 조회`,
      );
    }

    return await res.json();
  } catch (e) {
    console.error(e);
    throw new Error("영화 정보를 불러오지 못했습니다.");
  }
}

export async function getMovieDetailData(id: string): Promise<Movie> {
  try {
    const res = await fetch(`${API_URL}/movie/${id}?language=ko-KR`, {
      ...options,
    });

    if (!res.ok) {
      throw new Error(
        `TMDB API 요청 실패 (상태 코드 :${res.status} ${res.statusText}) - ${id} 조회`,
      );
    }

    return await res.json();
  } catch (e) {
    console.error(e);
    throw new Error("영화 상세 정보를 불러오지 못했습니다.");
  }
}
