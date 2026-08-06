"use client"

import * as React from "react"
import Link from "next/link"
import {
    Search,
    FileCheck,
    Mail,
    Phone,
    MapPin,
    GraduationCap,
    Calendar,
    User,
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
import { updateApplicantAction } from "./action"

type OptionItem = {
    id: string
    name?: string
    code?: string
    year_code?: string
}

type ApplicantDirectoryRow = {
    id: string // enrollmentId
    student_id?: string | null
    applicant_id?: string | null
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
    status: "Enrolled" | "Rejected" | string
    decision_date: string
}

export default function ApplicantDirectoryPage() {
    const supabase = createClient()

    const [applicants, setApplicants] = React.useState<ApplicantDirectoryRow[]>([])
    const [searchQuery, setSearchQuery] = React.useState("")
    const [selectedStatus, setSelectedStatus] = React.useState("ALL")
    const [selectedProgram, setSelectedProgram] = React.useState("ALL")
    const [isLoading, setIsLoading] = React.useState(true)

    // View Modal State
    const [selectedApplicant, setSelectedApplicant] = React.useState<ApplicantDirectoryRow | null>(null)

    // Edit Modal State
    const [editingApplicant, setEditingApplicant] = React.useState<ApplicantDirectoryRow | null>(null)
    const [isSaving, setIsSaving] = React.useState(false)
    const [editError, setEditError] = React.useState<string | null>(null)

    // Dynamic dropdown lookup options
    const [programs, setPrograms] = React.useState<OptionItem[]>([])
    const [yearLevels, setYearLevels] = React.useState<OptionItem[]>([])
    const [academicYears, setAcademicYears] = React.useState<OptionItem[]>([])
    const [semesters, setSemesters] = React.useState<OptionItem[]>([])

    // Load lookup options
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

    const fetchApplicantDirectory = React.useCallback(async (showLoader = false) => {
        if (showLoader) setIsLoading(true)
        try {
            // Fetch processed enrollments (status in Enrolled or Rejected)
            const { data, error } = await supabase
                .from("enrollments")
                .select(`
                    id,
                    student_id,
                    applicant_id,
                    program_id,
                    year_level_id,
                    academic_year_id,
                    semester_id,
                    status,
                    enrolled_at,
                    students (
                        id,
                        student_number,
                        first_name,
                        middle_name,
                        last_name,
                        email,
                        contact_number,
                        address
                    ),
                    applicants (
                        id,
                        applicant_id,
                        first_name,
                        middle_name,
                        last_name,
                        email,
                        contact_number,
                        address
                    ),
                    programs ( id, code, name ),
                    year_levels ( id, name ),
                    academic_years ( id, year_code ),
                    semesters ( id, name )
                `)
                .in("status", ["Enrolled", "Rejected"])
                .order("enrolled_at", { ascending: false })

            if (error) {
                console.error("Error fetching applicant directory:", error.message)
                return
            }

            if (data) {
                const formatted: ApplicantDirectoryRow[] = data.map((e: any) => {
                    const person = e.students || e.applicants
                    const middleInitial = person?.middle_name ? ` ${person.middle_name.charAt(0)}.` : ""
                    const fullName = person
                        ? `${person.first_name}${middleInitial} ${person.last_name}`
                        : "Unknown Applicant"

                    const status = e.status || "Enrolled"
                    const rawStudentNumber = e.students?.student_number
                    const displayStudentNumber =
                        status === "Enrolled"
                            ? rawStudentNumber && !rawStudentNumber.startsWith("PENDING")
                                ? rawStudentNumber
                                : "Enrolled"
                            : e.applicants?.applicant_id || "N/A"

                    return {
                        id: e.id,
                        student_id: e.student_id,
                        applicant_id: e.applicant_id,
                        student_number: displayStudentNumber,
                        full_name: fullName,
                        first_name: person?.first_name || "",
                        middle_name: person?.middle_name || "",
                        last_name: person?.last_name || "",
                        email: person?.email || "N/A",
                        contact_number: person?.contact_number || "N/A",
                        address: person?.address || "N/A",
                        program_id: e.program_id,
                        program: e.programs?.code || "Unassigned",
                        program_name: e.programs?.name || "Unassigned Program",
                        year_level_id: e.year_level_id,
                        year_level: e.year_levels?.name || "N/A",
                        academic_year_id: e.academic_year_id,
                        academic_year: e.academic_years?.year_code || "N/A",
                        semester_id: e.semester_id,
                        semester: e.semesters?.name || "N/A",
                        status: status,
                        decision_date: e.enrolled_at
                            ? new Date(e.enrolled_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })
                            : "N/A",
                    }
                })

                setApplicants(formatted)
            }
        } catch (err) {
            console.error("Fetch directory error:", err)
        } finally {
            setIsLoading(false)
        }
    }, [supabase])

    React.useEffect(() => {
        fetchApplicantDirectory(true)

        // Realtime subscription for instant updates
        const channel = supabase
            .channel("applicant-directory-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "applicants" },
                () => fetchApplicantDirectory(false)
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "enrollments" },
                () => fetchApplicantDirectory(false)
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "students" },
                () => fetchApplicantDirectory(false)
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchApplicantDirectory, supabase])

    // Extract unique program codes for filter
    const availablePrograms = React.useMemo(() => {
        const set = new Set(applicants.map((a) => a.program).filter((p) => p !== "Unassigned"))
        return Array.from(set)
    }, [applicants])

    // Filter applicants by search, decision status, and program
    const filteredApplicants = React.useMemo(() => {
        return applicants.filter((a) => {
            const matchesSearch =
                a.student_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.email.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesStatus =
                selectedStatus === "ALL" ||
                a.status.toLowerCase() === selectedStatus.toLowerCase()

            const matchesProgram =
                selectedProgram === "ALL" || a.program === selectedProgram

            return matchesSearch && matchesStatus && matchesProgram
        })
    }, [applicants, searchQuery, selectedStatus, selectedProgram])

    // Handle Edit Form Submission
    async function handleSaveEdit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!editingApplicant) return

        setIsSaving(true)
        setEditError(null)

        const formData = new FormData(e.currentTarget)
        const result = await updateApplicantAction({
            enrollmentId: editingApplicant.id,
            studentId: editingApplicant.student_id,
            applicantId: editingApplicant.applicant_id,
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
            setEditingApplicant(null)
            setSelectedApplicant(null)
            fetchApplicantDirectory(false)
        } else {
            setEditError(result.error || "Failed to update record.")
        }
    }

    const selectStyle =
        "h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950"

    return (
        <div className="space-y-6">
            <PageHeader
                title="Applicant Directory"
                description="View, search, edit, and inspect all processed applicant records with finalized decisions (Enrolled or Rejected)."
            >
                <Link
                    href="/pre-register"
                    className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2")}
                >
                    <FileCheck className="size-4" />
                    Pending Applications
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
                                placeholder="Search by ID, name, or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 text-xs h-9"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Decision Status Filter */}
                            <div className="flex items-center gap-1.5">
                                <Filter className="size-3.5 text-slate-400" />
                                <span className="text-xs font-semibold text-slate-500 shrink-0">
                                    Decision:
                                </span>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950"
                                >
                                    <option value="ALL">All Decisions</option>
                                    <option value="Enrolled">Enrolled</option>
                                    <option value="Rejected">Rejected</option>
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
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Directory Table */}
            <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader className="border-b border-slate-100 py-4">
                    <CardTitle className="text-base font-bold text-slate-800 flex items-center justify-between">
                        <span>Processed Applicant Records ({filteredApplicants.length})</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <p className="py-12 text-center text-xs text-slate-500">
                            Loading applicant directory...
                        </p>
                    ) : filteredApplicants.length === 0 ? (
                        <p className="py-12 text-center text-xs text-slate-500">
                            No processed applicant records found.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50">
                                    <TableHead className="text-xs font-semibold">ID / Student No.</TableHead>
                                    <TableHead className="text-xs font-semibold">Applicant Name</TableHead>
                                    <TableHead className="text-xs font-semibold">Contact & Email</TableHead>
                                    <TableHead className="text-xs font-semibold">Program</TableHead>
                                    <TableHead className="text-xs font-semibold">Year & Term</TableHead>
                                    <TableHead className="text-xs font-semibold">Decision Date</TableHead>
                                    <TableHead className="text-xs font-semibold">Decision Status</TableHead>
                                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredApplicants.map((app) => (
                                    <TableRow
                                        key={app.id}
                                        onClick={() => setSelectedApplicant(app)}
                                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                                    >
                                        <TableCell className="font-mono text-xs font-bold text-slate-900">
                                            {app.student_number}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-slate-900">
                                                    {app.full_name}
                                                </span>
                                                <span className="text-[10px] text-slate-500 truncate max-w-[180px]" title={app.address}>
                                                    {app.address}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col space-y-0.5 text-[11px] text-slate-600">
                                                <span className="flex items-center gap-1.5">
                                                    <Mail className="size-3 text-slate-400" />
                                                    {app.email}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-slate-500">
                                                    <Phone className="size-3 text-slate-400" />
                                                    {app.contact_number}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                                                {app.program}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-700">
                                            <div className="flex flex-col text-[11px] text-slate-700">
                                                <span>{app.year_level}</span>
                                                <span className="text-[10px] text-slate-400">{app.semester}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-600">
                                            {app.decision_date}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                status={
                                                    app.status.toLowerCase() === "enrolled"
                                                        ? "success"
                                                        : app.status.toLowerCase() === "rejected"
                                                            ? "danger"
                                                            : "default"
                                                }
                                            >
                                                {app.status}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 px-2.5 text-[11px] border-slate-200 hover:bg-slate-100 text-slate-700 gap-1.5 cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setEditingApplicant(app)
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

            {/* View Applicant Detail Modal */}
            {selectedApplicant && !editingApplicant && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
                    onClick={() => setSelectedApplicant(null)}
                >
                    <div
                        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <User className="size-5 text-slate-600" />
                                <h3 className="text-base font-bold text-slate-800">
                                    Applicant Record Details
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedApplicant(null)}
                                className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="space-y-6 p-6 text-xs text-slate-700">
                            {/* Profile Details */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                                        Personal Profile
                                    </span>
                                    <StatusBadge
                                        status={
                                            selectedApplicant.status.toLowerCase() === "enrolled"
                                                ? "success"
                                                : "danger"
                                        }
                                    >
                                        {selectedApplicant.status}
                                    </StatusBadge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 border border-slate-100">
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-medium">
                                            Full Name
                                        </p>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">
                                            {selectedApplicant.full_name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-medium">
                                            ID / Student No.
                                        </p>
                                        <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                                            {selectedApplicant.student_number}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-1">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Mail className="size-4 text-slate-400 shrink-0" />
                                        <span>{selectedApplicant.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Phone className="size-4 text-slate-400 shrink-0" />
                                        <span>{selectedApplicant.contact_number}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-slate-600">
                                        <MapPin className="size-4 text-slate-400 shrink-0 mt-0.5" />
                                        <span>{selectedApplicant.address}</span>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Academic Details */}
                            <div className="space-y-3">
                                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                                    Academic Record Details
                                </span>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-start gap-2">
                                        <GraduationCap className="size-4 text-slate-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] text-slate-400">Course / Program</p>
                                            <p className="font-semibold text-slate-800">
                                                {selectedApplicant.program} - {selectedApplicant.program_name}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <Calendar className="size-4 text-slate-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] text-slate-400">Year & Term</p>
                                            <p className="font-semibold text-slate-800">
                                                {selectedApplicant.year_level} ({selectedApplicant.semester})
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                Academic Year {selectedApplicant.academic_year}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3">
                            <span className="text-[10px] text-slate-400">
                                Processed on {selectedApplicant.decision_date}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-3 text-xs gap-1.5 cursor-pointer"
                                    onClick={() => setEditingApplicant(selectedApplicant)}
                                >
                                    <Pencil className="size-3.5" />
                                    Edit Record
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-8 px-3 text-xs cursor-pointer"
                                    onClick={() => setSelectedApplicant(null)}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Applicant Form Modal */}
            {editingApplicant && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
                    onClick={() => setEditingApplicant(null)}
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
                                    Edit Applicant Record
                                </h3>
                            </div>
                            <button
                                onClick={() => setEditingApplicant(null)}
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

                                {/* Personal Details Section */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Personal Information
                                    </h4>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-semibold">First Name *</Label>
                                            <Input
                                                name="firstName"
                                                defaultValue={editingApplicant.first_name}
                                                required
                                                className="h-8 text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-semibold">Middle Name</Label>
                                            <Input
                                                name="middleName"
                                                defaultValue={editingApplicant.middle_name}
                                                className="h-8 text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-semibold">Last Name *</Label>
                                            <Input
                                                name="lastName"
                                                defaultValue={editingApplicant.last_name}
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
                                                defaultValue={editingApplicant.email}
                                                required
                                                className="h-8 text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-semibold">Contact Number</Label>
                                            <Input
                                                name="contactNumber"
                                                defaultValue={editingApplicant.contact_number}
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold">Home Address</Label>
                                        <Input
                                            name="address"
                                            defaultValue={editingApplicant.address}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Academic Information Section */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Academic Program & Decision
                                    </h4>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-semibold">Course / Program *</Label>
                                            <select
                                                name="programId"
                                                defaultValue={editingApplicant.program_id}
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
                                                defaultValue={editingApplicant.year_level_id}
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
                                                defaultValue={editingApplicant.academic_year_id}
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
                                                defaultValue={editingApplicant.semester_id}
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
                                        <Label className="text-[11px] font-semibold">Decision Status *</Label>
                                        <select
                                            name="status"
                                            defaultValue={editingApplicant.status}
                                            required
                                            className={selectStyle}
                                        >
                                            <option value="Enrolled">Enrolled</option>
                                            <option value="Rejected">Rejected</option>
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
                                    onClick={() => setEditingApplicant(null)}
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