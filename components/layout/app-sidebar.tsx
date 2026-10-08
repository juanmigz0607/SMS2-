"use client"
 
import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { getNavigationForRole, studentNavigation } from "@/lib/navigation"

export type UserRole = "admin" | "staff" | "registrar" | "student"

type AppSidebarProps = {
    onNavigate?: () => void
    collapsed?: boolean
    userRole?: UserRole
}

export function AppSidebar({
    onNavigate,
    collapsed = false,
    userRole = "admin",
}: AppSidebarProps) {
    const pathname = usePathname()
    const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({})

    // Select navigation groups depending on user role
    const navGroups =
        userRole === "student"
            ? studentNavigation
            : getNavigationForRole(userRole)

    // Auto-expand menu if active route matches parent or child
    React.useEffect(() => {
        navGroups.forEach((group) => {
            group.items.forEach((item) => {
                if (item.children && item.children.length > 0) {
                    const isChildActive = item.children.some((child) => pathname === child.href)
                    if (isChildActive || pathname === item.href) {
                        setOpenMenus((prev) => ({ ...prev, [item.title]: true }))
                    }
                }
            })
        })
    }, [pathname, navGroups])

    const toggleMenu = (title: string) => {
        setOpenMenus((prev) => ({
            ...prev,
            [title]: !prev[title],
        }))
    }

    return (
        <aside
            className={cn(
                "flex h-full flex-col border-r border-slate-200 dark:border-emerald-950 bg-white dark:bg-[#070d0a]",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Brand Header */}
            <div
                className={cn(
                    "flex h-14 items-center border-b border-slate-100 dark:border-emerald-950 px-4",
                    collapsed && "justify-center px-2"
                )}
            >
                {collapsed ? (
                    <Image
                        src="/sms2.png"
                        alt="SMS 2"
                        width={32}
                        height={32}
                        className="h-8 w-auto object-contain dark:brightness-125 dark:drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                    />
                ) : (
                    <div className="flex items-center gap-2 px-2">
                        <Image
                            src="/sms2.png"
                            alt="SMS 2"
                            width={120}
                            height={32}
                            className="h-8 w-auto object-contain dark:brightness-125 dark:drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                            priority
                        />
                    </div>
                )}
            </div>

            {/* Dynamic Navigation Menu */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                {navGroups.map((group) => (
                    <div key={group.label} className="mb-4">
                        {group.label && !collapsed && (
                            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-emerald-500/80">
                                {group.label}
                            </p>
                        )}
                        <ul className="space-y-1">
                            {group.items.map((item) => {
                                const Icon = item.icon
                                const hasChildren = item.children && item.children.length > 0

                                if (hasChildren) {
                                    const isOpen = !!openMenus[item.title]
                                    const isAnyChildActive = item.children!.some((child) => pathname === child.href)
                                    const isParentActive = pathname === item.href

                                    if (collapsed) {
                                        return (
                                            <li key={item.title}>
                                                <Link
                                                    href={item.children![0].href}
                                                    onClick={() => {
                                                        if (onNavigate) onNavigate()
                                                    }}
                                                    className={cn(
                                                        "flex items-center justify-center rounded-md px-2 py-2 text-xs font-medium transition-colors duration-150",
                                                        isAnyChildActive || isParentActive
                                                            ? "bg-slate-900 text-white dark:bg-emerald-950/80 dark:text-emerald-300 dark:border dark:border-emerald-800 shadow-xs"
                                                            : "text-slate-600 dark:text-emerald-400/80 hover:bg-slate-100 dark:hover:bg-emerald-950/40 hover:text-slate-900 dark:hover:text-emerald-200"
                                                    )}
                                                    title={item.title}
                                                >
                                                    <Icon
                                                        className={cn(
                                                            "size-4 shrink-0",
                                                            isAnyChildActive || isParentActive
                                                                ? "text-white dark:text-emerald-400"
                                                                : "text-slate-500 dark:text-emerald-500/70"
                                                        )}
                                                    />
                                                </Link>
                                            </li>
                                        )
                                    }

                                    return (
                                        <li key={item.title} className="space-y-1">
                                            <button
                                                type="button"
                                                onClick={() => toggleMenu(item.title)}
                                                className={cn(
                                                    "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium transition-colors duration-150 cursor-pointer",
                                                    isParentActive || isAnyChildActive
                                                        ? "text-slate-900 dark:text-emerald-300 font-medium bg-slate-100/80 dark:bg-emerald-950/40"
                                                        : "text-slate-600 dark:text-emerald-400/80 hover:bg-slate-100 dark:hover:bg-emerald-950/40 hover:text-slate-900 dark:hover:text-emerald-200"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon
                                                        className={cn(
                                                            "size-4 shrink-0",
                                                            isParentActive || isAnyChildActive
                                                                ? "text-slate-900 dark:text-emerald-400"
                                                                : "text-slate-500 dark:text-emerald-500/70"
                                                        )}
                                                    />
                                                    <span>{item.title}</span>
                                                </div>
                                                {isOpen ? (
                                                    <ChevronDown className="size-3.5 shrink-0 text-slate-400 dark:text-emerald-500/70 transition-transform duration-150" />
                                                ) : (
                                                    <ChevronRight className="size-3.5 shrink-0 text-slate-400 dark:text-emerald-500/70 transition-transform duration-150" />
                                                )}
                                            </button>

                                            {isOpen && (
                                                <ul className="ml-4 space-y-1 border-l border-slate-200 dark:border-emerald-900/50 pl-3">
                                                    {item.children!.map((child) => {
                                                        const isChildActive = pathname === child.href
                                                        const ChildIcon = child.icon
                                                        return (
                                                            <li key={child.href}>
                                                                <Link
                                                                    href={child.href}
                                                                    target={child.target}
                                                                    rel={child.target === "_blank" ? "noopener noreferrer" : undefined}
                                                                    onClick={() => {
                                                                        if (onNavigate) onNavigate()
                                                                    }}
                                                                    className={cn(
                                                                        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors duration-150",
                                                                        isChildActive
                                                                            ? "bg-slate-900 text-white dark:bg-emerald-950/80 dark:text-emerald-300 dark:border dark:border-emerald-800 shadow-xs"
                                                                            : "text-slate-600 dark:text-emerald-400/80 hover:bg-slate-100 dark:hover:bg-emerald-950/40 hover:text-slate-900 dark:hover:text-emerald-200"
                                                                    )}
                                                                >
                                                                    <ChildIcon
                                                                        className={cn(
                                                                            "size-3.5 shrink-0",
                                                                            isChildActive
                                                                                ? "text-white dark:text-emerald-400"
                                                                                : "text-slate-400 dark:text-emerald-500/70"
                                                                        )}
                                                                    />
                                                                    <span>{child.title}</span>
                                                                </Link>
                                                            </li>
                                                        )
                                                    })}
                                                </ul>
                                            )}
                                        </li>
                                    )
                                }

                                const isActive = pathname === item.href

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            target={item.target}
                                            rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
                                            onClick={() => {
                                                if (onNavigate) onNavigate()
                                            }}
                                            className={cn(
                                                "flex items-center gap-3 rounded-md px-2.5 py-2 text-xs font-medium transition-colors duration-150",
                                                isActive
                                                    ? "bg-slate-900 text-white dark:bg-emerald-950/80 dark:text-emerald-300 dark:border dark:border-emerald-800 shadow-xs"
                                                    : "text-slate-600 dark:text-emerald-400/80 hover:bg-slate-100 dark:hover:bg-emerald-950/40 hover:text-slate-900 dark:hover:text-emerald-200",
                                                collapsed && "justify-center px-2"
                                            )}
                                            title={collapsed ? item.title : undefined}
                                        >
                                            <Icon
                                                className={cn(
                                                    "size-4 shrink-0",
                                                    isActive
                                                        ? "text-white dark:text-emerald-400"
                                                        : "text-slate-500 dark:text-emerald-500/70"
                                                )}
                                            />
                                            {!collapsed && <span>{item.title}</span>}
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                ))}
            </nav>
        </aside>
    )
}