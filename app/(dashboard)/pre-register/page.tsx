"use client"

import * as React from "react"
import Link from "next/link"
import {
    Search,
    ExternalLink,
    FileCheck,
    CheckCircle2,
    XCircle,
    Clock,
    Mail,
    Phone,
    Loader2,
    Filter,
    MapPin,
    GraduationCap,
    Calendar,
    User,
    X,
} from "lucide-react"

import { createClient } from "@/utils/supabase/client"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { updateEnrollmentStatusAction } from "./action"

type PreRegistrationRow = {
    id: string
    student_id: string
    student_number: string
    full_name: string
    first_name: string
    middle_name: string
    last_name: string
    email: string
    contact_number: string
    address: string
    program: string
    program_name: string
    year_level: string
    academic_year: string
    semester: string
    status: "Enrolled" | "Pending" | "Rejected" | string
    enrolled_at: string
    raw_date: string
}

export default function PreRegisterPage() {
    const supabase = createClient()

    const [applications, setApplications] = React.useState<PreRegistrationRow[]>([])
    const [searchQuery, setSearchQuery] = React.useState("")
    const [selectedStatus, setSelectedStatus] = React.useState("ALL")
    const [selectedProgram, setSelectedProgram] = React.useState("ALL")
    const [isLoading, setIsLoading] = React.useState(true)
    const [updatingId, setUpdatingId] = React.useState<string | null>(null)

    // Modal state for row click details
    const [selectedApplicant, setSelectedApplicant] = React.useState<PreRegistrationRow | null>(null)

    const fetchApplications = React.useCallback(async (showLoader = false) => {
        if (showLoader) setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from("enrollments")
                .select(`
                    id,
                    student_id,
                    applicant_id,
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
                    programs ( code, name ),
                    year_levels ( name ),
                    academic_years ( year_code ),
                    semesters ( name )
                `)
                .eq("status", "Pending")
                .order("enrolled_at", { ascending: false })

            if (error) {
                console.error("Error fetching pre-registrations:", error.message)
                return
            }

            if (data) {
                const formatted: PreRegistrationRow[] = data.map((e: any) => {
                    const person = e.students || e.applicants
                    const middleInitial = person?.middle_name ? ` ${person.middle_name.charAt(0)}.` : ""
                    const fullName = person ? `${person.first_name}${middleInitial} ${person.last_name}` : "Unknown Applicant"
                    const status = e.status || "Pending"
                    const rawStudentNumber = e.students?.student_number
                    let displayStudentNumber = "N/A"

                    if (status === "Enrolled") {
                        displayStudentNumber =
                            rawStudentNumber && !rawStudentNumber.startsWith("PENDING")
                                ? rawStudentNumber
                                : "N/A"
                    } else if (status === "Pending") {
                        displayStudentNumber = e.applicants?.applicant_id || "Pending Approval"
                    } else {
                        displayStudentNumber = "N/A"
                    }

                    return {
                        id: e.id,
                        student_id: e.student_id || e.applicant_id,
                        student_number: displayStudentNumber,
                        full_name: fullName,
                        first_name: person?.first_name || "N/A",
                        middle_name: person?.middle_name || "",
                        last_name: person?.last_name || "N/A",
                        email: person?.email || "N/A",
                        contact_number: person?.contact_number || "N/A",
                        address: person?.address || "N/A",
                        program: e.programs?.code || "Unassigned",
                        program_name: e.programs?.name || "Unassigned Program",
                        year_level: e.year_levels?.name || "N/A",
                        academic_year: e.academic_years?.year_code || "N/A",
                        semester: e.semesters?.name || "N/A",
                        status: e.status || "Pending",
                        raw_date: e.enrolled_at,
                        enrolled_at: e.enrolled_at
                            ? new Date(e.enrolled_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })
                            : "N/A",
                    }
                })

                setApplications(formatted)
            }
        } catch (err) {
            console.error("Fetch error:", err)
        } finally {
            setIsLoading(false)
        }
    }, [supabase])

    React.useEffect(() => {
        fetchApplications(true)

        const channel = supabase
            .channel("pre-register-live-updates")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "applicants" },
                () => fetchApplications(false)
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "enrollments" },
                () => fetchApplications(false)
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "students" },
                () => fetchApplications(false)
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchApplications, supabase])

    async function handleStatusChange(
        id: string,
        newStatus: "Enrolled" | "Pending" | "Rejected",
        e?: React.MouseEvent
    ) {
        if (e) e.stopPropagation() // Prevent triggering modal open on button click
        setUpdatingId(id)
        const result = await updateEnrollmentStatusAction(id, newStatus)
        setUpdatingId(null)

        if (result.success) {
            setApplications((prev) =>
                prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
            )
            if (selectedApplicant?.id === id) {
                setSelectedApplicant((prev) => (prev ? { ...prev, status: newStatus } : null))
            }
            fetchApplications(false)
        } else {
            alert(result.error || "Failed to update status")
        }
    }

    const availablePrograms = React.useMemo(() => {
        const set = new Set(
            applications.map((app) => app.program).filter((p) => p !== "Unassigned")
        )
        return Array.from(set)
    }, [applications])

    const filteredApplications = React.useMemo(() => {
        return applications.filter((app) => {
            const matchesSearch =
                app.student_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.email.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesStatus =
                selectedStatus === "ALL" ||
                app.status.toLowerCase() === selectedStatus.toLowerCase()

            const matchesProgram =
                selectedProgram === "ALL" || app.program === selectedProgram

            return matchesSearch && matchesStatus && matchesProgram
        })
    }, [applications, searchQuery, selectedStatus, selectedProgram])

    const stats = React.useMemo(() => {
        const total = applications.length
        const pending = applications.filter(
            (a) => a.status.toLowerCase() === "pending"
        ).length
        const enrolled = applications.filter(
            (a) => a.status.toLowerCase() === "enrolled"
        ).length
        const rejected = applications.filter(
            (a) => a.status.toLowerCase() === "rejected"
        ).length

        return { total, pending, enrolled, rejected }
    }, [applications])

    return (
        <div className="space-y-6">
            <PageHeader
                title="Pre-Registered Applications"
                description="Review, verify, and approve online student pre-registration submissions."
            >
                <Link
                    href="/enrollment"
                    target="_blank"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
                >
                    <ExternalLink className="size-4" />
                    Open Public Form
                </Link>
            </PageHeader>

            {/* Stat Cards Overview */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-slate-200 bg-white shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold text-slate-500">
                            Total Pre-Registrations
                        </CardTitle>
                        <FileCheck className="size-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                        <p className="text-[10px] text-slate-400">All submitted applications</p>
                    </CardContent>
                </Card>

                <Card className="border-amber-200 bg-amber-50/30 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold text-amber-700">
                            Pending Review
                        </CardTitle>
                        <Clock className="size-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-900">{stats.pending}</div>
                        <p className="text-[10px] text-amber-600">Awaiting approval</p>
                    </CardContent>
                </Card>

                <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold text-emerald-700">
                            Enrolled / Approved
                        </CardTitle>
                        <CheckCircle2 className="size-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-900">{stats.enrolled}</div>
                        <p className="text-[10px] text-emerald-600">Verified and enrolled</p>
                    </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50/30 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold text-red-700">
                            Rejected Applications
                        </CardTitle>
                        <XCircle className="size-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-900">{stats.rejected}</div>
                        <p className="text-[10px] text-red-600">Declined registrations</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter & Search Bar */}
            <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                            <div className="flex items-center gap-1.5">
                                <Filter className="size-3.5 text-slate-400" />
                                <span className="text-xs font-semibold text-slate-500 shrink-0">
                                    Status:
                                </span>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950"
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Enrolled">Enrolled</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>

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

            {/* Applications Table */}
            <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader className="border-b border-slate-100 py-4">
                    <CardTitle className="text-base font-bold text-slate-800">
                        Pre-Registration Applications ({filteredApplications.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <p className="py-12 text-center text-xs text-slate-500">
                            Loading pre-registration applications...
                        </p>
                    ) : filteredApplications.length === 0 ? (
                        <p className="py-12 text-center text-xs text-slate-500">
                            No pre-registration applications found.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50">
                                    <TableHead className="text-xs font-semibold">ID / Student No.</TableHead>
                                    <TableHead className="text-xs font-semibold">Applicant Name</TableHead>
                                    <TableHead className="text-xs font-semibold">Contact Details</TableHead>
                                    <TableHead className="text-xs font-semibold">Program</TableHead>
                                    <TableHead className="text-xs font-semibold">Year & Term</TableHead>
                                    <TableHead className="text-xs font-semibold">Submitted On</TableHead>
                                    <TableHead className="text-xs font-semibold">Status</TableHead>
                                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredApplications.map((app) => {
                                    const isUpdating = updatingId === app.id

                                    return (
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
                                                    <span
                                                        className="text-[10px] text-slate-500 truncate max-w-[180px]"
                                                        title={app.address}
                                                    >
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

                                            <TableCell>
                                                <div className="flex flex-col text-[11px] text-slate-700">
                                                    <span>{app.year_level}</span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {app.semester} (AY {app.academic_year})
                                                    </span>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-xs text-slate-600">
                                                {app.enrolled_at}
                                            </TableCell>

                                            <TableCell>
                                                <StatusBadge
                                                    status={
                                                        app.status.toLowerCase() === "enrolled"
                                                            ? "success"
                                                            : app.status.toLowerCase() === "pending"
                                                                ? "warning"
                                                                : app.status.toLowerCase() === "rejected"
                                                                    ? "danger"
                                                                    : "default"
                                                    }
                                                >
                                                    {app.status}
                                                </StatusBadge>
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {isUpdating ? (
                                                        <Loader2 className="size-4 animate-spin text-slate-400" />
                                                    ) : app.status === "Pending" ? (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                                className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                                                onClick={(e) =>
                                                                    handleStatusChange(app.id, "Enrolled", e)
                                                                }
                                                            >
                                                                Approve
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 px-2.5 text-[11px] text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                                                                onClick={(e) =>
                                                                    handleStatusChange(app.id, "Rejected", e)
                                                                }
                                                            >
                                                                Reject
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <span className="text-[11px] font-medium text-slate-400 italic">
                                                            No Actions (Final)
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Applicant Profile Popup Modal */}
            {selectedApplicant && (
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
                                    Applicant Information
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
                                        Personal Information
                                    </span>
                                    <StatusBadge
                                        status={
                                            selectedApplicant.status.toLowerCase() === "enrolled"
                                                ? "success"
                                                : selectedApplicant.status.toLowerCase() === "pending"
                                                    ? "warning"
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
                                    Academic Application Details
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

                        {/* Modal Footer / Actions */}
                        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3">
                            <span className="text-[10px] text-slate-400">
                                Submitted on {selectedApplicant.enrolled_at}
                            </span>
                            <div className="flex items-center gap-2">
                                {selectedApplicant.status === "Pending" ? (
                                    <>
                                        <Button
                                            size="sm"
                                            className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                            onClick={(e) =>
                                                handleStatusChange(selectedApplicant.id, "Enrolled", e)
                                            }
                                        >
                                            Approve Application
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50 cursor-pointer"
                                            onClick={(e) =>
                                                handleStatusChange(selectedApplicant.id, "Rejected", e)
                                            }
                                        >
                                            Reject
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 px-3 text-xs cursor-pointer"
                                        onClick={() => setSelectedApplicant(null)}
                                    >
                                        Close
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}