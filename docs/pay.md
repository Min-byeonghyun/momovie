# 이니시스 결제 흐름: 주문 버튼부터 결제 완료까지

이 문서는 일반적인 결제 예제가 아니라 현재 프로젝트 코드를 따라간 학습 문서다. 파일과 함수 이름은 모두 저장소에서 확인했다. 백엔드 내부처럼 이 저장소에서 볼 수 없는 내용은 **확인 필요**로 표시한다.

## 1. 이 문서에서 이해할 내용

1. 장바구니 또는 바로 구매 상품을 `/checkout` 한 화면으로 모은다.
2. `handlePay`가 배송지·할인·결제수단을 모아 백엔드에 주문을 먼저 만든다.
3. 결제할 금액이 남으면 백엔드가 만든 서명을 받아 이니시스 결제창을 연다.
4. 이니시스 인증 결과를 `/checkout/return`이 받아 백엔드 승인 API로 전달한다.
5. 승인 성공만 완료 화면으로 보내고, 결과가 불명확하면 주문 상태를 확인한 뒤 판단한다.

## 2. 결제 관련 핵심 파일 지도

| 순서 | 파일                                                              | 주요 함수/컴포넌트                                        | 역할                                                             |
| ---- | ----------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------- |
| 1    | `src/features/basket/components/BasketView.tsx`                   | `BasketView`                                              | 선택한 장바구니 번호를 `/checkout?items=...`로 보낸다.           |
| 1    | `src/features/goods/components/goodsdetail/PurchasePanel.tsx`     | `submitDirect`, `handleBuyNow`                            | 바로 구매 정보를 Zustand에 넣고 `/checkout?direct=1`로 이동한다. |
| 2    | `src/app/(detail)/checkout/page.tsx`                              | `CheckoutPage`                                            | URL을 해석하고 장바구니·프로필을 미리 조회한다.                  |
| 3    | `src/features/order/store/useCheckoutStore.ts`                    | `useCheckoutStore`                                        | 바로 구매용 `directLine`을 `sessionStorage`에 임시 보관한다.     |
| 4    | `src/features/order/components/checkout/CheckoutView.tsx`         | `handlePay`, `startPgPayment`                             | 결제 화면의 데이터 조립, 주문 생성, PG 시작을 담당한다.          |
| 5    | `src/features/order/queries/useCheckoutMutation.ts`               | `useCheckoutMutation`                                     | 장바구니/바로 구매 API를 `mode`로 나눈다.                        |
| 6    | `src/features/order/api/orderApi.ts`                              | `checkoutGoods`, `checkoutDirect`, `getPaymentSignature`  | 주문 생성 및 결제 서명 API를 호출한다.                           |
| 7    | `src/features/order/lib/inicis.ts`                                | `launchInicisPay`, `loadInicisSdk`                        | 숨은 폼을 만들고 `INIStdPay.pay()`를 호출한다.                   |
| 8    | `src/app/(detail)/checkout/return/route.ts`                       | `POST`                                                    | 인증 결과를 받고 백엔드 `/orders/goods/confirm`으로 중계한다.    |
| 9    | `src/features/order/components/checkout/PaymentPendingView.tsx`   | `PaymentPendingView`                                      | 승인 여부가 불명확할 때 최대 30초 동안 주문 상태를 확인한다.     |
| 10   | `src/features/order/components/checkout/CheckoutCompleteView.tsx` | `CheckoutCompleteView`                                    | `pay_success` 주문만 완료 화면에 표시하고 관련 캐시를 정리한다.  |
| 타입 | `src/features/order/types.ts`                                     | `CheckoutBaseInput`, `CheckoutResult`, `PaymentSignature` | 요청과 응답의 정확한 데이터 모양이다.                            |

## 3. 결제 전 알아야 하는 쉬운 개념

결제는 택배 접수와 비슷하다. 먼저 우리 쇼핑몰에서 송장인 **주문**을 만들고, 카드사 쪽에서 본인 확인인 **인증**을 한 뒤, 쇼핑몰 서버가 금액과 주문을 다시 확인해 **승인**한다.

