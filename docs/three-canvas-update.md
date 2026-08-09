# Canvas + Three.js 편집기 — 가장 쉬운 전체 흐름

이 문서의 목표는 딱 하나다.

> AI 그림 한 장이 어디서 들어와 Canvas에서 편집되고, Three.js로 상품에 붙은 뒤, 장바구니까지 어떻게 가는지 이해한다.

처음에는 세부 코드를 외우지 말고 아래 화살표만 기억하면 된다.

```text
AI 그림 번호
 → 실제 이미지 URL
 → Canvas 레이어
 → 투명 PNG
 → Three.js 상품 미리보기
 → 이미지 업로드
 → 장바구니·주문
```

---

## 0. 정말 아무것도 모르는 상태에서 먼저 알아야 할 것

이 장에서는 프로젝트 코드를 보지 않는다. Canvas와 Three.js를 이해하기 위한 가장 작은 기초부터 시작한다.

### 0-1. 브라우저가 이미지를 보여주는 가장 평범한 방법

보통 React에서는 다음처럼 이미지를 보여준다.

```tsx
<img src="https://example.com/cat.png" />
```

브라우저는 URL에서 이미지 파일을 다운로드한 뒤 화면에 보여준다.

하지만 `<img>`는 이미지를 보여줄 뿐이다. 이미지의 특정 부분을 지우거나, 여러 이미지를 한 장으로 합쳐 새 파일을 만들기는 어렵다.

그래서 Canvas가 필요하다.

### 0-2. Canvas란 무엇인가?

Canvas는 HTML이 제공하는 빈 그림판이다.

```html
<canvas width="700" height="700"></canvas>
```

처음에는 아무것도 없는 투명한 700×700 픽셀 그림판이다.

React에서 Canvas DOM을 찾은 다음 그림을 그릴 수 있는 도구를 꺼낸다.

```ts
const canvas = canvasRef.current;
const ctx = canvas.getContext("2d");
```

- `canvas`: 그림판 자체
- `ctx`: 그림판에 그림을 그리는 펜
- `2d`: 평면 그림을 그리겠다는 뜻

이 펜으로 사각형, 글자, 이미지를 그릴 수 있다.

```ts
ctx.fillRect(10, 10, 100, 100); // 사각형
ctx.fillText("안녕", 50, 50); // 글자
ctx.drawImage(img, 100, 100); // 이미지
```

Canvas의 중요한 특징은 다음과 같다.

> Canvas에 그린 것은 일반 `<img>` 여러 개가 아니라, 최종적으로 한 장의 픽셀 그림이 된다.

그래서 이 프로젝트는 여러 이미지와 텍스트를 합쳐 제작용 PNG 한 장을 만들 수 있다.

### 0-3. Canvas 좌표는 어떻게 생겼는가?

Canvas의 왼쪽 위가 `(0, 0)`이다.

```text
(0,0) ───────────────→ x 증가
  │
  │       (200,100)
  │          ●
  │
  ↓ y 증가
```

- 오른쪽으로 갈수록 `x`가 커진다.
- 아래쪽으로 갈수록 `y`가 커진다.

다음 코드는 이미지 왼쪽 위를 `(100, 50)`에 놓고, 300×200 크기로 그린다.

```ts
ctx.drawImage(img, 100, 50, 300, 200);
```

이미지를 움직인다는 것은 이미지 파일을 바꾸는 것이 아니다. `x=100`을 `x=120`처럼 바꾼 뒤 Canvas 전체를 다시 그리는 것이다.

### 0-4. Canvas는 그린 물체를 기억하지 않는다

이 부분이 매우 중요하다.

Canvas에 이미지를 그렸다고 해서 Canvas가 “이것은 이미지 1번이고 위치는 100이다”라고 기억하지 않는다. Canvas에는 최종 픽셀만 남는다.

그래서 프로젝트가 별도의 자바스크립트 객체로 상태를 기억해야 한다.

```ts
const layer = {
  id: "image-1",
  x: 100,
  y: 50,
  width: 300,
  height: 200,
  rotation: 0,
};
```

사용자가 오른쪽으로 20만큼 움직이면 다음처럼 한다.

```ts
layer.x = layer.x + 20;
```

그 뒤 Canvas를 깨끗이 지우고 새 값으로 다시 그린다.

```ts
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height);
```

현재 프로젝트에서 이 `layer`들을 관리하는 것이 `CanvasManager`다.

