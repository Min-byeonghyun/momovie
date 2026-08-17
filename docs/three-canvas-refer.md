# Canvas + Three.js 상품 편집기 — 완전 초보자용 강의

이 문서는 Canvas도, Three.js도 처음 보는 개발자를 위한 문서다.

목표는 용어를 외우는 것이 아니다. 이 프로젝트에서 그림 한 장이 어디서 와서, 어느 함수들을 지나고, 어떤 값으로 저장되고, 결국 상품 미리보기와 구매 데이터가 되는지를 스스로 추적할 수 있게 되는 것이다.

처음 읽을 때는 코드를 전부 이해하려고 하지 말자. 우선 아래 한 줄만 기억하면 된다.

```text
백엔드에서 이미지 주소 받기
→ Canvas에서 사용자가 그림 배치하기
→ 배치 결과를 투명 PNG 한 장으로 만들기
→ Three.js가 그 PNG를 상품 사진에 붙이기
→ 완성된 파일들을 업로드하기
→ 파일 key를 장바구니 또는 바로구매에 보내기
```

문서가 길어 보여도 한 번에 전부 읽을 필요는 없다.

```text
첫날: 0~6장   → Canvas와 Three.js가 각각 무슨 일을 하는지만 이해
둘째 날: 7~13장 → 실제 API부터 Canvas 편집까지 디버거로 따라가기
셋째 날: 14~15장 → Three.js 입력 다섯 개와 placement 이해
넷째 날: 16~20장 → 적용·저장·장바구니·바로구매 이해
개발할 때: 22~25장 → 필요한 파일과 문제 진단표만 찾아보기
```

읽다가 막히면 바로 다음 장으로 넘어가지 말고, 각 장 마지막의 화살표를 실제 코드에서 한 번 찾은 뒤 진행하자.

---

## 0. 30초짜리 전체 설명

이 기능이 완성 상품 사진을 만드는 재료는 다음 네 가지다.

| 재료           | 아주 쉬운 뜻                                               | 실제 값의 출처                             |
| -------------- | ---------------------------------------------------------- | ------------------------------------------ |
| 무지 상품 사진 | 아무 그림도 인쇄되지 않은 컵·티셔츠 사진                   | `GET /goods/:goodsSn/mockup`의 `imagePath` |
| 내 디자인      | AI 그림, 편집 그림, 내 파일 등                             | 소스별 API의 이미지 URL                    |
| 배치 설명서    | 상품 사진의 어디에 어떤 모양으로 디자인을 붙일지 적은 숫자 | 목업 API의 `placement`                     |
| 효과 필름      | 주름, 빛, 그림자를 마지막에 덮는 이미지                    | 목업 API의 `overlay`                       |

결과는 이런 식으로 만들어진다.

```text
무지 상품 사진
  + Canvas가 만든 투명 디자인 PNG
  + placement라는 붙이는 설명서
  + 필요하면 제외 영역과 overlay
  = 디자인이 붙은 완성 상품 사진
```

여기서 역할을 확실하게 나누자.

- Canvas는 사용자가 디자인을 움직이고, 돌리고, 크기를 바꾸는 편집기다.
- Three.js는 편집이 끝난 디자인 한 장을 상품 사진의 정해진 위치에 합성한다.
- 백엔드는 그림의 위치를 실시간으로 움직여 주지 않는다. 필요한 URL과 배치 숫자를 내려줄 뿐이다.
- Three.js는 Canvas 안의 각 레이어를 모른다. Canvas가 구운 투명 PNG 한 장만 받는다.

이 네 문장을 이해했다면 이미 절반은 이해한 것이다.

---

## 1. 먼저 헷갈리는 단어부터 없애기

### 1-1. 이 문서에서 말하는 “부트스트랩”은 Bootstrap 라이브러리가 아니다

프로젝트 주석에 나오는 `부트스트랩(bootstrap)`은 CSS 라이브러리인 Bootstrap을 뜻하지 않는다.

여기서는 단순히 다음 뜻이다.

> 화면을 처음 사용할 수 있게 필요한 데이터를 받고 초기 상태를 만드는 시작 작업

이 편집기의 부트스트랩은 다음 일이다.

```text
상품 목업 받기
→ 출력 크기 받기
→ 저장했던 편집 상태 받기
→ Canvas 크기 계산하기
→ CanvasManager 만들기
→ 저장본을 복원하거나 첫 이미지를 넣기
```

그러므로 코드에서 “부트스트랩”을 보면 “초기 준비”라고 읽으면 된다.

### 1-2. 픽셀, 이미지 URL, 이미지 객체, PNG는 서로 다르다

초보자일 때 가장 많이 섞이는 부분이다.

| 이름               | 예                          | 의미                                                        |
| ------------------ | --------------------------- | ----------------------------------------------------------- |
| 이미지 URL         | `https://.../cat.png`       | 이미지 파일이 있는 주소 문자열                              |
| `HTMLImageElement` | `new Image()`로 만든 객체   | 브라우저가 URL의 실제 픽셀을 내려받아 들고 있는 이미지 객체 |
| Canvas             | `<canvas>`                  | 픽셀을 직접 그릴 수 있는 빈 그림판                          |
| data URL           | `data:image/png;base64,...` | Canvas 결과 PNG를 긴 문자열로 표현한 것                     |
| Blob/File          | `Blob`, `File` 객체         | 업로드할 수 있는 파일 형태                                  |
| storage key        | `basket/.../abc.webp`       | 업로드된 파일을 서버가 식별하는 값                          |

데이터는 보통 이렇게 변한다.

```text
API의 URL 문자열
→ HTMLImageElement로 로드
→ Canvas에 drawImage
→ Canvas 결과를 PNG data URL로 변환
→ File로 변환
→ 스토리지에 업로드
→ storage key만 상태와 주문에 저장
```

URL과 이미지 자체는 같은 것이 아니다. URL은 주소이고, `HTMLImageElement`는 그 주소에서 픽셀 다운로드까지 끝낸 브라우저 객체다.

---

## 2. Canvas가 무엇인가

### 2-1. Canvas는 브라우저가 주는 빈 그림판이다

보통 이미지는 다음처럼 보여 준다.

```tsx
<img src="https://example.com/cat.png" />
```

`<img>`는 한 장을 보여 주기는 쉽지만, 여러 장을 원하는 위치에 합쳐 새 파일로 만들기는 불편하다.

Canvas는 다음처럼 생긴 빈 그림판이다.

```html
<canvas width="700" height="700"></canvas>
```

그림을 그리려면 2D 그리기 도구를 가져온다.

```ts
const ctx = canvas.getContext("2d");
ctx.drawImage(image, 100, 50, 300, 200);
```

이 코드는 “`image`를 x=100, y=50 위치에 너비 300, 높이 200으로 그려라”라는 뜻이다.

이 프로젝트는 Fabric.js나 Konva 같은 Canvas 편집 라이브러리를 사용하지 않는다. 브라우저 기본 Canvas 2D API를 직접 사용한다.

### 2-2. Canvas 좌표는 왼쪽 위에서 시작한다

```text
(0,0) ───────────────→ x가 커진다
  │
  │       그림
  │     (x, y)
  │
  ↓
y가 커진다
```

- `x`가 커지면 오른쪽으로 간다.
- `y`가 커지면 아래쪽으로 간다.
- `width`는 가로 길이다.
- `height`는 세로 길이다.
- 이 프로젝트의 레이어 `x`, `y`는 회전하기 전 사각형의 왼쪽 위 좌표다.
- `rotation`은 도가 아니라 라디안이다.

예를 들어 다음 레이어는 왼쪽 위가 `(100, 50)`이고 크기가 `300 × 200`이다.

```ts
const layer = {
  x: 100,
  y: 50,
  width: 300,
  height: 200,
  rotation: 0,
};
```

### 2-3. Canvas는 “그림 객체”를 기억하지 않는다

이것이 가장 중요한 성질이다.

`ctx.drawImage(...)`를 실행하면 Canvas에는 픽셀만 남는다. Canvas가 “여기에 고양이 레이어가 있다”라고 기억하는 것이 아니다.

따라서 이미지를 움직일 때는 기존 이미지를 집어서 옮기는 게 아니다.

```text
1. 코드가 레이어 x를 바꾼다.
2. Canvas 전체를 지운다.
3. 모든 레이어를 처음부터 다시 그린다.
```

현재 프로젝트의 실제 흐름도 같다.

```text
CanvasManager의 레이어 숫자 변경
→ manager.emit()
→ Zustand store의 items 갱신
→ EditorCanvas의 useEffect 재실행
→ clearRect로 전체 지우기
→ drawItems로 모든 레이어 다시 그리기
```

그래서 아래처럼 구분해야 한다.

- 레이어를 기억하는 곳: `CanvasManager`와 Zustand store
- 픽셀을 그리는 곳: `EditorCanvas`와 `drawItems`

### 2-4. `CanvasManager`는 Canvas 라이브러리도, 그림판도 아니다

이름 때문에 특히 헷갈린다.

[`CanvasManager.ts`](../src/features/goods-editor/canvas/CanvasManager.ts)는 이 프로젝트에서 직접 만든 숫자 관리 객체다. `<canvas>`를 만들지도 않고 `drawImage`를 호출하지도 않는다.

다음 같은 일을 한다.

- 레이어의 `x`, `y`, `width`, `height`, `rotation` 보관
- 어떤 레이어를 클릭했는지 검사
- 드래그, 리사이즈, 회전 계산
- 정렬과 스냅 계산
- undo/redo 기록
- 저장할 state 생성

실제로 그리는 코드는 [`EditorCanvas.tsx`](../src/features/goods-editor/components/EditorCanvas.tsx)와 [`drawItems.ts`](../src/features/goods-editor/canvas/drawItems.ts)에 있다.

---

## 3. Three.js가 무엇인가

### 3-1. 이 프로젝트에서는 “3D 상품 모델”을 돌리는 것이 아니다

Three.js는 3D 장면을 만드는 라이브러리다. 하지만 이 프로젝트는 컵이나 티셔츠의 실제 3D 모델 파일을 불러와 계속 회전시키는 구조가 아니다.

현재 코드는 다음 일을 한다.

```text
무지 상품 사진 한 장을 뒤에 놓는다.
→ Canvas가 만든 디자인 PNG를 앞에 놓는다.
→ placement 숫자대로 디자인 판을 이동·회전·왜곡한다.
→ 그림자나 광택 이미지를 맨 앞에 놓는다.
→ 그 장면을 한 번 촬영해 WebP 이미지 한 장을 만든다.
```

화면에 Three.js의 WebGL Canvas를 계속 띄워 애니메이션하는 방식이 아니다. 숨은 Canvas에서 한 프레임만 렌더하고, 결과 `blob:` URL을 일반 `<img>`에 보여 준다.

이 저장소는 `three`를 직접 사용한다. `@react-three/fiber` 같은 래퍼는 사용하지 않는다.

### 3-2. Three.js 용어는 “투명 필름 작업대”로 이해한다

| Three.js 용어 | 쉬운 뜻                                               |
| ------------- | ----------------------------------------------------- |
| `Texture`     | 사진을 GPU가 사용할 수 있는 형태로 바꾼 것            |
| `Geometry`    | 사진을 붙일 종이 모양. 사각형, 원, 휘는 판 등         |
| `Material`    | 종이에 어떤 사진을 보일지와 투명 처리 방법            |
| `Mesh`        | `Geometry + Material`, 즉 사진이 붙은 실제 종이 한 장 |
| `Scene`       | 여러 종이를 뒤에서 앞으로 포개는 작업대               |
| `Camera`      | 작업대를 바라보는 눈                                  |
| `Renderer`    | 카메라에 보이는 장면을 최종 이미지로 찍는 도구        |

조립 순서는 늘 이렇다.

```text
이미지 → Texture
모양 → Geometry
Texture를 보여 줄 규칙 → Material
Geometry + Material → Mesh
Mesh들을 Scene에 추가
Camera로 Scene을 보기
Renderer로 한 장 렌더링
```

### 3-3. Canvas와 Three.js는 직접 연결되지 않는다

중간 다리가 하나 있다.

```text
Canvas의 여러 레이어
→ exportUserLayer()
→ 투명 PNG 한 장
→ renderMockup()의 designUrl
→ Three.js
```

중요하다.

> Three.js는 사용자가 Canvas에서 움직인 각 레이어의 `x`, `y`를 받지 않는다.

Canvas가 먼저 모든 레이어를 투명 PNG 한 장으로 굽는다. Three.js는 그 PNG 전체를 하나의 디자인으로 받는다. 그리고 백엔드가 준 `placement`를 사용해 상품 사진 위에 붙인다.

Canvas 좌표와 Three.js placement 좌표는 서로 다른 좌표계다.

---

## 4. Canvas의 핵심 역할을 세 그룹으로 나누기

“Canvas가 어디에 있는지”가 헷갈리는 이유는 역할이 한 종류가 아니기 때문이다. 우선 초보자가 구분해야 할 핵심 역할을 세 그룹으로 나누자.

| 번호 | Canvas                                    | 사용자가 보나? | 역할                                          |
| ---- | ----------------------------------------- | -------------- | --------------------------------------------- |
| 1    | `EditorCanvas`의 `<canvas>`               | 본다           | 마우스로 디자인을 편집하는 그림판             |
| 2    | `exportUserLayer`가 만드는 임시 2D Canvas | 못 본다        | 여러 레이어를 투명 PNG 한 장으로 굽기         |
| 3    | `THREE.WebGLRenderer().domElement`        | 못 본다        | 상품 사진과 디자인을 합성해 WebP 한 장 만들기 |

세 Canvas는 같은 객체가 아니다.

