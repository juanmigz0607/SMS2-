"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Loader2, LogOut, User, Shield, ChevronLeft, ChevronRight } from "lucide-react"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/utils/supabase/client"
import { logoutAction } from "@/app/login/action"

import { LiveDateTime } from "@/components/live-date-time"

export type UserRole = "admin" | "staff" | "registrar"

type DashboardShellProps = {
    children: React.ReactNode
    userEmail?: string
    userRole?: UserRole
}

export function DashboardShell({
    children,
    userEmail = "admin@sms2.com",
    userRole = "admin",
}: DashboardShellProps) {
    const router = useRouter()
    const pathname = usePathname()

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Force reload on back navigation if page was cached (bfcache)
    useEffect(() => {
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                window.location.reload()
            }
        }
        window.addEventListener("pageshow", handlePageShow)
        return () => window.removeEventListener("pageshow", handlePageShow)
    }, [])

    // Derive page title based on active path
    const getPageTitle = (path: string) => {
        if (path.includes("/pre-register")) return "Pre-Registered Applications"
        if (path.includes("/enrollment")) return "Student Enrollment"
        if (path.includes("/applicant")) return "Applicant Directory"
        if (path.includes("/student-info")) return "Student Info Database"
        if (path.includes("/rfid-generate")) return "Student RFID Generate"
        if (path.includes("/file-storage")) return "Digital File Storage"
        if (path.includes("/heath-record")) return "Health Record Management"
        return "Enrollment Dashboard"
    }

    const pageTitle = getPageTitle(pathname)

    async function handleLogout() {
        if (loggingOut) return
        setLoggingOut(true)

        try {
            const supabase = createClient()
            await supabase.auth.signOut()
            await logoutAction()
            window.location.href = "/login"
        } catch (error) {
            console.error("Logout error:", error)
            setLoggingOut(false)
        }
    }

    const roleLabel =
        userRole === "admin"
            ? "Administrator"
            : userRole === "registrar"
                ? "Registrar"
                : "Staff"

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {/* Desktop Sidebar */}
            <div
                className={cn(
                    "hidden lg:block transition-all duration-300 border-r border-slate-200 bg-white",
                    sidebarCollapsed ? "w-16" : "w-64"
                )}
            >
                <AppSidebar collapsed={sidebarCollapsed} userRole={userRole} />
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setMobileOpen(false)}
                    />
                    <div className="absolute inset-y-0 left-0 w-64 bg-white animate-in slide-in-from-left">
                        <AppSidebar
                            onNavigate={() => setMobileOpen(false)}
                            userRole={userRole}
                        />
                    </div>
                </div>
            )}

            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Navigation Header */}
                <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shrink-0 shadow-sm">
                    <div className="flex items-center gap-3">
                        {/* Collapse / Expand Toggle Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 shrink-0 cursor-pointer text-slate-600 hover:bg-slate-100"
                            onClick={() => {
                                if (window.innerWidth < 1024) {
                                    setMobileOpen(!mobileOpen)
                                } else {
                                    setSidebarCollapsed(!sidebarCollapsed)
                                }
                            }}
                            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            {sidebarCollapsed ? (
                                <ChevronRight className="size-4" />
                            ) : (
                                <ChevronLeft className="size-4" />
                            )}
                        </Button>

                        {/* Dynamic Page Title */}
                        <div className="text-sm font-semibold text-slate-800">
                            {pageTitle}
                        </div>
                    </div>

                    {/* Live Date & Time Display */}
                    <div className="flex items-center gap-3" suppressHydrationWarning>
                        {mounted && <LiveDateTime />}

                        {/* User Profile Dropdown */}
                        {mounted ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full hover:bg-slate-100 transition-colors focus:outline-none" suppressHydrationWarning>
                                    <Avatar className="h-8 w-8 border border-slate-200">
                                        <AvatarImage alt={userEmail} className="object-cover" />
                                        <AvatarFallback className="bg-slate-900 text-white font-semibold text-xs">
                                            {userEmail.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent className="w-60 p-2" align="end" sideOffset={8}>
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel className="px-3 py-2">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-semibold text-slate-900 truncate">
                                                    {userEmail.split("@")[0]}
                                                </p>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {userEmail}
                                                </p>
                                                <p className="text-[10px] font-medium text-slate-600 flex items-center gap-1 pt-1">
                                                    <span className="size-1.5 rounded-full bg-blue-600" />
                                                    {roleLabel}
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>

                                        <DropdownMenuSeparator className="my-1" />

                                        <DropdownMenuItem
                                            className="cursor-pointer px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600"
                                            disabled={loggingOut}
                                            onClick={handleLogout}
                                        >
                                            {loggingOut ? (
                                                <>
                                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                                    <span>Signing out...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <LogOut className="mr-2 size-4" />
                                                    <span className="font-medium">Log out</span>
                                                </>
                                            )}
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white font-semibold text-xs border border-slate-200">
                                {userEmail.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </header>

                {/* Main View Area */}
                <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {children}
                </main>
            </div>
        </div>
    )
}