### 0-5. API가 이미지를 내려준다는 말의 정확한 뜻

API는 보통 이미지 픽셀 전체를 JSON에 넣어 보내지 않는다. 이미지가 있는 URL과 위치 숫자를 내려준다.

예를 들면 다음과 같다.

```json
{
  "imagePath": "https://cdn.example.com/mug.png",
  "placement": {
    "type": "type1",
    "width": 8,
    "height": 10,
    "position": { "x": 0, "y": 1 }
  }
}
```

이 응답을 받은 직후에는 아직 이미지 픽셀이 없다.

```text
API JSON의 imagePath 문자열
  → 브라우저가 URL로 이미지 파일 요청
  → 다운로드 완료
  → HTMLImageElement 생성
  → Canvas의 drawImage가 픽셀을 그림
```

그래서 이미지 로딩은 비동기다. 다운로드가 끝나기 전에 그리면 아무것도 나오지 않을 수 있다.

### 0-6. URL, HTMLImageElement, Canvas, PNG는 서로 다르다

처음에는 이 네 가지가 자주 섞인다.

| 형태               | 예                          | 뜻                                                     |
| ------------------ | --------------------------- | ------------------------------------------------------ |
| URL 문자열         | `https://.../art.png`       | 이미지 파일이 어디 있는지 나타내는 주소                |
| `HTMLImageElement` | `new Image()` 결과          | 브라우저가 다운로드해서 사용할 준비를 마친 이미지 객체 |
| Canvas             | `<canvas>`                  | 이미지를 그리고 합치는 작업 공간                       |
| PNG data URL       | `data:image/png;base64,...` | Canvas 결과를 이미지 파일처럼 표현한 긴 문자열         |

현재 프로젝트의 데이터는 이 순서로 변한다.

```text
AI 작품번호
 → 이미지 URL
 → HTMLImageElement
 → Canvas 픽셀
 → PNG data URL
```

### 0-7. 그렇다면 Three.js는 왜 필요한가?

평평한 사각형 상품이라면 Canvas만으로도 어느 정도 합성할 수 있다.

하지만 다음과 같은 상품은 단순한 2D 사각형 붙이기만으로 표현하기 어렵다.

- 원형 배지
- 모서리가 둥근 영역
- 기울어진 상품 면
- 머그컵처럼 휘어진 면
- 상품 사진의 카메라 구멍처럼 디자인이 가려져야 하는 부분

Three.js는 디자인 이미지를 사각형, 원, 휘어진 면 같은 모양에 붙이고 위치와 회전을 적용하는 데 사용한다.

### 0-8. Three.js 객체를 조립하는 순서

Three.js는 다음 순서로 생각하면 된다.

```text
Texture  = 붙일 이미지
Geometry = 이미지가 붙을 모양
Material = 모양의 표면 설정
Mesh     = 모양과 표면을 합친 물체
Scene    = 물체를 올려놓는 무대
Camera   = 무대를 바라보는 눈
Renderer = 카메라가 본 장면을 픽셀로 만드는 기계
```

사진 액자를 만드는 상황으로 비유하면 다음과 같다.

| Three.js | 액자 비유                                |
| -------- | ---------------------------------------- |
| Texture  | 액자에 넣을 사진                         |
| Geometry | 네모난 종이의 모양                       |
| Material | 종이 표면에 사진을 보이게 하는 방식      |
| Mesh     | 사진이 붙은 종이 한 장                   |
| Scene    | 종이를 올려놓은 촬영 테이블              |
| Camera   | 촬영하는 카메라                          |
| Renderer | 셔터를 눌러 최종 사진 파일을 만드는 과정 |

가장 작은 Three.js 코드는 다음 느낌이다.

```ts
const texture = new THREE.Texture(image);
const geometry = new THREE.PlaneGeometry(8, 10);
const material = new THREE.MeshBasicMaterial({ map: texture });
const mesh = new THREE.Mesh(geometry, material);

scene.add(mesh);
renderer.render(scene, camera);
```

이 프로젝트도 구조는 같다. 다만 Texture로 일반 이미지 대신 Canvas 결과를 사용하는 `CanvasTexture`가 많고, 상품에 따라 Geometry 모양이 달라진다.

### 0-9. Canvas와 Three.js가 연결되는 정확한 지점