정확히 말하면 실제 Canvas 객체가 딱 세 개라는 뜻은 아니다. `renderer.ts`는 base, design, crop, 둥근 모서리, overlay 처리 중에도 여러 임시 2D Canvas를 추가로 만든다. 여기서는 전체 흐름을 이해하기 위해 “편집용, export용, Three 최종 렌더용”이라는 세 역할만 먼저 구분한 것이다.

```text
[보이는 편집 Canvas]
      │ 레이어들을 그림
      ▼
[숨은 export Canvas]
      │ 투명 PNG 생성
      ▼
[숨은 Three WebGL Canvas]
      │ 상품 사진과 합성
      ▼
[화면의 일반 <img>]
```

이 그림을 이해하면 전체 구조가 훨씬 단순해진다.

---

## 5. 처음에는 이 다섯 파일만 본다

전체 폴더를 처음부터 읽으면 오히려 흐름이 안 보인다. 우선 아래 순서로만 연다.

1. [`EditorView.tsx`](../src/features/goods-editor/components/EditorView.tsx)  
   API 데이터를 모으고 Canvas와 미리보기를 연결하는 총괄 파일

2. [`PreviewPanel.tsx`](../src/features/goods-editor/components/PreviewPanel.tsx)  
   Canvas 결과를 500ms 뒤 투명 PNG로 만드는 곳

3. [`useEditorAngleRender.ts`](../src/features/goods-editor/queries/useEditorAngleRender.ts)  
   상품 각도 한 개를 Three.js 렌더러에 요청하는 곳

4. [`renderer.ts`](../src/features/goods/mockup/renderer.ts)  
   실제 Three.js 합성 코드

5. [`types.ts`](../src/features/goods/mockup/types.ts)  
   백엔드 `placement` 값의 뜻을 적은 사전

Canvas의 마우스 이동까지 보고 싶을 때만 다음 파일을 추가로 본다.

- [`EditorCanvas.tsx`](../src/features/goods-editor/components/EditorCanvas.tsx)
- [`CanvasManager.ts`](../src/features/goods-editor/canvas/CanvasManager.ts)
- [`drawItems.ts`](../src/features/goods-editor/canvas/drawItems.ts)

---

## 6. 실제 실행 흐름 한 장 지도

아래가 현재 활성 코드의 정확한 큰 흐름이다.

```text
/goods/[goodsSn]/editor 페이지
  │
  ├─ URL에서 goodsSn, key, aiid/seq 또는 edit 또는 file 읽기
  ▼
EditorView
  │
  ├─ GET /goods/:goodsSn/mockup
  ├─ GET /base/:baseId/size-info
  ├─ GET /base/editor/state?key=...
  └─ 소스별 이미지 API
  ▼
CanvasManager
  │
  ├─ 레이어 숫자 보관
  └─ 사용자의 이동·크기·회전 숫자 계산
  │
  ├─ useEditorImages → source URL 조회·이미지 로드·imageMap 생성
  └─ EditorCanvas → 레이어 숫자 + imageMap 픽셀을 실제로 그림
  ▼
PreviewPanel
  │ 500ms 기다림
  └─ exportUserLayer() → 투명 PNG data URL
  ▼
useEditorAngleRender
  └─ requestMockupRender(() => renderMockup(...))
  ▼
renderer.ts의 Three.js
  ├─ baseImageUrl
  ├─ designUrl
  ├─ placement
  └─ overlay
  ▼
WebP Blob → blob: URL → <img> 미리보기
```

주의할 점이 하나 있다.

[`MockupPreviewPanel.tsx`](../src/features/goods-editor/components/MockupPreviewPanel.tsx)와 [`useEditorMockupPreview.ts`](../src/features/goods-editor/queries/useEditorMockupPreview.ts)는 파일은 남아 있지만 현재 `EditorView`에서 사용하는 활성 흐름이 아니다. 현재 활성 흐름은 `PreviewPanel → useEditorAngleRender`다.

---

## 7. 출발점: 편집기 URL에서 무슨 값을 읽는가

첫 파일은 [`page.tsx`](<../src/app/(detail)/goods/[goodsSn]/editor/page.tsx>)다.

예를 들어 주소가 다음과 같다고 해 보자.

```text
/goods/123/editor?key=session-abc&aiid=AI-77&seq=2
```

각 값의 뜻은 다음과 같다.

| URL 값                | 뜻                                      |
| --------------------- | --------------------------------------- |
| `goodsSn=123`         | 어떤 상품을 편집하는가                  |
| `key=session-abc`     | 어느 편집 세션을 저장하고 복원할 것인가 |
| `aiid=AI-77`, `seq=2` | 처음 넣을 AI 그림은 무엇인가            |

페이지는 검색 파라미터를 보고 `source`라는 작은 객체를 만든다.

```ts
const source = { type: "ai", aiid: "AI-77", aiseq: 2 };
```

전체 편집기 모델이 지원하는 source 종류는 네 가지다.

```ts
const supportedSources = [
  { type: "ai", aiid, aiseq },
  { type: "edit", editSn },
  { type: "file", fileIdx },
  { type: "addon", itemCode, imagePath },
];
```

단, 이 `page.tsx`가 URL에서 직접 만드는 진입 source는 `ai`, `edit`, `file` 세 종류다. `addon`은 편집기 안의 소스 패널에서 나중에 추가하는 종류다.

URL에는 이미지 파일 자체를 넣지 않는다. “어떤 이미지를 다시 조회할지”를 알 수 있는 작은 식별자만 넣는다.

`key`가 없으면 `crypto.randomUUID()`로 새 key를 만든다. 로그인 확인이 끝나면 다음처럼 `EditorView`로 넘긴다.

```tsx
<EditorView goodsSn={goodsSn} editorKey={editorKey} source={source} />
```

여기까지는 Canvas도 Three.js도 실행되지 않았다. 필요한 번호만 정리한 단계다.

---

## 8. `EditorView`가 처음 받는 백엔드 데이터

[`EditorView.tsx`](../src/features/goods-editor/components/EditorView.tsx)가 전체 기능의 조립자다. 처음에는 세 종류의 핵심 데이터를 기다린다.

아래에는 코드가 `request()`에 넘기는 상대 경로를 적었다. 실제 브라우저 Network 탭에서는 `NEXT_PUBLIC_API_BASE_URL` 같은 API 기본 주소가 앞에 붙어 `/v1/goods/...`처럼 보일 수 있다. 서로 다른 API가 아니라 `기본 주소 + 아래 경로`다.

### 8-1. 상품 목업: `GET /goods/:goodsSn/mockup`

호출 연결은 다음과 같다.

```text
EditorView
→ useGoodsMockupQuery(goodsSn)
→ getGoodsMockup(goodsSn)
→ GET /goods/:goodsSn/mockup
```

관련 파일은 다음과 같다.

- [`useGoodsMockupQuery.ts`](../src/features/goods/queries/useGoodsMockupQuery.ts)
- [`goodsApi.ts`](../src/features/goods/api/goodsApi.ts)
- [`types.ts`](../src/features/goods/mockup/types.ts)

응답은 개념적으로 아래처럼 생겼다. 실제 값은 상품마다 다르다.

```ts
const mockupExample = {
  baseId: "MUG-01",
  imageGroup: "MUG-ANGLES",
  master: {
    imagePath: "https://cdn.../mug-front.png",
    placement: [
      /* 디자인을 붙이는 숫자들 */
    ],
    overlay: {
      /* 그림자/광택 이미지 정보 */
    },
    isMaster: true,
  },
  images: [
    {
      /* 옆면 각도 */
    },
    {
      /* 뒷면 각도 */
    },
  ],
};
```

필드의 역할은 다음과 같다.

| 필드                 | 누가 사용하나?         | 역할                                        |
| -------------------- | ---------------------- | ------------------------------------------- |
| `baseId`             | Canvas 초기화 쪽       | 출력 크기 API를 한 번 더 호출할 때 사용     |
| `master.imagePath`   | Three.js               | 대표 무지 상품 사진                         |
| `images[].imagePath` | Three.js               | 다른 각도의 무지 상품 사진                  |
| `placement`          | Canvas 일부 + Three.js | 편집영역 모양 및 상품 사진에 붙일 위치·모양 |
| `overlay`            | Three.js               | 주름·그림자·빛을 맨 위에 덮기               |

중요한 구분이 있다.

> `baseId`는 Three.js에 직접 넣는 값이 아니다.

`baseId`는 출력 크기를 받기 위한 다음 API의 주소에 사용된다.

### 8-2. 출력 규격: `GET /base/:baseId/size-info`

호출 연결은 다음과 같다.

```text
mockup.baseId
→ useBaseSizeInfoQuery(baseId)
→ getBaseSizeInfo(baseId)
→ GET /base/:baseId/size-info
```

이 API는 “최종 제작 PNG를 몇 픽셀로 만들 것인가?”를 알려 준다.

[`outputMapping.ts`](../src/features/goods-editor/lib/outputMapping.ts)의 `resolveOutputSpec()`은 다음 순서로 유효한 크기를 고른다.

```text
1순위: sizeInfo의 production w/h
2순위: sizeInfo의 print w/h
3순위: 응답 최상위 width/height
모두 없거나 0이면: 규격 미등록으로 적용 차단
```

이 값은 두 군데에 영향을 준다.

1. 화면 편집영역의 가로세로 비율
2. `exportFlattened()`가 만드는 최종 고해상도 PNG 크기

서버가 `1000 × 500`을 내려주면 화면도 2:1 비율로 만들고, 제작 PNG도 2:1 비율로 만든다. 화면에서 꼭 1000px로 보이는 것은 아니다.

### 8-3. 저장한 편집 상태: `GET /base/editor/state?key=...`

호출 연결은 다음과 같다.

```text
editorKey
→ useEditorStateQuery(editorKey)
→ getEditorState(editorKey)
→ GET /base/editor/state?key=...
```

처음 편집하는 key라면 `state`는 `null`이다. 과거에 저장한 key라면 레이어 위치와 결과 key 등이 돌아온다.

서버는 이 state의 내부 의미를 해석하지 않고 JSON으로 보관한다. 따라서 버전 검사와 복원 책임은 프론트의 [`editorSchema.ts`](../src/features/goods-editor/model/editorSchema.ts)에 있다.

### 8-4. 실제 디자인 이미지: 소스별 API

상품 목업 API는 무지 상품 사진을 준다. 사용자의 AI 그림은 별도 API에서 가져온다.

[`editorSourceApi.ts`](../src/features/goods-editor/api/editorSourceApi.ts)가 소스 종류에 따라 URL을 고른다.

| source  | 요청                                  | 응답에서 사용하는 값                   |
| ------- | ------------------------------------- | -------------------------------------- |
| `ai`    | `GET /ai/images/:aiid/:seq`           | `editSourceImage`, 없으면 `thumbImage` |
| `edit`  | `GET /users/mypage/art-edits/:editSn` | `resultImg`                            |
| `file`  | `GET /users/mypage/files/:idx`        | `imagePath`                            |
| `addon` | 추가 조회 없음                        | source에 들어 있는 `imagePath`         |

AI 예시로 단계별 자료형을 보면 이렇다.

```text
URL 검색 파라미터
aiid=AI-77&seq=2

        ↓ page.tsx

EditorSource 객체
{ type: "ai", aiid: "AI-77", aiseq: 2 }

        ↓ resolveEditorSourceUrl()

API 요청
GET /ai/images/AI-77/2

        ↓ pickSourceUrl()

이미지 URL 문자열
"https://cdn.../original.png"

        ↓ loadEditorImage()

HTMLImageElement
naturalWidth=1200, naturalHeight=800
```

API는 Canvas를 직접 그리지 않는다. API가 URL을 주고, 프론트가 그 URL을 브라우저 이미지 객체로 로드한 후 Canvas에 그린다.

---

## 9. 초기 준비가 실제로 끝나는 과정

이제 `EditorView`의 부트스트랩을 한 줄씩 말로 바꿔 보자.

```text
1. 상품 목업 응답을 기다린다.
2. baseId가 있으면 size-info 응답도 기다린다.
3. 저장 state 응답을 기다린다.
4. resolveOutputSpec()으로 제작 크기를 고른다.
5. createEditorMeta()로 화면용 숫자를 만든다.
6. initManager(meta)로 CanvasManager를 만든다.
7. 저장 state가 있으면 loadDocument()로 복원한다.
8. 저장 state가 없고 진입 source가 있으면 이미지를 불러 addImage()한다.
```

복원본이 첫 이미지보다 우선이다. 이미 저장된 레이어가 있는데 URL의 첫 이미지를 또 추가하면 중복되기 때문이다.

### 9-1. 화면용 크기는 왜 서버 크기와 다른가

제작 원본이 수천 픽셀이면 그대로 화면에 그리기 무겁고, 작은 휴대폰 화면에도 맞지 않는다. 그래서 [`bootstrapMeta.ts`](../src/features/goods-editor/lib/bootstrapMeta.ts)는 긴 변을 화면용 논리 크기 `580`에 맞춘다.

기본 규칙은 다음과 같다.

```text
Canvas 전체 너비 = 700
위·아래 여백 = 각각 60
편집 사각형의 긴 변 = 580
실제로 디자인이 보이는 중앙 영역 = 편집 사각형의 80%
```

`CanvasMeta`는 다음 숫자들을 가진다.

```ts
const meta = {
  canvasW, // Canvas 전체 너비
  canvasH, // Canvas 전체 높이
  editW, // 비율을 반영한 편집 사각형 너비
  editH, // 비율을 반영한 편집 사각형 높이
  padX, // 편집 사각형 왼쪽 여백
  padY, // 편집 사각형 위쪽 여백
  editAreaRatio, // 실제 보이는 중앙 영역 비율, 기본 0.8
};
```

