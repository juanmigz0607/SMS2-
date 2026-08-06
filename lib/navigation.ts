import type { LucideIcon } from "lucide-react"
import {
  Activity,
  BookOpen,
  CreditCard,
  Database,
  FileCheck,
  FileText,
  Folder,
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
      { title: "Pre Register", href: "/pre-register", icon: FileCheck, roles: ["admin", "registrar"] },
      { title: "Applicant Directory", href: "/applicant", icon: Users, roles: ["admin", "staff", "registrar"] },
    ],
  },
  {
    label: "REGISTRAR MANAGEMENT",
    items: [
      { title: "Student Info Database", href: "/student-info", icon: Database, roles: ["admin", "registrar"] },
      { title: "Student RFID Generate", href: "/rfid-generate", icon: CreditCard, roles: ["admin", "staff", "registrar"] },
      { title: "Digital File Storage", href: "/file-storage", icon: Folder, roles: ["admin", "staff", "registrar"] },
      { title: "Health Record Management", href: "/heath-record", icon: Activity, roles: ["admin", "staff", "registrar"] },
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
      { title: "Pre Register", href: "/pre-register", icon: FileCheck },
      { title: "Applicant Directory", href: "/applicant", icon: Users },
    ],
  },
  {
    label: "REGISTRAR MANAGEMENT",
    items: [
      { title: "Student Info Database", href: "/student-info", icon: Database },
      { title: "Student RFID Generate", href: "/rfid-generate", icon: CreditCard },
      { title: "Digital File Storage", href: "/file-storage", icon: Folder },
      { title: "Health Record Management", href: "/heath-record", icon: Activity },
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