```text
CanvasManager가 가진 레이어 데이터
  ↓ drawItems
Canvas에 편집 결과 그림
  ↓ exportUserLayer
투명 PNG data URL
  ↓ renderMockup의 designUrl
Three.js CanvasTexture
  ↓ Geometry + Material + Mesh
상품 위에 디자인이 붙은 결과 이미지
```

즉 Canvas와 Three.js가 상태를 직접 공유하는 것이 아니다.

> Canvas가 투명 PNG를 만들고, Three.js가 그 PNG를 입력 이미지로 받는다.

---

## 1. Canvas와 Three.js는 무엇이 다른가?

| 도구     | 이 프로젝트에서 하는 일                        | 비유                                   |
| -------- | ---------------------------------------------- | -------------------------------------- |
| Canvas   | AI 그림의 위치, 크기, 회전을 편집한다          | 그림판에서 스티커 움직이기             |
| Three.js | 편집된 그림을 상품 사진의 정해진 위치에 붙인다 | 완성한 스티커를 머그컵 사진에 합성하기 |

Three.js가 편집 상태를 저장하는 것이 아니다. 편집 상태는 Canvas 쪽의 레이어 데이터가 가진다.

또한 이 프로젝트의 Three.js는 계속 돌아가는 3D 게임 화면이 아니다. 필요할 때 상품 미리보기 이미지 한 장을 만든다.

---

## 2. 처음에는 이 파일만 본다

| 순서 | 파일                                                          | 역할                            |
| ---- | ------------------------------------------------------------- | ------------------------------- |
| 1    | `src/app/(detail)/goods/[goodsSn]/editor/page.tsx`            | 편집기 입구                     |
| 2    | `src/features/goods-editor/components/EditorView.tsx`         | 전체 기능을 연결하는 총관리자   |
| 3    | `src/features/goods-editor/components/EditorCanvas.tsx`       | 마우스 입력을 받는 Canvas 화면  |
| 4    | `src/features/goods-editor/canvas/drawItems.ts`               | Canvas에 실제 이미지를 그림     |
| 5    | `src/features/goods/mockup/renderer.ts`                       | Three.js로 상품 미리보기를 만듦 |
| 6    | `src/features/goods-editor/lib/applyEditor.ts`                | 완성 이미지를 업로드함          |
| 7    | `src/features/goods/components/goodsdetail/PurchasePanel.tsx` | 결과를 장바구니·구매로 보냄     |

`CanvasManager.ts` 같은 큰 파일은 처음부터 전부 읽지 않는다. 문제가 생긴 함수만 검색해서 본다.

---

## 3. 전체 호출 순서

```text
GoodsEditorPage
  ↓ URL에서 goodsSn, aiid, seq, key를 읽음
EditorView
  ↓ 상품 목업·출력 크기·저장 상태 API 호출
CanvasManager.addImage
  ↓ AI 이미지를 레이어로 등록
EditorCanvas
  ↓ 마우스 이동을 Canvas 좌표로 변환
CanvasManager.moveSelectedBy
  ↓ 레이어 x, y 변경
drawItems
  ↓ Canvas를 다시 그림
exportUserLayer
  ↓ 편집 결과를 투명 PNG로 변환
renderMockup
  ↓ Three.js가 PNG를 상품 사진에 붙임
applyEditor
  ↓ 제작본과 대표본 업로드
PurchasePanel
  ↓ 이미지 key를 장바구니·주문에 전달
```

이제 같은 흐름을 실제 값으로 따라가 보자.

---

## 4. 1단계: 편집기 URL에서 시작한다

사용자가 AI 그림을 상품에 적용하면 다음과 비슷한 주소로 들어온다.

```text
/goods/GOODS-100/editor?key=EDIT-1&aiid=AI-200&seq=1
```

| 값          | 뜻                                  |
| ----------- | ----------------------------------- |
| `GOODS-100` | 편집할 상품번호                     |
| `EDIT-1`    | 편집 내용을 저장하고 다시 찾을 번호 |
| `AI-200`    | 사용할 AI 작품번호                  |
| `seq=1`     | 작품 안의 이미지 순서               |

파일 `src/app/(detail)/goods/[goodsSn]/editor/page.tsx`의 `GoodsEditorPage`가 이 값을 읽는다.

AI 작품 정보는 다음 모양으로 정리된다.

```ts
{ type: "ai", aiid: "AI-200", aiseq: 1 }
```

