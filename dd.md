# 인증 코드 완전 입문 가이드

> 대상: React와 Next.js를 막 배우기 시작한 개발자  
> 목표: 이 문서를 읽고 로그인 유지 흐름을 설명하고, 보호 페이지를 추가하고,
> 인증 문제가 생겼을 때 어느 파일부터 확인해야 하는지 판단할 수 있게 되는 것

---

## 0. 먼저 결론: 평소에 내가 해야 하는 일

대부분의 페이지와 컴포넌트에서는 토큰을 직접 다루지 않는다.

### 로그인한 사용자만 들어갈 수 있는 페이지

페이지 맨 위에서 `requireProfile()`을 호출한다.

```tsx
// src/app/(main)/mypage/example/page.tsx
import { requireProfile } from "@/features/user/api/requireProfile.server";

export default async function ExamplePage() {
  const { profile } = await requireProfile("/mypage/example");

  return <div>{profile.userName}님의 페이지</div>;
}
```

이 한 줄이 다음 일을 대신한다.

1. 로그인 쿠키가 있는지 확인
2. Access Token이 아직 유효한지 확인
3. 필요하면 토큰 재발급 페이지로 이동
4. 백엔드에 `/users/me`를 호출해 실제 로그인 상태 확인
5. 로그인하지 않았다면 `/login`으로 이동
6. 로그인했다면 사용자 정보 반환

페이지에서 쿠키를 직접 검사하거나 refresh API를 직접 호출하지 않는다.

### Client Component에서 로그인 필수 API 호출

공용 `request()`에 `auth: true`를 전달한다.

```ts
return request("/users/basket", {
  method: "POST",
  body: payload,
  auth: true,
});
```

그러면 Access Token 만료로 401이 발생했을 때 `request()`가 refresh와 재시도를
처리한다. 버튼 컴포넌트에서는 refresh를 신경 쓰지 않는다.

---

## 1. 토큰이 무엇인가

로그인하면 백엔드가 브라우저에 쿠키 두 개를 준다.

| 쿠키            | 현재 문서상 수명 | 역할                                           |
| --------------- | ---------------: | ---------------------------------------------- |
| `access_token`  |         약 2시간 | 일반 API를 호출할 때 사용하는 출입증           |
| `refresh_token` |          약 14일 | Access Token을 재발급받을 때 사용하는 재발급권 |

둘 다 `httpOnly` 쿠키다.

`httpOnly`는 브라우저의 JavaScript에서 다음과 같이 읽을 수 없다는 뜻이다.

```ts
// access_token과 refresh_token은 여기서 보이지 않는다.
console.log(document.cookie);
```

프론트 코드가 토큰 문자열을 가져와 저장하거나 교체하는 구조가 아니다.

```text
프론트가 fetch(..., { credentials: "include" }) 실행
→ 브라우저가 요청에 쿠키를 자동 첨부
→ 백엔드가 Set-Cookie 응답
→ 브라우저가 새 쿠키를 자동 저장
```

따라서 이 프로젝트에서 “토큰을 갱신한다”는 말은 정확히는 다음 뜻이다.

> refresh API를 호출하고, 백엔드가 보낸 새 쿠키를 브라우저가 저장하게 한다.

---

## 2. 우리가 사용하는 RTR 방식

RTR은 `Refresh Token Rotation`의 약자다.

고정 Refresh Token 방식은 refresh할 때 Access Token만 새로 발급한다.

```text
R1으로 refresh → 새 Access 발급, R1은 계속 사용
```

RTR 방식은 refresh할 때 두 토큰을 모두 새로 발급한다.

```text
로그인                → Access A1 + Refresh R1
R1으로 첫 번째 refresh → Access A2 + Refresh R2
R2으로 두 번째 refresh → Access A3 + Refresh R3
```

한 번 사용한 `R1`은 폐기된다. 폐기된 `R1`이 다시 들어오면 백엔드는 토큰 탈취를
의심할 수 있다. 엄격한 백엔드는 해당 로그인 세션 전체를 무효화할 수도 있다.