- **주문 생성**: 상품, 수량, 배송지, 할인 사용액을 서버에 보내 `orderSn`을 받는 단계다. 아직 카드 결제가 끝난 것은 아니다.
- **결제 요청**: `oid`, `price`, 구매자 정보 등을 이니시스 결제창에 전달하는 단계다.
- **결제 인증**: 사용자가 카드번호, 앱카드, 비밀번호 등으로 본인임을 증명하는 단계다. 인증 성공도 최종 결제 성공과 같지 않다.
- **결제 승인**: 백엔드가 인증 토큰을 이니시스에 서버 간 요청으로 보내 실제 결제를 확정하는 단계다.
- **서명/해시**: 주문번호와 금액을 봉인한 도장이다. 이 프로젝트의 `signature`, `verification`, `mKey`는 백엔드가 생성한다. 프론트에서 만들지 않는다.
- **리디렉션과 `returnUrl`**: 인증이 끝난 브라우저가 결과를 들고 돌아올 주소다. 이 프로젝트에서는 `/checkout/return` Route Handler가 form POST를 받는다.
- **역할 분리**: 프론트는 입력과 화면 이동을 담당한다. 서버는 상품 가격 재계산, 주문 생성, 서명 생성, 결제 승인과 최종 상태 저장을 담당한다.

## 4. 전체 결제 흐름

```mermaid
sequenceDiagram
    actor U as 사용자
    participant P as PurchasePanel/BasketView
    participant C as CheckoutView
    participant B as 백엔드 주문 API
    participant I as 이니시스
    participant R as /checkout/return

    U->>P: 구매하기 또는 선택상품 주문
    P->>C: directLine 또는 items 쿼리
    U->>C: 결제하기 클릭
    C->>B: POST /orders/goods 또는 /direct
    B-->>C: orderSn, paymentPrice, paid
    alt 0원 결제
        C->>C: /checkout/complete 이동
    else PG 결제
        C->>B: GET /orders/:orderSn/signature
        B-->>C: mid, price, timestamp, 서명들
        C->>I: INIStdPay.pay(hidden form)
        I->>R: 인증 결과 form POST
        R->>B: POST /orders/goods/confirm
        alt 승인 성공
            R->>C: 303 /checkout/complete
        else 명확한 실패
            R->>C: 303 원래 checkout
        else 결과 불명
            R->>C: 303 /checkout/pending
            C->>B: 2초마다 주문 상세 조회
        end
    end
```

1. **장바구니 시작점**
   - 파일: `src/features/basket/components/BasketView.tsx`
   - 처리: 개별 주문은 `/checkout?items=${item.idx}`, 선택 주문은 선택된 `idx`들을 쉼표로 연결한다.
   - 다음 데이터: 장바구니 항목 번호 목록. 상품 가격 전체를 URL로 보내지 않는다.

2. **바로 구매 시작점**
   - 파일: `src/features/goods/components/goodsdetail/PurchasePanel.tsx`
   - 함수: `submitDirect`
   - 처리: 상품, 옵션 조합, 수량, 화면 가격, DIY 이미지 key를 `DirectOrderLine`으로 만든다. `setDirectLine`으로 저장하고 `/checkout?direct=1`로 간다.
   - 다음 데이터: `useCheckoutStore`의 `directLine`. 이는 서버 주문이 아닌 임시 전달 상자다.

3. **결제 화면 진입**
   - 파일: `src/app/(detail)/checkout/page.tsx`
   - 함수: `CheckoutPage`
   - 입력: `items`, `direct`, `payError`, `cancelOrder` 검색 파라미터.
   - 처리: 로그인을 확인하고 basket/profile TanStack Query 데이터를 SSR에서 미리 채운다.

4. **화면용 주문 데이터 정규화**
   - 파일: `src/features/order/components/checkout/CheckoutView.tsx`
   - 컴포넌트: `CheckoutView`
   - 장바구니는 basket 캐시에서 `itemIdxs`에 해당하는 항목을 고른다. 바로 구매는 `directLine.items`를 읽는다. 둘 다 내부의 `CheckoutItemView[]` 모양으로 바뀐다.
   - `subtotal`, 쿠폰 할인, 서버가 미리 계산한 배송비, 포인트와 캐시를 합쳐 `total`을 만든다. 이 값은 화면 표시와 서버 대조용이며 최종 진실은 아니다.

5. **결제 버튼 검증과 주문 body 생성**
   - 함수: `handlePay`
   - 검사: 연속 클릭, 빈 상품, 구매 불가 장바구니 항목, 배송지, 배송비 계산 완료, 미지원 쿠폰.
   - 공통 `CheckoutBaseInput`에 `clientTotalPrice`, 배송지, 포인트/캐시, `payMethod`를 넣는다.
   - 바로 구매는 상품·옵션·DIY 데이터를 추가하고, 장바구니는 `basketItemIdxs`를 추가한다.

