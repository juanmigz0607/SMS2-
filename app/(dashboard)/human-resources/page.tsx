import Link from "next/link"
import {
    Users,
    UserCheck,
    GraduationCap,
    ShieldCheck,
    ArrowRight,
    Building2,
    CalendarCheck,
    Clock,
    Mail,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/utils/supabase/server"

export default async function HumanResourcesPage() {
    let facultyCount = 0
    let staffCount = 0
    let activeFacultyCount = 0
    let onDutyStaffCount = 0

    try {
        const supabase = await createClient()
        const [
            { count: totalFaculty, data: facultyData },
            { count: totalStaff, data: staffData },
        ] = await Promise.all([
            supabase.from("faculty").select("status", { count: "exact" }),
            supabase.from("registration_staff").select("status", { count: "exact" }),
        ])

        if (totalFaculty !== null && totalFaculty !== undefined) {
            facultyCount = totalFaculty
            if (facultyData) {
                activeFacultyCount = facultyData.filter((f) => f.status === "Active").length
            }
        }

        if (totalStaff !== null && totalStaff !== undefined) {
            staffCount = totalStaff
            if (staffData) {
                onDutyStaffCount = staffData.filter((s) => s.status === "On Duty").length
            }
        }
    } catch {
        // Fallback gracefully if database table is not created yet
    }

    const totalPersonnel = facultyCount + staffCount

    return (
        <div className="space-y-6">
            <PageHeader
                title="Human Resources"
                description="Registrar personnel management, registration staff assignments, and academic faculty directories."
            />

            {/* Quick Stat Highlights */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-slate-200 dark:border-emerald-950/60 bg-white dark:bg-[#070d0a]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-slate-500 dark:text-emerald-400/80">
                            Total HR Personnel
                        </CardTitle>
                        <Users className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-emerald-100">
                            {totalPersonnel}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-emerald-500/70 mt-1">
                            Staff & faculty members
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-emerald-950/60 bg-white dark:bg-[#070d0a]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-slate-500 dark:text-emerald-400/80">
                            Registration Staff
                        </CardTitle>
                        <UserCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-emerald-100">
                            {staffCount}
                        </div>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                            Official registrar roster
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-emerald-950/60 bg-white dark:bg-[#070d0a]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-slate-500 dark:text-emerald-400/80">
                            Active Faculty
                        </CardTitle>
                        <GraduationCap className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-emerald-100">
                            {facultyCount}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-emerald-500/70 mt-1">
                            {activeFacultyCount} active this term
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-emerald-950/60 bg-white dark:bg-[#070d0a]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-slate-500 dark:text-emerald-400/80">
                            Active Counters
                        </CardTitle>
                        <Building2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-emerald-100">6</div>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                            Windows open for evaluation
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Sections Navigation Cards */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-slate-200 dark:border-emerald-950/60 bg-white dark:bg-[#070d0a] hover:border-emerald-500/50 transition-all duration-200 shadow-xs">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
                                <UserCheck className="size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-emerald-100">
                                    Registration Staff
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500 dark:text-emerald-400/70">
                                    Registrar front-desk personnel, counter evaluators & verifiers
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-xs text-slate-600 dark:text-emerald-300/80 leading-relaxed">
                            Oversee registrar admissions staff, window assignments, duty schedules, and credential verification personnel handling applicant evaluations.
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-emerald-950/40 px-2 py-1 text-slate-600 dark:text-emerald-400 text-[11px]">
                                <Mail className="size-3" /> Email Directory
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-emerald-950/40 px-2 py-1 text-slate-600 dark:text-emerald-400 text-[11px]">
                                <ShieldCheck className="size-3" /> Counter Assignments
                            </span>
                        </div>
                        <div className="pt-2">
                            <Link
                                href="/human-resources/registration-staff"
                                className={cn(
                                    buttonVariants(),
                                    "w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500"
                                )}
                            >
                                Manage Registration Staff
                                <ArrowRight className="ml-2 size-4" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-emerald-950/60 bg-white dark:bg-[#070d0a] hover:border-emerald-500/50 transition-all duration-200 shadow-xs">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
                                <GraduationCap className="size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-emerald-100">
                                    Faculty Directory
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500 dark:text-emerald-400/70">
                                    Academic instructors, program chairs & department heads
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-xs text-slate-600 dark:text-emerald-300/80 leading-relaxed">
                            Maintain department faculty profiles, academic ranking, advisor assignments, teaching loads, and registrar-affiliated program coordinators.
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-emerald-950/40 px-2 py-1 text-slate-600 dark:text-emerald-400 text-[11px]">
                                <Building2 className="size-3" /> Departments
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-emerald-950/40 px-2 py-1 text-slate-600 dark:text-emerald-400 text-[11px]">
                                <CalendarCheck className="size-3" /> Academic Load
                            </span>
                        </div>
                        <div className="pt-2">
                            <Link
                                href="/human-resources/faculty"
                                className={cn(
                                    buttonVariants(),
                                    "w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500"
                                )}
                            >
                                Manage Faculty
                                <ArrowRight className="ml-2 size-4" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