RTR의 목적은 로그인 기간을 연장하는 것 자체가 아니라 **탈취된 Refresh Token의
재사용을 탐지하고 피해 시간을 줄이는 것**이다.

### 14일이 지나도 계속 로그인되는가?

이것은 프론트 코드가 아니라 백엔드 만료 정책에 달려 있다.

- 슬라이딩 만료: refresh할 때 만료일도 `현재 + 14일`로 연장
- 절대 만료: 토큰은 회전하지만 최초 로그인 후 14일이라는 마지막 날짜는 유지
- 혼합 방식: 미사용 14일이면 만료되고, 계속 사용해도 최대 90일이면 만료

현재 프론트 코드는 백엔드가 준 쿠키를 저장할 뿐이다. 정확한 만료 정책은 백엔드
설정과 구현을 확인해야 한다.

---

## 3. 전체 구조: 누가 누구를 호출하는가

인증과 관련된 중요한 진입점은 세 개다.

```text
┌──────────────────────────────────────────────────────────────┐
│ 1. 주소창 진입·새로고침                                     │
│                                                              │
│ 브라우저 → proxy() → 페이지                                 │
│                └─ Access 만료 시 → GET /api/auth/refresh    │
│                                       └─ 백엔드 refresh      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 2. 로그인 필수 Server Page 렌더                              │
│                                                              │
│ page.tsx → requireProfile() → getProfileServer()             │
│               ├─ 로그인 성공 → profile 반환                 │
│               ├─ 갱신 필요 → GET /api/auth/refresh          │
│               └─ 로그인 불가 → /login                       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 3. 화면이 뜬 뒤 Client Component의 API 호출                  │
│                                                              │
│ 버튼·훅 → request({ auth: true }) → 백엔드 API               │
│                         └─ 401 → refreshSession()             │
│                                    └─ 성공 후 원 요청 재시도 │
└──────────────────────────────────────────────────────────────┘
```

세 흐름은 서로 다른 문제를 해결한다.

| 진입점              | 담당 코드                  | 필요한 이유                           |
| ------------------- | -------------------------- | ------------------------------------- |
| 새로고침·첫 방문    | `proxy.ts`                 | 페이지를 그리기 전에 만료된 토큰 갱신 |
| 보호 페이지 렌더    | `requireProfile.server.ts` | 로그인 사용자인지 최종 확인           |
| 버튼·클라이언트 API | `client.ts`                | 화면 사용 도중 발생한 401 복구        |

---

## 4. 파일별로 아주 자세히 읽기

## 4-1. `src/lib/auth/token.ts`

인증에서 공통으로 사용하는 작은 도구들을 모은 파일이다.

### 쿠키 이름 상수

```ts
export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";
```

다른 파일에서 `"access_token"`을 직접 쓰지 않고 이 상수를 가져다 쓴다.
백엔드가 쿠키 이름을 변경하면 이 파일을 중심으로 수정할 수 있다.

### `decodeJwtExp(token)`

JWT 안의 `exp` 값을 읽는 내부 함수다. `exp`는 토큰 만료 시각이다.

이 함수는 JWT 서명을 검증하지 않는다. 프론트에는 백엔드의 비밀키가 없기 때문에
진짜 토큰인지 판정할 수 없다. 오직 “겉에 적힌 만료 시간이 지났는가?”를 빠르게
확인하는 용도다.

### `isAccessTokenFresh(token, skewSec)`

```ts
isAccessTokenFresh(access);
```

Access Token이 아직 충분히 유효하면 `true`, 없거나 만료됐으면 `false`를 반환한다.
기본적으로 만료 30초 전부터 만료된 것으로 취급한다.

왜 30초 일찍 처리할까?

```text
현재는 5초 남음 → 프론트 검사에서는 유효
네트워크 이동 중 5초 경과 → 백엔드에 도착했을 때 만료
```

이 경계 문제를 줄이기 위해 여유 시간을 둔다.

중요: 이 함수가 `true`라고 해서 진짜 로그인이라는 뜻은 아니다. 토큰 위조,
서버 강제 로그아웃 등은 백엔드만 판단할 수 있다.

