# Canvas + Three.js 편집기 — 처음 읽는 핵심 강의

이 문서는 처음 보는 사람도 약 10~15분 안에 전체 길을 잡도록 만든 입문편이다.

세부 수식, 모든 placement 필드, 현재 구현 한계까지 확인할 때만 [상세 참고 문서](./three-canvas-editor-reference.md)를 열면 된다. 처음에는 이 문서만 읽자.

한 번에 끝까지 읽을 필요도 없다.

```text
지금 먼저 읽기: 1~10장  → Canvas와 Three.js 연결 이해
그다음 읽기:   11~13장 → 적용·저장·구매 이해
개발할 때 보기: 14~16장 → 파일 위치·디버깅·주의점
```

## 1. 결론부터 한 줄

```text
백엔드에서 디자인 이미지 주소를 받는다
→ Canvas에서 사용자가 위치·크기·회전을 편집한다
→ Canvas 결과를 투명 PNG 한 장으로 만든다
→ Three.js가 그 PNG를 무지 상품 사진에 붙인다
→ 완성 파일을 업로드한다
→ 파일 key를 장바구니·주문에 보낸다
```

Canvas와 Three.js의 역할은 완전히 다르다.

| 도구     | 이 프로젝트에서 하는 일                                  |
| -------- | -------------------------------------------------------- |
| Canvas   | 사용자가 디자인을 이동·회전·확대하는 2D 편집기           |
| Three.js | 편집 결과 PNG를 컵·티셔츠 같은 상품 사진에 합성하는 도구 |

Three.js가 Canvas 레이어들을 직접 받는 것이 아니다.

```text
Canvas 레이어 여러 개
→ exportUserLayer()
→ 투명 PNG 한 장
→ Three.js의 designUrl
```

이 연결 하나가 전체 기능의 핵심이다.

---

## 2. 정말 기초: Canvas가 무엇인가

Canvas는 브라우저가 제공하는 빈 그림판이다.

```html
<canvas width="700" height="700"></canvas>
```

다음 코드는 이미지를 Canvas의 `(100, 50)` 위치에 `300 × 200` 크기로 그린다.

```ts
const ctx = canvas.getContext("2d");
ctx.drawImage(image, 100, 50, 300, 200);
```

Canvas 좌표는 왼쪽 위 `(0,0)`에서 시작한다.

```text
(0,0) ─────────→ x가 커지면 오른쪽
  │
  │
  ▼
y가 커지면 아래쪽
```

가장 중요한 사실은 이것이다.

> Canvas는 “고양이 레이어가 여기 있다”라고 기억하지 않는다. 그린 픽셀만 남긴다.

그래서 그림을 움직일 때 실제로는 다음 작업을 한다.

```text
레이어의 x 숫자 변경
→ Canvas 전체 지우기
→ 모든 레이어 다시 그리기
```

이 프로젝트에서 역할은 다음처럼 나뉜다.

- `CanvasManager`: 레이어의 `x/y/width/height/rotation` 숫자를 관리하는 프로젝트 자체 코드
- Zustand store: manager의 최신 숫자를 React에 전달
- `EditorCanvas`: 실제 `<canvas>`를 만들고 전체를 다시 그림
- `drawItems`: 각 이미지·텍스트 픽셀을 그리는 공용 함수

`CanvasManager`라는 이름 때문에 헷갈리지만, 이 객체는 `<canvas>`를 만들거나 `drawImage()`를 실행하지 않는다.

Fabric.js와 Konva도 사용하지 않는다. 브라우저 기본 Canvas 2D API를 직접 사용한다.

---

## 3. 정말 기초: Three.js가 무엇인가

이 프로젝트는 실제 컵 3D 모델 파일을 불러와 계속 돌리는 구조가 아니다.

투명 필름을 차례대로 포갠 뒤 한 번 사진 찍는다고 생각하면 된다.

```text
뒤
1. 무지 상품 사진
2. 사용자의 투명 디자인
3. 손잡이·카메라 구멍 같은 상품 원본 조각
4. 주름·빛·그림자 overlay
앞

→ 한 번 렌더
→ WebP 이미지 한 장
→ 일반 <img>로 표시
```