이 객체 이름은 `source`다. 이미지 파일 자체가 아니라 “어떤 이미지를 가져올지 적은 주소표”다.

그리고 다음처럼 `EditorView`에 전달한다.

```tsx
<EditorView goodsSn={goodsSn} editorKey={editorKey} source={source} />
```

---

## 5. 2단계: EditorView가 API를 호출한다

파일: `src/features/goods-editor/components/EditorView.tsx`

`EditorView`는 세 종류의 데이터를 준비한다.

### 5-1. 상품 사진과 디자인 위치

```tsx
useGoodsMockupQuery(goodsSn);
```

호출 API:

```text
GET /goods/{goodsSn}/mockup
```

API 함수는 `src/features/goods/api/goodsApi.ts`의 `getGoodsMockup`이다.

응답에서 지금 알아야 할 값은 다음뿐이다.

```ts
{
  baseId: "BASE-10",
  master: {
    imagePath: "https://.../blank-mug.png",
    placement: [{
      type: "type1",
      width: 8,
      height: 10,
      position: { x: 0, y: 1 }
    }]
  }
}
```

- `master.imagePath`: 아무 그림도 붙지 않은 상품 사진
- `master.placement`: 상품의 어디에 어떤 모양으로 그림을 붙일지 나타내는 값

`placement.type`의 대표적인 값은 다음과 같다.

| 값         | 모양                 |
| ---------- | -------------------- |
| `type1`    | 사각형               |
| `type2`    | 둥근 사각형          |
| `type3`    | 원                   |
| `cylinder` | 머그컵처럼 휘어진 면 |

### 5-2. 실제 제작 이미지 크기

```tsx
useBaseSizeInfoQuery(baseId);
```

호출 API:

```text
GET /base/{baseId}/size-info
```

화면에서는 작은 Canvas로 편집하지만, 최종 제작본은 이 API의 비율과 크기에 맞춰 크게 만든다.

### 5-3. 이전 편집 내용

```tsx
useEditorStateQuery(editorKey);
```

호출 API:

```text
GET /base/editor/state?key={editorKey}
```

처음이면 저장 내용이 없다. “편집 계속하기”라면 이전 레이어의 위치·크기·회전을 복원한다.

---

## 6. 3단계: AI 이미지가 Canvas 레이어가 된다

처음 받은 source에는 AI 작품번호만 있다.

`EditorView`가 `resolveEditorSourceUrl(source)`을 호출한다.

파일: `src/features/goods-editor/api/editorSourceApi.ts`

AI source일 때의 흐름은 다음과 같다.

```text
{ aiid, aiseq }
 → resolveEditorSourceUrl
 → getArtInfo(aiid, aiseq)
 → 실제 이미지 URL
 → loadEditorImage
 → HTMLImageElement
```

이미지 로딩이 끝나면 다음 함수가 실행된다.

```ts
manager.addImage(source, img.naturalWidth, img.naturalHeight, {
  baseImage: true,
});
```

이제 이미지는 다음과 비슷한 Canvas 레이어가 된다.

```ts
{
  x: 120,
  y: 90,
  width: 400,
  height: 400,
  rotation: 0,
  flipX: false,
  flipY: false
}
```

Canvas는 결국 이 값으로 그림을 그린다.

---

## 7. 4단계: 사용자가 이미지를 움직인다

파일: `src/features/goods-editor/components/EditorCanvas.tsx`

### 마우스를 누를 때

```text
onPointerDown
 → manager.hitTest(x, y)  : 누른 레이어 찾기
 → manager.select(hitId) : 레이어 선택
 → manager.beginDrag()    : 이동 시작
```

### 마우스를 움직일 때

```text
onPointerMove
 → manager.moveSelectedBy(dx, dy)
 → 선택 레이어의 x, y 변경
```

예를 들어 이전 좌표가 `(100, 100)`, 현재 좌표가 `(120, 110)`이면 `dx=20`, `dy=10`이다.

화면에 Canvas가 350px로 보여도 내부 논리 너비는 700이다. 그래서 `toCanvasCoords`가 화면 좌표를 다음처럼 바꾼다.

```text
화면에서 50px 이동 × 700 ÷ 화면 너비 350 = 내부 좌표 100 이동
```

이 덕분에 화면 크기가 달라도 저장 위치는 일정하다.

---

## 8. 5단계: Canvas가 이미지를 다시 그린다

`CanvasManager`가 레이어를 바꾸면 Zustand의 `items`도 갱신된다.

