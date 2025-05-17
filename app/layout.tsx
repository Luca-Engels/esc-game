import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { GroupProvider } from "@/contexts/group-context"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Eurovision Ranking Game",
  description: "Create your personal Eurovision ranking",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <GroupProvider>
            <Suspense>{children}</Suspense>
            <Toaster />
            <SpeedInsights />
            <Analytics />
          </GroupProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