### 9-2. 숫자 하나로 끝까지 계산해 보기

서버 출력 규격이 `1000 × 1000`, 처음 넣는 원본 그림이 `1200 × 800`이라고 가정하자.

#### 첫 번째: 화면 편집 사각형

정사각형이므로 `createEditorMeta()` 결과는 다음과 같다.

```text
editW = 580
editH = 580
canvasW = 700
canvasH = 700
padX = 60
padY = 60
```

#### 두 번째: 실제 출력이 보이는 중앙 80% 영역

```text
너비 = 580 × 0.8 = 464
높이 = 580 × 0.8 = 464
시작 x = 60 + (580 - 464) / 2 = 118
시작 y = 60 + (580 - 464) / 2 = 118
```

즉 사용자가 보는 점선·클립 영역은 `(118, 118)`부터 `464 × 464`다.

#### 세 번째: 1200 × 800 그림을 영역 안에 맞추기

`addImage()`는 비율을 유지하면서 그림 전체가 영역 안에 들어오게 한다.

```text
가로 배율 = 464 / 1200 ≈ 0.3867
세로 배율 = 464 / 800  = 0.58
더 작은 값 0.3867 선택
```

따라서 새 레이어는 대략 다음 숫자가 된다.

```ts
const initialLayer = {
  width: 464,
  height: 309.3,
  x: 118,
  y: 195.3,
};
```

그림 중심은 `(350, 350)`이다. 그래서 `drawItems()`는 중심으로 이동한 뒤 다음처럼 그린다.

```text
translate(350, 350)
drawImage(image, -232, -154.65, 464, 309.3)
```

`drawImage`가 음수에서 시작하는 이유는 중심 `(0,0)`을 기준으로 좌우·상하 절반씩 펼치기 때문이다.

#### 네 번째: 화면 CSS 크기는 또 다를 수 있다

Canvas 내부 좌표는 700이지만 브라우저에서는 CSS로 560px 너비로 보일 수 있다.

이때 화면에서 마우스를 8px 옮기면 내부 논리 좌표는 다음만큼 움직인다.

```text
8 × 700 / 560 = 10
```

그래서 `EditorCanvas.toCanvasCoords()`가 브라우저 마우스 좌표를 Canvas 내부 좌표로 변환한다. 이 계산이 없으면 화면 크기가 달라질 때 드래그가 어긋난다.

#### 다섯 번째: 나중에 제작 PNG로 다시 확대

`exportFlattened()`는 긴 변을 서버 규격 1000에 맞춘다.

```text
scale = 1000 / 580 ≈ 1.724
결과 Canvas = 1000 × 1000
중앙 80% 영역 = 800 × 800
```

정리하면 서버의 1000은 화면에 그대로 표시할 픽셀이 아니라 최종 출력 크기다. 편집 중에는 580 논리 좌표로 가볍게 작업하고, 적용할 때 다시 제작 크기로 만든다.

---

## 10. 이미지 URL이 Canvas 레이어가 되는 과정

### 10-1. `source`는 이미지를 다시 찾기 위한 정보다

AI, art-edit, 내 파일 레이어에 저장되는 `source`는 이미지 URL이 아니라 안정적인 식별 정보다.

```ts
const source = { type: "ai", aiid: "AI-77", aiseq: 2 };
```

URL은 만료되거나 바뀔 수 있다. 반면 `aiid`와 `aiseq`로 다시 API를 호출하면 최신 URL을 받을 수 있다. 그래서 `ai/edit/file`은 state에 식별자만 넣는다.

`addon`은 예외다. 관리자 업로드 CDN의 영구 주소를 쓰므로 `{ type: "addon", itemCode, imagePath }`처럼 `imagePath`도 source와 함께 저장한다. 그래도 presigned URL, `blob:` URL, `data:` URL은 저장하지 않는다.

### 10-2. 처음 이미지를 넣을 때

저장본이 없고 URL에서 받은 source가 있으면 `EditorView`가 다음 순서로 처리한다.

```text
resolveEditorSourceUrl(source)
→ 이미지 URL 받기
→ loadEditorImage(url)
→ HTMLImageElement 로드 완료
→ naturalWidth, naturalHeight 확인
→ manager.addImage(source, naturalWidth, naturalHeight, { baseImage: true })
```

`naturalWidth`와 `naturalHeight`는 다운로드한 원본 이미지의 실제 픽셀 크기다. `addImage()`는 그 비율을 사용해 중앙 80% 영역 안에 이미지 전체가 들어오게 배치한다.

`baseImage: true`는 “첫 진입 작품이라 일반 삭제 버튼에서 보호하는 기준 이미지”라는 이 프로젝트의 표시다. `locked: true`와 같은 뜻은 아니므로 기본적으로 이동할 수 있다. `manager.reset()`으로 전체 초기화하면 baseImage도 함께 제거된다.

### 10-3. 레이어에는 어떤 값이 저장되나

이미지 레이어는 개념적으로 다음처럼 생겼다.

```ts
const imageLayer = {
  id: "layer-...",
  kind: "image",
  source: { type: "ai", aiid: "AI-77", aiseq: 2 },

  x: 118,
  y: 195.3,
  width: 464,
  height: 309.3,
  rotation: 0,
  flipX: false,
  flipY: false,

  opacity: 1,
  locked: false,
  hidden: false,
  zIndex: 0,
  filter: "none",
  baseImage: true,
};
```

이 객체에는 이미지 픽셀이 없다. 위치 숫자와 “어느 이미지를 다시 가져올지”라는 source만 있다.

### 10-4. 그러면 실제 픽셀은 어디에 있나

[`useEditorImages.ts`](../src/features/goods-editor/queries/useEditorImages.ts)가 모든 이미지 레이어의 source를 조회한다.

```text
items의 image 레이어들
→ 각 source를 API로 조회
→ URL을 HTMLImageElement로 로드
→ Map<layer.id, HTMLImageElement> 생성
```

결과를 쉽게 쓰면 다음 모양이다.

```ts
const imageMap = new Map([
  ["layer-1", HTMLImageElement],
  ["layer-2", HTMLImageElement],
]);
```

따라서 정보가 두 군데로 나뉜다.

```text
items[0]      = 어디에, 얼마나 크게, 얼마나 돌려서 그릴까?
imageMap[id]  = 실제로 어떤 픽셀을 그릴까?
```

`drawItems(ctx, items, imageMap)`가 이 둘을 합친다.

처음 진입할 때는 `resolveEditorSourceUrl() → loadEditorImage()`가 원본 크기를 알아내기 위해 이미지를 한 번 조회한다. 그 뒤 레이어가 만들어지면 `useEditorImages`가 source를 다시 해결해 `imageMap`을 채운다. 따라서 개발자 도구 Network에서 같은 source 조회나 이미지 로드가 두 번 보일 수 있다.

---

## 11. Canvas가 실제로 한 프레임을 그리는 과정

[`EditorCanvas.tsx`](../src/features/goods-editor/components/EditorCanvas.tsx)의 `useEffect`를 쉬운 말로 바꾸면 다음과 같다.

```text
1. <canvas>와 CanvasManager가 있는지 확인한다.
2. Canvas 내부 width/height를 meta와 맞춘다.
3. getContext("2d")로 그리기 도구를 꺼낸다.
4. clearRect()로 이전 픽셀을 전부 지운다.
5. 중앙 편집영역 모양으로 clip한다.
6. 투명 배경을 뜻하는 체크무늬를 그린다.
7. drawItems()로 모든 레이어를 그린다.
8. clip을 해제한다.
9. 편집영역 점선과 스냅 가이드를 그린다.
```

`clip()`은 “이 모양 밖으로 그린 픽셀은 보이지 않게 하라”는 뜻이다.

예를 들어 원형 상품이면 원 밖의 디자인이 숨는다. 레이어 숫자가 잘리거나 삭제되는 것이 아니다. 그리는 동안만 픽셀이 보이지 않는 것이다.

### 11-1. `drawItems()`는 레이어 하나를 어떻게 그리나

[`drawItems.ts`](../src/features/goods-editor/canvas/drawItems.ts)는 배열의 앞에서 뒤로 그린다. 먼저 그린 레이어는 아래, 나중에 그린 레이어는 위에 보인다.

이미지 레이어 하나의 실제 순서는 다음과 같다.

```ts
ctx.save();
ctx.translate(레이어_중심_x, 레이어_중심_y);
ctx.rotate(item.rotation);
ctx.scale(item.flipX ? -1 : 1, item.flipY ? -1 : 1);
ctx.drawImage(image, -width / 2, -height / 2, width, height);
ctx.restore();
```

한 줄씩 해석하면 다음과 같다.

1. `save()` — 현재 Canvas 설정을 잠깐 저장한다.
2. `translate()` — 좌표 원점 `(0,0)`을 레이어 중심으로 옮긴다.
3. `rotate()` — 중심을 기준으로 회전한다.
4. `scale(-1, 1)` — 필요하면 좌우 또는 상하를 뒤집는다.
5. `drawImage()` — 중심에서 반쪽만큼 왼쪽·위에서 그림을 시작한다.
6. `restore()` — 다음 레이어에 회전과 반전이 묻지 않도록 원래 설정으로 돌아간다.

텍스트 레이어이면 `drawImage()` 대신 내부 `drawText()`가 `fillText()`를 사용한다.

`hidden`인 레이어는 건너뛴다. 이미지의 `filter`가 있으면 `ctx.filter`에 적용한다.

### 11-2. 파란 선택 테두리와 동그란 손잡이는 Canvas 그림이 아니다

선택 외곽선과 크기·회전 손잡이는 [`SelectionHandles.tsx`](../src/features/goods-editor/components/SelectionHandles.tsx)가 만드는 HTML `div`다.

```text
실제 디자인 픽셀 = Canvas
선택 테두리·손잡이 = Canvas 위에 포갠 DOM
```

이렇게 나누면 손잡이가 Canvas 경계에서 잘리는 일을 피하고, React 포인터 이벤트도 쉽게 받을 수 있다.

---

## 12. 마우스로 그림을 이동할 때 호출되는 함수

이제 사용자가 그림을 오른쪽으로 끄는 정확한 흐름을 보자.

### 12-1. 마우스를 누른다

```text
EditorCanvas.onPointerDown
→ toCanvasCoords(clientX, clientY)
→ manager.hitTest(x, y)
→ manager.select(hitId)
→ manager.beginDrag()
```

`clientX`, `clientY`는 브라우저 화면 좌표다. `toCanvasCoords()`가 CSS 확대·축소를 반영해 700 기준 Canvas 논리 좌표로 바꾼다.

`hitTest()`는 위에 있는 레이어부터 검사한다. 회전된 레이어라면 클릭점을 `-rotation`만큼 반대로 돌려 레이어의 원래 사각형 안인지 판정한다.

### 12-2. 누른 채 움직인다

```text
EditorCanvas.onPointerMove
→ 현재 Canvas 좌표 - 직전 Canvas 좌표
→ manager.moveSelectedBy(dx, dy)
→ 선택 레이어의 x += dx, y += dy
→ applySnap()
→ emit()
```

`applySnap()`은 4 논리 픽셀 안으로 가까워졌을 때 편집 사각형 경계·중심 또는 다른 레이어와 맞춘다.

주의: 스냅 기준의 바깥 경계는 중앙 80% 점선 영역이 아니라 `padX/padY`부터 시작하는 전체 `editW × editH` 사각형이다. 정렬 버튼과 보이는 clip 영역은 중앙 80%를 기준으로 하므로 둘을 같은 것으로 생각하면 안 된다.

### 12-3. `emit()` 뒤에 화면이 바뀐다

Zustand store는 manager를 구독하고 있다.

```text
manager.emit()
→ store의 sync()
→ manager.getItems().slice()
→ items가 새 배열이 됨
→ EditorCanvas useEffect가 items 변경 감지
→ clearRect()
→ drawItems()
```

그래서 사용자는 이미지가 부드럽게 움직인다고 느끼지만, 실제로는 이동할 때마다 전체를 빠르게 지우고 다시 그리고 있다.

### 12-4. 마우스를 놓는다

```text
EditorCanvas.onPointerUp
→ manager.endDrag()
→ undo용 history를 한 번 기록
```

포인터가 50번 움직였다고 history 50개를 만드는 것이 아니라, 한 번의 드래그를 한 작업으로 기록한다.

### 12-5. 크기와 회전은 어디서 하나

`SelectionHandles`의 HTML 손잡이가 포인터를 받는다.

- 모서리 손잡이: `beginResize()` → `resizeCornerTo()`
- 변 손잡이: `beginResize()` → `resizeEdgeBy()`
- 회전 손잡이: `beginRotate()` → `rotateToPoint()`
- 작업 종료: `endTransform()`

모서리 리사이즈는 원래 비율을 유지하고 반대쪽 모서리를 고정한다. 최소 크기는 20이다. 회전은 중심과 포인터 사이 각도를 `Math.atan2()`로 구하며, 45도 단위에서 ±5도 안으로 가까워지면 달라붙는다. 저장 단위는 라디안이다.

---

## 13. Canvas의 여러 레이어가 투명 PNG 한 장이 되는 과정

우측 미리보기는 레이어를 하나씩 Three.js에 넘기지 않는다. [`PreviewPanel.tsx`](../src/features/goods-editor/components/PreviewPanel.tsx)가 `items` 변경 후 500ms 기다린 다음 `exportUserLayer()`를 부른다.

현재 `PreviewPanel`은 숨기지 않은 이미지 레이어가 하나라도 있을 때만 export한다. `drawItems()`와 `exportUserLayer()` 자체는 텍스트도 그릴 수 있지만, 이미지 없이 텍스트만 있는 문서는 현재 미리보기에서 export하지 않으며 `EditorView`의 적용 버튼도 활성화되지 않는다.