`EditorCanvas`는 `items` 변경을 감지하고 다음 함수를 부른다.

```text
drawItems(ctx, items, imageMap)
```

파일: `src/features/goods-editor/canvas/drawItems.ts`

핵심 코드는 다음이다.

```ts
ctx.translate(cx, cy);
ctx.rotate(item.rotation);
ctx.scale(item.flipX ? -1 : 1, item.flipY ? -1 : 1);
ctx.drawImage(img, -item.width / 2, -item.height / 2, item.width, item.height);
```

쉬운 뜻은 다음과 같다.

1. `translate`: 그림 중심으로 이동
2. `rotate`: 저장된 각도만큼 회전
3. `scale`: 필요하면 좌우·상하 반전
4. `drawImage`: 저장된 너비와 높이로 그림

Canvas가 필요한 값은 이것이다.

```text
이미지 + x + y + width + height + rotation + flip
```

---

## 9. 6단계: Canvas 결과를 투명 PNG로 만든다

파일: `src/features/goods-editor/lib/exportCanvas.ts`

함수:

```text
exportUserLayer(items, meta, imageMap, clip)
```

이 함수는 화면에 보이지 않는 새 Canvas를 만들고 다음 작업을 한다.

1. 인쇄 가능한 영역만 남긴다.
2. 현재 레이어를 `drawItems`로 다시 그린다.
3. 배경은 그리지 않는다.
4. 투명 PNG data URL을 반환한다.

결과는 다음 형태다.

```text
data:image/png;base64,...
```

즉 “편집한 그림만 들어 있는 투명 스티커 이미지”다.

미리보기에서는 `useEditorMockupPreview`가 레이어 변경 후 500ms 기다렸다가 이 함수를 실행한다.

```text
레이어 변경
 → 500ms 대기
 → exportUserLayer
 → renderMockup
```

500ms를 기다리는 이유는 드래그할 때마다 무거운 Three.js 렌더링을 실행하지 않기 위해서다.

---

## 10. 7단계: Three.js가 상품 미리보기를 만든다

파일: `src/features/goods/mockup/renderer.ts`

함수: `renderMockup`

중요한 입력은 네 가지다.

```ts
renderMockup({
  baseImageUrl: master.imagePath,
  designUrl: canvas가_만든_투명_PNG,
  placement: master.placement,
  outputSize: 640,
});
```

| 입력           | 뜻                     |
| -------------- | ---------------------- |
| `baseImageUrl` | 무지 상품 사진         |
| `designUrl`    | Canvas가 만든 투명 PNG |
| `placement`    | 붙일 위치·크기·모양    |
| `outputSize`   | 결과 이미지 크기       |

### 상품 사진 배치

```text
상품 사진
 → CanvasTexture
 → PlaneGeometry라는 평평한 면
 → Mesh
 → Scene에 추가
```

코드에서는 다음과 같다.

```ts
const bgTexture = new THREE.CanvasTexture(baseCanvas);
const bgMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(planeW, planeH),
  new THREE.MeshBasicMaterial({ map: bgTexture }),
);
scene.add(bgMesh);
```

### 디자인 배치

투명 PNG도 Texture로 만든다. 이후 placement 종류에 따라 다음 함수가 처리한다.

- 사각형·둥근 사각형·원: `buildFlatMesh`
- 휘어진 면: `buildCylinderMesh`

API의 `placement.position`, `width`, `height`, `rotation` 값으로 위치와 모양을 정한다.

즉 상품마다 붙일 위치를 프론트가 추측하는 것이 아니다. 목업 API의 placement를 사용한다.

### 결과 만들기

```ts
renderer.render(scene, camera);
```

그 뒤 결과를 WebP Blob과 `blob:...` 임시 URL로 바꿔 미리보기 `<img>`에 표시한다.

여기에는 계속 반복되는 `requestAnimationFrame`이 없다. 필요할 때 한 프레임만 그린다.

별도 Light도 없다. `MeshBasicMaterial`은 조명 없이 상품 사진과 디자인 Texture를 그대로 보여준다.

---

## 11. “적용하기”를 누르면 저장되는 것

`EditorView`에서 “적용하기”를 누르면 `applyMut.mutate()`가 실행된다.

