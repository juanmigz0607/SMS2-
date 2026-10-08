"use client"

import * as React from "react"
import {
    Search,
    GraduationCap,
    Users,
    Plus,
    Mail,
    Building2,
    Award,
    CheckCircle2,
    X,
    Loader2,
    Trash2,
    Edit3,
    RefreshCw,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
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
import { createClient } from "@/utils/supabase/client"
import {
    createFacultyAction,
    updateFacultyAction,
    deleteFacultyAction,
    type FacultyRecord,
    type UpsertFacultyInput,
} from "./action"

export type DepartmentItem = {
    id: string
    code: string
    name: string
    description?: string | null
}

const defaultDepartments: DepartmentItem[] = [
    { id: "1", code: "REG", name: "Registrar's Office" },
    { id: "2", code: "CCS", name: "College of Computer Studies" },
    { id: "3", code: "COE", name: "College of Engineering" },
    { id: "4", code: "CBA", name: "College of Business & Accountancy" },
    { id: "5", code: "CAS", name: "College of Arts & Sciences" },
    { id: "6", code: "CED", name: "College of Education" },
    { id: "7", code: "ADM", name: "Admissions & Evaluation" },
]

/**
 * Generate Faculty ID formatted as:
 * Year today (2 digits) + Day today (3 digits, zero-padded) + Random number (4 digits)
 * Example: 260082001 (Year: 26, Day: 008, Random: 2001)
 */
function generateFacultyId(): string {
    const now = new Date()
    const yearToday = String(now.getFullYear()).slice(-2)
    const dayToday = String(now.getDate()).padStart(3, "0")
    const randomNumber = Math.floor(1000 + Math.random() * 9000)
    return `${yearToday}${dayToday}${randomNumber}`
}

export default function FacultyPage() {
    const supabase = React.useMemo(() => createClient(), [])
    const [facultyList, setFacultyList] = React.useState<FacultyRecord[]>([])
    const [departmentList, setDepartmentList] = React.useState<DepartmentItem[]>(defaultDepartments)
    const [isLoading, setIsLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [departmentFilter, setDepartmentFilter] = React.useState("ALL")

    // Modal state
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [editingFaculty, setEditingFaculty] = React.useState<FacultyRecord | null>(null)
    const [deletingId, setDeletingId] = React.useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [feedbackMessage, setFeedbackMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

    // Form inputs state (without Academic Rank)
    const [formData, setFormData] = React.useState<UpsertFacultyInput>({
        faculty_id: "",
        name: "",
        email: "",
        department: "College of Computer Studies",
        employment_type: "Full-Time",
        assigned_units: 18,
        status: "Active",
    })

    // Fetch departments from `departments` database table
    const fetchDepartments = React.useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from("departments")
                .select("id, code, name, description")
                .order("name")

            if (!error && data && data.length > 0) {
                setDepartmentList(data as DepartmentItem[])
            } else {
                setDepartmentList(defaultDepartments)
            }
        } catch {
            setDepartmentList(defaultDepartments)
        }
    }, [supabase])

    const fetchFaculty = React.useCallback(async () => {
        setIsLoading(true)
        setFeedbackMessage(null)
        try {
            const { data, error } = await supabase
                .from("faculty")
                .select("*")
                .order("created_at", { ascending: false })

            if (error) {
                console.error("Error fetching faculty from database:", error)
                setFeedbackMessage({ type: "error", text: error.message || "Failed to load faculty from database." })
                setFacultyList([])
            } else if (data) {
                setFacultyList(data as FacultyRecord[])
            }
        } catch (err: any) {
            console.error("Unexpected error fetching faculty:", err)
            setFeedbackMessage({ type: "error", text: "Unexpected error loading faculty records." })
            setFacultyList([])
        } finally {
            setIsLoading(false)
        }
    }, [supabase])

    React.useEffect(() => {
        fetchFaculty()
        fetchDepartments()
    }, [fetchFaculty, fetchDepartments])

    const filteredFaculty = React.useMemo(() => {
        return facultyList.filter((faculty) => {
            const matchesSearch =
                (faculty.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (faculty.faculty_id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (faculty.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (faculty.department || "").toLowerCase().includes(searchQuery.toLowerCase())

            const matchesDept =
                departmentFilter === "ALL" || faculty.department === departmentFilter

            return matchesSearch && matchesDept
        })
    }, [facultyList, searchQuery, departmentFilter])

    const totalCount = facultyList.length
    const fullTimeCount = facultyList.filter((f) => f.employment_type === "Full-Time").length
    const partTimeCount = facultyList.filter((f) => f.employment_type === "Part-Time").length
    const activeCount = facultyList.filter((f) => f.status === "Active").length

    const openAddModal = () => {
        const nextId = generateFacultyId()
        const firstDept = departmentList[0]
        setFormData({
            faculty_id: nextId,
            name: "",
            email: "",
            department: firstDept?.name || "College of Computer Studies",
            department_id: firstDept?.id || null,
            employment_type: "Full-Time",
            assigned_units: 18,
            status: "Active",
        })
        setIsAddOpen(true)
    }

    const openEditModal = (faculty: FacultyRecord) => {
        setEditingFaculty(faculty)
        const currentDeptName = faculty.department || departmentList[0]?.name || "College of Computer Studies"
        const matchedDept = departmentList.find((d) => d.id === faculty.department_id || d.name === currentDeptName)
        setFormData({
            faculty_id: faculty.faculty_id,
            name: faculty.name,
            email: faculty.email,
            department: matchedDept?.name || currentDeptName,
            department_id: matchedDept?.id || faculty.department_id || null,
            employment_type: faculty.employment_type,
            assigned_units: faculty.assigned_units,
            status: faculty.status,
        })
    }

    const handleCreateFaculty = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name || !formData.email || !formData.faculty_id || !formData.department) {
            setFeedbackMessage({ type: "error", text: "Please fill in all required fields." })
            return
        }

        setIsSubmitting(true)
        setFeedbackMessage(null)

        const res = await createFacultyAction(formData)
        setIsSubmitting(false)

        if (res.success) {
            setIsAddOpen(false)
            setFeedbackMessage({ type: "success", text: "Faculty member added successfully to the database!" })
            await fetchFaculty()
        } else {
            setFeedbackMessage({ type: "error", text: res.error || "Failed to add faculty member." })
        }
    }

    const handleUpdateFaculty = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingFaculty) return

        setIsSubmitting(true)
        setFeedbackMessage(null)

        const res = await updateFacultyAction(editingFaculty.id, formData)
        setIsSubmitting(false)

        if (res.success) {
            setEditingFaculty(null)
            setFeedbackMessage({ type: "success", text: "Faculty member updated successfully in database!" })
            await fetchFaculty()
        } else {
            setFeedbackMessage({ type: "error", text: res.error || "Failed to update faculty member." })
        }
    }

    const handleDeleteFaculty = async (id: string) => {
        if (!confirm("Are you sure you want to delete this faculty member from the database?")) return

        setDeletingId(id)
        const res = await deleteFacultyAction(id)
        setDeletingId(null)

        if (res.success) {
            setFeedbackMessage({ type: "success", text: "Faculty record deleted successfully from database." })
            await fetchFaculty()
        } else {
            setFeedbackMessage({ type: "error", text: res.error || "Failed to delete faculty record." })
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Faculty Directory"
                description="Manage academic faculty profiles, department designations, instructional loads, and advisor assignments."
            >
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            fetchFaculty()
                            fetchDepartments()
                        }}
                        disabled={isLoading}
                        className="text-xs border-slate-200 dark:border-emerald-900 bg-white dark:bg-[#070d0a] text-slate-700 dark:text-emerald-300"
                    >
                        <RefreshCw className={`mr-1 size-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={openAddModal}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs text-xs"
                    >
                        <Plus className="mr-1.5 size-4" />
                        Add Faculty Member
                    </Button>
                </div>
            </PageHeader>

            {feedbackMessage && (
                <div
                    className={`rounded-lg border p-3 text-xs flex items-center justify-between ${
                        feedbackMessage.type === "success"
                            ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200"
                            : "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200"
                    }`}
                >
                    <span>{feedbackMessage.text}</span>
                    <button
                        onClick={() => setFeedbackMessage(null)}
                        className="text-xs font-semibold underline ml-4 cursor-pointer"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Metric KPI cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-slate-200 dark:border-emerald-950/60 bg-white dark:bg-[#070d0a]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-slate-500 dark:text-emerald-400/80">
                            Total Faculty
                        </CardTitle>
                        <GraduationCap className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-emerald-100">
                            {isLoading ? "..." : totalCount}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-emerald-500/70 mt-1">Teaching staff roster</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-emerald-950/60 bg-white dark:bg-[#070d0a]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-slate-500 dark:text-emerald-400/80">
                            Full-Time Faculty
                        </CardTitle>
                        <Award className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {isLoading ? "..." : fullTimeCount}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-emerald-500/70 mt-1">Tenured & regular faculty</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-emerald-950/60 bg-white dark:bg-[#070d0a]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-slate-500 dark:text-emerald-400/80">
                            Part-Time / Lecturers
                        </CardTitle>
                        <Users className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-emerald-100">
                            {isLoading ? "..." : partTimeCount}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-emerald-500/70 mt-1">Adjunct instructors</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-emerald-950/60 bg-white dark:bg-[#070d0a]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-slate-500 dark:text-emerald-400/80">
                            Active Status
                        </CardTitle>
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-emerald-100">
                            {isLoading ? "..." : activeCount}
                        </div>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Active this term</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-emerald-500/60" />
                    <Input
                        type="search"
                        placeholder="Search faculty by name, ID, or department..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white dark:bg-[#070d0a] border-slate-200 dark:border-emerald-950/80 text-xs"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-emerald-500/70">Department:</span>
                    <select
                        aria-label="Filter faculty by department"
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="h-9 rounded-md border border-slate-200 dark:border-emerald-950 bg-white dark:bg-[#070d0a] px-3 py-1 text-xs text-slate-900 dark:text-emerald-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    >
                        <option value="ALL">All Departments</option>
                        {departmentList.map((dept) => (
                            <option key={dept.id} value={dept.name}>
                                {dept.name} ({dept.code})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <Card className="border-slate-200 dark:border-emerald-950/60 bg-white dark:bg-[#070d0a] overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-slate-100 dark:border-emerald-950 hover:bg-transparent">
                            <TableHead className="text-xs">Faculty Member</TableHead>
                            <TableHead className="text-xs">Faculty ID</TableHead>
                            <TableHead className="text-xs">Email</TableHead>
                            <TableHead className="text-xs">Department / College</TableHead>
                            <TableHead className="text-xs">Employment</TableHead>
                            <TableHead className="text-xs">Load (Units)</TableHead>
                            <TableHead className="text-xs">Status</TableHead>
                            <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-32 text-center text-xs text-slate-500 dark:text-emerald-500/70">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="size-4 animate-spin text-emerald-500" />
                                        <span>Loading faculty records from database...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredFaculty.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-32 text-center text-xs text-slate-500 dark:text-emerald-500/70">
                                    {facultyList.length === 0
                                        ? "No faculty records found in database. Click 'Add Faculty Member' to register faculty."
                                        : "No faculty members found matching the search criteria."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredFaculty.map((faculty) => (
                                <TableRow key={faculty.id} className="border-slate-100 dark:border-emerald-950 hover:bg-slate-50/50 dark:hover:bg-emerald-950/20">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-300 dark:border-emerald-800">
                                                {(faculty.name || "Faculty")
                                                    .replace(/^(Dr\.|Engr\.|Prof\.|Atty\.)\s*/i, "")
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .filter(Boolean)
                                                    .slice(0, 2)
                                                    .join("") || "F"}
                                            </div>
                                            <p className="text-xs font-semibold text-slate-900 dark:text-emerald-100">
                                                {faculty.name}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-slate-700 dark:text-emerald-300 font-medium">
                                        {faculty.faculty_id}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-700 dark:text-emerald-300">
                                        <div className="flex items-center gap-1.5">
                                            <Mail className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            <span>{faculty.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-800 dark:text-emerald-200">
                                        <div className="flex items-center gap-1.5">
                                            <Building2 className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            <span>{faculty.department}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        <span className="inline-flex items-center rounded-sm bg-slate-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-emerald-300 border border-slate-200 dark:border-emerald-900/50">
                                            {faculty.employment_type}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-700 dark:text-emerald-300 font-medium">
                                        {faculty.assigned_units} units
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge
                                            status={
                                                faculty.status === "Active"
                                                    ? "success"
                                                    : faculty.status === "Sabbatical"
                                                        ? "info"
                                                        : "warning"
                                            }
                                        >
                                            {faculty.status}
                                        </StatusBadge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditModal(faculty)}
                                                className="h-7 px-2 text-xs text-slate-600 dark:text-emerald-400 hover:text-slate-900 dark:hover:text-emerald-200"
                                            >
                                                <Edit3 className="size-3 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteFaculty(faculty.id)}
                                                disabled={deletingId === faculty.id}
                                                className="h-7 px-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                                            >
                                                {deletingId === faculty.id ? (
                                                    <Loader2 className="size-3 animate-spin" />
                                                ) : (
                                                    <Trash2 className="size-3" />
                                                )}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Modal: Add Faculty Member */}
            {isAddOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
                    onClick={() => setIsAddOpen(false)}
                >
                    <div
                        className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-emerald-900 bg-white dark:bg-[#09120e] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-emerald-50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-950 bg-slate-50 dark:bg-[#070d0a] px-6 py-4">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="size-5 text-emerald-600 dark:text-emerald-400" />
                                <h3 className="text-base font-bold text-slate-800 dark:text-emerald-100">
                                    Add New Faculty Member
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsAddOpen(false)}
                                className="rounded-md p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-emerald-950 dark:hover:text-emerald-200 transition-colors cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateFaculty} className="p-6 space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-700 dark:text-emerald-300 block mb-1">
                                        Faculty ID *
                                    </label>
                                    <Input
                                        required
                                        value={formData.faculty_id}
                                        onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                                        placeholder="FAC-2026-101"
                                        className="text-xs bg-white dark:bg-[#070d0a] border-slate-200 dark:border-emerald-950"
                                    />
                                </div>
                                <div>
                                    <label className="font-semibold text-slate-700 dark:text-emerald-300 block mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full h-9 rounded-md border border-slate-200 dark:border-emerald-950 bg-white dark:bg-[#070d0a] px-3 text-xs text-slate-900 dark:text-emerald-100"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="On Leave">On Leave</option>
                                        <option value="Sabbatical">Sabbatical</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 dark:text-emerald-300 block mb-1">
                                    Full Name (with Title) *
                                </label>
                                <Input
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Dr. Maria Clara Santos"
                                    className="text-xs bg-white dark:bg-[#070d0a] border-slate-200 dark:border-emerald-950"
                                />
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 dark:text-emerald-300 block mb-1">
                                    Email Address *
                                </label>
                                <Input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="e.g. m.santos@faculty.sms.edu"
                                    className="text-xs bg-white dark:bg-[#070d0a] border-slate-200 dark:border-emerald-950"
                                />
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 dark:text-emerald-300 block mb-1">
                                    Department (from Database) *
                                </label>
                                <select
                                    required
                                    value={formData.department}
                                    onChange={(e) => {
                                        const matched = departmentList.find((d) => d.name === e.target.value)
                                        setFormData({
                                            ...formData,
                                            department: e.target.value,
                                            department_id: matched?.id || null,
                                        })
                                    }}
                                    className="w-full h-9 rounded-md border border-slate-200 dark:border-emerald-950 bg-white dark:bg-[#070d0a] px-3 text-xs text-slate-900 dark:text-emerald-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    {departmentList.map((dept) => (
                                        <option key={dept.id} value={dept.name}>
                                            {dept.name} ({dept.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-700 dark:text-emerald-300 block mb-1">
                                        Employment Type
                                    </label>
                                    <select
                                        value={formData.employment_type}
                                        onChange={(e) => setFormData({ ...formData, employment_type: e.target.value as any })}
                                        className="w-full h-9 rounded-md border border-slate-200 dark:border-emerald-950 bg-white dark:bg-[#070d0a] px-3 text-xs text-slate-900 dark:text-emerald-100"
                                    >
                                        <option value="Full-Time">Full-Time</option>
                                        <option value="Part-Time">Part-Time</option>
                                        <option value="Visiting">Visiting</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-semibold text-slate-700 dark:text-emerald-300 block mb-1">
                                        Assigned Units
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="40"
                                        value={formData.assigned_units}
                                        onChange={(e) => setFormData({ ...formData, assigned_units: Number(e.target.value) || 0 })}
                                        className="text-xs bg-white dark:bg-[#070d0a] border-slate-200 dark:border-emerald-950"
                                    />
                                </div>
                            </div>

                            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-emerald-950">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAddOpen(false)}
                                    className="text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save to Database"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Edit Faculty Member */}
            {editingFaculty && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
                    onClick={() => setEditingFaculty(null)}
                >
                    <div
                        className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-emerald-900 bg-white dark:bg-[#09120e] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-emerald-50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-950 bg-slate-50 dark:bg-[#070d0a] px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Edit3 className="size-5 text-emerald-600 dark:text-emerald-400" />
                                <h3 className="text-base font-bold text-slate-800 dark:text-emerald-100">
                                    Edit Faculty Member
                                </h3>
                            </div>
                            <button
                                onClick={() => setEditingFaculty(null)}
                                className="rounded-md p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-emerald-950 dark:hover:text-emerald-200 transition-colors cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateFaculty} className="p-6 space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-700 dark:text-emerald-300 block mb-1">
                                        Faculty ID
                                    </label>
                                    <Input
                                        required
                                        value={formData.faculty_id}
                                        onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                                        className="text-xs bg-white dark:bg-[#070d0a] border-slate-200 dark:border-emerald-950"
                                    />
                                </div>
                                <div>
                                    <label className="font-semibold text-slate-700 dark:text-emerald-300 block mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full h-9 rounded-md border border-slate-200 dark:border-emerald-950 bg-white dark:bg-[#070d0a] px-3 text-xs text-slate-900 dark:text-emerald-100"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="On Leave">On Leave</option>
                                        <option value="Sabbatical">Sabbatical</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 dark:text-emerald-300 block mb-1">
                                    Full Name *
                                </label>
                                <Input
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="text-xs bg-white dark:bg-[#070d0a] border-slate-200 dark:border-emerald-950"
                                />
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 dark:text-emerald-300 block mb-1">
                                    Email Address *
                                </label>
                                <Input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="text-xs bg-white dark:bg-[#070d0a] border-slate-200 dark:border-emerald-950"
                                />
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 dark:text-emerald-300 block mb-1">
                                    Department (from Database) *
                                </label>
                                <select
                                    required
                                    value={formData.department}
                                    onChange={(e) => {
                                        const matched = departmentList.find((d) => d.name === e.target.value)
                                        setFormData({
                                            ...formData,
                                            department: e.target.value,
                                            department_id: matched?.id || null,
                                        })
                                    }}
                                    className="w-full h-9 rounded-md border border-slate-200 dark:border-emerald-950 bg-white dark:bg-[#070d0a] px-3 text-xs text-slate-900 dark:text-emerald-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    {departmentList.map((dept) => (
                                        <option key={dept.id} value={dept.name}>
                                            {dept.name} ({dept.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-700 dark:text-emerald-300 block mb-1">
                                        Employment Type
                                    </label>
                                    <select
                                        value={formData.employment_type}
                                        onChange={(e) => setFormData({ ...formData, employment_type: e.target.value as any })}
                                        className="w-full h-9 rounded-md border border-slate-200 dark:border-emerald-950 bg-white dark:bg-[#070d0a] px-3 text-xs text-slate-900 dark:text-emerald-100"
                                    >
                                        <option value="Full-Time">Full-Time</option>
                                        <option value="Part-Time">Part-Time</option>
                                        <option value="Visiting">Visiting</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-semibold text-slate-700 dark:text-emerald-300 block mb-1">
                                        Assigned Units
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="40"
                                        value={formData.assigned_units}
                                        onChange={(e) => setFormData({ ...formData, assigned_units: Number(e.target.value) || 0 })}
                                        className="text-xs bg-white dark:bg-[#070d0a] border-slate-200 dark:border-emerald-950"
                                    />
                                </div>
                            </div>

                            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-emerald-950">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingFaculty(null)}
                                    className="text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        "Update Record"
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