6. **백엔드 주문 생성**
   - 파일: `src/features/order/queries/useCheckoutMutation.ts`
   - 함수: `useCheckoutMutation`
   - `mode === "basket"`이면 `checkoutGoods`, 아니면 `checkoutDirect`를 부른다.
   - API: `POST /orders/goods` 또는 `POST /orders/goods/direct`.
   - 응답: `CheckoutResult { orderSn, paymentPrice, paid, deliveryPrice }`.

7. **0원과 PG 결제 분기**
   - `res.paid`가 참이면 포인트/캐시 전액 결제이므로 PG 없이 `/checkout/complete?orderSn=...`로 이동한다.
   - 아니면 `startPgPayment(res.orderSn)`을 실행한다.

8. **서명 조회와 결제창 호출**
   - `startPgPayment`가 `getPaymentSignature(orderSn)`을 호출한다.
   - 백엔드 응답의 `price`를 그대로 이니시스에 사용한다. 프론트의 `total`을 다시 넣지 않는다.
   - `launchInicisPay`가 SDK를 최초 한 번 로드하고 hidden form을 만든 뒤 `window.INIStdPay.pay("inicisPayForm")`을 호출한다.

9. **인증 결과와 승인 중계**
   - 파일: `src/app/(detail)/checkout/return/route.ts`
   - 함수: `POST`
   - `resultCode !== "0000"`이면 인증 실패/취소로 판단하고 승인 API를 부르지 않는다.
   - 성공이면 `authUrl`, `authToken`, `netCancelUrl`, `orderNumber` 등을 백엔드 `POST /orders/goods/confirm`으로 전달한다.
   - 백엔드 응답이 `res.ok && data.success`일 때만 완료 페이지로 간다.

10. **불명 상태 처리**
    - confirm이 5xx이거나 15초 내 응답하지 않으면 결제가 이미 승인됐을 가능성이 있다. 즉시 재결제시키지 않고 `/checkout/pending`으로 이동한다.
    - `usePaymentStatusQuery`가 2초마다 주문 상세를 조회한다. `pay_success`면 완료, `pay_fail`이면 재시도 버튼을 보여주고, 30초가 지나도 불명이면 주문내역 확인만 안내한다.

## 5. 실제 결제 데이터의 변화

| 단계            | 데이터                                                                 | 생성 위치                                    | 다음 사용처                                    |
| --------------- | ---------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------- |
| 상품/옵션       | `BasketItem[]` 또는 `DirectOrderLine.items`                            | basket API 또는 `PurchasePanel.submitDirect` | `CheckoutView.items`                           |
| 수량/화면 가격  | `cnt`, `orgPrice`, `linePrice`                                         | 상품 상세/장바구니                           | 화면 합계 계산. 서버가 다시 계산함             |
| 배송지          | `DeliveryPreset` → `deliveryName`, `deliveryPost` 등                   | `CheckoutView`                               | 체크아웃 API                                   |
| 할인            | `usePoint`, `useCash`, `couponCode?`                                   | `CheckoutView.handlePay`                     | 체크아웃 API. 현재 쿠폰 결제는 화면에서 차단됨 |
| 주문 생성 요청  | `CheckoutGoodsInput` / `CheckoutDirectInput`                           | `handlePay`                                  | 주문 API                                       |
| 주문 생성 응답  | `orderSn`, `paymentPrice`, `paid`, `deliveryPrice`                     | 백엔드                                       | 0원 완료 또는 서명 조회                        |
| 이니시스 요청값 | `mid`, `oid`, `price`, `timestamp`, `signature`, `verification` 등     | 서버 서명 + 프론트 구매자 정보               | hidden form                                    |
| 인증 결과       | `resultCode`, `orderNumber`, `authUrl`, `authToken`, `netCancelUrl` 등 | 이니시스                                     | `/checkout/return` → 백엔드 confirm            |
| 최종 주문 상태  | `paymentMethod.status`                                                 | 백엔드 주문 상세                             | pending/complete 화면                          |

### 이니시스 필드 사전

