"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle({
    variant = "outline",
    size = "icon",
    className = "",
}: {
    variant?: "outline" | "ghost" | "default" | "secondary"
    size?: "icon" | "sm" | "default" | "lg"
    className?: string
}) {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className={cn(buttonVariants({ variant, size }), className, "opacity-50 pointer-events-none")}>
                <Sun className="h-[1.2rem] w-[1.2rem] text-slate-400" />
                <span className="sr-only">Toggle theme</span>
            </div>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className={cn(
                    buttonVariants({ variant, size }),
                    "relative cursor-pointer transition-colors duration-200",
                    className
                )}
                aria-label="Select theme mode"
                title={`Current theme: ${theme ?? "system"}`}
            >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-emerald-400" />
                <span className="sr-only">Toggle theme</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className={`cursor-pointer flex items-center gap-2 ${theme === "light" ? "font-semibold bg-accent text-accent-foreground" : ""}`}
                >
                    <Sun className="h-4 w-4 text-amber-500" />
                    <span>Day / Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className={`cursor-pointer flex items-center gap-2 ${theme === "dark" ? "font-semibold bg-accent text-accent-foreground" : ""}`}
                >
                    <Moon className="h-4 w-4 text-emerald-400" />
                    <span>Night Version</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className={`cursor-pointer flex items-center gap-2 ${theme === "system" ? "font-semibold bg-accent text-accent-foreground" : ""}`}
                >
                    <Monitor className="h-4 w-4 text-slate-400" />
                    <span>System</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