500ms를 기다리는 이유는 드래그 중 매 픽셀마다 무거운 Three.js 합성을 시작하지 않기 위해서다.

호출은 다음과 같다.

```text
items 또는 imageMap 변경
→ 500ms 타이머 시작
→ 그 사이 또 바뀌면 이전 타이머 취소
→ 500ms 동안 추가 변경이 없으면
→ exportUserLayer(items, meta, imageMap, clip)
```

[`exportCanvas.ts`](../src/features/goods-editor/lib/exportCanvas.ts)의 `exportUserLayer()`는 보이지 않는 새 Canvas를 만든다.

```text
1. 중앙 80% 영역의 너비와 높이를 계산한다.
2. 정확히 그 크기의 투명 Canvas를 새로 만든다.
3. 편집영역 모양으로 clip한다.
4. drawItems()를 다시 사용해 모든 레이어를 그린다.
5. canvas.toDataURL("image/png")로 PNG 문자열을 만든다.
```

앞의 `1000 × 1000` 예시에서는 중앙 영역이 `464 × 464`였다.

```text
새 export Canvas 크기 = 464 × 464
원래 중앙 영역 시작점 = (118, 118)
drawItems 오프셋 = (-118, -118)
```

그래서 원래 Canvas에서 `x=118`이었던 픽셀이 export Canvas에서는 `x=0`으로 옮겨진다.

결과는 다음처럼 시작하는 긴 문자열이다.

```text
data:image/png;base64,iVBORw0KGgoAAA...
```

이 문자열이 현재 활성 Three.js 미리보기의 `designUrl`이다.

중요한 차이를 한 번 더 보자.

| 함수                | 결과                                                          | 현재 사용처                          |
| ------------------- | ------------------------------------------------------------- | ------------------------------------ |
| `exportUserLayer()` | 중앙 80% 크기, 투명 배경 PNG                                  | 실시간 Three.js, 적용 시 `designKey` |
| `exportFlattened()` | 서버 제작 규격으로 확대, 출력영역 안을 흰색으로 채운 평면 PNG | 적용 결과의 `flattenedKey`           |

`exportUserLayer()`는 고해상도 1000으로 확대하지 않는다. 위 예에서는 464px다. 현재 코드는 이 같은 결과를 실시간 Three 미리보기와 `designKey` 업로드에 모두 재사용한다.

---

## 14. 투명 PNG가 Three.js 상품 사진이 되는 과정

### 14-1. 현재 활성 호출 순서

투명 PNG가 만들어지면 `PreviewPanel`은 평면 미리보기를 보여 주고, 렌더 가능한 각도마다 `AngleThumb` 또는 큰 미리보기에서 [`useEditorAngleRender.ts`](../src/features/goods-editor/queries/useEditorAngleRender.ts)를 사용한다.

편집기 `PreviewPanel`과 적용 파일 생성은 `viewable: false`여도 `imagePath + 디자인 placement`가 있어 렌더 가능하면 그 각도를 사용한다. 반면 상품 상세의 `MockupGallery`는 `viewable !== false`인 각도만 화면에 보여 준다.

```text
EditorView
→ PreviewPanel
→ exportUserLayer
→ BigPreview / AngleThumb
→ useEditorAngleRender
→ requestMockupRender
→ renderMockup
→ WebP blob URL
→ <img>
```

`requestMockupRender()`는 여러 각도의 무거운 렌더 요청을 큐로 정리하는 역할이다. 실제 합성은 `renderMockup()`이 한다.

### 14-2. `renderMockup()`에 실제로 들어가는 다섯 값

`useEditorAngleRender`에서 현재 호출하는 모양은 다음과 같다.

```ts
renderMockup({
  baseImageUrl: angle.imagePath,
  designUrl,
  placement: angle.placement ?? [],
  overlay: angle.overlay,
  outputSize: size,
});
```

각 값이 어디서 왔는지 다시 연결해 보자.

| 입력           | 실제 값                           | 출발점                                            |
| -------------- | --------------------------------- | ------------------------------------------------- |
| `baseImageUrl` | 무지 컵·티셔츠 사진 URL           | `GET /goods/:goodsSn/mockup`의 각도별 `imagePath` |
| `designUrl`    | 사용자가 편집한 투명 PNG data URL | `exportUserLayer()`                               |
| `placement`    | 붙일 위치·크기·모양 숫자 배열     | 목업 API의 각도별 `placement`                     |
| `overlay`      | 그림자·광택 이미지와 배치 숫자    | 목업 API의 각도별 `overlay`                       |
| `outputSize`   | 결과 이미지 최대 크기             | UI 위치에 따라 256/512, 적용 시 1024              |

이 표에서 Canvas가 만든 것은 `designUrl` 하나다. `baseImageUrl`, `placement`, `overlay`는 상품 목업 API에서 오고, `outputSize`는 프론트 호출부가 정한다.

### 14-3. `renderer.ts` 안에서 일어나는 일

[`renderer.ts`](../src/features/goods/mockup/renderer.ts)를 처음부터 읽으면 길다. 아래 일곱 단계로 나눠 보면 된다.

#### 1단계: 두 이미지를 로드한다

```text
baseImageUrl → 무지 상품 HTMLImageElement
designUrl    → 투명 디자인 HTMLImageElement
```

`data:`와 `blob:` URL은 직접 로드한다. `base`, `design`, `overlay` 중 원격 URL인 이미지는 모두 실패에 대비해 대략 다음 순서로 시도한다.

```text
Next 이미지 최적화 주소
→ CORS가 허용된 원본 주소
→ /api/image-proxy
```

Canvas에서 픽셀을 다시 꺼내 파일로 만들려면 외부 이미지의 CORS 문제가 중요하기 때문이다.

#### 2단계: 입력 이미지를 임시 2D Canvas로 옮긴다

무지 상품 이미지는 `outputSize` 이하로 줄이고, 디자인 이미지도 Canvas texture로 쓰기 좋게 임시 Canvas에 복사한다.

여기서 만드는 Canvas도 화면에 보이지 않는다. Three.js의 `CanvasTexture` 재료로 사용하려는 중간 작업물이다.

#### 3단계: 카메라를 고른다

첫 번째 디자인 placement의 `cameratype`이 정확히 `"3D"`이면 다음을 쓴다.

```ts
new THREE.PerspectiveCamera(75, ...)
```

원근감이 있는 카메라다. 그 외이거나 값이 없으면 다음을 쓴다.

```ts
new THREE.OrthographicCamera(...)
```

멀고 가까워도 크기가 달라지지 않는 평면적인 카메라다.

#### 4단계: 맨 뒤에 무지 상품 사진을 놓는다

개념 코드는 다음과 같다.

```text
base Canvas
→ CanvasTexture
→ PlaneGeometry
→ MeshBasicMaterial
→ Mesh
→ Scene에 추가
```

이 무지 상품 Mesh의 `renderOrder`는 `0`이다. 가장 뒤다.

#### 5단계: 그 앞에 디자인을 놓는다

`placement` 배열에서 `type1`, `type2`, `type3`, `cylinder` 중 첫 번째 항목만 대표 디자인 배치로 고른다.

```text
design Canvas
→ CanvasTexture
→ placement 종류에 맞는 Geometry
→ 투명을 허용하는 MeshBasicMaterial
→ 디자인 Mesh
→ Scene에 추가
```

디자인 Mesh의 `renderOrder`는 `1`이다.

#### 6단계: 제외영역과 overlay를 위에 놓는다

카메라 구멍이나 컵 손잡이처럼 디자인이 덮으면 안 되는 곳은 상품 원본의 해당 조각을 다시 디자인 위에 덮는다. `renderOrder`는 `2`다.

그림자·광택 overlay는 가장 마지막에 올린다. `renderOrder`는 `9999`다.

최종 포개는 순서는 다음 하나로 기억하면 된다.

```text
뒤
무지 상품 사진       renderOrder 0
디자인               renderOrder 1
제외영역의 상품 조각 renderOrder 2
그림자·광택 overlay  renderOrder 9999
앞
```

#### 7단계: 한 번 렌더하고 WebP로 바꾼다

```text
renderer.render(scene, camera)
→ renderer.domElement.toBlob("image/webp", 품질 0.85)
→ URL.createObjectURL(blob)
→ "blob:https://..."
→ React의 <img src={url}>
```

`requestAnimationFrame`으로 계속 그리는 애니메이션 루프는 없다. 장면을 한 번 찍어 이미지 파일처럼 보여 준다.

`MeshBasicMaterial`을 사용하므로 Three.js 조명을 계산하지 않는다. 그림자와 광택은 주로 이미 만들어진 상품 사진과 overlay 이미지가 담당한다.

### 14-4. 렌더가 끝난 뒤 메모리를 정리한다

Three.js 결과를 많이 만들 때는 GPU와 브라우저 메모리를 정리하지 않으면 점점 느려질 수 있다. 현재 코드는 다음 방식으로 관리한다.

- `WebGLRenderer`는 singleton 한 개를 재사용한다.
- `renderQueue`가 renderer 작업을 한 건씩 직렬로 실행한다.
- 각 렌더가 만든 Texture, Geometry, Material은 `track()`하고 `finally`에서 `dispose()`한다.
- Scene도 렌더 후 `clear()`한다.
- renderer 또는 WebGL context 오류가 나면 `forceContextLoss()`와 `dispose()` 후 다음 요청에서 새로 만든다.
- 편집기 hook과 File 변환 코드는 더 이상 쓸 필요가 없는 `blob:` URL에 `URL.revokeObjectURL()`을 호출한다.

`blob:` URL은 서버 주소가 아니라 현재 브라우저 메모리를 잠시 가리키는 주소다. 새 기능을 추가할 때도 만든 object URL을 언제 폐기할지 함께 설계해야 한다.

---

## 15. 백엔드 `placement` 숫자는 무엇을 뜻하나

`placement`는 사용자가 Canvas에서 움직인 레이어 위치가 아니다.

> 관리자가 각 무지 상품 사진에 미리 등록해 둔 “이 상품 사진에는 디자인을 여기 붙여라”라는 설명서다.

상품 앞면 사진과 옆면 사진은 붙일 위치가 다르므로 각 각도마다 `placement`가 따로 있다.

### 15-1. 디자인 모양 네 종류

| type       | 쉬운 뜻                       | Three.js 구현                       |
| ---------- | ----------------------------- | ----------------------------------- |
| `type1`    | 일반 사각형에 디자인 붙이기   | 중앙 cover crop + `PlaneGeometry`   |
| `type2`    | 모서리가 둥근 사각형에 붙이기 | 둥근 Canvas crop + `ShapeGeometry`  |
| `type3`    | 원형에 붙이기                 | 중앙 정사각 crop + `CircleGeometry` |
| `cylinder` | 컵처럼 휘어진 면에 붙이기     | 잘게 나눈 평면의 점들을 휘기        |

`cylinder`라는 이름이지만 Three.js의 `CylinderGeometry`를 사용하지 않는다. API의 500px 기준 크기를 Three world 크기인 `cylWidth/cylHeight`로 변환한 다음 `PlaneGeometry(cylWidth, cylHeight, 64, 32)`를 만든다. 이 판을 가로 64칸, 세로 32칸으로 잘게 나누고 각 꼭짓점을 이동해 휘어 보이게 한다.

`placement.type`이 비어 있거나 `null`인 예전 데이터는 `normalizePlacementType()`에서 `type1`로 취급한다.

카메라 필드는 평면과 원통이 공통으로 첫 디자인 placement에서 읽는다.

- `cameratype`이 `"3D"`이면 Perspective, 그 외에는 Orthographic
- `cameraposition`은 3D Perspective 카메라의 z 위치이며 기본값은 100
- 2D Orthographic 카메라의 z는 현재 코드에서 100으로 고정

### 15-2. 평면 타입이 읽는 값

`type1`, `type2`, `type3`은 주로 다음 값을 읽는다. 아래 숫자는 구조를 보여 주기 위한 가상 예시다.

```ts
const flatPlacement = {
  type: "type1",
  width: 120,
  height: 80,
  position: { x: 10, y: -5 },
  rotation: { x: 0, y: 10, z: -3 },
  cornerRadius: 8,
  skewX: 0,
  skewY: 0,
  cameratype: "2D",
  cameraposition: 100,
};
```

- `width`, `height`: 디자인 판의 Three world 크기. Canvas 픽셀이 아님
- `position.x/y`: Three world에서 디자인 판 중심의 위치
- `rotation.x/y/z`: 회전값이며 단위는 도(degree)
- `cornerRadius`: `type2`의 둥근 정도
- `skewX`, `skewY`: 사각형의 변을 옆으로 밀어 평행사변형처럼 찌그러뜨리는 전단(shear) 값

`type3`은 사실상 `width`를 원의 지름으로 사용하고 `height`는 모양 크기에 사용하지 않는다.

매우 중요한 단위 차이가 있다.

```text
Canvas 레이어 rotation = 라디안
API placement.rotation  = 도(degree)
```

이름이 같아 보여도 그대로 서로 복사하면 안 된다. renderer가 degree를 radian으로 변환한다.

### 15-3. 원통 타입이 읽는 값

원통은 일반 타입과 좌표 필드도 다르다.

```ts
const cylinderPlacement = {
  type: "cylinder",
  positionx: 100,
  positiony: 80,
  width: 220,
  height: 260,
  imageposition: "position2",
  topCurve: 10,
  bottomCurve: 6,
  sideRoll: 12,
  tiltForward: 4,
};
```