| 필드           | 현재 값의 출처                   | 쉬운 뜻                                              |
| -------------- | -------------------------------- | ---------------------------------------------------- |
| `mid`          | `PaymentSignature.mid`           | 이니시스가 가맹점을 구분하는 ID                      |
| `oid`          | `PaymentSignature.orderSn`       | 이번 결제의 주문번호                                 |
| `price`        | `PaymentSignature.price`         | 서버가 확정해 서명한 결제 금액                       |
| `timestamp`    | `PaymentSignature.timestamp`     | 서명이 만들어진 시점                                 |
| `signature`    | 백엔드                           | `oid`, `price`, `timestamp`를 묶은 서명              |
| `verification` | 백엔드                           | `use_chkfake=Y`와 함께 보내는 추가 위조 검증값       |
| `mKey`         | 백엔드                           | 가맹점 키에서 만든 검증용 해시값                     |
| `goodname`     | 첫 상품명 + 나머지 건수          | 결제창에 표시할 상품명                               |
| `buyername`    | 선택 배송지 이름                 | 구매자 이름 역할. 코드 변수는 `buyername` 소문자이다 |
| `buyertel`     | 선택 배송지 전화번호             | 구매자 연락처                                        |
| `buyeremail`   | 로그인 프로필 이메일             | 구매자 이메일                                        |
| `gopaymethod`  | `PAY_METHODS[].gopay`            | `Card`, `DirectBank`, `HPP` 중 결제 방식             |
| `returnUrl`    | 현재 origin + `/checkout/return` | 인증 결과를 POST할 주소                              |
| `closeUrl`     | 현재 origin + `/checkout/close`  | 사용자가 결제창을 닫았을 때 iframe이 도착할 주소     |
| `merchantData` | 장바구니/바로 구매 checkout 경로 | 실패 시 돌아갈 화면. 외부 입력으로 보고 재검증함     |

주의: 요청에 나온 `buyerName`, `buyerTel`, `buyerEmail`이라는 camelCase 이름은 현재 코드에 없다. 실제 이니시스 form 필드는 각각 `buyername`, `buyertel`, `buyeremail`이다.

## 6. 핵심 코드 따라 읽기

### 6.1 버튼 클릭: 두 입력을 하나의 mutation으로

파일: `src/features/order/components/checkout/CheckoutView.tsx`, 함수: `handlePay`

```tsx
checkout.mutate(
    direct && directLine
        ? { mode: "direct", body: { ...base, productSn: directLine.productSn, items: /* ... */ } }
        : { mode: "basket", body: { ...base, basketItemIdxs: itemIdxs } },
    { onSuccess: (res) => { /* 0원 또는 PG 분기 */ } },
);
```

`base`까지는 배송지와 결제 정보가 같다. 다른 부분만 `mode`와 body에 붙인다. 그래서 주문 생성 뒤 흐름은 완전히 합쳐진다.

### 6.2 서버 서명을 받아 PG 시작

```tsx
const sig = await getPaymentSignature(orderSn);
await launchInicisPay({
  sig,
  gopaymethod: payMethod.gopay,
  returnUrl: `${window.location.origin}/checkout/return`,
  closeUrl: `${window.location.origin}/checkout/close`,
  /* 구매자와 상품 정보 */
});
```

핵심은 `sig.price`를 사용한다는 점이다. 화면 계산 금액으로 새 서명을 만들지 않는다.

### 6.3 숨은 form과 SDK

파일: `src/features/order/lib/inicis.ts`, 함수: `launchInicisPay`

```ts
const fields = {
  mid: params.sig.mid,
  oid: params.sig.orderSn,
  price: String(params.sig.price),
  signature: params.sig.signature,
  use_chkfake: "Y",
  verification: params.sig.verification,
};
window.INIStdPay.pay(FORM_ID);
```

사용자에게 보이지 않는 `<form>`의 각 값을 `<input type="hidden">`으로 만든다. SDK는 폼 ID를 받아 결제 오버레이를 연다.

### 6.4 인증과 승인은 별개

파일: `src/app/(detail)/checkout/return/route.ts`, 함수: `POST`

```ts
if (resultCode !== "0000") return backTo(/* ... */);
const res = await fetch(`${SERVER_API_BASE}/orders/goods/confirm`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
if (res.ok && data.success) return toComplete(data.orderSn ?? orderNumber);
```

`0000`은 인증 통과다. 그 뒤 백엔드 confirm까지 성공해야 최종 완료다.

## 7. 장바구니 구매와 바로 구매 비교

