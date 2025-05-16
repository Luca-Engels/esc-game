import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { GroupProvider } from "@/contexts/group-context"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

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
    <html lang="en">
      <body>
        <GroupProvider>
          {children}
          <Toaster />
          <SpeedInsights />
          <Analytics />
        </GroupProvider>
      </body>
    </html>
  )
}