Three.js 용어도 이 비유로 이해하면 된다.

| 용어     | 쉬운 뜻                                    |
| -------- | ------------------------------------------ |
| Texture  | Three.js가 사용할 사진                     |
| Geometry | 사진을 붙일 판의 모양                      |
| Material | 판에 어떤 사진과 투명 규칙을 쓸지 정한 것  |
| Mesh     | Geometry + Material, 즉 사진 붙은 판 한 장 |
| Scene    | 판들을 포개 놓는 작업대                    |
| Camera   | 작업대를 바라보는 눈                       |
| Renderer | 눈에 보이는 장면을 최종 이미지로 찍는 도구 |

현재 코드는 `three`를 직접 사용한다. React Three Fiber를 사용하지 않는다. 조명과 애니메이션 루프도 없다.

---

## 4. “부트스트랩”은 Bootstrap CSS 라이브러리가 아니다

코드 주석의 `부트스트랩(bootstrap)`은 다음 뜻이다.

> 편집기를 처음 사용할 수 있게 데이터와 상태를 준비하는 초기화 작업

```text
상품 목업 받기
→ 제작 크기 받기
→ 저장한 편집 상태 받기
→ Canvas 크기 계산
→ CanvasManager 생성
→ 저장본 복원 또는 첫 이미지 추가
```

Bootstrap CSS를 설치했다는 뜻이 아니다.

---

## 5. 실제 시작 파일과 API

시작 파일은 [`page.tsx`](<../src/app/(detail)/goods/[goodsSn]/editor/page.tsx>)다.

예시 URL을 보자.

```text
/goods/123/editor?key=session-abc&aiid=AI-77&seq=2
```

```text
goodsSn=123       → 어떤 상품인가
key=session-abc   → 어느 편집 상태를 저장·복원할까
aiid=AI-77&seq=2  → 처음 넣을 AI 그림은 무엇인가
```

`page.tsx`가 다음 source를 만들어 `EditorView`에 넘긴다.

```ts
const source = { type: "ai", aiid: "AI-77", aiseq: 2 };
```

source는 이미지 자체가 아니라 이미지를 다시 찾기 위한 정보다.

[`EditorView.tsx`](../src/features/goods-editor/components/EditorView.tsx)는 다음 데이터를 받는다.

| 요청                                  | 핵심 응답 값                                 | 어디에 사용하나                                |
| ------------------------------------- | -------------------------------------------- | ---------------------------------------------- |
| `GET /goods/:goodsSn/mockup`          | `baseId`, `master`, `images`                 | 각 사진 안에 상품 URL·placement·overlay가 있음 |
| `GET /base/:baseId/size-info`         | `sizeInfo[].type/w/h`, 최상위 `width/height` | Canvas 비율과 제작 PNG 크기                    |
| `GET /base/editor/state?key=...`      | 저장한 `layers`, `result`                    | 과거 편집 복원                                 |
| `GET /ai/images/:aiid/:seq`           | `editSourceImage`, 없으면 `thumbImage`       | AI 디자인 URL                                  |
| `GET /users/mypage/art-edits/:editSn` | `resultImg`                                  | art-edit 디자인 URL                            |
| `GET /users/mypage/files/:idx`        | `imagePath`                                  | 내 파일 디자인 URL                             |

실제 Network 주소에는 API 기본 주소나 `/v1`이 앞에 붙을 수 있다.

`resolveOutputSpec()`은 `sizeInfo[]`에서 유효한 `type: "production"`의 `w/h`를 먼저 고르고, 없으면 `type: "print"`의 `w/h`, 그것도 없으면 응답 최상위 `width/height`를 사용한다.

목업 응답은 아주 쉽게 다음 재료다.

```text
master.imagePath       = 대표 무지 상품 사진
master.placement       = 대표 사진에 붙일 위치·크기·모양
master.overlay         = 대표 사진에 덮을 그림자·광택
images[].imagePath     = 옆면·뒷면 무지 상품 사진
images[].placement     = 각 옆면·뒷면의 배치 설명서
images[].overlay       = 각 옆면·뒷면의 그림자·광택
baseId                 = size-info를 다시 조회할 번호
```