### `safeInternalPath(next, origin)`

refresh가 끝난 후 돌아갈 주소가 우리 서비스 내부 주소인지 검사한다.

```text
/mypage                     → 허용
/mypage?tab=works           → 허용
https://attacker.example    → 차단
//attacker.example          → 차단
```

이 검사가 없으면 공격자가 refresh 주소를 이용해 사용자를 피싱 사이트로 보낼 수
있다. 이를 Open Redirect 공격이라고 한다.

---

## 4-2. `src/proxy.ts`

### 대표 함수

```ts
export default function proxy(request: NextRequest);
```

Next.js가 문서 요청을 페이지에 보내기 전에 자동으로 실행하는 함수다. 다른 파일이
`proxy()`를 직접 import해서 호출하지 않는다. 파일 이름과 위치를 보고 Next.js가
호출한다.

### 언제 실행되는가?

`config.matcher`에 해당하는 요청에서 실행된다. 코드 안에서는 그중에서도
`sec-fetch-dest === "document"`인 문서 요청만 처리한다.

문서 요청의 예:

- 주소창에 URL 입력
- 브라우저 새로고침
- 일반적인 첫 페이지 방문

이미지, API, Next.js 프리페치 등은 그대로 통과시킨다.

### 실제 판단 순서

```text
1. 문서 요청이 아니면 통과
2. 프리페치 요청이면 통과
3. /api, /login, /signup이면 통과
4. access가 만료됐고 refresh가 있으면 브릿지로 redirect
5. 나머지는 원래 페이지로 통과
```

여기서는 백엔드 refresh를 직접 호출하지 않는다.

```ts
url.pathname = "/api/auth/refresh";
return NextResponse.redirect(url);
```

프록시가 하는 일은 **판단과 리다이렉트까지**다. 실제 쿠키 갱신은 다음에 설명할
Route Handler가 담당한다.

---

## 4-3. `src/app/api/auth/refresh/route.ts`

### 대표 함수

```ts
export async function GET(request: NextRequest);
```

이 함수는 다음 URL에 GET 요청이 오면 Next.js가 자동으로 호출한다.

```text
GET /api/auth/refresh?next=/mypage
```

이 파일도 다른 코드가 `GET()` 함수를 직접 import하지 않는다. 폴더 경로와
`route.ts`라는 이름이 API 주소를 만든다.

### 이 파일을 “브릿지”라고 부르는 이유

브라우저와 백엔드 사이에서 쿠키를 전달해 주기 때문이다.

```text
브라우저
  → GET /api/auth/refresh
  → Route Handler
  → POST 백엔드 /auth/refresh
  ← 백엔드 Set-Cookie
  ← Route Handler가 Set-Cookie를 브라우저에 전달
  → 원래 페이지로 redirect
```

Server Component는 렌더 도중 응답 쿠키를 직접 설정할 수 없다. 그래서
Server Component는 이 주소로 사용자를 보내고, Route Handler가 응답에 새 쿠키를
담는다.

### 함수 내부 실행 순서

1. `next`가 안전한 내부 주소인지 검사한다.
2. Refresh Cookie가 없으면 `/login`으로 보낸다.
3. 요청의 쿠키를 그대로 백엔드 `/auth/refresh`에 전달한다.
4. 백엔드가 성공하면 받은 모든 `Set-Cookie`를 브라우저 응답에 복사한다.
5. 새 쿠키를 받은 브라우저를 원래 `next` 주소로 돌려보낸다.

### 실패 응답 처리

| 백엔드 결과                 | 프론트 처리                                         |
| --------------------------- | --------------------------------------------------- |
| 성공 + 새 쿠키              | 쿠키 전달 후 원래 페이지로 이동                     |
| 401                         | 세션이 무효라고 보고 쿠키 삭제 후 로그인 이동       |
| 5xx·429·네트워크 오류       | 일시 장애일 수 있으므로 쿠키를 보존하고 로그인 이동 |
| 성공인데 Access Cookie 없음 | 무한 redirect 방지를 위해 쿠키 보존 후 로그인 이동  |