```text
exportUserLayer
 → 투명 디자인 PNG
renderMockupRepresentativeFile
 → 상품에 붙은 대표 이미지
applyEditor
 → 제작용 이미지 생성·업로드
manager.toState
 → 레이어 위치·크기·회전을 JSON으로 변환
saveEditorState
 → 편집 JSON과 결과 key 저장
```

`applyEditor` 결과는 세 종류다.

| 변수                | 용도                                                |
| ------------------- | --------------------------------------------------- |
| `flattenedKey`      | 실제 제작에 사용하는 평면 이미지                    |
| `representativeKey` | 장바구니·주문 화면의 대표 이미지                    |
| `designKey`         | 상품 상세에서 Three.js 목업을 다시 만들 투명 이미지 |

반드시 다음처럼 구분한다.

```text
flattenedKey       = 제작용
representativeKey = 화면 대표용
designKey         = 목업 재생성용
```

편집 JSON에는 이미지 URL이나 Canvas 픽셀을 저장하지 않는다. `aiid`, 위치, 크기, 회전 같은 값만 저장한다. 다시 열 때 AI 이미지 URL을 새로 조회한다.

---

## 12. 장바구니와 주문으로 넘어가는 값

상품 상세의 `GoodsDetailView`가 저장 결과 이름을 구매용 이름으로 바꾼다.

```ts
{
    userImage: result.representativeKey,
    originalfilepath: result.flattenedKey
}
```

`PurchasePanel`의 `submitBasket`과 `submitDirect`가 사용한다.

| 구매 데이터                | 실제 의미                     |
| -------------------------- | ----------------------------- |
| `productSn`                | 상품번호                      |
| `productOption`            | 선택 옵션                     |
| `cnt`                      | 수량                          |
| `userImage`                | 화면에 보여줄 대표 이미지 key |
| `originalfilepath`         | 실제 제작용 이미지 key        |
| `aiid/aiseq` 또는 `editSn` | 작품 할인 검증용 번호         |
| `userComment`              | 제작 요청사항                 |

장바구니는 `submitBasket`이 `addBasketItem` API를 호출한다.

바로 구매는 `submitDirect`가 값을 Zustand의 `directLine`에 저장하고 `/checkout?direct=1`로 이동한다. 이후 `CheckoutView.handlePay`가 주문 API body에 넣는다.

---

## 13. 문제별로 볼 코드

| 문제                               | 확인 순서                                                        |
| ---------------------------------- | ---------------------------------------------------------------- |
| 드래그가 이상함                    | `EditorCanvas.onPointerMove` → `CanvasManager.moveSelectedBy`    |
| Canvas에 잘못 그려짐               | `drawItems`의 `translate`, `rotate`, `drawImage`                 |
| 확대·축소가 이상함                 | `SelectionHandles` → `CanvasManager.resizeCornerTo`              |
| Canvas는 정상인데 상품 위치가 틀림 | 목업 API의 `master.placement` → `renderer.ts`                    |
| 원통 상품이 틀림                   | `renderer.ts`의 `buildCylinderMesh`                              |
| 저장 후 위치가 사라짐              | `EditorView`의 `saveEditorState` → `CanvasManager.loadDocument`  |
| 장바구니 이미지가 틀림             | `applyEditor` → `GoodsDetailView` → `PurchasePanel.submitBasket` |
| 바로 구매 이미지가 틀림            | `applyEditor` → `GoodsDetailView` → `PurchasePanel.submitDirect` |

Canvas 화면이 정상인데 상품 미리보기만 틀리면 Canvas 코드를 먼저 고치지 않는다. `placement`와 Three.js 렌더러부터 확인한다.

---

## 13-1. 실제 데이터가 단계마다 어떻게 변하는가?

이번에는 AI 그림 한 장을 선택했다고 가정하고 데이터 모양만 연결해 본다.

### 단계 A: 페이지 URL

```text
/goods/G100/editor?key=E100&aiid=A100&seq=1
```

아직 문자열뿐이다.

### 단계 B: `GoodsEditorPage`가 만든 source

```ts
{ type: "ai", aiid: "A100", aiseq: 1 }
```

이 값은 저장해도 안전한 작품 식별자다.

### 단계 C: AI 상세 API 결과에서 고른 URL

`resolveEditorSourceUrl`이 `getArtInfo("A100", 1)`을 호출하고 `imgpath` 또는 `displayImgPath`를 고른다.

```text
https://cdn.example.com/private/ai-A100-1.png
```

