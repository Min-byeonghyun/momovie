"use client";

import ErrorState from "@/components/ui/ErrorState";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <ErrorState
        title="페이지를 불러올 수 없습니다"
        message="영화 정보를 가져오는 중 문제가 발생했습니다. 네트워크 연결을 확인하고 다시 시도해주세요."
        onRetry={reset}
      />
    </div>
  );
}