현재 코드는 새 `access_token`이 왔는지는 검사하지만 새 `refresh_token`이 왔는지는
검사하지 않는다. 엄격 RTR 계약을 프론트에서도 검증하려면 두 쿠키가 모두 왔는지
확인하도록 보강할 수 있다.

---

## 4-4. `src/features/user/api/userApi.server.ts`

### 대표 함수

```ts
export async function getProfileServer(): Promise<UserMe | null>;
```

Server Component에서 백엔드 `GET /users/me`를 호출하는 함수다.

요청에 현재 브라우저 쿠키를 전달한다.

```ts
const cookie = (await headers()).get("cookie") ?? "";

fetch(`${SERVER_API_BASE}/users/me`, {
  headers: { cookie },
});
```

### 반환 규칙

| `/users/me` 결과 | 함수 결과 | 의미                        |
| ---------------- | --------- | --------------------------- |
| 200              | `UserMe`  | 로그인 사용자 확인 성공     |
| 401              | `null`    | 로그인 토큰이 유효하지 않음 |
| 403·404·5xx      | `throw`   | 서버 장애나 계약 문제       |

401만 `null`로 바꾸는 이유는 500 오류를 로그아웃으로 오해하지 않기 위해서다.

이 함수는 refresh하지 않는다. 오직 “현재 쿠키로 나는 누구인가?”를 백엔드에
물어보는 함수다. `null`을 받은 뒤 refresh할지 로그인으로 보낼지는 호출한 쪽,
즉 `requireProfile()`이 결정한다.

---

## 4-5. `src/features/user/api/requireProfile.server.ts`

### 대표 함수

```ts
export async function requireProfile(nextPath = "/mypage");
```

로그인 필수 페이지가 직접 호출하는 **라우트 가드의 메인 함수**다.

여기서 라우트 가드는 “로그인하지 않은 사용자가 보호 페이지 내용을 받지 못하게
막는 함수”라는 뜻이다.

### 매개변수 `nextPath`

refresh 성공 후 돌아올 현재 페이지 주소다.

```ts
await requireProfile("/mypage/coupon");
```

Access Token을 갱신하러 잠시 `/api/auth/refresh`로 이동하더라도 끝난 뒤
`/mypage/coupon`으로 돌아온다.

동적 URL이나 쿼리가 있으면 함께 넘긴다.

```ts
await requireProfile(`/mypage/likes?tab=${activeTab}`);
```

### 내부 실행 순서

```text
requireProfile()
│
├─ access도 없고 refresh도 없음
│    └─ /login
│
├─ access가 없거나 만료됨
│    ├─ refresh 있음 → /api/auth/refresh
│    └─ refresh 없음 → /login
│
└─ access가 유효해 보임
     └─ getProfileServer()로 백엔드 확인
          ├─ UserMe → 페이지에 profile 반환
          ├─ null(401) + refresh 있음 → /api/auth/refresh
          ├─ null(401) + refresh 없음 → /login
          └─ 다른 오류 → 오류를 그대로 위로 전달
```

왜 토큰 만료 시간도 보고 `/users/me`도 호출할까?

- 만료 시간 검사: 불필요한 백엔드 호출과 명백한 실패를 빠르게 피함
- `/users/me`: 강제 로그아웃, 위조 토큰 등 실제 인증 상태를 백엔드에서 확인

### 반환값

```ts
const { qc, profile } = await requireProfile(...);
```

- `profile`: 로그인한 사용자 정보
- `qc`: 서버의 TanStack QueryClient

`getProfileServer()` 결과가 이미 `qc`에 저장돼 있으므로 같은 렌더에서 프로필을
또 요청하지 않고 Hydration에 사용할 수 있다.

### 보호 페이지에서 사용하는 방법

#### 가장 단순한 형태

```tsx
import { requireProfile } from "@/features/user/api/requireProfile.server";

export default async function CouponPage() {
  const { profile } = await requireProfile("/mypage/coupon");

  return <div>{profile.userName}님의 쿠폰</div>;
}
```

