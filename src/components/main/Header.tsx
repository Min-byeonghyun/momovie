"use client";

import useIsMounted from "@/hooks/useIsMounted";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

export default function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsMounted();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-2xl font-bold italic text-foreground"
            >
              Wave
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/?category=now_playing"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                상영중
              </Link>
              <Link
                href="/?category=popular"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                인기작
              </Link>
              <Link
                href="/?category=upcoming"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                개봉예정
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <form className="relative">
              <input
                type="text"
                placeholder="제목으로 찾아보세요.."
                className="w-48 sm:w-64 px-4 py-2 pr-16 text-sm bg-secondary text-foreground placeholder:text-muted-foreground rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 text-sm font-medium bg-foreground text-background rounded hover:opacity-90 transition-opacity"
              >
                search
              </button>
            </form>

            <button
              className="w-10 h-10 p-2 rounded-md hover:bg-secondary transition-colors"
              aria-label="테마 변경"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {mounted && (resolvedTheme === "dark" ? <Moon /> : <Sun />)}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
