export default function MovieSectionError() {
  return (
    <>
      <section className="py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Popular Movies
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              인기있는 영화
            </h2>
          </div>
        </div>
        <div className="bg-secondary/50 rounded-lg border border-border p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground mb-4"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="text-sm text-muted-foreground mb-4">
              영화 목록을 불러올 수 없습니다
            </p>
            <button className="px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 text-foreground rounded-lg border border-border transition-colors">
              다시 시도
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