#### QueryClient도 사용하는 형태

```tsx
import { requireProfile } from "@/features/user/api/requireProfile.server";
import { HydrateClient } from "@/lib/query/server";

export default async function CouponPage() {
  const { qc } = await requireProfile("/mypage/coupon");

  // 필요하면 qc.prefetchQuery(...)로 이 페이지 데이터도 미리 가져온다.

  return (
    <HydrateClient client={qc}>
      <CouponView />
    </HydrateClient>
  );
}
```

#### 사용하면 안 되는 곳

`requireProfile.server.ts`는 서버 전용이다. `"use client"`가 붙은 Client
Component에서 import하면 안 된다.

```tsx
"use client";

// 잘못된 사용
import { requireProfile } from "@/features/user/api/requireProfile.server";
```

Client Component 자체를 지키는 것이 아니라, 그 컴포넌트를 보여주는 `page.tsx`
Server Component에서 가드를 호출한다.

```text
page.tsx(Server) → requireProfile() → 통과 → Client Component 렌더
```

---

## 4-6. `src/lib/api/client.ts`

화면이 이미 렌더된 뒤 브라우저에서 API를 호출할 때 사용하는 공용 함수다.

### 메인 함수 `request<T>()`

```ts
export async function request<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T>;
```

각 feature API 함수가 이 함수를 호출한다.

```ts
export function getProfile(signal?: AbortSignal) {
  return request<UserMe>("/users/me", {
    auth: true,
    signal,
  });
}
```

그리고 React Query 훅이나 컴포넌트는 feature API 함수를 호출한다.

```text
컴포넌트
→ React Query 훅
→ feature의 API 함수
→ 공용 request()
→ 백엔드
```

### `auth: true`의 의미

```ts
request("/users/me", { auth: true });
```

“이 API는 로그인이 필요하므로 401이면 refresh를 한 번 시도해 달라”는 뜻이다.

`auth: true`가 없으면 401을 그대로 오류로 반환한다. 로그인 API나 공개 API에서
잘못된 비밀번호로 받은 401까지 refresh하면 안 되기 때문이다.

### 내부 함수 `doFetch()`

실제 API 요청을 만드는 함수다.

```ts
const doFetch = () => fetch(url, { ... });
```

처음 요청할 때 한 번 실행되고, refresh 성공 후 동일 요청을 재시도할 때 한 번 더
실행될 수 있다.

### 내부 함수 `refreshSession()`

```ts
function refreshSession(): Promise<boolean>;
```

브라우저에서 백엔드 refresh API를 호출한다.

```text
POST /v1/auth/refresh
```

`true`는 HTTP 성공, `false`는 실패를 뜻한다.

### `refreshing` 변수와 single-flight

```ts
let refreshing: Promise<boolean> | null = null;
```

동시에 API 세 개가 401을 받았다고 생각해 보자.

```text
API A → 401 ┐
API B → 401 ├─ refresh는 하나만 실행
API C → 401 ┘
```

첫 번째 요청이 만든 Promise를 나머지 요청이 같이 기다린다. 이를 single-flight라고
부른다. RTR에서는 같은 Refresh Token을 동시에 여러 번 사용하는 일을 줄이므로
특히 중요하다.

### `request()`의 전체 실행 순서

```text
1. doFetch()로 원 요청
2. 응답이 401인가?
3. auth: true인가?
4. 둘 다 맞으면 refreshSession()
5. refresh 성공이면 doFetch()로 원 요청 딱 한 번 재시도
6. 그래도 실패하면 ApiError
7. 성공이면 JSON 데이터 반환
```

재시도에도 401이 발생하면 다시 refresh하지 않는다. 그래서 무한 반복되지 않는다.

현재 구현은 refresh 실패 시 자동으로 `/login`으로 이동하지 않는다. 최종 401을
`ApiError`로 던진다. 따라서 기존 문서의 “실패하면 그때 로그인으로”라는 설명은
실제 코드와 달랐다.

---

## 5. 실제 상황별로 처음부터 따라가기

