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
  UserCog,
  UserPlus,
  Users,
} from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  target?: "_self" | "_blank"
  roles?: string[]
  children?: NavItem[]
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
    label: "Administration",
    items: [
      { title: "Academic Programs", href: "/admin/programs", icon: BookOpen, roles: ["admin"] },
      { title: "User Accounts", href: "/admin/accounts", icon: UserCheck, roles: ["admin"] },
    ],
  },
  {
    label: "REGISTRAR MANAGEMENT",
    items: [
      { title: "student info database", href: "/student-info", icon: FileCheck, roles: ["admin", "registrar"] },
      { title: "student RFID generate", href: "/rfid-generate", icon: Users, roles: ["admin", "staff", "registrar"] },
      { title: "Digital file storage", href: "/file-storage", icon: Users, roles: ["admin", "staff", "registrar"] },
      { title: "Heath record management", href: "/heath-record", icon: Users, roles: ["admin", "staff", "registrar"] },
      {
        title: "Human Resources",
        href: "/human-resources",
        icon: UserCog,
        roles: ["admin", "registrar"],
        children: [
          { title: "Registration Staff", href: "/human-resources/registration-staff", icon: UserCheck, roles: ["admin", "registrar"] },
          { title: "Faculty", href: "/human-resources/faculty", icon: GraduationCap, roles: ["admin", "registrar"] },
        ],
      },
    ],
  }
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
      { title: "Applicant Directory", href: "/student", icon: Users },
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
  if (role === "admin" || role === "registrar") {
    return adminNavigation
  }
  return staffNavigation
}

// Keep backward compatibility with existing code
export const navigation = [...adminNavigation, ...staffNavigation]

export const allNavItems = [...adminNavigation, ...staffNavigation, ...studentNavigation].flatMap(
  (group) => group.items.flatMap((item) => (item.children ? [item, ...item.children] : [item]))
)

export function getPageTitle(pathname: string): string {
  const item = allNavItems.find((nav) => nav.href === pathname)
  return item?.title ?? "SMS 2"
}