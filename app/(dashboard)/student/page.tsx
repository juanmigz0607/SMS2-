"use client"

import * as React from "react"
import Link from "next/link"
import { Search, UserPlus, GraduationCap, Mail, Phone, MapPin } from "lucide-react"

import { createClient } from "@/utils/supabase/client"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

type StudentDirectoryRow = {
    id: string
    student_number: string
    full_name: string
    email: string
    contact_number: string
    address: string
    program: string
    year_level: string
    academic_year: string
    semester: string
    status: string
    enrolled_at: string
}

export default function StudentDirectoryPage() {
    const supabase = createClient()

    const [students, setStudents] = React.useState<StudentDirectoryRow[]>([])
    const [searchQuery, setSearchQuery] = React.useState("")
    const [selectedProgram, setSelectedProgram] = React.useState("ALL")
    const [isLoading, setIsLoading] = React.useState(true)

    const fetchStudentDirectory = React.useCallback(async () => {
        setIsLoading(true)
        try {
            // Fetch students and join latest enrollment + lookup tables
            const { data, error } = await supabase
                .from("students")
                .select(`
          id,
          student_number,
          first_name,
          middle_name,
          last_name,
          email,
          contact_number,
          address,
          enrollments (
            id,
            status,
            enrolled_at,
            programs ( code, name ),
            year_levels ( name ),
            academic_years ( year_code ),
            semesters ( name )
          )
        `)
                .order("created_at", { ascending: false })

            if (error) {
                console.error("Error fetching students:", error.message)
                return
            }

            if (data) {
                const formatted: StudentDirectoryRow[] = data.map((s: any) => {
                    // Get most recent enrollment record if multiple exist
                    const latestEnrollment = Array.isArray(s.enrollments) && s.enrollments.length > 0
                        ? s.enrollments[0]
                        : null

                    const middleInitial = s.middle_name ? ` ${s.middle_name.charAt(0)}.` : ""
                    const fullName = `${s.first_name}${middleInitial} ${s.last_name}`

                    return {
                        id: s.id,
                        student_number: s.student_number || "N/A",
                        full_name: fullName,
                        email: s.email || "N/A",
                        contact_number: s.contact_number || "N/A",
                        address: s.address || "N/A",
                        program: latestEnrollment?.programs?.code || "Unassigned",
                        year_level: latestEnrollment?.year_levels?.name || "N/A",
                        academic_year: latestEnrollment?.academic_years?.year_code || "N/A",
                        semester: latestEnrollment?.semesters?.name || "N/A",
                        status: latestEnrollment?.status || "Enrolled",
                        enrolled_at: latestEnrollment?.enrolled_at
                            ? new Date(latestEnrollment.enrolled_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })
                            : "N/A",
                    }
                })

                setStudents(formatted)
            }
        } catch (err) {
            console.error("Fetch directory error:", err)
        } finally {
            setIsLoading(false)
        }
    }, [supabase])

    React.useEffect(() => {
        fetchStudentDirectory()
    }, [fetchStudentDirectory])

    // Extract unique program codes for filtering
    const availablePrograms = React.useMemo(() => {
        const set = new Set(students.map((s) => s.program).filter((p) => p !== "Unassigned"))
        return Array.from(set)
    }, [students])

    // Filter students by search term and program selection
    const filteredStudents = React.useMemo(() => {
        return students.filter((s) => {
            const matchesSearch =
                s.student_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.email.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesProgram =
                selectedProgram === "ALL" || s.program === selectedProgram

            return matchesSearch && matchesProgram
        })
    }, [students, searchQuery, selectedProgram])

    return (
        <div className="space-y-6">
            <PageHeader
                title="Student Directory"
                description="View, filter, and manage registered student accounts and active academic profiles."
            >
                <Link
                    href="/enrollment"
                    className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2")}
                >
                    <UserPlus className="size-4" />
                    Enroll New Student
                </Link>
            </PageHeader>

            {/* Search & Filter Bar */}
            <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                            <Input
                                placeholder="Search by student number, name, or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 text-xs h-9"
                            />
                        </div>

                        {/* Program Filter Dropdown */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 shrink-0">
                                Program:
                            </span>
                            <select
                                value={selectedProgram}
                                onChange={(e) => setSelectedProgram(e.target.value)}
                                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950"
                            >
                                <option value="ALL">All Programs</option>
                                {availablePrograms.map((prog) => (
                                    <option key={prog} value={prog}>
                                        {prog}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Directory Table */}
            <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader className="border-b border-slate-100 py-4">
                    <CardTitle className="text-base font-bold text-slate-800 flex items-center justify-between">
                        <span>Registered Students ({filteredStudents.length})</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <p className="py-12 text-center text-xs text-slate-500">
                            Loading student records...
                        </p>
                    ) : filteredStudents.length === 0 ? (
                        <p className="py-12 text-center text-xs text-slate-500">
                            No student records found matching your search criteria.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50">
                                    <TableHead className="text-xs font-semibold">Student No.</TableHead>
                                    <TableHead className="text-xs font-semibold">Student Name</TableHead>
                                    <TableHead className="text-xs font-semibold">Contact & Email</TableHead>
                                    <TableHead className="text-xs font-semibold">Program</TableHead>
                                    <TableHead className="text-xs font-semibold">Year Level</TableHead>
                                    <TableHead className="text-xs font-semibold">Term</TableHead>
                                    <TableHead className="text-xs font-semibold text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStudents.map((student) => (
                                    <TableRow key={student.id} className="hover:bg-slate-50/80 transition-colors">
                                        <TableCell className="font-mono text-xs font-bold text-slate-900">
                                            {student.student_number}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-slate-900">
                                                    {student.full_name}
                                                </span>
                                                <span className="text-[10px] text-slate-500 truncate max-w-[180px]" title={student.address}>
                                                    {student.address}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col space-y-0.5 text-[11px] text-slate-600">
                                                <span className="flex items-center gap-1.5">
                                                    <Mail className="size-3 text-slate-400" />
                                                    {student.email}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-slate-500">
                                                    <Phone className="size-3 text-slate-400" />
                                                    {student.contact_number}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                                                {student.program}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-700">
                                            {student.year_level}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-[11px] text-slate-600">
                                                <span>{student.semester}</span>
                                                <span className="text-[10px] text-slate-400">AY {student.academic_year}</span>
                                            </div>
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