## 상황 A: 로그인 직후 마이페이지 방문

```text
1. 브라우저가 /mypage 요청
2. proxy(): Access Token이 신선함 → 통과
3. page.tsx가 requireProfile("/mypage") 호출
4. requireProfile(): Access Token이 신선함
5. getProfileServer(): GET /users/me
6. 백엔드 200 + 사용자 정보
7. page.tsx가 화면 렌더
```

refresh는 호출되지 않는다.

## 상황 B: Access Token이 만료된 뒤 새로고침

```text
1. 브라우저가 현재 페이지 문서 요청
2. proxy(): access 만료 + refresh 있음 발견
3. /api/auth/refresh?next=현재주소 로 redirect
4. Route Handler가 백엔드 POST /auth/refresh
5. 백엔드가 새 Access + 새 Refresh를 Set-Cookie로 응답
6. Route Handler가 Set-Cookie를 브라우저에 전달
7. 브라우저가 새 쿠키 저장
8. 원래 페이지로 redirect
9. 새 Access로 정상 렌더
```

## 상황 C: 화면 사용 중 버튼을 눌렀는데 Access Token 만료

```text
1. Client Component에서 API 호출
2. request()가 백엔드 요청
3. 백엔드 401
4. auth: true이므로 refreshSession()
5. 브라우저가 새 쿠키 저장
6. request()가 처음 API를 한 번 재시도
7. 성공 데이터를 컴포넌트에 반환
```

사용자는 중간 refresh를 보지 못한다.

## 상황 D: Refresh Token도 만료됨

문서 요청 경로:

```text
브릿지가 refresh 시도
→ 백엔드 401
→ 브릿지가 쿠키 삭제
→ /login
```

클라이언트 API 경로:

```text
원 API 401
→ refresh 실패
→ 최초 요청의 401을 ApiError로 반환
```

현재 클라이언트 경로는 자동 로그인 이동이 구현돼 있지 않다.

## 상황 E: 백엔드가 500 오류

`getProfileServer()`는 오류를 throw한다. 500을 비로그인으로 간주해 refresh하거나
사용자의 쿠키를 지우지 않는다. 서버 장애 때문에 정상 세션까지 없애지 않기 위한
처리다.

---

## 6. Server Component와 Client Component가 헷갈릴 때

### Server Component

- 서버에서 렌더
- `cookies()`, `headers()` 사용 가능
- 브라우저의 `window`, `localStorage` 사용 불가
- 렌더 도중 쿠키를 새로 설정할 수 없음
- `requireProfile()`과 `getProfileServer()` 사용 가능

### Client Component

- 파일 위에 `"use client"`가 있음
- 클릭 이벤트와 React 훅 사용 가능
- httpOnly 토큰을 읽을 수 없음
- feature API와 React Query 훅 사용
- 401 처리는 `client.ts`의 `request()`에 맡김

### 역할 분리 예시

```tsx
// page.tsx — Server Component
import { requireProfile } from "@/features/user/api/requireProfile.server";
import { SettingsView } from "@/features/user";

export default async function SettingsPage() {
  await requireProfile("/mypage/settings");
  return <SettingsView />;
}
```

```tsx
// SettingsView.tsx — Client Component
"use client";

export function SettingsView() {
  // 버튼 클릭, mutation 훅 등 화면 상호작용 담당
  return <button>저장</button>;
}
```

페이지 입장 가능 여부는 Server Page가 결정하고, 화면이 뜬 뒤 API의 401 복구는
공용 client가 처리한다.

---

## 7. 새 기능을 만들 때 복사해서 쓰는 패턴

### 로그인 필수 페이지 추가

```tsx
import { requireProfile } from "@/features/user/api/requireProfile.server";

export default async function NewPrivatePage() {
  const { profile } = await requireProfile("/정확한-현재-주소");

  return <div>{profile.userName}</div>;
}
```

체크할 것:

- `page.tsx`는 Server Component인가?
- `nextPath`에 이 페이지의 실제 URL을 넣었는가?
- 쿼리스트링을 유지해야 한다면 함께 넣었는가?