- `positionx`, `positiony`, `width`, `height`: 관리자 500px 기준 좌표계
- `imageposition`: 디자인의 어느 가로 부분을 보여 줄지 선택
  - `position1`: 왼쪽 절반
  - `position2`: 가운데 절반, 기본값
  - `position3`: 오른쪽 절반
- `topCurve`, `bottomCurve`: 위·아래 곡률
- `sideRoll`: 옆으로 감기는 정도
- `tiltForward`: 앞뒤로 기울어진 느낌

원통의 `rotationZ` 필드는 타입에는 선언돼 있지만 현재 `buildCylinderMesh()`에서는 사용하지 않는다.

### 15-4. 제외영역 `type4`, `type5`, `type6`

예를 들어 머그컵 손잡이 앞까지 디자인 사각형이 덮였다고 해 보자. 손잡이 부분은 원래 상품 사진이 다시 보여야 한다.

| type    | 제외영역 모양 |
| ------- | ------------- |
| `type4` | 사각형        |
| `type5` | 둥근 사각형   |
| `type6` | 원·타원       |

세 타입 모두 `width`, `height`, `position.x/y`를 사용한다. `type5`만 둥근 정도를 위해 `cornerRadius`도 사용한다. 제외영역의 `rotation`과 `skew`는 현재 `buildExcludeMesh()`가 읽지 않는다.

Three.js는 디자인 Mesh에 진짜 구멍을 뚫지 않는다. 대신 무지 상품 texture의 해당 위치만 잘라 디자인 위에 다시 덮는다.

```text
상품 원본
→ 디자인이 손잡이까지 덮음
→ 손잡이 위치의 상품 원본 조각을 맨 위에 다시 그림
→ 손잡이가 디자인 앞에 있는 것처럼 보임
```

제작 평면 PNG를 만드는 `exportFlattened()`에서는 접근이 다르다. `destination-out` 합성 모드로 해당 영역을 투명하게 뚫는다. 원통 placement는 이 평면 변환을 지원하지 않아 제외 도형 목록을 만들지 않는다.

### 15-5. overlay

overlay는 상품의 주름, 빛, 그림자를 가진 투명 이미지다.

```ts
const overlay = {
  file: "https://cdn.../shirt-shadow.png",
  x: 0,
  y: 0,
  width: 120,
  height: 120,
  opacity: 0.8,
  rotationZ: 0,
};
```

`renderer.ts`는 이것을 `Sprite`로 만들어 가장 앞에 둔다. 각도의 전용 `angle.overlay`가 우선이고, 없으면 `placement` 배열 안의 `type: "overlay"` 항목을 예전 형식 호환용으로 찾는다.

- `file`: overlay 이미지 URL
- `x`, `y`: Three world 위치
- `width`, `height`: 크기
- `opacity`: 투명도
- `rotationZ`: z축 회전이며 단위는 도(degree)

`overlay.type === "overlay"`인 형식은 `width/height`를 world 단위로 바로 사용한다. 그 외의 오래된 전용 overlay 형식은 base Canvas 크기와 `/26` 규칙을 사용해 환산한다. overlay 이미지 로드가 실패하면 renderer는 이 부분만 조용히 건너뛰고 base와 design 합성은 계속한다.

### 15-6. Canvas 좌표와 placement 좌표를 섞지 말 것

둘은 출발점부터 다르다.

| 구분        | Canvas 레이어                     | 일반 placement                     | cylinder 원본 값                        |
| ----------- | --------------------------------- | ---------------------------------- | --------------------------------------- |
| 누가 만드나 | 사용자가 편집하면서 프론트가 변경 | 상품 관리자가 등록, 백엔드가 전달  | 상품 관리자가 등록, 백엔드가 전달       |
| 좌표 기준   | Canvas 왼쪽 위                    | Three world 중심 기준              | 관리자 500px 이미지의 왼쪽 위 기준      |
| y 방향      | 아래로 갈수록 증가                | 위로 갈수록 증가                   | 아래로 증가하며 renderer가 Three로 변환 |
| 위치 필드   | `x`, `y`                          | `position.x`, `position.y`         | `positionx`, `positiony`                |
| 회전 단위   | 라디안                            | `rotation.x/y/z`의 도(degree)      | `rotationZ` 선언은 있으나 현재 미사용   |
| 목적        | 투명 디자인 PNG 안에서의 배치     | PNG 전체를 평평한 상품 면에 붙이기 | PNG 일부를 골라 휘어진 상품 면에 붙이기 |

사용자가 Canvas에서 그림을 오른쪽으로 옮기면 그 변화는 투명 PNG 안에 구워진다. Three.js placement의 `position.x`가 바뀌는 것이 아니다.

---

## 16. “적용하기”를 누르면 무엇을 만드는가

실시간 미리보기의 `blob:` URL은 현재 브라우저 탭에서만 쓸 수 있다. 장바구니와 주문에서 계속 쓰려면 파일로 만들고 스토리지에 업로드해야 한다.

[`EditorView.tsx`](../src/features/goods-editor/components/EditorView.tsx)의 적용 mutation은 다음 순서로 실행된다.

```text
1. exportUserLayer()로 투명 디자인 PNG 만들기
2. renderMockupRepresentativeFile()로 master 상품 접목 WebP 만들기
3. renderMockupWorkingFiles()로 나머지 각도 WebP 만들기
4. applyEditor() 호출
5. applyEditor() 안에서 exportFlattened() 제작 평면 PNG 만들기
6. 네 종류의 파일을 스토리지에 업로드
7. EditorResult 만들기
8. manager.toState(..., result)로 저장 JSON 만들기
9. POST /base/editor/state
10. /goods/:goodsSn?editorKey=... 로 돌아가기
```

대표와 각도별 목업은 적용할 때 가로세로 비율을 유지하며 긴 변이 최대 `1024px`인 결과로 다시 렌더한다. 항상 `1024 × 1024`라는 뜻은 아니다. 우측 패널에서 보던 작은 256/512 결과를 그대로 저장하는 것도 아니다.

### 16-1. 최종 산출물 네 종류

이 표는 반드시 구분해야 한다. 산출물의 종류는 네 가지지만, `workingKeys`는 각도 수만큼 파일이 생기므로 실제 업로드 파일이 네 개로 고정되는 것은 아니다.

| 결과 필드           | 어떤 그림인가                                               | 현재 구매 필드               |
| ------------------- | ----------------------------------------------------------- | ---------------------------- |
| `designKey`         | `exportUserLayer`, 투명한 사용자 디자인 자체                | `originalfilepath`           |
| `flattenedKey`      | `exportFlattened`, 출력영역 안이 흰 제작 규격 평면 PNG      | 현재 구매 body에 보내지 않음 |
| `representativeKey` | master 상품 사진에 디자인을 붙인 대표 WebP                  | `userImage`                  |
| `workingKeys`       | 대표를 포함한 렌더 가능한 모든 면·각도의 접목 WebP key 배열 | `workingImages`              |

아주 쉽게 이미지로 생각하면 다음과 같다.

```text
designKey
┌──────────────┐
│ 투명 배경에  │
│ 디자인만 있음│
└──────────────┘

flattenedKey
┌──────────────┐
│ 제작 크기의  │
│ 평면 시안    │
└──────────────┘

representativeKey
┌──────────────┐
│ 컵 사진 위에 │
│ 디자인이 붙음│
└──────────────┘

workingKeys
[앞면 컵, 옆면 컵, 뒷면 컵, ...]
```

매우 중요하다.

> 현재 코드에서 `originalfilepath`는 `flattenedKey`가 아니라 `designKey`다.

[`GoodsDetailView.tsx`](../src/features/goods/components/goodsdetail/GoodsDetailView.tsx)의 실제 매핑은 다음과 같다.

```ts
const purchaseImages = {
  userImage: result.representativeKey,
  originalfilepath: result.designKey,
  workingImages: result.workingKeys,
};
```

`flattenedKey`는 현재 editor state 안에 보존되지만 이 구매 매핑에는 들어가지 않는다. 이름만 보고 제작사가 실제로 어떤 필드를 사용하는지 추측하면 안 된다. 이 문서는 프론트가 현재 무엇을 보내는지만 확정해서 설명한다.

`exportFlattened()`의 “흰 배경”은 이미지 전체가 무조건 흰색이라는 뜻도 아니다. 먼저 출력 모양으로 clip한 뒤 그 안을 흰색으로 채우므로 clip 바깥은 투명할 수 있고, `type4/5/6` 제외영역도 다시 투명하게 뚫릴 수 있다.

또 하나의 중요한 현재 계약이 있다. `exportUserLayer()`는 `type4/5/6` 제외영역을 펀칭하지 않으므로 `designKey` 자체에는 그 구멍이 없다. 제외영역이 뚫린 것은 `flattenedKey`인데, 현재 프론트 구매 body는 `originalfilepath: designKey`를 보내고 `flattenedKey`를 보내지 않는다. 백엔드나 제작 단계가 어떤 파일을 실제로 사용하거나 추가 처리하는지는 이 프론트 코드만으로 확정할 수 없으므로 계약 확인이 필요하다.

### 16-2. 업로드는 어떻게 하는가

파일 바이너리를 일반 주문 API body에 넣지 않는다.

```text
PNG/WebP File
→ POST /storage/presigned-url 또는 /storage/presigned-urls
→ { uploadUrl, key, requiredHeaders } 받기
→ uploadUrl로 파일을 PUT
→ 성공하면 key만 보관
```

`uploadUrl`은 업로드할 때만 쓰는 일회성 주소다. state에는 넣지 않는다.

- `designKey` 파일은 업로드 분류 `editor`
- `flattenedKey`, `representativeKey`, 대표 제외 각도 파일들은 업로드 분류 `basket`

대표 파일은 한 번만 업로드한다. 다른 각도 파일들을 업로드한 뒤 그 key 배열의 master 위치에 이미 받은 `representativeKey`를 끼워 `workingKeys`를 만든다. 따라서 `workingKeys[masterIndex]`와 `representativeKey`는 같은 key이고, master 파일을 두 번 업로드하지 않는다.

---

## 17. 편집 state에는 무엇을 저장하고 무엇을 저장하지 않는가

저장되는 모양은 대략 다음과 같다.

```ts
const state = {
  version: 1,
  context: {
    key: "session-abc",
    goodsSn: "123",
    baseId: "MUG-01",
    sizeType: "production",
    width: 1000,
    height: 1000,
    unit: "px",
  },
  document: {
    layers: [
      /* x, y, width, source 등이 든 레이어 */
    ],
    selectedLayerId: "layer-1",
    backgroundColor: null,
  },
  result: {
    status: "ready",
    flattenedKey: "basket/.../diy-flattened.png",
    representativeKey: "basket/.../diy-representative.webp",
    workingKeys: ["basket/.../diy-representative.webp", "basket/.../side.webp"],
    designKey: "editor/.../diy-userlayer.png",
    eligibleSource: { type: "ai", aiid: "AI-77", aiseq: 2 },
    coverageRatio: 0.73,
    createdAt: "...",
  },
  updatedAt: "...",
};
```

저장하는 것과 저장하지 않는 것을 분리하면 이해가 쉽다.

| 저장함                                                | 저장하지 않음              |
| ----------------------------------------------------- | -------------------------- |
| 상품·규격 식별 정보                                   | `CanvasRenderingContext2D` |
| 레이어의 source 식별자(addon은 영구 `imagePath` 포함) | `HTMLImageElement`         |
| `x/y/width/height/rotation`                           | Canvas 픽셀 전체           |
| hidden, locked, flip, zIndex 등                       | `data:` URL, `blob:` URL   |
| 업로드가 끝난 storage key                             | 만료되는 presigned URL     |
| 적용 결과 정보                                        | undo/redo history          |

저장 요청은 다음이다.

```http
POST /base/editor/state
```

```ts
const body = { key: editorKey, state };
```

### 17-1. 현재 코드에는 편집 중 debounce 자동저장이 없다

`EditorView` 파일 맨 위 주석에는 debounce 자동저장처럼 읽히는 오래된 설명이 남아 있지만 실제 실행 코드는 다르다.

현재 서버 저장 시점은 다음 두 경우다.

1. 사용자가 “적용하기”를 눌러 모든 산출물 생성이 성공했을 때
2. 문서가 실제로 사라지는 탭 닫기·새로고침 등의 `pagehide` 때 `keepalive` 요청으로 한 번

드래그할 때마다, 또는 500ms마다 state를 서버에 저장하지 않는다. `PreviewPanel`의 500ms debounce는 Three.js 미리보기 PNG 생성용이지 서버 자동저장용이 아니다.

Next.js 클라이언트 라우터로 화면을 옮기는 모든 경우에 `pagehide`가 발생한다고 보장할 수는 없다. 따라서 “편집 화면에서 나가면 언제나 자동저장된다”라고 이해하면 안 된다.

백엔드 state 계약은 UTF-8 JSON 기준 2MB 이하다. `pagehide` 경로는 `isEditorStateWithinLimit()`가 초과 여부를 확인하고 저장 요청을 생략한다. 적용 저장 경로는 같은 사전검사를 하지 않아, 너무 크면 서버의 400 응답으로 실패한다.

---

## 18. 저장한 편집기를 다시 열면 어떻게 복원되는가

복원은 “Canvas 스크린샷을 불러오기”가 아니다. 숫자와 source를 다시 조립하는 과정이다.

```text
1. GET /goods/:goodsSn/mockup
2. GET /base/:baseId/size-info
3. GET /base/editor/state?key=...
4. 현재 size-info로 createEditorMeta()
5. parseEditorState()
6. manager.loadDocument(layers, selectedLayerId)
7. 각 이미지 레이어 source로 이미지 URL을 다시 조회
8. useEditorImages가 HTMLImageElement를 다시 만듦
9. imageMap이 채워짐
10. EditorCanvas가 레이어 숫자 + 이미지 픽셀을 다시 그림
```

