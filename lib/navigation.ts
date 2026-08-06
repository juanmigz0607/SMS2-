import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  target?: "_self" | "_blank"
  roles?: string[]
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

// Admin navigation structure
export const adminNavigation: NavGroup[] = [
  {
    label: "Core",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["admin", "staff", "registrar"] },
    ],
  },
  {
    label: "Enrollment Management",
    items: [
      { title: "Enroll Student", href: "/enrollment", icon: UserPlus, roles: ["admin", "registrar"] },
      { title: "Student Directory", href: "/student", icon: Users, roles: ["admin", "staff", "registrar"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { title: "Academic Programs", href: "/admin/programs", icon: BookOpen, roles: ["admin"] },
      { title: "User Accounts", href: "/admin/accounts", icon: UserCheck, roles: ["admin"] },
    ],
  },
]

// Staff / Registrar navigation structure
export const staffNavigation: NavGroup[] = [
  {
    label: "Core",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "Enrollment Management",
    items: [
      { title: "Enroll Student", href: "/enrollment", icon: UserPlus },
      { title: "Student Directory", href: "/student", icon: Users },
    ],
  },
]

// Student navigation structure
export const studentNavigation: NavGroup[] = [
  {
    label: "Student Portal",
    items: [
      { title: "My Profile", href: "/student/profile", icon: GraduationCap },
      { title: "Enrollment Status", href: "/student/status", icon: FileCheck },
      { title: "Settings", href: "/student/settings", icon: Settings },
    ],
  },
]

// Helper function to get navigation based on role
export function getNavigationForRole(role: string | null | undefined) {
  if (role === "admin") {
    return adminNavigation
  }
  return staffNavigation
}

// Keep backward compatibility with existing code
export const navigation = [...adminNavigation, ...staffNavigation]

export const allNavItems = [...adminNavigation, ...staffNavigation, ...studentNavigation].flatMap(
  (group) => group.items
)

export function getPageTitle(pathname: string): string {
  const item = allNavItems.find((nav) => nav.href === pathname)
  return item?.title ?? "SMS 2"
}