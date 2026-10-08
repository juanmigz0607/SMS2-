import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import NextTopLoader from "nextjs-toploader"
import "./global.css"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

export const metadata: Metadata = {
    title: "Zentraq — Clinic Management",
    description: "Clinic management system for healthcare operations",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={cn(
                "h-full",
                "antialiased",
                geistSans.variable,
                geistMono.variable,
                "font-sans",
                inter.variable
            )}
        >
            <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <NextTopLoader
                        color="#1f6feb"
                        height={4}
                        showSpinner={false}
                        crawl
                        easing="ease"
                        speed={250}
                        shadow="0 0 10px #1f6feb, 0 0 5px #1f6feb"
                    />

                    {children}

                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    )
}
