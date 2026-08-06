"use client"

import * as React from "react"
import Link from "next/link"
import {
    Search,
    Users,
    UserCheck,
    UserX,
    GraduationCap,
    Mail,
    Phone,
    MapPin,
    Filter,
    X,
    Pencil,
    Loader2,
} from "lucide-react"

import { createClient } from "@/utils/supabase/client"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { buttonVariants, Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { updateStudentInfoAction } from "./action"

type OptionItem = {
    id: string
    name?: string
    code?: string
    year_code?: string
}

type StudentInfoRow = {
    id: string // student_id
    enrollment_id?: string | null
    student_number: string
    full_name: string
    first_name: string
    middle_name: string
    last_name: string
    email: string
    contact_number: string
    address: string
    program_id?: string
    program: string
    program_name: string
    year_level_id?: string
    year_level: string
    academic_year_id?: string
    academic_year: string
    semester_id?: string
    semester: string
    enrollment_status: string
    isActive: boolean
    created_at: string
    raw_created_at: string
}

export default function StudentInfoPage() {
    const supabase = createClient()

    const [students, setStudents] = React.useState<StudentInfoRow[]>([])
    const [searchQuery, setSearchQuery] = React.useState("")
    const [selectedStatus, setSelectedStatus] = React.useState("ALL")
    const [selectedProgram, setSelectedProgram] = React.useState("ALL")
    const [selectedSchoolYear, setSelectedSchoolYear] = React.useState("ALL")
    const [isLoading, setIsLoading] = React.useState(true)

    // Edit Modal State
    const [editingStudent, setEditingStudent] = React.useState<StudentInfoRow | null>(null)
    const [isSaving, setIsSaving] = React.useState(false)
    const [editError, setEditError] = React.useState<string | null>(null)

    // Lookup options
    const [programs, setPrograms] = React.useState<OptionItem[]>([])
    const [yearLevels, setYearLevels] = React.useState<OptionItem[]>([])
    const [academicYears, setAcademicYears] = React.useState<OptionItem[]>([])
    const [semesters, setSemesters] = React.useState<OptionItem[]>([])

    // Load lookup options for selects
    React.useEffect(() => {
        async function loadLookupOptions() {
            try {
                const [
                    { data: progData },
                    { data: yearData },
                    { data: ayData },
                    { data: semData },
                ] = await Promise.all([
                    supabase.from("programs").select("id, code, name").order("code"),
                    supabase.from("year_levels").select("id, name").order("name"),
                    supabase.from("academic_years").select("id, year_code").order("year_code"),
                    supabase.from("semesters").select("id, name").order("name"),
                ])

                if (progData) setPrograms(progData)
                if (yearData) setYearLevels(yearData)
                if (ayData) setAcademicYears(ayData)
                if (semData) setSemesters(semData)
            } catch (err) {
                console.error("Error loading lookup options:", err)
            }
        }
        loadLookupOptions()
    }, [supabase])

    const fetchStudentDatabase = React.useCallback(async (showLoader = false) => {
        if (showLoader) setIsLoading(true)
        try {
            // Fetch students joined with latest enrollment details
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
                    created_at,
                    enrollments (
                        id,
                        status,
                        program_id,
                        year_level_id,
                        academic_year_id,
                        semester_id,
                        enrolled_at,
                        programs ( id, code, name ),
                        year_levels ( id, name ),
                        academic_years ( id, year_code ),
                        semesters ( id, name )
                    )
                `)
                .order("created_at", { ascending: false })

            if (error) {
                console.error("Error fetching student database:", error.message)
                return
            }

            if (data) {
                const formatted: StudentInfoRow[] = data.map((s: any) => {
                    const middleInitial = s.middle_name ? ` ${s.middle_name.charAt(0)}.` : ""
                    const fullName = `${s.first_name}${middleInitial} ${s.last_name}`

                    const latestEnrollment =
                        Array.isArray(s.enrollments) && s.enrollments.length > 0
                            ? s.enrollments[0]
                            : null

                    const enrollmentStatus = latestEnrollment?.status || "Enrolled"
                    const isActive = enrollmentStatus.toLowerCase() === "enrolled"

                    const rawStudentNumber = s.student_number
                    const displayStudentNumber =
                        !rawStudentNumber || rawStudentNumber.startsWith("PENDING")
                            ? "Unassigned"
                            : rawStudentNumber

                    return {
                        id: s.id,
                        enrollment_id: latestEnrollment?.id || null,
                        student_number: displayStudentNumber,
                        full_name: fullName,
                        first_name: s.first_name || "",
                        middle_name: s.middle_name || "",
                        last_name: s.last_name || "",
                        email: s.email || "N/A",
                        contact_number: s.contact_number || "N/A",
                        address: s.address || "N/A",
                        program_id: latestEnrollment?.program_id,
                        program: latestEnrollment?.programs?.code || "Unassigned",
                        program_name: latestEnrollment?.programs?.name || "Unassigned Program",
                        year_level_id: latestEnrollment?.year_level_id,
                        year_level: latestEnrollment?.year_levels?.name || "N/A",
                        academic_year_id: latestEnrollment?.academic_year_id,
                        academic_year: latestEnrollment?.academic_years?.year_code || "N/A",
                        semester_id: latestEnrollment?.semester_id,
                        semester: latestEnrollment?.semesters?.name || "N/A",
                        enrollment_status: enrollmentStatus,
                        isActive: isActive,
                        created_at: s.created_at
                            ? new Date(s.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })
                            : "N/A",
                        raw_created_at: s.created_at || "",
                    }
                })

                setStudents(formatted)
            }
        } catch (err) {
            console.error("Fetch student database error:", err)
        } finally {
            setIsLoading(false)
        }
    }, [supabase])

    React.useEffect(() => {
        fetchStudentDatabase(true)

        // Realtime subscription for student database updates
        const channel = supabase
            .channel("student-database-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "students" },
                () => fetchStudentDatabase(false)
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "enrollments" },
                () => fetchStudentDatabase(false)
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchStudentDatabase, supabase])

    // Stat Overview calculations
    const stats = React.useMemo(() => {
        const total = students.length
        const active = students.filter((s) => s.isActive).length
        const inactive = students.filter((s) => !s.isActive).length
        const programsSet = new Set(students.map((s) => s.program).filter((p) => p !== "Unassigned"))

        return { total, active, inactive, activePrograms: programsSet.size }
    }, [students])

    // Extract unique programs for dropdown filter
    const availablePrograms = React.useMemo(() => {
        const set = new Set(students.map((s) => s.program).filter((p) => p !== "Unassigned"))
        return Array.from(set)
    }, [students])

    // Extract unique school years for dropdown filter
    const availableSchoolYears = React.useMemo(() => {
        const set = new Set(
            students.map((s) => s.academic_year).filter((ay) => ay && ay !== "N/A")
        )
        return Array.from(set)
    }, [students])

    // Filter students by search, active status, program, and school year
    const filteredStudents = React.useMemo(() => {
        return students.filter((s) => {
            const matchesSearch =
                s.student_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.email.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesStatus =
                selectedStatus === "ALL" ||
                (selectedStatus === "ACTIVE" && s.isActive) ||
                (selectedStatus === "INACTIVE" && !s.isActive)

            const matchesProgram =
                selectedProgram === "ALL" || s.program === selectedProgram

            const matchesSchoolYear =
                selectedSchoolYear === "ALL" || s.academic_year === selectedSchoolYear

            return (
                matchesSearch &&
                matchesStatus &&
                matchesProgram &&
                matchesSchoolYear
            )
        })
    }, [
        students,
        searchQuery,
        selectedStatus,
        selectedProgram,
        selectedSchoolYear,
    ])

    // Save Edit Form Handler
    async function handleSaveEdit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!editingStudent) return

        setIsSaving(true)
        setEditError(null)

        const formData = new FormData(e.currentTarget)
        const result = await updateStudentInfoAction({
            studentId: editingStudent.id,
            enrollmentId: editingStudent.enrollment_id,
            firstName: formData.get("firstName") as string,
            middleName: formData.get("middleName") as string,
            lastName: formData.get("lastName") as string,
            email: formData.get("email") as string,
            contactNumber: formData.get("contactNumber") as string,
            address: formData.get("address") as string,
            programId: formData.get("programId") as string,
            yearLevelId: formData.get("yearLevelId") as string,
            academicYearId: formData.get("academicYearId") as string,
            semesterId: formData.get("semesterId") as string,
            status: formData.get("status") as string,
        })

        setIsSaving(false)

        if (result.success) {
            setEditingStudent(null)
            fetchStudentDatabase(false)
        } else {
            setEditError(result.error || "Failed to update student profile.")
        }
    }

    const selectStyle =
        "h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950"

    return (
        <div className="space-y-6">
            <PageHeader
                title="Student Info Database"
                description="Manage, edit, and inspect official student profiles, contact records, academic levels, and active status."
            >
                <Link
                    href="/applicant"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
                >
                    <Users className="size-4" />
                    Applicant Directory
                </Link>
            </PageHeader>

            {/* Stat Cards Overview */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-slate-200 bg-white shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold text-slate-500">
                            Total Registered Students
                        </CardTitle>
                        <Users className="size-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                        <p className="text-[10px] text-slate-400">Total student directory records</p>
                    </CardContent>
                </Card>

                <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold text-emerald-700">
                            Active Students
                        </CardTitle>
                        <UserCheck className="size-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-900">{stats.active}</div>
                        <p className="text-[10px] text-emerald-600">Currently enrolled & active</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 bg-slate-50/50 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold text-slate-600">
                            Inactive / Inactive Term
                        </CardTitle>
                        <UserX className="size-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-800">{stats.inactive}</div>
                        <p className="text-[10px] text-slate-400">Non-enrolled or inactive</p>
                    </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50/30 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold text-blue-700">
                            Programs Represented
                        </CardTitle>
                        <GraduationCap className="size-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900">{stats.activePrograms}</div>
                        <p className="text-[10px] text-blue-600">Active degree programs</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filter Bar */}
            <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                            <Input
                                placeholder="Search by student no, name, or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 text-xs h-9"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Active Status Filter */}
                            <div className="flex items-center gap-1.5">
                                <Filter className="size-3.5 text-slate-400" />
                                <span className="text-xs font-semibold text-slate-500 shrink-0">
                                    Account Status:
                                </span>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950"
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                </select>
                            </div>

                            {/* Program Filter Dropdown */}
                            <div className="flex items-center gap-1.5">
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

                            {/* School Year Filter Dropdown */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-500 shrink-0">
                                    School Year:
                                </span>
                                <select
                                    value={selectedSchoolYear}
                                    onChange={(e) => setSelectedSchoolYear(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950"
                                >
                                    <option value="ALL">All School Years</option>
                                    {availableSchoolYears.map((sy) => (
                                        <option key={sy} value={sy}>
                                            {sy}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Student Directory Table */}
            <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader className="border-b border-slate-100 py-4">
                    <CardTitle className="text-base font-bold text-slate-800 flex items-center justify-between">
                        <span>Student Information Database ({filteredStudents.length})</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <p className="py-12 text-center text-xs text-slate-500">
                            Loading student database...
                        </p>
                    ) : filteredStudents.length === 0 ? (
                        <p className="py-12 text-center text-xs text-slate-500">
                            No student records found matching your filters.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50">
                                    <TableHead className="text-xs font-semibold">Student No.</TableHead>
                                    <TableHead className="text-xs font-semibold">Student Name</TableHead>
                                    <TableHead className="text-xs font-semibold">Contact & Email</TableHead>
                                    <TableHead className="text-xs font-semibold">Program</TableHead>
                                    <TableHead className="text-xs font-semibold">Year & Term</TableHead>
                                    <TableHead className="text-xs font-semibold">Status</TableHead>
                                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStudents.map((student) => (
                                    <TableRow
                                        key={student.id}
                                        onClick={() => setEditingStudent(student)}
                                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                                    >
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
                                            <div className="flex flex-col text-[11px] text-slate-700">
                                                <span>{student.year_level}</span>
                                                <span className="text-[10px] text-slate-400">{student.semester}</span>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <StatusBadge status={student.isActive ? "success" : "default"}>
                                                {student.isActive ? "Active" : "Inactive"}
                                            </StatusBadge>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 px-2.5 text-[11px] border-slate-200 hover:bg-slate-100 text-slate-700 gap-1.5 cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setEditingStudent(student)
                                                }}
                                            >
                                                <Pencil className="size-3 text-slate-500" />
                                                Edit
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Student Info Modal */}
            {editingStudent && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
                    onClick={() => setEditingStudent(null)}
                >
                    <div
                        className="w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Pencil className="size-4 text-slate-700" />
                                <h3 className="text-base font-bold text-slate-800">
                                    Edit Student Information
                                </h3>
                            </div>
                            <button
                                onClick={() => setEditingStudent(null)}
                                className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSaveEdit}>
                            <div className="space-y-4 p-6 text-xs max-h-[70vh] overflow-y-auto">
                                {editError && (
                                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                                        {editError}
                                    </div>
                                )}

                                {/* Personal Information Section */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Personal Information
                                    </h4>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-semibold">First Name *</Label>
                                            <Input
                                                name="firstName"
                                                defaultValue={editingStudent.first_name}
                                                required
                                                className="h-8 text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-semibold">Middle Name</Label>
                                            <Input
                                                name="middleName"
                                                defaultValue={editingStudent.middle_name}
                                                className="h-8 text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-semibold">Last Name *</Label>
                                            <Input
                                                name="lastName"
                                                defaultValue={editingStudent.last_name}
                                                required
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-semibold">Email Address *</Label>
                                            <Input
                                                name="email"
                                                type="email"
                                                defaultValue={editingStudent.email}
                                                required
                                                className="h-8 text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-semibold">Contact Number</Label>
                                            <Input
                                                name="contactNumber"
                                                defaultValue={editingStudent.contact_number}
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold">Home Address</Label>
                                        <Input
                                            name="address"
                                            defaultValue={editingStudent.address}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Academic & Enrollment Information Section */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Academic Level & Status
                                    </h4>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-semibold">Course / Program *</Label>
                                            <select
                                                name="programId"
                                                defaultValue={editingStudent.program_id}
                                                required
                                                className={selectStyle}
                                            >
                                                {programs.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.code} - {p.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-semibold">Year Level *</Label>
                                            <select
                                                name="yearLevelId"
                                                defaultValue={editingStudent.year_level_id}
                                                required
                                                className={selectStyle}
                                            >
                                                {yearLevels.map((y) => (
                                                    <option key={y.id} value={y.id}>
                                                        {y.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-semibold">Academic Year *</Label>
                                            <select
                                                name="academicYearId"
                                                defaultValue={editingStudent.academic_year_id}
                                                required
                                                className={selectStyle}
                                            >
                                                {academicYears.map((a) => (
                                                    <option key={a.id} value={a.id}>
                                                        {a.year_code}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-semibold">Semester *</Label>
                                            <select
                                                name="semesterId"
                                                defaultValue={editingStudent.semester_id}
                                                required
                                                className={selectStyle}
                                            >
                                                {semesters.map((s) => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1 pt-2">
                                        <Label className="text-[11px] font-semibold">Enrollment & Account Status *</Label>
                                        <select
                                            name="status"
                                            defaultValue={editingStudent.enrollment_status}
                                            required
                                            className={selectStyle}
                                        >
                                            <option value="Enrolled">Active (Enrolled)</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 text-xs cursor-pointer"
                                    onClick={() => setEditingStudent(null)}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="h-8 px-4 text-xs bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