`baseId` 자체는 Three.js 입력이 아니다.

### 편집기 안에서 그림을 더 추가할 때

좌측 패널의 목록 API에서 사용자가 하나를 고르면 작은 source만 넘긴다.

```text
내 AI 목록    → aiid/seq
art-edit 목록 → editSn
내 파일 목록  → fileIdx
꾸미기 목록   → itemCode/imagePath

onPick
→ EditorView.addSource()
→ resolveEditorSourceUrl()
→ loadEditorImage()
→ manager.addImage()
```

AI/edit/file의 만료 URL은 state에 저장하지 않는다. ID만 저장하고 복원할 때 다시 조회한다. addon만 관리자 CDN의 영구 `imagePath`를 source에 함께 저장한다.

---

## 6. API의 이미지가 Canvas 레이어가 되는 과정

AI 이미지를 예로 들면 자료형이 이렇게 바뀐다.

```text
{ type: "ai", aiid: "AI-77", aiseq: 2 }
→ GET /ai/images/AI-77/2
→ "https://.../original.png" URL 문자열
→ loadEditorImage(url)
→ HTMLImageElement
→ naturalWidth / naturalHeight 확인
→ manager.addImage(...)
→ x/y/width/height를 가진 layer 생성
```

레이어는 대략 다음 모양이다.

```ts
const layer = {
  id: "layer-1",
  kind: "image",
  source: { type: "ai", aiid: "AI-77", aiseq: 2 },
  x: 118,
  y: 195,
  width: 464,
  height: 309,
  rotation: 0,
  flipX: false,
  flipY: false,
  hidden: false,
  locked: false,
  zIndex: 0,
  filter: "none",
  baseImage: true,
};
```

이 레이어에는 실제 이미지 픽셀이 없다.

[`useEditorImages.ts`](../src/features/goods-editor/queries/useEditorImages.ts)가 source를 URL로 다시 바꾸고 다음 Map을 만든다.

```text
imageMap
"layer-1" → 실제 HTMLImageElement 픽셀
```

그래서 그릴 때 두 재료를 합친다.

```text
layer = 어디에, 얼마나 크게, 얼마나 돌려서 그릴까
imageMap = 실제 어떤 픽셀을 그릴까

drawItems(ctx, layers, imageMap)
```

이름이 비슷하지만 아래 둘은 전혀 다르다.

| 이름                        | 뜻                                                      |
| --------------------------- | ------------------------------------------------------- |
| 레이어의 `baseImage: true`  | 첫 사용자 디자인이며 일반 삭제 버튼에서 보호한다는 표시 |
| Three 입력의 `baseImageUrl` | 아무 디자인도 없는 무지 상품 사진 URL                   |

---

## 7. 숫자 예시 하나로 Canvas 크기 이해하기

서버 제작 규격이 `1000 × 1000`, 원본 디자인이 `1200 × 800`이라고 가정한다.

화면에서는 제작 크기 1000을 그대로 쓰지 않는다.

```text
Canvas 전체       = 700 × 700
편집 사각형       = 580 × 580
중앙 출력영역 80% = 464 × 464
중앙 영역 시작    = (118, 118)
```

`addImage()`는 1200 × 800 원본의 비율을 유지해 464 × 464 안에 전부 넣는다.

```text
scale = min(464/1200, 464/800) ≈ 0.3867

새 layer
width  = 464
height ≈ 309
x      = 118
y      ≈ 195
```

Canvas 내부는 700이지만 CSS로 화면에 560px로 보인다면 화면 8px 이동은 Canvas 논리 좌표 10px 이동이다.

```text
8 × 700 / 560 = 10
```

그래서 `EditorCanvas.toCanvasCoords()`가 마우스 화면 좌표를 Canvas 내부 좌표로 변환한다.

---

## 8. 그림을 드래그할 때 정확히 호출되는 함수

