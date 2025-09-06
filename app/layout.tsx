import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import { ScrollProgress, PageTransition } from "@/components/magazine-components"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Business Analytics Dashboard",
  description: "AI-powered business analytics platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange={false}>
          <AuthProvider>
            <ScrollProgress />
            <PageTransition>
              {children}
            </PageTransition>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
