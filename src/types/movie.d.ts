/**
 * TMDB 영화 상세 정보 응답 타입
 * - /movie/{movie_id} API로 받아오는 영화의 전체 정보 구조
 */
interface Movie {
  adult: boolean; // 성인 영화 여부
  backdrop_path: string | null; // 배경 이미지 경로 (없으면 null)
  belongs_to_collection: MovieCollection | null; // 소속 컬렉션 정보 (시리즈처럼 묶인 경우 / 없으면 null)
  budget: number; // 제작비 (USD)
  genres: Genre[]; // 장르 목록 (예: 미스터리, 스릴러)
  homepage: string; // 공식 홈페이지(URL, 없으면 빈 문자열)
  id: number; // TMDB 영화 고유 ID
  imdb_id: string | null; // IMDb ID (없으면 null)
  origin_country: string[]; // 제작 국가 코드 배열 (ISO 3166-1)
  original_language: string; // 원본 언어 코드 (ISO 639-1)
  original_title: string; // 원래 제목 (원어)
  overview: string; // 영화 줄거리/설명
  popularity: number; // 인기 지표 값
  poster_path: string | null; // 포스터 이미지 경로 (없으면 null)
  production_companies: ProductionCompany[]; // 제작사 정보 배열
  production_countries: ProductionCountry[]; // 제작 국가 상세 정보 배열
  release_date: string; // 개봉 날짜 (YYYY-MM-DD 포맷)
  revenue: number; // 영화 수익 (USD)
  runtime: number | null; // 러닝타임(분, 없으면 null)
  spoken_languages: SpokenLanguage[]; // 사용 언어 정보 배열
  status: string; // 영화 상태 (예: Released, Post Production)
  tagline: string | null; // 영화 태그라인(홍보 문구, 없으면 null)
  title: string; // 지역 반영된 제목(로컬 제목)
  video: boolean; // 관련 비디오 존재 여부
  vote_average: number; // 평점 평균
  vote_count: number; // 평점 투표 수
}

/**
 * 영화가 속한 컬렉션 정보
 */
interface MovieCollection {
  id: number; // 컬렉션 고유 ID
  name: string; // 컬렉션 이름
  poster_path: string | null; // 컬렉션 대표 포스터 이미지 경로
  backdrop_path: string | null; // 컬렉션 백드롭 이미지 경로
}

/**
 * 영화 장르 정보
 */
interface Genre {
  id: number; // 장르 ID
  name: string; // 장르 이름
}

/**
 * 제작사 정보
 */
interface ProductionCompany {
  id: number; // 제작사 고유 ID
  logo_path: string | null; // 제작사 로고 이미지 경로 (없으면 null)
  name: string; // 제작사 이름
  origin_country: string; // 제작사 국가 코드
}

/**
 * 제작 국가 정보
 */
interface ProductionCountry {
  iso_3166_1: string; // 국가 코드 (ISO 3166-1)
  name: string; // 국가 이름
}

/**
 * 사용 언어 정보
 */
interface SpokenLanguage {
  english_name: string; // 영어 이름
  iso_639_1: string; // 언어 코드 (ISO 639-1)
  name: string; // 해당 언어 이름
}

/**
 *
 */
interface TMDBListResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

/**
 * TMDB 영상 객체
 * - /movie/{movie_id}/videos API에서 반환되는 개별 비디오 정보
 */
interface TMDBVideo {
  iso_639_1: string; // 영상 언어 코드 (ISO 639-1)
  iso_3166_1: string; // 영상 국가/지역 코드 (ISO 3166-1)
  name: string; // 영상 제목
  key: string; // YouTube 등 플랫폼에서 사용하는 영상 ID
  site: string; // 비디오 플랫폼 이름 ("YouTube", "Vimeo" 등)
  size: number; // 영상 해상도/품질 (ex: 1080)
  type: string; // 영상 타입 ("Trailer", "Teaser", etc.)
  official: boolean; // 공식 영상 여부
  published_at: string; // 공개된 날짜/시간 ISO 문자열
  id: string; // 이 영상 객체의 고유 ID
}

/**
 * TMDB 비디오 API 전체 응답 타입
 */
interface TMDBVideoResponse {
  id: number; // 이 비디오들이 속한 영화의 TMDB ID
  results: TMDBVideo[]; // 비디오(영상) 배열
}

/**
 * 영화 출연진(캐스트) 정보
 * - /movie/{movie_id}/credits API에 포함되는 캐스트 정보
 */
interface CastMember {
  adult: boolean; // 성인 배우 여부
  gender: number; // 성별 코드 (0/1/2 등 TMDB 기준)
  id: number; // 배우/출연자 고유 ID
  known_for_department: string; // 주요 활동 부문 ("Acting" 등)
  name: string; // 배우 이름
  original_name: string; // 원래 배우 이름
  popularity: number; // 인기 수치
  profile_path: string | null; // 프로필 이미지 경로 (없으면 null)
  cast_id: number; // 캐스트 내부 ID
  character: string; // 캐릭터 이름
  credit_id: string; // 이 캐스트 크레딧 고유 ID
  order: number; // 정렬/순서 정보
}

/**
 * 영화 제작진(크루) 정보
 * - /movie/{movie_id}/credits API에 포함되는 크루 정보
 */
interface CrewMember {
  adult: boolean; // 성인 여부
  gender: number; // 성별 코드
  id: number; // 크루 고유 ID
  known_for_department: string; // 담당 부문 ("Directing", "Writing" 등)
  name: string; // 이름
  original_name: string; // 원래 이름
  popularity: number; // 인기 수치
  profile_path: string | null; // 프로필 이미지 경로
  credit_id: string; // 크레딧 고유 ID
  department: string; // 부서명
  job: string; // 업무/직책
}

/**
 * 영화 출연/제작진 전체 크레딧 타입
 * - /movie/{movie_id}/credits API 결과
 */
interface MovieCredits {
  id: number; // 이 크레딧이 속한 영화 ID
  cast: CastMember[]; // 출연진 목록
  crew: CrewMember[]; // 제작진 목록
}
