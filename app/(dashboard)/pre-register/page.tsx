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
    email: string
    contact_number: string
    address: string
    program: string
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

    const fetchApplications = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from("enrollments")
                .select(`
                    id,
                    student_id,
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
                    programs ( code, name ),
                    year_levels ( name ),
                    academic_years ( year_code ),
                    semesters ( name )
                `)
                .order("enrolled_at", { ascending: false })

            if (error) {
                console.error("Error fetching pre-registrations:", error.message)
                return
            }

            if (data) {
                const formatted: PreRegistrationRow[] = data.map((e: any) => {
                    const s = e.students
                    const middleInitial = s?.middle_name ? ` ${s.middle_name.charAt(0)}.` : ""
                    const fullName = s ? `${s.first_name}${middleInitial} ${s.last_name}` : "Unknown Student"

                    return {
                        id: e.id,
                        student_id: e.student_id,
                        student_number: s?.student_number || "N/A",
                        full_name: fullName,
                        email: s?.email || "N/A",
                        contact_number: s?.contact_number || "N/A",
                        address: s?.address || "N/A",
                        program: e.programs?.code || "Unassigned",
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
        fetchApplications()

        // Realtime subscription for pre-registrations updates
        const channel = supabase
            .channel("pre-register-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "enrollments" },
                () => {
                    fetchApplications()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchApplications, supabase])

    async function handleStatusChange(
        id: string,
        newStatus: "Enrolled" | "Pending" | "Rejected"
    ) {
        setUpdatingId(id)
        const result = await updateEnrollmentStatusAction(id, newStatus)
        setUpdatingId(null)

        if (result.success) {
            setApplications((prev) =>
                prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
            )
        } else {
            alert(result.error || "Failed to update status")
        }
    }

    // Program options for dropdown filter
    const availablePrograms = React.useMemo(() => {
        const set = new Set(
            applications.map((app) => app.program).filter((p) => p !== "Unassigned")
        )
        return Array.from(set)
    }, [applications])

    // Filter logic
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

    // Stat counts
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
                            {/* Status Filter */}
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

                            {/* Program Filter */}
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
                                    <TableHead className="text-xs font-semibold">Student No.</TableHead>
                                    <TableHead className="text-xs font-semibold">Student Name</TableHead>
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
                                            className="hover:bg-slate-50/80 transition-colors"
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
                                                    ) : (
                                                        <>
                                                            {app.status !== "Enrolled" && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="default"
                                                                    className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                    onClick={() =>
                                                                        handleStatusChange(app.id, "Enrolled")
                                                                    }
                                                                >
                                                                    Approve
                                                                </Button>
                                                            )}

                                                            {app.status !== "Rejected" && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 px-2.5 text-[11px] text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                                    onClick={() =>
                                                                        handleStatusChange(app.id, "Rejected")
                                                                    }
                                                                >
                                                                    Reject
                                                                </Button>
                                                            )}

                                                            {app.status !== "Pending" && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-7 px-2 text-[11px] text-slate-500 hover:bg-slate-100"
                                                                    onClick={() =>
                                                                        handleStatusChange(app.id, "Pending")
                                                                    }
                                                                >
                                                                    Mark Pending
                                                                </Button>
                                                            )}
                                                        </>
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
        </div>
    )
}