이 URL은 표시용 주소다. 만료될 수 있으므로 편집 state 안에 저장하지 않는다.

### 단계 D: 브라우저 이미지 객체

`loadEditorImage(url)`의 다운로드가 끝나면 다음 정보를 가진다.

```text
HTMLImageElement
naturalWidth  = 1024
naturalHeight = 1024
```

### 단계 E: `CanvasManager.addImage`가 만든 레이어

축약하면 다음과 같다.

```ts
{
  id: "layer-1",
  kind: "image",
  source: { type: "ai", aiid: "A100", aiseq: 1 },
  x: 150,
  y: 80,
  width: 400,
  height: 400,
  rotation: 0,
  flipX: false,
  flipY: false,
  zIndex: 0
}
```

원본 이미지가 1024×1024여도 화면 편집 크기는 400×400일 수 있다. 원본 파일과 화면 배치 크기는 서로 다른 값이다.

### 단계 F: 사용자가 오른쪽으로 30 이동

`moveSelectedBy(30, 0)`이 실행되면 레이어가 다음처럼 바뀐다.

```ts
// 변경 전
x: 150;

// 변경 후
x: 180;
```

이미지 파일은 변하지 않았다. 배치 설명 숫자만 변했다.

### 단계 G: `drawItems`가 Canvas에 그림

`drawItems`는 `imageMap.get("layer-1")`으로 `HTMLImageElement`를 찾는다.

그리고 레이어의 `x=180`, `y=80`, `width=400`, `height=400`을 사용해 Canvas 픽셀을 다시 만든다.

반환값은 없다. 전달받은 `ctx`의 Canvas 픽셀이 변경된다.

### 단계 H: `exportUserLayer`의 결과

```text
data:image/png;base64,iVBORw0KGgoAAA...
```

이것은 배경이 투명하고 사용자가 배치한 디자인만 들어 있는 PNG다.

### 단계 I: 목업 API의 상품 데이터와 합침

```ts
{
  baseImageUrl: "https://cdn.example.com/blank-mug.png",
  designUrl: "data:image/png;base64,...",
  placement: [{
    type: "cylinder",
    width: 180,
    height: 120,
    positionx: 160,
    positiony: 140
  }],
  outputSize: 640
}
```

여기서 데이터 출처를 구분해야 한다.

| 값             | 출처                            |
| -------------- | ------------------------------- |
| `baseImageUrl` | 상품 목업 API                   |
| `placement`    | 상품 목업 API                   |
| `designUrl`    | Canvas의 `exportUserLayer` 결과 |
| `outputSize`   | 프론트 미리보기 설정            |

### 단계 J: Three.js 내부 변환

```text
baseImageUrl
 → HTMLImageElement
 → baseCanvas
 → CanvasTexture
 → 배경 PlaneGeometry의 Material

designUrl
 → HTMLImageElement
 → userCanvas
 → CanvasTexture
 → cylinder Geometry의 Material
```

두 Mesh를 같은 Scene에 올리고 Camera로 본 뒤 `renderer.render`를 실행한다.

### 단계 K: 미리보기 결과

```text
blob:http://localhost/...임시주소...
```

이 주소는 브라우저 메모리에 있는 WebP 결과를 가리킨다. 서버에 저장된 주소가 아니므로 더 이상 쓰지 않을 때 `URL.revokeObjectURL`로 해제한다.

### 단계 L: 적용 결과

적용 버튼을 누르면 임시 미리보기와 별도로 파일을 업로드하고 다음 key를 받는다.

```ts
{
  flattenedKey: "basket/.../diy-flattened.png",
  representativeKey: "basket/.../diy-representative.webp",
  designKey: "editor/.../diy-userlayer.png"
}
```

이것은 URL이 아니라 스토리지에서 파일을 찾는 안정적인 key다.

### 단계 M: 구매 요청에 들어가는 값

```ts
{
  productSn: "G100",
  cnt: 1,
  userImage: "basket/.../diy-representative.webp",
  originalfilepath: "basket/.../diy-flattened.png",
  aiid: "A100",
  aiseq: 1
}
```

전체 변화를 한 줄로 다시 쓰면 다음과 같다.

```text
작품 ID
 → 표시 URL
 → HTMLImageElement
 → 위치 숫자를 가진 Canvas 레이어
 → Canvas 픽셀
 → 투명 PNG
 → Three.js Texture와 Mesh
 → 미리보기 Blob URL
 → 업로드된 storage key
 → 장바구니·주문 API body
```

