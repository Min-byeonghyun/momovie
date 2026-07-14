"use client";

import { ThemeProvider, ThemeProviderProps } from "next-themes";

export default function NextThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  return (
    <>
      <ThemeProvider {...props}>{children}</ThemeProvider>
    </>
  );
}