```text
마우스 누름
→ EditorCanvas.onPointerDown
→ toCanvasCoords()
→ manager.hitTest()
→ manager.select()
→ 그림을 눌렀을 때만 manager.beginDrag()

마우스 이동
→ EditorCanvas.onPointerMove
→ manager.moveSelectedBy(dx, dy)
→ layer.x/y 변경
→ 4px 스냅 계산
→ manager.emit()
→ Zustand items 갱신
→ EditorCanvas useEffect 재실행
→ clearRect()로 전체 삭제
→ drawItems()로 전체 다시 그리기

마우스 놓음
→ manager.endDrag()
→ 한 번의 undo history 기록
```

`drawItems()`는 레이어 하나를 다음 순서로 그린다.

```text
save
→ 레이어 중심으로 translate
→ rotate
→ 좌우·상하 flip scale
→ drawImage 또는 fillText
→ restore
```

선택 테두리와 크기·회전 손잡이는 Canvas 픽셀이 아니라 [`SelectionHandles.tsx`](../src/features/goods-editor/components/SelectionHandles.tsx)가 Canvas 위에 올린 HTML `div`다.

---

## 9. Canvas 결과를 Three.js에 넘기는 지점

현재 활성 호출은 이것이다.

```text
EditorView
→ PreviewPanel
→ 500ms 동안 추가 변경이 없으면 exportUserLayer()
→ BigPreview / AngleThumb
→ useEditorAngleRender()
→ requestMockupRender()
→ renderMockup()
→ WebP blob URL
→ <img>
```

`MockupPreviewPanel`과 `useEditorMockupPreview` 파일은 남아 있지만 현재 `EditorView`의 활성 흐름이 아니다.

`exportUserLayer()`는 중앙 80% 영역만 새 투명 Canvas에 다시 그리고 PNG data URL을 만든다.

```text
data:image/png;base64,...
```

앞 예시라면 결과는 `464 × 464`다. 제작 규격 1000으로 확대하지 않는다.

`PreviewPanel`의 500ms는 서버 자동저장이 아니다. 드래그가 잠시 멈춘 뒤 Three.js 미리보기를 갱신하기 위한 debounce다.

---

## 10. Three.js가 받는 정확한 값

[`useEditorAngleRender.ts`](../src/features/goods-editor/queries/useEditorAngleRender.ts)는 각도 하나마다 다음처럼 호출한다.

```ts
renderMockup({
  baseImageUrl: angle.imagePath,
  designUrl,
  placement: angle.placement ?? [],
  overlay: angle.overlay,
  outputSize: size,
});
```

| 값             | 어디서 왔나                  | 뜻                       |
| -------------- | ---------------------------- | ------------------------ |
| `baseImageUrl` | 목업 API의 `angle.imagePath` | 무지 상품 사진           |
| `designUrl`    | Canvas의 `exportUserLayer()` | 사용자가 편집한 투명 PNG |
| `placement`    | 목업 API                     | 붙일 위치·크기·모양      |
| `overlay`      | 목업 API                     | 그림자·광택 이미지       |
| `outputSize`   | 프론트 호출부                | 결과의 최대 크기         |

Three.js 안의 순서는 다음과 같다.

```text
base와 design 이미지 로드
→ CanvasTexture 생성
→ Camera 생성
→ base Mesh 추가          renderOrder 0
→ design Mesh 추가        renderOrder 1
→ 제외영역 상품 조각 추가 renderOrder 2
→ overlay 추가            renderOrder 9999
→ renderer.render(scene, camera)
→ WebP Blob 생성
```

placement 종류는 우선 이것만 알면 된다.

| type        | 뜻                                              |
| ----------- | ----------------------------------------------- |
| `type1`     | 사각형에 디자인 붙이기                          |
| `type2`     | 둥근 사각형에 붙이기                            |
| `type3`     | 원형에 붙이기                                   |
| `cylinder`  | 잘게 나눈 평면을 휘어 컵처럼 보이게 붙이기      |
| `type4/5/6` | 디자인 위에 상품 원본 조각을 다시 덮는 제외영역 |