| 구분           | 장바구니 구매                              | 바로 구매                                   |
| -------------- | ------------------------------------------ | ------------------------------------------- |
| 시작           | `BasketView`                               | `PurchasePanel.submitDirect`                |
| 화면 전달      | `/checkout?items=1,2`                      | Zustand `directLine` + `/checkout?direct=1` |
| 임시 저장      | 서버 장바구니                              | `sessionStorage`의 `omy-checkout`           |
| 주문 body 핵심 | `basketItemIdxs`                           | `productSn`, `items`, DIY 이미지/작품 필드  |
| 주문 API       | `POST /orders/goods`                       | `POST /orders/goods/direct`                 |
| 합쳐지는 지점  | `useCheckoutMutation`의 성공 응답부터 동일 | 동일                                        |
| 후속           | `orderSn` → 0원 또는 서명/PG               | 동일                                        |

바로 구매의 화면용 `linePrice`를 서버가 그대로 믿는 구조가 아니다. 실제 주문 API는 상품 식별자·옵션·수량과 `clientTotalPrice`를 받고 서버가 다시 산출한다.

## 8. 성공·실패·취소 처리

| 상황                    | 판정 코드                          | 처리                                                      |
| ----------------------- | ---------------------------------- | --------------------------------------------------------- |
| 0원 결제                | `CheckoutResult.paid`              | PG 없이 `/checkout/complete`                              |
| 인증 성공 + 승인 성공   | confirm의 `res.ok && data.success` | `/checkout/complete`                                      |
| 사용자가 인증 취소/실패 | `resultCode !== "0000"`            | 원래 checkout으로 복귀, 임시 주문 자동 취소 요청          |
| 승인 명확한 4xx 실패    | confirm 4xx                        | 백엔드 망취소 후 checkout 복귀                            |
| 승인 결과 불명          | confirm 5xx, 통신 실패, 15초 초과  | `/checkout/pending`, 재결제 금지, 상태 폴링               |
| 결제창만 닫음           | `/checkout/close`                  | 부모 iframe의 `INIStdPay.viewOff()` 또는 `/checkout` 이동 |
| 상태 폴링 성공          | `pay_success`                      | 완료로 이동                                               |
| 상태 폴링 실패          | `pay_fail`                         | 재결제 버튼 허용                                          |

**주의해서 볼 부분**

- `startPgPayment` 설명대로 결제창만 닫은 pending 주문의 정리는 백엔드 정책에 의존하며 코드 주석에 TODO가 있다.
- 쿠폰 목록에 전송용 `code`가 없어 현재 쿠폰 선택 상태에서는 결제를 차단한다.
- `buyername`은 실제 구매자 본인 이름이 아니라 선택한 배송지의 `deliveryName`이다. 업무 규칙이 이것을 의도했는지는 확인이 필요하다.

## 9. 보안 관점에서 꼭 알아야 할 부분

| 점검                     | 코드에서 확인한 근거                                                                                                         | 판단 범위                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 프론트 금액만 신뢰하는가 | `clientTotalPrice`는 서버 대조용이고 서명 응답의 `price`로 PG를 연다. API 주석은 서버가 가격·배송비를 재산출한다고 명시한다. | 백엔드 실제 산식은 이 저장소에서 확인 불가                |
| 주문번호 중복 방지       | `payLockRef`와 pending state가 같은 화면의 더블클릭을 막고, 주문번호는 서버가 반환한다.                                      | 서버 DB unique/idempotency는 확인 불가                    |
| 서명 위치                | `getPaymentSignature` 응답으로만 받고 프론트에는 signKey 생성 코드가 없다.                                                   | 적절한 방향. 백엔드 보관 방식은 확인 불가                 |
| 승인 재검증              | `/checkout/return`이 백엔드 confirm으로 인증 결과를 전달한다. 완료는 confirm 성공만 허용한다.                                | confirm 내부의 금액 대조와 이니시스 승인 요청은 확인 불가 |
| 키 노출                  | 프론트에는 `mid`, 해시 결과가 전달되지만 signKey 원문은 보이지 않는다.                                                       | 환경 변수와 백엔드 설정은 별도 확인 필요                  |
| 중복 결제                | 불명 상태에서 재결제시키지 않고 상태를 폴링한다. `payLockRef`도 있다.                                                        | 여러 탭·서버 중복 요청의 idempotency는 확인 불가          |
| open redirect            | `merchantData`는 `/checkout`으로 시작하고 `//`가 없는지 확인한다.                                                            | 현재 Route Handler 범위에서 방어 확인                     |
| 민감 인증값              | `authToken`은 서버 Route Handler에서 백엔드로 중계하며 브라우저 컴포넌트가 읽지 않는다. 로그에도 넣지 않는다.                | 서버 로그/백엔드 로그는 확인 불가                         |

