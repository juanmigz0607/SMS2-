"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    Users,
    UserCheck,
    GraduationCap,
    Clock,
    UserPlus,
    FileCheck,
    ArrowRight,
    CheckCircle2,
} from "lucide-react"
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"

import { createClient } from "@/utils/supabase/client"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type EnrollmentRow = {
    id: string
    student_number: string
    student_name: string
    course_program: string
    year_level: string
    semester: string
    status: string
    enrolled_at: string
}

type LiveStats = {
    totalStudents: number
    enrolledThisSemester: number
    pendingEnrollments: number
    activePrograms: number
}

export default function EnrollmentDashboardPage() {
    const router = useRouter()
    const supabase = createClient()

    const [stats, setStats] = React.useState<LiveStats>({
        totalStudents: 0,
        enrolledThisSemester: 0,
        pendingEnrollments: 0,
        activePrograms: 0,
    })
    const [recentEnrollments, setRecentEnrollments] = React.useState<EnrollmentRow[]>([])
    const [programDistribution, setProgramDistribution] = React.useState<
        { name: string; count: number }[]
    >([])

    const fetchDashboardData = React.useCallback(async () => {
        try {
            // 1. Fetch total registered students count from students table
            const { count: studentCount } = await supabase
                .from("students")
                .select("*", { count: "exact", head: true })

            // 2. Fetch enrolled this semester count from enrollments table
            const { count: enrolledCount } = await supabase
                .from("enrollments")
                .select("*", { count: "exact", head: true })
                .eq("status", "Enrolled")

            // 3. Fetch ONLY currently pending enrollments count (status = Pending)
            const { count: pendingCount } = await supabase
                .from("enrollments")
                .select("*", { count: "exact", head: true })
                .eq("status", "Pending")

            // 4. Fetch total active academic programs count from programs table
            const { count: programCount } = await supabase
                .from("programs")
                .select("*", { count: "exact", head: true })

            setStats({
                totalStudents: studentCount ?? 0,
                enrolledThisSemester: enrolledCount ?? 0,
                pendingEnrollments: pendingCount ?? 0,
                activePrograms: programCount ?? 0,
            })

            // 5. Fetch recent 5 officially enrolled students with full details
            const { data: enrollmentsData } = await supabase
                .from("enrollments")
                .select(`
                    id,
                    status,
                    enrolled_at,
                    students (
                        id,
                        student_number,
                        first_name,
                        middle_name,
                        last_name
                    ),
                    programs ( code, name ),
                    year_levels ( name ),
                    semesters ( name )
                `)
                .eq("status", "Enrolled")
                .not("student_id", "is", null)
                .order("enrolled_at", { ascending: false })

            if (enrollmentsData) {
                // Map recent enrolled students for table
                const formattedEnrollments: EnrollmentRow[] = enrollmentsData
                    .slice(0, 5)
                    .map((e: any) => {
                        const student = e.students
                        const program = e.programs
                        const yearLevel = e.year_levels
                        const semester = e.semesters

                        const middleInitial = student?.middle_name ? ` ${student.middle_name.charAt(0)}.` : ""
                        const name = student
                            ? `${student.first_name}${middleInitial} ${student.last_name}`
                            : "Enrolled Student"

                        return {
                            id: e.id,
                            student_number: student?.student_number || "N/A",
                            student_name: name,
                            course_program: program?.code || "N/A",
                            year_level: yearLevel?.name || "N/A",
                            semester: semester?.name || "N/A",
                            status: "Enrolled",
                            enrolled_at: new Date(e.enrolled_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            }),
                        }
                    })

                setRecentEnrollments(formattedEnrollments)

                // Program chart aggregation using enrolled students
                const programCounts: Record<string, number> = {}
                enrollmentsData.forEach((e: any) => {
                    const prog = e.programs?.code || "Unassigned"
                    programCounts[prog] = (programCounts[prog] || 0) + 1
                })

                const chartData = Object.entries(programCounts).map(
                    ([name, count]) => ({
                        name,
                        count,
                    })
                )
                setProgramDistribution(chartData)
            }
        } catch (err) {
            console.error("Dashboard fetch error:", err)
        }
    }, [supabase])

    React.useEffect(() => {
        fetchDashboardData()

        // Realtime channel for instant UI updates across students, applicants, and enrollments
        const channel = supabase
            .channel("enrollment-dashboard-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "students" },
                () => fetchDashboardData()
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "applicants" },
                () => fetchDashboardData()
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "enrollments" },
                () => fetchDashboardData()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchDashboardData, supabase])

    return (
        <div className="space-y-8">
            <PageHeader
                title="Enrollment Dashboard"
                description="Overview of student registrations, active enrollments, and academic distribution."
            >
                <Link
                    href="/pre-register"
                    className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2")}
                >
                    <FileCheck className="size-4" />
                    Pre-Registered Applications
                </Link>
            </PageHeader>

            {/* 1. Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Total Registered Students"
                    value={stats.totalStudents}
                />
                <StatCard
                    label="Enrolled This Semester"
                    value={stats.enrolledThisSemester}
                />
                <StatCard
                    label="Pending Applications"
                    value={stats.pendingEnrollments}
                />
                <StatCard
                    label="Active Programs"
                    value={stats.activePrograms}
                />
            </div>

            {/* 2. Program Distribution Chart & Quick Actions */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="shadow-sm border-zinc-200/80 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            Enrollments by Program
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {programDistribution.length === 0 ? (
                            <p className="py-12 text-center text-sm text-muted-foreground">
                                No program enrollment data available yet.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={programDistribution}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                                    />
                                    <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                                    <Tooltip
                                        contentStyle={{
                                            background: "var(--card)",
                                            border: "1px solid var(--border)",
                                            borderRadius: "6px",
                                            fontSize: "12px",
                                        }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        fill="var(--chart-1, #2563eb)"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm flex flex-col justify-between">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            Quick Management
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Link
                            href="/pre-register"
                            className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50"
                        >
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-900">
                                    Pre-Registered Applications
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Review and manage online student enrollment submissions.
                                </p>
                            </div>
                            <span className="text-xs font-semibold text-blue-600">View Applications &rarr;</span>
                        </Link>

                        <Link
                            href="/student"
                            className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50"
                        >
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-900">
                                    Applicant Directory
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    View processed applicant records with finalized decisions (Enrolled or Rejected).
                                </p>
                            </div>
                            <ArrowRight className="size-4 text-slate-400" />
                        </Link>
                    </CardContent>
                    <div className="p-6 pt-0">
                        <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-100">
                            <CheckCircle2 className="size-4 shrink-0" />
                            <span>Realtime sync active for enrollment updates.</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* 3. Recent Enrollments Table */}
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-semibold">
                        Recent Student Enrollments
                    </CardTitle>
                    <Link
                        href="/student"
                        className="text-xs font-medium text-blue-600 hover:underline"
                    >
                        View Applicant Directory
                    </Link>
                </CardHeader>
                <CardContent>
                    {recentEnrollments.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            No recent enrollments recorded.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student No.</TableHead>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Course / Program</TableHead>
                                    <TableHead>Year Level</TableHead>
                                    <TableHead>Date Enrolled</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentEnrollments.map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-mono text-xs font-semibold">
                                            {student.student_number}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {student.student_name}
                                        </TableCell>
                                        <TableCell>{student.course_program}</TableCell>
                                        <TableCell>{student.year_level}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {student.enrolled_at}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <StatusBadge
                                                status={
                                                    student.status === "Enrolled"
                                                        ? "success"
                                                        : student.status === "Pending"
                                                            ? "warning"
                                                            : "default"
                                                }
                                            >
                                                {student.status}
                                            </StatusBadge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}