`cylinder`도 실제 `CylinderGeometry`가 아니다. 64 × 32조각의 `PlaneGeometry` 꼭짓점을 움직여 휘게 만든다.

아주 중요한 구분이다.

```text
Canvas layer의 x/y
= 투명 PNG 안에서 사용자가 디자인을 옮긴 위치

Three placement의 position
= 그 투명 PNG 전체를 상품 사진 어디에 붙일지 정한 관리자 값
```

여기서도 종류가 나뉜다. 일반 `type1~6`은 Three world 좌표인 `position.x/y`를 쓴다. `cylinder`는 `positionx/positiony`와 `width/height`를 관리자 500px 이미지 좌표로 받은 뒤 renderer가 Three world 좌표로 변환한다.

사용자가 Canvas에서 오른쪽으로 움직여도 `placement.position.x`는 바뀌지 않는다. 이동 결과가 투명 PNG 안에 구워질 뿐이다.

---

## 11. “적용하기”를 누르면 만드는 네 종류의 결과

적용 순서는 다음과 같다.

```text
exportUserLayer()로 투명 디자인 만들기
→ master 상품 접목 WebP 만들기
→ 다른 렌더 가능 각도 WebP 만들기
→ exportFlattened() 제작 평면 PNG 만들기
→ presigned URL 받기
→ 파일들을 스토리지에 PUT
→ storage key로 EditorResult 만들기
→ POST /base/editor/state
→ 상품 상세로 돌아가기
```

네 결과를 섞으면 안 된다.

| result              | 어떤 이미지인가                                | 편집기 적용본 구매에서 |
| ------------------- | ---------------------------------------------- | ---------------------- |
| `designKey`         | 투명한 사용자 디자인 자체                      | `originalfilepath`     |
| `flattenedKey`      | 제작 크기의 평면 PNG                           | 현재 구매 body에 안 감 |
| `representativeKey` | 대표 상품에 디자인을 붙인 WebP                 | `userImage`            |
| `workingKeys`       | 대표 포함, 렌더 가능한 모든 각도 WebP key 배열 | `workingImages`        |

현재 실제 매핑은 [`GoodsDetailView.tsx`](../src/features/goods/components/goodsdetail/GoodsDetailView.tsx)에 있다.

```ts
const applied = {
  userImage: result.representativeKey,
  originalfilepath: result.designKey,
  workingImages: result.workingKeys,
};
```

이것만은 꼭 기억하자.

> 현재 `originalfilepath`는 `flattenedKey`가 아니라 `designKey`다.

파일 업로드는 다음 방식이다.

```text
POST /storage/presigned-url 또는 /storage/presigned-urls
→ uploadUrl과 key 받기
→ uploadUrl로 File PUT
→ state와 구매에는 key만 저장
```

`blob:` URL, `data:` URL, 만료되는 presigned URL, `HTMLImageElement`, Canvas 픽셀은 state에 저장하지 않는다.

---

## 12. 저장과 복원

state에는 다음 정보가 들어간다.

```text
context  = editorKey, goodsSn, baseId, 제작 width/height
document = layers, selectedLayerId
result   = 적용 성공 결과가 있을 때만 designKey, flattenedKey, representativeKey, workingKeys 등
```

복원은 Canvas 스크린샷을 불러오는 일이 아니다.

```text
GET /base/editor/state?key=...
→ layer의 source와 위치 숫자 복원
→ source ID로 최신 이미지 URL 다시 조회
→ HTMLImageElement 다시 로드
→ imageMap 다시 생성
→ Canvas 전체 다시 그리기
```

현재 서버 저장 시점은 다음 두 경우다.

1. “적용하기”가 성공했을 때
2. 탭 닫기·새로고침처럼 실제 `pagehide`가 발생할 때 한 번

드래그 도중 debounce 서버 자동저장은 없다. Next.js 화면 이동마다 `pagehide` 저장이 항상 보장되는 것도 아니다.

---

## 13. 장바구니와 바로구매에 무엇을 보내나

### 장바구니

옵션 한 줄마다 다음 요청을 보낸다.