보안은 프론트 코드만 보고 “완전하다”고 결론 내릴 수 없다. 특히 가격 대조, 주문번호 유일성, 승인 idempotency, `netCancel`은 백엔드 코드를 함께 검토해야 한다.

## 10. 내가 직접 기능을 수정할 때 보는 순서

### 결제수단을 추가할 때

1. `src/features/order/lib/payMethods.ts`의 `PayMethodDef`, `PAY_METHODS`
2. `src/features/order/types.ts`의 `CheckoutBaseInput.payMethod`
3. `CheckoutView.handlePay`가 저장하는 값과 `startPgPayment`의 `gopaymethod`
4. `inicis.ts`의 `acceptmethod` 등 수단별 필드
5. 백엔드 주문 DTO, 이니시스 가맹점 설정

### 주문 데이터 필드를 추가할 때

1. `src/features/order/types.ts` 요청 타입
2. `CheckoutView.handlePay`의 `base` 또는 direct body
3. `orderApi.ts`의 endpoint 계약
4. 장바구니/바로 구매 중 어디서 최초 값이 생기는지
5. 백엔드 DTO와 서버 검증

### 완료 화면을 바꿀 때

1. `CheckoutCompleteView.tsx`
2. `checkout/complete/page.tsx`
3. 성공 이동을 만드는 `CheckoutView`, `checkout/return/route.ts`, `PaymentPendingView`
4. 성공 후 basket/profile 캐시 정리 코드

### 실패 처리나 재시도를 바꿀 때

1. `checkout/return/route.ts`의 세 분기
2. `PaymentPendingView.tsx`
3. `usePaymentStatusQuery.ts`
4. `cancelAbandonedOrder`와 백엔드 결제 상태 정의

## 11. 이해도 확인 질문

1. **결제 버튼을 누르면 처음 실행되는 핵심 함수는?** `CheckoutView.handlePay`.
2. **주문번호는 프론트가 만드는가?** 아니다. 주문 생성 API의 `CheckoutResult.orderSn`으로 받는다.
3. **장바구니와 바로 구매는 어디서 합쳐지는가?** `useCheckoutMutation`의 주문 생성 결과 이후다.
4. **화면의 `total`이 최종 금액인가?** 아니다. 서버 대조용이고 서버가 재산출한다.
5. **PG에 보내는 금액은 어디서 오는가?** `getPaymentSignature`가 반환한 `PaymentSignature.price`.
6. **`resultCode === "0000"`이면 결제가 끝났는가?** 아니다. 인증 성공이며 백엔드 승인이 남았다.
7. **승인 결과를 모르는데 왜 즉시 재결제시키지 않는가?** 이미 승인됐을 수 있어 이중 결제를 막기 위해서다.
8. **0원 결제도 이니시스를 여는가?** 아니다. `res.paid`이면 곧바로 완료로 간다.
9. **signKey 원문은 프론트에 있는가?** 확인된 코드에는 없다. 서버가 서명 결과만 준다.
10. **완료 화면은 무엇을 다시 확인하는가?** 주문 상세의 `paymentMethod.status === "pay_success"`인지 확인한다.

## 12. 확인하지 못한 부분

> 확인 필요: 백엔드 `/orders/goods`, `/orders/goods/direct`, `/orders/:orderSn/signature`, `/orders/goods/confirm`의 내부 구현은 현재 프론트엔드 저장소에 없다.

따라서 다음 항목은 이 저장소만으로 확정할 수 없다.

- 서버의 실제 상품가·배송비·할인 재계산식과 `TOTAL_MISMATCH` 비교 방식
- `signature`, `verification`, `mKey` 생성에 쓰는 비밀키 보관 방식
- 이니시스 승인 요청 및 `netCancel`의 상세 구현
- 주문번호 DB 유일 제약과 여러 탭/재전송에 대한 idempotency
- 결제창만 닫고 남은 `payment_wait` 주문의 서버 정리 주기
- 실제 이니시스 관리자 페이지의 허용 도메인, MID, 결제수단 설정
- 현재 코드 주석이 참조하는 백엔드 실측 결과의 운영 환경 동일 여부
