"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
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

    // Select navigation groups depending on user role
    const navGroups =
        userRole === "student"
            ? studentNavigation
            : getNavigationForRole(userRole)

    return (
        <aside
            className={cn(
                "flex h-full flex-col border-r border-slate-200 bg-white",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Brand Header */}
            <div
                className={cn(
                    "flex h-14 items-center border-b border-slate-100 px-4",
                    collapsed && "justify-center px-2"
                )}
            >
                {collapsed ? (
                    <Image
                        src="/sms2.png"
                        alt="SMS 2"
                        width={32}
                        height={32}
                        className="h-8 w-auto object-contain"
                    />
                ) : (
                    <div className="flex items-center gap-2 px-2">
                        <Image
                            src="/sms2.png"
                            alt="SMS 2"
                            width={120}
                            height={32}
                            className="h-8 w-auto object-contain"
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
                            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {group.label}
                            </p>
                        )}
                        <ul className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href
                                const Icon = item.icon

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
                                                    ? "bg-slate-900 text-white shadow-sm"
                                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                                                collapsed && "justify-center px-2"
                                            )}
                                            title={collapsed ? item.title : undefined}
                                        >
                                            <Icon
                                                className={cn(
                                                    "size-4 shrink-0",
                                                    isActive ? "text-white" : "text-slate-500"
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