### 로그인 필수 API 함수 추가

```ts
import { request } from "@/lib/api/client";

export function updateSomething(payload: UpdatePayload) {
  return request<UpdateResult>("/users/something", {
    method: "PATCH",
    body: payload,
    auth: true,
  });
}
```

체크할 것:

- 정말 로그인 필수 API인가?
- 그렇다면 `auth: true`를 넣었는가?
- 컴포넌트에서 직접 `fetch()`하지 않고 feature API 함수로 분리했는가?

### 로그인하지 않아도 되는 페이지에서 프로필 표시

서버에서는 `getProfileServer()`를 사용할 수 있다.

```ts
const profile = await getProfileServer();

if (profile) {
  // 로그인 사용자 UI
} else {
  // 비로그인 UI
}
```

단, 403·404·5xx는 `null`이 아니라 throw된다는 점을 기억한다.

---

## 8. 절대로 하지 말아야 할 것

### 컴포넌트마다 refresh 직접 호출

```ts
// 금지
if (response.status === 401) {
  await fetch("/v1/auth/refresh", { method: "POST" });
}
```

동시에 같은 Refresh Token을 여러 번 사용해 RTR 재사용 탐지에 걸릴 수 있다.
Client API는 공용 `request({ auth: true })`를 사용한다.

### httpOnly 토큰을 localStorage에 복사

XSS 공격에 토큰이 노출될 수 있고 현재 쿠키 인증 구조와 충돌한다.

### 500을 로그아웃으로 처리

백엔드 장애와 세션 만료는 다르다. 인증 실패로 확정된 응답만 로그아웃 근거로
사용해야 한다.

### 쿠키 이름을 여러 파일에 문자열로 작성

`ACCESS_TOKEN_COOKIE`, `REFRESH_TOKEN_COOKIE` 상수를 사용한다.

### Client Component에서 서버 전용 파일 import

`*.server.ts`는 Server Component와 서버 코드에서만 사용한다.

---

## 9. 현재 구현의 RTR 한계

현재 `client.ts`의 single-flight는 **한 브라우저 탭 안에서, 공용 `request()`로
동시에 발생한 401들**만 하나로 묶는다.

하지만 refresh 경로는 두 개다.

```text
클라이언트 401 → POST /v1/auth/refresh
문서/RSC 갱신 → GET /api/auth/refresh → 백엔드 POST /auth/refresh
```

두 경로는 같은 JavaScript Promise를 공유하지 않는다. 탭끼리도 변수를 공유하지
않는다. 따라서 다음 상황은 경합할 수 있다.

- 한 탭에서 API refresh 중 새로고침
- 여러 탭에서 동시에 401
- 여러 탭을 동시에 새로고침
- 한 탭의 문서 refresh와 다른 탭의 API refresh가 겹침

```text
요청 A: refresh(R1) → 성공, R2 발급
요청 B: refresh(R1) → 이미 사용된 R1 재사용
```

백엔드가 이전 토큰 재사용 시 세션 전체를 폐기하는 엄격 RTR라면 사용자가 갑자기
로그아웃될 수 있다.

프론트의 탭 간 잠금만으로 어느 정도 줄일 수는 있지만, 잠금을 잡은 탭이 종료되는
문제 등 완전한 해결이 어렵다. 가장 확실한 해결은 백엔드가 아주 짧은 동시 요청
구간에서 최초 회전 결과를 재사용하거나 적절한 유예 정책을 제공하는 것이다.

또한 Route Handler는 성공 응답에 새 Access Cookie만 확인한다. 백엔드와 계약이
“RTR이므로 성공할 때 Access와 Refresh를 항상 모두 발급”이라면 두 쿠키를 모두
검사하도록 보강하는 것이 좋다.

---

## 10. 문제 발생 시 어디부터 볼 것인가

### “새로고침하면 로그인 버튼으로 바뀐다”

확인 순서:

