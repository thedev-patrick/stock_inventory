"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/lib/theme-context"
import { ThemeToggle } from "./components/theme-toggle"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <header className="flex justify-between items-center p-4 border-b border-accent/20">
          <div className="text-xl font-bold text-accent">Inventory Tracker</div>
          <ThemeToggle />
        </header>
        {children}
      </SessionProvider>
    </ThemeProvider>
  )
}