저장된 context의 크기를 그대로 Canvas로 쓰는 것이 아니라 현재 API 규격으로 meta를 다시 만든다. 다만 저장된 레이어의 `x/y/width/height`를 새 meta 비율에 맞춰 다시 확대·축소하는 코드는 없다. 규격이 저장 후 달라지면 Canvas 틀과 예전 레이어 좌표가 어긋날 수 있으므로 별도 마이그레이션이 필요하다.

presigned URL은 만료될 수 있으므로 저장하지 않는다. `ai/edit/file`은 다음처럼 source 식별자를 저장했다가 URL을 다시 받는다.

```text
{ type: "ai", aiid, aiseq }
→ GET /ai/images/:aiid/:seq
→ 새 editSourceImage URL
```

`addon`만 관리자 CDN의 영구 `imagePath`를 source에 함께 저장해 추가 API 없이 다시 사용한다.

`loadDocument()` 직후에는 레이어 숫자가 먼저 복원되고, 실제 이미지 로드는 비동기라 조금 늦을 수 있다. 그래서 적용 버튼은 모든 이미지 레이어가 `imageMap`에 들어올 때까지 기다리도록 검사한다.

---

## 19. 적용 후 상품 상세 화면에서는 무엇을 보여 주나

적용 성공 후 주소는 다음 모양이 된다.

```text
/goods/123?editorKey=session-abc
```

[`GoodsDetailView.tsx`](../src/features/goods/components/goodsdetail/GoodsDetailView.tsx)는 이 key로 editor state를 다시 조회한다.

백엔드는 state의 storage key와 별도로 표시용 만료 URL을 `assets`에 내려줄 수 있다.

```ts
const editorStateResponse = {
  ok: true,
  state: {
    /* 저장한 JSON */
  },
  assets: {
    designUrl: "https://signed...",
    representativeUrl: "https://signed...",
  },
};
```

- `state.result.designKey`는 안정적인 저장·캐시 식별용 key다.
- `assets.designUrl`은 브라우저 `<img>`와 Three.js가 지금 표시할 URL이다.
- `assets.representativeUrl`은 바로구매 `directLine.displayImage`가 되어 결제 화면에 보여 줄 수 있지만, 주문 API에는 이 만료 URL 대신 `representativeKey → userImage`가 들어간다.

상세 갤러리는 업로드한 `workingKeys` 파일들을 바로 표시하는 구조가 아니다. 현재는 다음처럼 다시 합성한다.

```text
assets.designUrl의 투명 디자인
+ 상품 상세 GET /goods/:sn의 mockup 각도들
→ MockupGallery
→ 각 각도 renderMockup()
→ 상세 화면 갤러리
```

`workingKeys`는 구매 데이터로 넘기기 위해 보관한다. 상세 갤러리 표시와 구매용 저장 파일은 역할이 다르다.

---

## 20. 장바구니와 바로구매에 실제로 어떤 값을 보내는가

이 장은 “화면에 보이는 값”과 “서버에 보내는 값”을 구분해서 읽어야 한다.

### 20-1. 적용 결과를 구매용 필드로 바꾸기

상세 화면에서 먼저 다음 매핑을 만든다.

```ts
const applied = {
  userImage: result.representativeKey,
  originalfilepath: result.designKey,
  workingImages: result.workingKeys,
  // 할인 조건을 만족한 경우만 aiid/aiseq 또는 editSn
};
```

새 계약으로 인정하려면 `result.status === "ready"`이고, `result.designKey`와 비어 있지 않은 `result.workingKeys`가 모두 있어야 한다. 예전 저장본에 이 값들이 없으면 적용 구매본으로 사용하지 않는다.

이 장의 `result.* → 구매 필드` 예시는 편집기 적용본 기준이다. 편집기를 사용하지 않고 raw AI/edit/file 작품을 바로 구매하면 `prepareBasketImages()`가 목업 파일들을 만들고, `originalfilepath`에는 `stripUrlSignature(design.designUrl)`로 서명을 제거한 원본 design 경로를 넣는다.

### 20-2. 장바구니 담기

[`PurchasePanel.tsx`](../src/features/goods/components/goodsdetail/PurchasePanel.tsx)의 `submitBasket()`은 선택한 옵션 조합 한 줄마다 [`addBasketItem()`](../src/features/basket/api/basketApi.ts)을 호출한다.

```http
POST /users/basket
```

현재 body는 다음 모양이다.

```ts
const basketBody = {
  productSn: detail.goodsSn,
  productOption: line.productOption,
  cnt: line.cnt,
  ordertype: "normal",

  // DIY일 때만 추가
  userComment: comment || undefined,
  userImage: applied.userImage,
  originalfilepath: applied.originalfilepath,
  workingImages: applied.workingImages,

  // 50% 할인 조건까지 만족한 경우 둘 중 하나
  aiid: "...",
  aiseq: 2,
  // 또는 editSn: "..."
};
```

현재 프론트 코드는 DIY 적용본이어도 이 요청의 `ordertype`에 문자열 `"normal"`을 넣는다. 이름만 보고 다른 값을 상상하지 말고 현재 전송 사실을 기준으로 디버깅해야 한다.

상품 가격은 이 body에 보내지 않는다. 서버가 가격과 할인을 다시 계산한다.

장바구니에서 결제할 때는 이미지 key들을 주문 API에 다시 나열하지 않는다.

```http
POST /orders/goods
```

```ts
const basketOrderBody = {
  // 배송지·결제 공통값들
  clientTotalPrice,
  deliveryPrice,
  usePoint,
  useCash,
  deliveryName,
  deliveryPost,
  deliveryAddr1,
  deliveryAddr2,
  deliveryPhone,
  requestComment,
  payMethod,

  basketItemIdxs: [11, 12],
};
```

주문 요청 타입에는 `couponCode`와 `deliveryEmail` 선택 필드가 선언돼 있지만, 현재 `CheckoutView.handlePay()`가 만드는 실제 `base`에는 둘 다 넣지 않는다. 쿠폰이 선택돼 있으면 현재 결제를 차단하며, 프로필 이메일은 이후 PG 창의 `buyeremail` 표시값으로만 사용한다.

또한 `usePoint`, `useCash`가 0이거나 `deliveryAddr2`, `requestComment`가 빈 문자열이면 코드가 `undefined`로 만들기 때문에 실제 JSON body에서는 해당 필드가 빠진다.

이미지 정보는 이미 `/users/basket`에 저장됐으므로 주문에는 장바구니 항목 번호만 보낸다.

### 20-3. 바로구매

바로구매는 장바구니 서버를 거치지 않는다.

```text
PurchasePanel.submitDirect()
→ Zustand의 directLine에 임시 저장
→ sessionStorage의 "omy-checkout"에 유지
→ /checkout?direct=1 이동
→ CheckoutView.handlePay()
→ POST /orders/goods/direct
```

`directLine`에는 상품명, 화면 표시 이미지, 옵션 이름, 화면 가격처럼 결제 화면에 보여 줄 값도 들어 있다. 하지만 이들 전부를 주문 API에 보내는 것은 아니다.

실제 주문 body의 핵심 모양은 다음과 같다.

```ts
const directOrderBody = {
  // 위 장바구니 주문과 같은 배송·금액·결제 공통값
  clientTotalPrice,
  deliveryPrice,
  usePoint,
  useCash,
  deliveryName,
  deliveryPost,
  deliveryAddr1,
  deliveryAddr2,
  deliveryPhone,
  requestComment,
  payMethod,

  productSn: directLine.productSn,
  items: directLine.items.map((item) => ({
    productOption: item.productOption || undefined,
    cnt: item.cnt,
  })),

  aiid: directLine.aiid,
  aiseq: directLine.aiseq,
  editSn: directLine.editSn,
  userImage: directLine.userImage,
  originalfilepath: directLine.originalfilepath,
  workingImages: directLine.workingImages,
  userComment: directLine.userComment,
};
```

`productName`, `productImage`, `displayImage`, `optionLabel`, `linePrice`, `orgPrice`는 결제 화면 표시용 임시 값이라 이 직접 주문 API body에는 넣지 않는다.

### 20-4. `aiid/aiseq` 또는 `editSn`은 언제 보내나

편집기에 AI 작품이 하나라도 있다는 이유만으로 무조건 보내지 않는다.

[`coverage.ts`](../src/features/goods-editor/lib/coverage.ts)가 보이는 이미지 레이어의 사각 영역을 `100 × 100` 작은 Canvas에 칠해 오마브 작품 비율을 계산한다.

```text
AI 또는 art-edit 소스 면적 비율이 0.5 이상
→ 할인 대상
→ 가장 위에 있는 오마브 레이어 1개의 source 선택
→ aiid/aiseq 또는 editSn을 result와 구매 body에 넣음
```

내 파일만 썼거나 오마브 작품 비율이 50% 미만이면 이미지 key들은 보내더라도 할인 근거 식별자는 보내지 않는다.

여기서 분모는 전체 출력영역이 아니다. AI/edit/file 중 어떤 이미지 레이어의 사각형이라도 칠해진 픽셀만 전체 이미지 면적으로 센다. 아무 이미지도 없는 빈 출력영역은 분모에서 빠진다. 위 레이어가 아래 레이어를 덮으면 위 레이어 색이 남는다.

또한 실제 PNG의 투명 픽셀 모양을 읽는 것이 아니라 레이어의 회전된 사각형 전체를 칠하는 근사 계산이다.

---

## 21. Three.js는 편집기에서만 쓰이는가

아니다. 같은 `renderMockup()`을 입력 출처와 결과 사용법만 바꿔 여러 상황에서 재사용한다.

### 상황 A. 상품 목록·상세에서 작품을 바로 상품에 접목

```text
GET /goods 또는 GET /goods/:sn
→ 응답에 포함된 mockup

AI/edit/file API
→ design URL

MockupImage
→ useMockupPreview
→ renderMockup
```

### 상황 B. 편집기 우측 실시간 미리보기

이 문서에서 가장 자세히 본 흐름이다.

```text
GET /goods/:sn/mockup
→ Canvas에서 편집
→ exportUserLayer의 design URL
→ PreviewPanel
→ useEditorAngleRender
→ renderMockup
```

### 상황 C. 편집기 “적용하기” 파일 생성

```text
같은 투명 design URL
→ master와 다른 각도들을 긴 변 최대 1024px로 renderMockup
→ WebP File
→ 스토리지 업로드
```

### 상황 D. 편집기를 쓰지 않고 바로 장바구니·바로구매

상품 상세에서 raw AI/edit/file 작품을 골랐지만 편집기 “적용하기” 결과가 없는 경우다.

```text
PurchasePanel.submitBasket() 또는 submitDirect()
→ prepareBasketImages()
→ 캐시에 접목본이 없으면 renderMockup()
→ master와 다른 렌더 가능 각도를 WebP로 만들기
→ 스토리지 업로드
→ 접목 WebP key들을 장바구니 또는 directLine에 사용
```

이 경로는 상품 접목 WebP만 업로드해 `userImage/workingImages`를 만든다. 원본 design은 다시 업로드하지 않고 `stripUrlSignature(design.designUrl)`로 presigned query를 제거한 경로를 `originalfilepath`로 사용한다.

반대로 편집기 적용본 `applied`가 있으면 이 재렌더·재업로드 경로를 건너뛰고 이미 업로드된 `userImage/originalfilepath/workingImages` key를 그대로 재사용한다.

결국 핵심 합성 함수는 같다. “무지 사진과 placement가 어디서 왔는가”, “design URL이 원래 작품인가 Canvas export인가”, “결과를 화면에만 보이나 File로 저장하나”가 다를 뿐이다.

---

## 22. 기능을 고칠 때 어디부터 봐야 하나

### 22-1. 편집기 페이지로 어떤 source가 들어오는지 바꾸고 싶다

순서대로 본다.

1. [`page.tsx`](<../src/app/(detail)/goods/[goodsSn]/editor/page.tsx>)
2. [`editorTypes.ts`](../src/features/goods-editor/model/editorTypes.ts)의 `EditorSource`
3. [`editorSourceApi.ts`](../src/features/goods-editor/api/editorSourceApi.ts)
4. [`useEditorImages.ts`](../src/features/goods-editor/queries/useEditorImages.ts)

새 source 종류를 추가한다면 저장과 복원 때도 URL을 다시 구할 수 있어야 한다.

### 22-2. 처음 들어온 이미지 크기나 위치를 바꾸고 싶다

1. [`bootstrapMeta.ts`](../src/features/goods-editor/lib/bootstrapMeta.ts) — 편집 사각형 비율
2. [`canvasTypes.ts`](../src/features/goods-editor/canvas/canvasTypes.ts) — 700, 60, 0.8 같은 기본값
3. [`CanvasManager.ts`](../src/features/goods-editor/canvas/CanvasManager.ts)의 `addImage()` — contain 계산과 중앙 배치

### 22-3. 드래그·스냅·회전·리사이즈를 바꾸고 싶다

1. [`EditorCanvas.tsx`](../src/features/goods-editor/components/EditorCanvas.tsx) — 포인터 이벤트와 좌표 변환
2. [`SelectionHandles.tsx`](../src/features/goods-editor/components/SelectionHandles.tsx) — 크기·회전 손잡이
3. [`CanvasManager.ts`](../src/features/goods-editor/canvas/CanvasManager.ts) — 실제 숫자 계산

화면에 이상하게 보인다고 무조건 `EditorCanvas`만 고치면 안 된다. 먼저 잘못된 것이 이벤트 좌표인지, manager의 레이어 숫자인지, 실제 그리기인지 나눈다.