```http
POST /users/basket
```

```ts
const basketBody = {
  productSn,
  productOption,
  cnt,
  ordertype: "normal",
  userComment,
  userImage: result.representativeKey,
  originalfilepath: result.designKey,
  workingImages: result.workingKeys,
  // 50% 할인 조건을 만족한 경우만
  aiid,
  aiseq,
  // 또는 editSn
};
```

장바구니에서 결제할 때 `/orders/goods`에는 이미지들을 다시 보내지 않는다. 서버 장바구니가 이미 가지고 있으므로 배송·결제 값과 `basketItemIdxs`만 보낸다.

### 바로구매

```text
PurchasePanel.submitDirect()
→ Zustand + sessionStorage의 directLine
→ /checkout?direct=1
→ CheckoutView.handlePay()
→ POST /orders/goods/direct
```

직접 주문 body에는 다음 값이 함께 들어간다.

```text
productSn
items[{ productOption, cnt }]
userImage
originalfilepath
workingImages
조건을 만족한 aiid/aiseq 또는 editSn
userComment
배송·금액·결제 공통값
```

상품명, 옵션 표시 이름, 화면용 가격, `displayImage`는 결제 화면 표시용이며 직접 주문 body에는 넣지 않는다.

### 편집기 적용본에서 AI 번호는 왜 어떤 주문에는 없나

편집기에서 여러 레이어를 조합한 적용본은 AI나 art-edit 레이어가 있다는 이유만으로 `aiid/aiseq` 또는 `editSn`을 보내지 않는다.

보이는 이미지 레이어 사각형 중 오마브 AI/art-edit가 차지한 비율이 50% 이상일 때만 가장 위의 해당 source 하나를 할인 근거로 보낸다. 내 파일만 썼거나 50% 미만이면 이미지 key는 보내도 작품 번호는 보내지 않는다.

### 편집기를 사용하지 않고 바로 구매한 경우

위 `result.*` 매핑과 50% 판정은 편집기 적용본 기준이다. raw AI/edit/file 작품을 편집기 없이 구매하면 `prepareBasketImages()`가 상품 접목 WebP를 업로드하고, `originalfilepath`에는 원본 디자인 URL에서 서명만 제거한 경로를 넣는다. 이때 raw AI 작품은 `aiid/aiseq`, raw art-edit는 `editSn`도 50% 계산 없이 보내며 file에는 작품 ID가 없다.

---

## 14. 처음에는 이 파일만 순서대로 열기

| 순서 | 파일                                                                                      | 질문                                   |
| ---- | ----------------------------------------------------------------------------------------- | -------------------------------------- |
| 1    | [`EditorView.tsx`](../src/features/goods-editor/components/EditorView.tsx)                | API와 전체 기능을 누가 연결하나?       |
| 2    | [`EditorCanvas.tsx`](../src/features/goods-editor/components/EditorCanvas.tsx)            | 마우스 좌표를 어떻게 받고 다시 그리나? |
| 3    | [`CanvasManager.ts`](../src/features/goods-editor/canvas/CanvasManager.ts)                | 레이어 숫자를 누가 바꾸나?             |
| 4    | [`drawItems.ts`](../src/features/goods-editor/canvas/drawItems.ts)                        | 실제 픽셀은 어떻게 그리나?             |
| 5    | [`PreviewPanel.tsx`](../src/features/goods-editor/components/PreviewPanel.tsx)            | 언제 투명 PNG를 만드나?                |
| 6    | [`useEditorAngleRender.ts`](../src/features/goods-editor/queries/useEditorAngleRender.ts) | 각도 하나를 어떻게 요청하나?           |
| 7    | [`renderer.ts`](../src/features/goods/mockup/renderer.ts)                                 | Three.js가 어떻게 합성하나?            |
| 8    | [`applyEditor.ts`](../src/features/goods-editor/lib/applyEditor.ts)                       | 어떤 파일을 업로드하고 key를 만드나?   |

한 번에 모든 파일을 읽지 말고, 오른쪽 질문의 답이 보일 때까지만 읽는다.

---