---

## 14. 디버거로 직접 따라가는 연습

한 번에 하나만 연습한다.

### 연습 A: Canvas 이동

1. `EditorCanvas.onPointerMove`에 breakpoint를 건다.
2. 이미지를 움직여 `dx`, `dy`를 확인한다.
3. `CanvasManager.moveSelectedBy`에서 `x`, `y`가 바뀌는지 본다.
4. `drawItems`에서 바뀐 좌표가 사용되는지 본다.

### 연습 B: Three.js 입력

1. `useEditorMockupPreview`의 내부 `render` 함수에 breakpoint를 건다.
2. `design`이 `data:image/png...`인지 본다.
3. `master.imagePath`가 상품 사진인지 본다.
4. `master.placement` 값을 본다.
5. `renderMockup`으로 전달되는 것을 확인한다.

### 연습 C: 저장과 구매

1. `applyEditor` 반환값의 세 key를 확인한다.
2. `GoodsDetailView`에서 `userImage`, `originalfilepath`로 바뀌는지 본다.
3. `PurchasePanel.submitBasket` 또는 `submitDirect`의 값을 본다.

---

## 15. 최소 용어 사전

| 용어          | 쉬운 뜻                                         |
| ------------- | ----------------------------------------------- |
| Layer         | Canvas 위의 이미지나 텍스트 한 개               |
| CanvasManager | 레이어의 위치·크기·회전을 관리하는 객체         |
| Zustand       | manager의 변경값을 React 화면에 전달하는 저장소 |
| Texture       | Three.js 도형에 붙일 이미지                     |
| Geometry      | 사각형·원·휘어진 면 같은 모양                   |
| Material      | Geometry 표면에 Texture를 보여주는 설정         |
| Mesh          | Geometry와 Material을 합친 물체                 |
| Scene         | 상품 배경과 디자인 Mesh를 올리는 작업대         |
| Camera        | Scene을 보는 눈                                 |
| Renderer      | Camera가 본 결과를 이미지로 만드는 도구         |
| placement     | 디자인을 붙일 위치·크기·모양을 담은 API 값      |

---

## 16. 이것만 대답할 수 있으면 전체 흐름을 이해한 것이다

1. **상품 사진은 어디서 오는가?**
   - `GET /goods/{goodsSn}/mockup`의 `master.imagePath`.

2. **상품에 붙일 위치는 어디서 오는가?**
   - 같은 응답의 `master.placement`.

3. **사용자가 그림을 움직이면 무엇이 바뀌는가?**
   - Canvas 레이어의 `x`, `y`.

4. **Canvas 결과는 Three.js에 어떤 형태로 전달되는가?**
   - `exportUserLayer`가 만든 투명 PNG data URL.

5. **Three.js는 무엇을 만드는가?**
   - 투명 디자인이 상품 사진에 붙은 미리보기 이미지.

6. **실제 제작용 파일은 무엇인가?**
   - `flattenedKey`, 구매 데이터에서는 `originalfilepath`.

7. **장바구니 대표 이미지는 무엇인가?**
   - `representativeKey`, 구매 데이터에서는 `userImage`.

---

## 17. 프론트 코드만으로 모르는 부분

- 관리자가 placement 값을 어떤 방식으로 만드는지
- 백엔드와 제작 업체가 `originalfilepath`를 어떻게 처리하는지
- 앞면·뒷면을 어떤 데이터로 구분할지
- 한 상품에 여러 인쇄 영역이 있을 때의 최종 업무 규칙

현재 렌더러는 디자인 placement가 여러 개여도 첫 번째 디자인 영역만 사용한다.

---

## 마지막 요약

```text
GoodsEditorPage : URL의 상품·AI 번호를 읽음
EditorView      : API와 전체 기능을 연결
CanvasManager   : 레이어 위치·크기·회전을 저장
EditorCanvas    : 마우스 입력을 받음
drawItems       : Canvas에 그림
exportUserLayer : 투명 PNG 생성
renderMockup    : PNG를 상품 사진에 붙임
applyEditor     : 결과 이미지 업로드
PurchasePanel   : 이미지 key를 장바구니·주문으로 전달
```

막히면 전체 코드를 다시 읽지 말고, 문제가 이 아홉 단계 중 어디에 있는지 먼저 고른다. 그 단계의 파일과 함수만 보면 된다.