1. 브라우저 쿠키에 `refresh_token`이 있는가?
2. `proxy.ts`가 문서 요청을 감지했는가?
3. `/api/auth/refresh?next=...` 요청이 발생했는가?
4. 백엔드 refresh 응답에 `Set-Cookie`가 있는가?
5. 새 쿠키의 Domain, Path, SameSite, Secure 설정이 맞는가?

### “버튼을 누르면 401이 그대로 난다”

1. 해당 feature API가 공용 `request()`를 사용하는가?
2. 옵션에 `auth: true`가 있는가?
3. `/v1/auth/refresh` 요청이 발생했는가?
4. refresh는 성공했는가?
5. 재시도된 원 API도 401인가?

### “보호 페이지에 비로그인 사용자가 들어간다”

1. 해당 `page.tsx`가 `requireProfile()`을 호출하는가?
2. 호출 결과를 기다리도록 `await`했는가?
3. Client Component가 아니라 Server Page에서 호출했는가?

### “가끔 멀티탭 사용 중 로그아웃된다”

Network 탭과 백엔드 로그에서 같은 시각에 refresh가 두 번 호출됐는지 확인한다.
엄격 RTR의 동시 refresh 경합일 가능성이 있다.

### “백엔드 장애 때 쿠키가 사라진다”

refresh 실패 상태 코드가 정말 401인지 확인한다. 현재 브릿지는 401에서만 쿠키를
삭제한다. 백엔드가 일시 장애도 401로 반환한다면 백엔드 응답 계약을 고쳐야 한다.

---

## 11. 수정 목적별 담당 파일

| 수정하고 싶은 것                        | 먼저 볼 파일                                     |
| --------------------------------------- | ------------------------------------------------ |
| 쿠키 이름 변경                          | `src/lib/auth/token.ts`                          |
| Access 만료 임박 기준 30초 변경         | `src/lib/auth/token.ts`                          |
| 새로고침 전 선제 갱신 조건 변경         | `src/proxy.ts`                                   |
| 브릿지 실패·쿠키 전달 정책 변경         | `src/app/api/auth/refresh/route.ts`              |
| `/users/me` 서버 응답 처리 변경         | `src/features/user/api/userApi.server.ts`        |
| 보호 페이지 입장 정책 변경              | `src/features/user/api/requireProfile.server.ts` |
| 클라이언트 401·refresh·재시도 정책 변경 | `src/lib/api/client.ts`                          |
| 로그인 폼과 로그인 API                  | `src/features/auth`                              |
| 로그인 화면 라우트                      | `src/app/(auth)`                                 |

변경할 때는 한 파일만 보고 끝내지 말고 세 진입 경로를 같이 생각한다.

```text
문서 요청(proxy)
보호 페이지(requireProfile)
클라이언트 API(request)
```

예를 들어 refresh URL이나 쿠키 정책을 바꾸면 세 경로가 모두 같은 백엔드 계약을
따르는지 확인해야 한다.

---

## 12. 마지막 암기용 요약

```text
token.ts
→ 쿠키 이름, Access 만료 판정, 안전한 복귀 주소

proxy.ts
→ 새로고침·첫 방문 전에 Access 만료를 발견하고 브릿지로 보냄

app/api/auth/refresh/route.ts
→ 백엔드 refresh 호출, Set-Cookie 전달, 원래 페이지로 복귀

getProfileServer()
→ 현재 쿠키로 /users/me를 호출해 진짜 로그인 상태 확인

requireProfile()
→ 보호 페이지의 메인 가드. 갱신·로그인 이동·profile 반환 결정

client.ts의 request()
→ 화면 사용 중 API 호출 담당

client.ts의 refreshSession()
→ auth:true 요청이 401일 때 refresh

client.ts의 refreshing
→ 같은 탭에서 발생한 동시 refresh를 하나로 합침
```

가장 중요한 규칙 두 개만 기억한다면 다음과 같다.

1. 보호 `page.tsx`에서는 `await requireProfile("현재 URL")`
2. 로그인 필수 Client API에서는 공용 `request(..., { auth: true })`

나머지 토큰 전달과 갱신은 공용 인증 코드에 맡긴다.
