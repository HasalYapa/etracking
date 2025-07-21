import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Hasal Dimantha - Full Stack Developer",
  description: "Full-stack developer passionate about creating amazing digital experiences. Skilled in React, Next.js, Node.js, and more.",
  keywords: ["developer", "full-stack", "react", "nextjs", "nodejs", "typescript"],
  authors: [{ name: "Hasal Dimantha" }],
  creator: "Hasal Dimantha",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://yourwebsite.com",
    title: "Hasal Dimantha - Full Stack Developer",
    description: "Full-stack developer passionate about creating amazing digital experiences.",
    siteName: "Hasal Dimantha Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hasal Dimantha - Full Stack Developer",
    description: "Full-stack developer passionate about creating amazing digital experiences.",
    creator: "@yourusername",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow pt-16">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
} 