### 22-4. Canvas에 그리는 방식이나 필터를 바꾸고 싶다

1. [`drawItems.ts`](../src/features/goods-editor/canvas/drawItems.ts)
2. [`EditorCanvas.tsx`](../src/features/goods-editor/components/EditorCanvas.tsx)의 clip과 redraw effect
3. [`exportCanvas.ts`](../src/features/goods-editor/lib/exportCanvas.ts)

화면만 바꾸고 export를 잊지 않으려면 가능하면 화면과 export가 함께 사용하는 `drawItems()`를 고친다.

### 22-5. 우측 미리보기 갱신 속도나 각도를 바꾸고 싶다

1. [`PreviewPanel.tsx`](../src/features/goods-editor/components/PreviewPanel.tsx) — 500ms, 각도 목록, 256/512 크기
2. [`useEditorAngleRender.ts`](../src/features/goods-editor/queries/useEditorAngleRender.ts) — 각도별 비동기 상태와 object URL 수명
3. [`renderQueue.ts`](../src/features/goods/mockup/renderQueue.ts) — 렌더 요청 순서와 캐시

### 22-6. 상품에 붙는 위치·곡률·모양을 바꾸고 싶다

먼저 Network에서 백엔드 placement가 올바른지 확인한다. 그다음 다음 파일을 본다.

1. [`types.ts`](../src/features/goods/mockup/types.ts) — 필드 사전과 타입 분류
2. [`renderer.ts`](../src/features/goods/mockup/renderer.ts)
   - `buildFlatMesh()`
   - `buildCylinderMesh()`
   - `buildExcludeMesh()`

상품마다 전부 같은 방향으로 틀리면 renderer 계산 문제일 가능성이 크다. 특정 상품 한 각도만 틀리면 그 각도의 백엔드 placement 값부터 의심한다.

### 22-7. 적용 파일과 업로드를 바꾸고 싶다

1. [`EditorView.tsx`](../src/features/goods-editor/components/EditorView.tsx)의 apply mutation
2. [`mockupRepresentative.ts`](../src/features/goods-editor/lib/mockupRepresentative.ts)
3. [`exportCanvas.ts`](../src/features/goods-editor/lib/exportCanvas.ts)
4. [`applyEditor.ts`](../src/features/goods-editor/lib/applyEditor.ts)
5. [`storage.ts`](../src/lib/api/storage.ts)

### 22-8. 장바구니·바로구매로 넘기는 값을 바꾸고 싶다

1. [`GoodsDetailView.tsx`](../src/features/goods/components/goodsdetail/GoodsDetailView.tsx) — result key 매핑
2. [`PurchasePanel.tsx`](../src/features/goods/components/goodsdetail/PurchasePanel.tsx) — 장바구니와 directLine 구성
3. [`basketApi.ts`](../src/features/basket/api/basketApi.ts) — `/users/basket` body 타입
4. [`CheckoutView.tsx`](../src/features/order/components/checkout/CheckoutView.tsx) — 실제 주문 body 구성
5. [`types.ts`](../src/features/order/types.ts) — 주문 요청 계약

---

## 23. 브라우저 개발자 도구로 직접 따라가는 실습

문서를 읽는 것보다 한 번 멈춰서 값을 보는 것이 훨씬 빨리 이해된다.

### 실습 1. 백엔드 값 확인

1. Chrome 개발자 도구를 연다.
2. `Network` 탭을 연다.
3. 편집기 페이지를 새로고침한다.
4. `mockup`을 검색한다.
5. `/goods/:goodsSn/mockup` 응답에서 다음만 찾는다.
   - `baseId`
   - `master.imagePath`
   - `master.placement`
   - `master.overlay`
6. `size-info` 요청에서 `production`, `print`, 최상위 `width/height`를 찾는다.
7. `editor/state` 요청에서 처음이면 `state: null`인지 확인한다.

목표는 응답 전체를 이해하는 것이 아니다. 위 네 값이 어디에 있는지만 확인하면 된다.

### 실습 2. AI URL이 실제 이미지 객체가 되는 지점

다음 함수에 breakpoint를 건다.

```text
editorSourceApi.ts → resolveEditorSourceUrl()
EditorView.tsx     → loadEditorImage(url) 바로 전
CanvasManager.ts   → addImage()
```

다음 값을 순서대로 본다.

```text
source
→ url
→ img.naturalWidth / img.naturalHeight
→ 새 layer의 x/y/width/height
```

이 네 단계가 보이면 “API 데이터가 Canvas 레이어가 되는 과정”을 이해한 것이다.

### 실습 3. 드래그 한 번 따라가기

다음에 breakpoint를 건다.

```text
EditorCanvas.onPointerDown
CanvasManager.hitTest
CanvasManager.moveSelectedBy
useGoodsEditorStore의 sync
EditorCanvas의 redraw useEffect
```

그림을 조금 오른쪽으로 끌면서 다음을 확인한다.

- `clientX`와 변환된 Canvas `x`가 다른가?
- `dx`가 얼마인가?
- 선택 레이어의 `x`가 얼마나 바뀌었나?
- `items`가 새 배열이 됐나?
- `clearRect()` 뒤 `drawItems()`가 다시 불렸나?

### 실습 4. Canvas와 Three.js의 경계 보기

다음에 breakpoint를 건다.

```text
PreviewPanel의 exportUserLayer() 호출 줄
useEditorAngleRender의 renderMockup() 호출 줄
renderer.ts의 renderMockup() 시작
```

`designUrl`의 앞부분을 본다.

```text
data:image/png;base64,
```

그리고 `renderMockup()` 입력에서 다음을 각각 펼친다.

```text
baseImageUrl  // 상품 API에서 온 URL
designUrl     // Canvas가 방금 만든 data URL
placement     // 상품 API에서 온 숫자 배열
overlay       // 상품 API에서 온 효과 정보
```

이 네 값을 구분할 수 있으면 Three.js 입력을 이해한 것이다.

### 실습 5. 적용 결과와 구매 매핑 보기

다음 순서로 breakpoint를 건다.

```text
EditorView의 apply mutation
→ applyEditor()의 return 직전
→ saveEditorState()
→ GoodsDetailView의 applied useMemo
→ PurchasePanel.submitBasket 또는 submitDirect
```

다음 매핑을 눈으로 확인한다.

```text
result.designKey         → originalfilepath
result.representativeKey → userImage
result.workingKeys       → workingImages
result.flattenedKey      → 현재 구매 body에는 없음
```

### 실습 6. Network에서 최종 요청 확인

장바구니라면 `/users/basket`, 바로구매라면 `/orders/goods/direct` 요청의 `Payload`를 연다.

문서의 예시를 믿는 것보다 현재 실행 요청을 직접 보는 습관이 중요하다. 프론트 타입, 백엔드 계약, 코드가 나중에 바뀌어도 Network가 지금 브라우저가 보낸 사실을 보여 준다.

---

## 24. 문제가 생겼을 때 가장 빠른 진단표

| 증상                                       | 가장 먼저 확인할 값                                | 볼 파일                                      |
| ------------------------------------------ | -------------------------------------------------- | -------------------------------------------- |
| 편집기에 첫 이미지가 안 보임               | source API 응답 URL, `imageMap.has(layer.id)`      | `editorSourceApi.ts`, `useEditorImages.ts`   |
| 저장본 레이어는 있는데 그림이 투명함       | source 재조회 성공 여부, `imagesReady`             | `EditorView.tsx`, `useEditorImages.ts`       |
| 마우스 위치와 선택 위치가 어긋남           | DOM `rect.width`와 `meta.canvasW` 비율             | `EditorCanvas.toCanvasCoords()`              |
| 드래그 숫자는 바뀌는데 화면이 안 바뀜      | `emit()` → store `sync()` → items 참조 변경        | `CanvasManager.ts`, `useGoodsEditorStore.ts` |
| 회전했더니 그림이 다른 곳으로 감           | 중심 `cx/cy`, `save/translate/rotate/restore`      | `drawItems.ts`                               |
| Canvas에는 보이는데 미리보기가 늦음        | 500ms debounce, 렌더 큐 상태                       | `PreviewPanel.tsx`, `renderQueue.ts`         |
| 평면 시안은 맞는데 상품에 붙는 위치가 틀림 | 해당 각도의 `placement`                            | Network, `renderer.ts`                       |
| 특정 각도가 목록에 아예 안 보임            | `imagePath`, 디자인 placement, 상세이면 `viewable` | `isRenderableMockup()`, `MockupGallery`      |
| 각도는 있는데 합성 결과가 실패함           | angle status, WebGL·이미지 로드·CORS 오류          | `useEditorAngleRender.ts`, `renderer.ts`     |
| 상품 손잡이·카메라 구멍을 디자인이 덮음    | `type4/5/6` 제외영역                               | 목업 API, `buildExcludeMesh()`               |
| 주름·광택이 안 보임                        | `overlay.file` 로드와 CORS                         | `renderer.ts` overlay 구간                   |
| 적용하기가 안 됨                           | 출력 spec, `imagesReady`, master render 가능 여부  | `EditorView.tsx`                             |
| 상세 복귀 후 적용본이 아님                 | `editorKey`, state의 `designKey/workingKeys`       | `GoodsDetailView.tsx`                        |
| 장바구니 이미지가 틀림                     | 세 key 매핑과 `/users/basket` payload              | `GoodsDetailView.tsx`, `PurchasePanel.tsx`   |

진단 원칙은 간단하다.

```text
API 입력이 틀렸나?
→ 레이어 숫자가 틀렸나?
→ Canvas PNG가 틀렸나?
→ placement가 틀렸나?
→ Three 결과가 틀렸나?
→ 업로드 key 매핑이 틀렸나?
```

앞 단계 결과부터 확인하면 원인을 빨리 좁힐 수 있다.

---

## 25. 현재 코드의 한계와 주의점

아래는 이론이 아니라 현재 구현을 읽고 확인한 내용이다. 새 기능을 만들 때 “당연히 되겠지”라고 가정하면 안 되는 부분이다.

### 25-1. 레이어 `opacity`는 현재 실제 그리기에 적용되지 않는다

`EditorLayerBase`에는 `opacity`가 있지만 `drawItems()`가 `ctx.globalAlpha = item.opacity`를 설정하지 않는다.

따라서 state 숫자만 바꿔도 현재 화면과 export 투명도는 달라지지 않는다. 투명도 기능을 완성하려면 `save()` 뒤 `globalAlpha`를 적용하고 화면·export가 모두 같은 `drawItems()`를 쓰는지 검사해야 한다.

### 25-2. 일반 placement의 `visible`, `opacity`도 현재 무시된다

타입에는 선언되어 있지만 일반 디자인 Mesh를 만들 때 renderer가 이 값들을 확인하지 않는다. 다만 overlay의 `opacity`는 사용한다.

### 25-3. 디자인 placement가 여러 개여도 첫 번째 것만 사용한다

`findPrimaryDesignPlacement()`는 `type1/2/3/cylinder` 중 첫 번째 항목 하나를 고른다. 한 상품 각도에 디자인 영역이 여러 개라면 현재 renderer는 모두 렌더하지 않는다.

### 25-4. 원통 `rotationZ`는 현재 사용하지 않는다

타입에 값은 있지만 `buildCylinderMesh()`가 읽지 않는다. 원통의 회전을 추가하려면 API 단위와 중심을 먼저 정하고 renderer를 수정해야 한다.

### 25-5. 회전된 레이어의 스냅·크기 계산은 완전한 외곽선 계산이 아니다

클릭 판정은 포인터를 역회전해 비교한다. 하지만 스냅과 일부 드래그·리사이즈 기준은 저장된 `x/y/width/height` 사각형을 중심으로 계산한다. 회전 후 화면에 보이는 정확한 바깥 AABB와 항상 같지는 않다.

### 25-6. `baseImage`는 lock이 아니다

`baseImage: true`는 첫 진입 작품 표시와 일반 삭제 버튼의 보호에 쓰인다. 커버리지 계산은 이 플래그를 읽지 않고 source 종류, hidden 여부, 레이어 순서를 본다. `locked`와 별개이며 이동은 가능하고, 전체 `reset()`은 baseImage도 제거한다.

### 25-7. 미리보기의 “flat”은 placement type이 아니다

현재 UI에서 `flat`은 Three.js 상품 합성을 하지 않는 평면도를 가리키는 내부 이름·키다. 백엔드 디자인 placement 종류에는 `flat`이 없다.

### 25-8. 자동저장에 관한 오래된 주석이 있다

- `EditorView.tsx` 상단은 debounce 자동저장을 언급하지만 실행 코드는 적용·`pagehide` 저장이다.
- `useEditorData.ts` 상단은 mockup이 상품 상세에 embedded되어 EditorView가 읽는다고 적혀 있지만, 현재 `EditorView`는 전용 `useGoodsMockupQuery()`를 사용한다.

코드는 동작의 근거이고 주석은 설명일 뿐이다. 둘이 다르면 호출부와 실행 코드를 기준으로 판단하고 주석을 함께 고치는 것이 좋다.

### 25-9. 저장할 다른 각도 수에는 제한이 있다

활성 `EditorView`는 대표를 포함한 렌더 가능한 전체 preview가 20장을 넘으면 먼저 오류를 낸다. 즉 정상 master 한 장이 있으면 나머지 렌더 가능한 각도는 최대 19장이다. 내부 `renderMockupWorkingFiles()`에도 대표 제외 입력 20장 제한이 한 번 더 있다.

편집기를 쓰지 않는 구매의 `prepareBasketImages()`도 대표 포함 preview가 20장을 넘으면 차단한다.

### 25-10. 현재 구매 원본의 해상도와 제외영역 계약을 확인해야 한다