## 15. 개발자 도구로 한 번만 직접 따라가기

### 1단계: Network

편집기를 새로고침하고 다음 응답에서 표시한 값만 찾는다.

```text
/goods/:sn/mockup → master.imagePath/placement/overlay, images[], baseId
/base/:baseId/size-info → sizeInfo[]의 type과 w/h, 최상위 width/height
/base/editor/state → state가 null인지 저장본인지
/ai/images/:aiid/:seq → editSourceImage
```

### 2단계: breakpoint

다음 순서로 멈춘다.

```text
resolveEditorSourceUrl()
→ loadEditorImage()
→ CanvasManager.addImage()
→ EditorCanvas.onPointerMove()
→ CanvasManager.moveSelectedBy()
→ drawItems()
→ PreviewPanel의 exportUserLayer()
→ useEditorAngleRender의 renderMockup()
```

각 단계에서 이 값만 본다.

```text
source
→ URL
→ naturalWidth/Height
→ layer x/y/width/height
→ 투명 designUrl
→ baseImageUrl + placement + overlay
→ WebP blob URL
```

여기까지 직접 보면 전체 흐름이 머릿속에 연결된다.

---

## 16. 지금 코드에서 반드시 조심할 것

1. 활성 미리보기는 `PreviewPanel → useEditorAngleRender`다. 이름이 비슷한 옛 파일을 따라가지 않는다.
2. Canvas 레이어 `rotation`은 라디안, API placement 회전은 도(degree)다.
3. Canvas `x/y`와 Three placement 위치는 서로 다른 값이다.
4. `EditorLayer.opacity`는 타입에 있지만 현재 `drawItems()`에 실제 적용되지 않는다.
5. Three.js는 placement 배열의 첫 디자인 영역 하나만 사용한다.
6. `designKey`는 기본 정사각 meta에서 약 464px이고 제외영역 구멍도 없다.
7. 고해상도·제외영역이 반영된 것은 `flattenedKey`지만 현재 구매 body에는 보내지 않는다.
8. 따라서 실제 제작 원본 계약은 백엔드·제작팀과 반드시 확인해야 한다.

모든 현재 한계와 수식은 [상세 참고 문서의 25장](./three-canvas-editor-reference.md#25-현재-코드의-한계와-주의점)에 정리했다.

---

## 17. 이름이 같은 `key` 세 종류

| 이름                                | 뜻                                             |
| ----------------------------------- | ---------------------------------------------- |
| `editorKey`                         | `/base/editor/state`에서 편집 세션을 찾는 번호 |
| `designKey`, `representativeKey` 등 | 스토리지에 업로드한 파일 경로                  |
| React Query `queryKey`              | 브라우저 캐시 항목을 구분하는 이름             |

서로 완전히 다른 값이다.

---

## 마지막 확인 문제

1. Canvas가 레이어 객체를 기억하는가?  
   아니다. manager가 숫자를 기억하고 Canvas는 전체를 다시 그린다.

2. Three.js가 Canvas 레이어 배열을 받는가?  
   아니다. `exportUserLayer()`가 만든 투명 PNG 한 장을 받는다.

3. 상품 사진과 placement는 어디서 오나?  
   `GET /goods/:goodsSn/mockup`의 `master`와 `images[]` 각각에서 온다.

4. 사용자가 Canvas에서 움직이면 placement도 바뀌나?  
   아니다. 변화가 투명 PNG 안에 구워진다.

5. 편집기 적용본의 구매 `originalfilepath`는 무엇인가?  
   `result.designKey`다. `flattenedKey`가 아니다.

이 다섯 답을 자기 말로 설명할 수 있으면 전체 뼈대를 이해한 것이다.

```text
API URL
→ HTMLImageElement
→ Canvas layer + imageMap
→ drawItems
→ exportUserLayer 투명 PNG
→ renderMockup
→ 상품 WebP
→ 업로드 key
→ 장바구니·주문
```

막힌 부분이 생겼을 때만 [상세 참고 문서](./three-canvas-editor-reference.md)에서 같은 장을 찾아 더 깊게 읽자.