기본 정사각 meta에서 `designKey`는 중앙 80%인 약 `464 × 464px`의 `exportUserLayer()` 결과이며 제작 규격으로 확대하지 않는다. 이 파일에는 `type4/5/6` 제외 구멍도 없다. 반면 고해상도와 제외 구멍은 `flattenedKey`에만 반영되지만 현재 구매 body에는 들어가지 않는다.

따라서 `originalfilepath: designKey`가 실제 제작에 충분한 해상도인지, 제외영역은 어느 단계가 처리할지, `flattenedKey`를 별도로 보내야 하는지는 백엔드·제작팀 계약을 확인해야 한다. 프론트 코드만 보고 의도를 확정할 수 없다.

### 25-11. 직사각형 원형 clip은 화면과 export가 다를 수 있다

`EditorCanvas.buildShapePath()`의 ellipse는 `w/2`, `h/2` 반지름을 사용한 타원이다. 하지만 `exportCanvas.applyClip()`은 `min(w,h)/2 + 2` 반지름을 사용한 원이다. type3 규격이 정사각형이면 거의 같지만 직사각형이면 화면에서 보던 clip과 export 모양이 달라질 수 있다.

### 25-12. pagehide 저장의 document와 result 시점이 다를 수 있다

적용 후 레이어를 다시 수정하고 재적용하지 않은 채 `pagehide` 저장이 실행되면, 최신 레이어 document와 `lastResultRef`에 남은 직전 적용 이미지 result가 한 state에 저장될 수 있다. 즉 “현재 편집 숫자”와 “마지막으로 적용해 업로드한 결과”가 잠시 다른 시점일 수 있다.

### 25-13. 클릭 판정은 실제 불투명 픽셀이 아니라 사각형 기준이다

`hitTest()`는 포인터를 레이어 회전의 반대 방향으로 돌린 뒤 `width × height` 사각형 안인지 본다. PNG의 투명 픽셀이나 Canvas clip 모양은 확인하지 않는다. 그래서 그림의 투명 여백이나 화면에서 clip 밖으로 숨은 레이어 부분을 눌러도 선택될 수 있다.

### 25-14. 작은 원본 이미지도 처음 배치할 때 확대될 수 있다

`addImage()`의 `fitScale`은 `min(areaW / naturalWidth, areaH / naturalHeight)`이며 최대값을 1로 제한하지 않는다. 따라서 중앙 영역보다 작은 원본도 영역에 맞게 확대될 수 있다. 레이어 픽셀 크기가 커져도 원본 해상도가 늘어나는 것은 아니므로 export가 흐려질 수 있다.

### 25-15. 새 빈 편집기의 첫 레이어 추가는 undo되지 않는다

새 `CanvasManager`는 빈 문서를 history의 첫 baseline으로 기록하지 않는다. 첫 `addImage()` 또는 `addText()` 결과가 history의 첫 snapshot이 되므로 그 순간에는 `canUndo()`가 false다. 저장본을 `loadDocument()`한 경우에는 복원 문서를 baseline으로 기록하므로 이후 작업의 undo가 정상적으로 시작된다.

---

## 26. 완전 초보자용 용어 사전

| 용어           | 이 프로젝트에서의 뜻                                                         |
| -------------- | ---------------------------------------------------------------------------- |
| API            | 프론트가 백엔드에 데이터를 요청하는 약속                                     |
| response       | 백엔드가 돌려준 데이터                                                       |
| React Query    | API 요청 결과, 로딩, 캐시를 관리하는 도구                                    |
| Zustand        | React 여러 컴포넌트가 함께 보는 편집 상태 저장소                             |
| source         | 이미지 자체가 아니라 다시 이미지를 찾을 식별 정보                            |
| layer          | 그림 한 장 또는 텍스트 한 개와 그 위치 숫자 묶음                             |
| Canvas         | 브라우저의 픽셀 그림판                                                       |
| context, `ctx` | Canvas에 선·텍스트·이미지를 그리는 도구                                      |
| `drawImage`    | 이미지 픽셀을 Canvas에 그리는 함수                                           |
| redraw         | 기존 Canvas를 지우고 현재 state로 전부 다시 그리기                           |
| clip           | 특정 모양 안쪽만 보이게 제한하기                                             |
| crop           | 이미지의 필요한 사각 부분만 잘라 결과로 만들기                               |
| contain        | 원본 비율을 유지하며 영역 안에 전체가 들어오게 맞추기                        |
| offset         | 좌표를 일정 값만큼 옮기는 값                                                 |
| debounce       | 변화가 멈춘 뒤 일정 시간 후 한 번 실행하기                                   |
| data URL       | 이미지 내용을 base64 긴 문자열에 담은 형태                                   |
| Blob           | 브라우저 메모리의 파일 같은 바이너리 데이터                                  |
| object URL     | Blob을 잠시 `<img>`에 보여 주기 위한 `blob:` 주소                            |
| CORS           | 다른 출처의 이미지를 Canvas에서 안전하게 읽을 수 있는지 정하는 브라우저 규칙 |
| presigned URL  | 제한된 시간 동안 스토리지 업로드를 허용하는 서명 주소                        |
| storage key    | 업로드된 파일의 안정적인 식별 경로                                           |
| mockup         | 무지 상품 사진에 디자인을 붙여 보는 합성 정보와 결과                         |
| placement      | 디자인을 상품 사진의 어디에 어떤 모양으로 붙일지 적은 숫자                   |
| overlay        | 디자인 위에 덮는 주름·빛·그림자 이미지                                       |
| Texture        | Three.js가 사용할 이미지 데이터                                              |
| Geometry       | Three.js에서 이미지를 붙일 판의 모양                                         |
| Material       | 그 판이 어떤 texture와 투명 규칙을 쓸지 정한 것                              |
| Mesh           | Geometry와 Material을 합친 실제 장면 물체                                    |
| Scene          | Mesh들을 모아 둔 장면                                                        |
| Camera         | Scene을 바라보는 눈                                                          |
| Renderer       | Camera가 보는 Scene을 최종 픽셀로 그리는 도구                                |
| 라디안         | Canvas 레이어 회전에 쓰는 각도 단위. `Math.PI`가 180도                       |

---

## 27. 혼자 새 기능을 개발할 때 쓰는 추적 공식

앞으로 이 코드가 바뀌어도 다음 여덟 질문을 순서대로 적으면 흐름을 잃지 않는다.

1. 입력은 어디서 오는가? URL인가, API response인가, 사용자 이벤트인가?
2. 입력의 TypeScript 타입은 어느 파일에 있는가?
3. API raw 값을 화면용 값으로 고르는 함수는 무엇인가?
4. 그 값은 React state, Zustand, CanvasManager 중 어디에 보관되는가?
5. 어느 함수가 실제 픽셀을 그리는가?
6. 화면용 결과와 업로드용 결과가 같은가, 별도 export인가?
7. 서버에는 URL, 파일, key, JSON 중 무엇을 저장하는가?
8. 장바구니·상세·주문 중 누가 그 저장 결과를 다시 사용하는가?

예를 들어 “레이어 투명도 기능”을 추가한다면 다음처럼 추적한다.

```text
입력 UI 슬라이더
→ CanvasManager가 opacity 변경
→ emit()
→ Zustand items 변경
→ drawItems에서 ctx.globalAlpha 적용
→ EditorCanvas 화면 확인
→ exportUserLayer/exportFlattened도 같은 drawItems라 적용 확인
→ state.layers.opacity 저장·복원 확인
→ Three.js는 투명 PNG만 받으므로 별도 레이어 opacity를 알 필요 없음
```

이런 식으로 입력부터 마지막 소비자까지 한 줄로 연결하면 중간 하나를 빼먹지 않는다.

---

## 28. 스스로 만들어 볼 작은 연습 세 가지

큰 기능을 바로 만들지 말고 아래 순서로 연습하면 구조가 몸에 들어온다.

### 연습 1. 선택 레이어를 10px 오른쪽으로 보내는 버튼

목표 흐름:

```text
버튼 클릭
→ manager.beginDrag()
→ manager.moveSelectedBy(10, 0)
→ manager.endDrag()
→ emit
→ redraw
→ 미리보기 500ms 후 갱신
```

이 연습으로 UI → manager → Canvas → Three 전체 연결을 볼 수 있다.

### 연습 2. 레이어 opacity를 실제로 적용

목표 흐름:

```text
CanvasManager 인터페이스와 구현에 setOpacity(0~1) 추가
→ setFilter()를 참고해 선택 레이어 변경 + history commit
→ LayerInspector에 슬라이더 추가
→ 슬라이더가 manager.setOpacity() 호출
→ drawItems의 ctx.save() 뒤
→ ctx.globalAlpha 설정
→ 화면 Canvas 확인
→ exportUserLayer 확인
→ 적용 후 상세 목업 확인
```

현재는 opacity를 바꾸는 공개 manager 메서드와 UI가 모두 없으므로 `drawItems` 한 줄만 추가해서는 기능이 완성되지 않는다. 이 연습으로 입력 UI → 상태 변경 → history → 공용 렌더 → export 전체를 연결하는 법을 배울 수 있다.

### 연습 3. placement 값을 화면에 개발용으로 표시

`PreviewPanel`의 선택 각도 아래에 개발 모드에서만 다음을 보여 주는 작은 패널을 만든다.

```text
type
position
width / height
rotation
cameratype
overlay.file 존재 여부
```

상품 합성이 틀렸을 때 백엔드 입력 문제와 renderer 문제를 구분하는 훈련이 된다.

---

## 29. 이해 확인 문제와 정답

### 문제 1

사용자가 Canvas의 레이어를 오른쪽으로 옮기면 Three.js의 `placement.position.x`도 바뀌는가?

정답: 아니다. 바뀐 위치는 Canvas가 만든 투명 PNG 안에 구워진다. placement는 상품별 관리자 데이터 그대로다.

### 문제 2

Canvas는 그림 레이어를 객체로 기억하는가?

정답: 아니다. Canvas에는 픽셀만 남는다. 레이어는 CanvasManager와 Zustand가 기억하며 변경할 때 전체를 다시 그린다.

### 문제 3

AI API가 Canvas에 바로 이미지를 그려 주는가?

정답: 아니다. API는 이미지 URL을 주고, 프론트가 `HTMLImageElement`로 로드한 뒤 `drawImage()`로 그린다.

### 문제 4

Three.js가 받는 디자인은 레이어 배열인가?

정답: 아니다. `exportUserLayer()`가 만든 투명 PNG 한 장이다.

### 문제 5

Three.js의 결과는 계속 움직이는 3D 화면인가?

정답: 아니다. 현재 코드는 한 프레임 렌더 후 WebP Blob을 만들어 일반 `<img>`에 보여 준다.

### 문제 6

편집기 “적용하기” 결과를 구매할 때 `originalfilepath`에는 어떤 key가 들어가는가?

정답: 투명 사용자 레이어인 `result.designKey`다. `flattenedKey`가 아니다. 편집기를 쓰지 않은 raw 작품 구매는 별도로 `prepareBasketImages()`가 서명을 뗀 원본 design 경로를 만든다.

### 문제 7

장바구니 결제의 `/orders/goods`에 이미지 key를 또 보내는가?

정답: 아니다. `/users/basket`에 이미 저장했으므로 `basketItemIdxs`를 보낸다.

### 문제 8

편집기 `PreviewPanel`의 500ms debounce는 서버 자동저장인가?

정답: 아니다. Three.js 미리보기용 투명 PNG 생성을 늦추는 것이다.

---

## 30. 마지막 한 페이지 요약

### 편집 시작

```text
page.tsx가 URL 번호를 EditorSource로 만듦
→ EditorView가 목업·규격·저장 state 요청
→ createEditorMeta로 화면 좌표 계산
→ CanvasManager 생성
→ 저장본 복원 또는 source 이미지 addImage
```

### Canvas 편집

```text
source API URL
→ HTMLImageElement
→ imageMap

CanvasManager의 레이어 숫자
+ imageMap의 실제 픽셀
→ drawItems
→ EditorCanvas
```

### 마우스 이동

```text
화면 좌표
→ Canvas 논리 좌표
→ hitTest/select/beginDrag
→ moveSelectedBy
→ emit
→ Zustand items 갱신
→ Canvas 전체 redraw
```

### Three.js 실시간 미리보기

```text
Canvas 레이어들
→ exportUserLayer
→ 투명 PNG designUrl

designUrl
+ angle.imagePath
+ angle.placement
+ angle.overlay
→ renderMockup
→ WebP blob URL
→ <img>
```

### 적용과 저장

```text
designKey         = 투명 사용자 디자인
flattenedKey      = 제작 규격 평면 PNG
representativeKey = 대표 상품 접목 WebP
workingKeys       = 대표 포함 전체 각도 접목 WebP 배열
```

```text
파일들
→ presigned URL 발급
→ 스토리지 PUT
→ key들로 EditorResult 생성
→ POST /base/editor/state
```

### 편집기 적용본 구매

```text
representativeKey → userImage
designKey         → originalfilepath
workingKeys       → workingImages
flattenedKey      → 현재 구매 body에는 들어가지 않음
```

마지막으로 이 문장 하나만 정확히 기억하자.

> Canvas는 사용자가 디자인 내부를 편집하고, Three.js는 Canvas가 완성한 투명 디자인 한 장을 백엔드 placement대로 상품 사진에 붙인다.

이 문장을 실제 코드의 `EditorView → PreviewPanel → exportUserLayer → useEditorAngleRender → renderMockup` 순서와 연결해서 말할 수 있다면, 이제 이 프로젝트의 Canvas + Three.js 핵심 흐름을 이해한 것이다.
