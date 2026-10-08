"use client"

import * as React from "react"
import {
    Search,
    UserCheck,
    Users,
    Plus,
    Mail,
    Phone,
    Building2,
    GraduationCap,
    X,
    Loader2,
    Trash2,
    Edit3,
    RefreshCw,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
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
    createStaffAction,
    updateStaffAction,
    deleteStaffAction,
    type StaffRecord,
    type UpsertStaffInput,
    type StaffRole,
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
 * Generate Staff ID formatted as:
 * Year today (2 digits) + Day today (3 digits, zero-padded) + Random number (4 digits)
 * Example: 260082001 (Year: 26, Day: 008, Random: 2001)
 */
function generateStaffId(): string {
    const now = new Date()
    const yearToday = String(now.getFullYear()).slice(-2)
    const dayToday = String(now.getDate()).padStart(3, "0")
    const randomNumber = Math.floor(1000 + Math.random() * 9000)
    return `${yearToday}${dayToday}${randomNumber}`
}

export default function RegistrationStaffPage() {
    const supabase = React.useMemo(() => createClient(), [])
    const [staffList, setStaffList] = React.useState<StaffRecord[]>([])
    const [departmentList, setDepartmentList] = React.useState<DepartmentItem[]>(defaultDepartments)
    const [isLoading, setIsLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [departmentFilter, setDepartmentFilter] = React.useState("ALL")
    const [roleFilter, setRoleFilter] = React.useState("ALL")

    // Modal state
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [editingStaff, setEditingStaff] = React.useState<StaffRecord | null>(null)
    const [deletingId, setDeletingId] = React.useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [feedbackMessage, setFeedbackMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

    // Form inputs state
    const [formData, setFormData] = React.useState<UpsertStaffInput>({
        staff_id: "",
        name: "",
        email: "",
        phone: "",
        role: "Staff",
        department: "Registrar's Office",
    })

    // Fetch departments from separate `departments` database table
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

    // Fetch staff records from `registration_staff` table
    const fetchStaff = React.useCallback(async () => {
        setIsLoading(true)
        setFeedbackMessage(null)
        try {
            const { data, error } = await supabase
                .from("registration_staff")
                .select("*")
                .order("created_at", { ascending: false })

            if (error) {
                console.error("Error fetching staff from database:", error)
                setFeedbackMessage({ type: "error", text: error.message || "Failed to load registration staff from database." })
                setStaffList([])
            } else if (data) {
                setStaffList(data as StaffRecord[])
            }
        } catch (err: any) {
            console.error("Unexpected error fetching staff:", err)
            setFeedbackMessage({ type: "error", text: "Unexpected error loading staff records." })
            setStaffList([])
        } finally {
            setIsLoading(false)
        }
    }, [supabase])

    React.useEffect(() => {
        fetchStaff()
        fetchDepartments()
    }, [fetchStaff, fetchDepartments])

    const filteredStaff = React.useMemo(() => {
        return staffList.filter((staff) => {
            const dept = staff.assigned_window || staff.department || ""
            const matchesSearch =
                (staff.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (staff.staff_id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (staff.role || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (staff.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (staff.phone || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                dept.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesDept =
                departmentFilter === "ALL" || dept === departmentFilter

            const matchesRole =
                roleFilter === "ALL" || (staff.role || "").toLowerCase() === roleFilter.toLowerCase()

            return matchesSearch && matchesDept && matchesRole
        })
    }, [staffList, searchQuery, departmentFilter, roleFilter])

    const totalCount = staffList.length
    const departmentsCount = departmentList.length
    const staffRoleCount = staffList.filter((s) => (s.role || "").toLowerCase() === "staff").length
    const facultyRoleCount = staffList.filter((s) => (s.role || "").toLowerCase() === "faculty").length

    const openAddModal = () => {
        const nextId = generateStaffId()
        const firstDept = departmentList[0]
        setFormData({
            staff_id: nextId,
            name: "",
            email: "",
            phone: "",
            role: "Staff",
            department: firstDept?.name || "Registrar's Office",
            department_id: firstDept?.id || null,
        })
        setIsAddOpen(true)
    }

    const openEditModal = (staff: StaffRecord) => {
        setEditingStaff(staff)
        const normalizedRole: StaffRole =
            (staff.role || "").toLowerCase() === "faculty" ? "Faculty" : "Staff"

        const currentDeptName = staff.department || staff.assigned_window || departmentList[0]?.name || "Registrar's Office"
        const matchedDept = departmentList.find((d) => d.id === staff.department_id || d.name === currentDeptName)

        setFormData({
            staff_id: staff.staff_id,
            name: staff.name,
            email: staff.email,
            phone: staff.phone || "",
            role: normalizedRole,
            department: matchedDept?.name || currentDeptName,
            department_id: matchedDept?.id || staff.department_id || null,
        })
    }

    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name || !formData.email || !formData.staff_id || !formData.department) {
            setFeedbackMessage({ type: "error", text: "Please fill in all required fields." })
            return
        }

        setIsSubmitting(true)
        setFeedbackMessage(null)

        const res = await createStaffAction({
            ...formData,
            assigned_window: formData.department,
        })
        setIsSubmitting(false)

        if (res.success) {
            setIsAddOpen(false)
            setFeedbackMessage({ type: "success", text: "Registration staff member added successfully to the database!" })
            await fetchStaff()
        } else {
            setFeedbackMessage({ type: "error", text: res.error || "Failed to add registration staff member." })
        }
    }

    const handleUpdateStaff = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingStaff) return

        setIsSubmitting(true)
        setFeedbackMessage(null)

        const res = await updateStaffAction(editingStaff.id, {
            ...formData,
            assigned_window: formData.department,
        })
        setIsSubmitting(false)

        if (res.success) {
            setEditingStaff(null)
            setFeedbackMessage({ type: "success", text: "Staff details updated successfully in database!" })
            await fetchStaff()
        } else {
            setFeedbackMessage({ type: "error", text: res.error || "Failed to update staff member." })
        }
    }

    const handleDeleteStaff = async (id: string) => {
        if (!confirm("Are you sure you want to delete this staff member from the database?")) return

        setDeletingId(id)
        const res = await deleteStaffAction(id)
        setDeletingId(null)

        if (res.success) {
            setFeedbackMessage({ type: "success", text: "Staff record removed successfully from database." })
            await fetchStaff()
        } else {
            setFeedbackMessage({ type: "error", text: res.error || "Failed to remove staff record." })
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Registration Staff"
                description="Manage registrar personnel, database department assignments, and admissions evaluation staff."
            >
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            fetchStaff()
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
                        Add Staff Member
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
                            Total Staff Roster
                        </CardTitle>
                        <Users className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-emerald-100">
                            {isLoading ? "..." : totalCount}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-emerald-500/70 mt-1">Registered personnel</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-emerald-950/60 bg-white dark:bg-[#070d0a]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-slate-500 dark:text-emerald-400/80">
                            Staff Designation
                        </CardTitle>
                        <UserCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {isLoading ? "..." : staffRoleCount}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-emerald-500/70 mt-1">Personnel with Staff role</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-emerald-950/60 bg-white dark:bg-[#070d0a]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-slate-500 dark:text-emerald-400/80">
                            Faculty Designation
                        </CardTitle>
                        <GraduationCap className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-emerald-100">
                            {isLoading ? "..." : facultyRoleCount}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-emerald-500/70 mt-1">Personnel with Faculty role</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-emerald-950/60 bg-white dark:bg-[#070d0a]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-slate-500 dark:text-emerald-400/80">
                            Departments in Database
                        </CardTitle>
                        <Building2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-emerald-100">
                            {departmentsCount}
                        </div>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Configured departments</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-emerald-500/60" />
                    <Input
                        type="search"
                        placeholder="Search staff by name, ID, email, role, or department..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white dark:bg-[#070d0a] border-slate-200 dark:border-emerald-950/80 text-xs"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500 dark:text-emerald-500/70">Role:</span>
                        <select
                            aria-label="Filter staff by role"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="h-9 rounded-md border border-slate-200 dark:border-emerald-950 bg-white dark:bg-[#070d0a] px-3 py-1 text-xs text-slate-900 dark:text-emerald-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        >
                            <option value="ALL">All Roles</option>
                            <option value="Staff">Staff</option>
                            <option value="Faculty">Faculty</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500 dark:text-emerald-500/70">Department:</span>
                        <select
                            aria-label="Filter staff by department"
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
            </div>

            {/* Registration Staff Table */}
            <Card className="border-slate-200 dark:border-emerald-950/60 bg-white dark:bg-[#070d0a] overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-slate-100 dark:border-emerald-950 hover:bg-transparent">
                            <TableHead className="text-xs">Staff Member</TableHead>
                            <TableHead className="text-xs">Staff ID</TableHead>
                            <TableHead className="text-xs">Email</TableHead>
                            <TableHead className="text-xs">Contact Number</TableHead>
                            <TableHead className="text-xs">Role / Designation</TableHead>
                            <TableHead className="text-xs">Department</TableHead>
                            <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-xs text-slate-500 dark:text-emerald-500/70">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="size-4 animate-spin text-emerald-500" />
                                        <span>Loading staff roster from database...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredStaff.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-xs text-slate-500 dark:text-emerald-500/70">
                                    {staffList.length === 0
                                        ? "No registration staff found in database. Click 'Add Staff Member' to register staff."
                                        : "No registration staff found matching the filter criteria."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredStaff.map((staff) => (
                                <TableRow key={staff.id} className="border-slate-100 dark:border-emerald-950 hover:bg-slate-50/50 dark:hover:bg-emerald-950/20">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-300 dark:border-emerald-800">
                                                {(staff.name || "Staff")
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .filter(Boolean)
                                                    .slice(0, 2)
                                                    .join("") || "S"}
                                            </div>
                                            <p className="text-xs font-semibold text-slate-900 dark:text-emerald-100">
                                                {staff.name}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-slate-700 dark:text-emerald-300 font-medium">
                                        {staff.staff_id}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-700 dark:text-emerald-300">
                                        <div className="flex items-center gap-1.5">
                                            <Mail className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            <span>{staff.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-600 dark:text-emerald-400/90">
                                        {staff.phone ? (
                                            <div className="flex items-center gap-1.5">
                                                <Phone className="size-3 text-slate-400 dark:text-emerald-500/70 shrink-0" />
                                                <span>{staff.phone}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 dark:text-emerald-600/60">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-semibold border ${
                                            (staff.role || "").toLowerCase() === "faculty"
                                                ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                                                : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                        }`}>
                                            {staff.role || "Staff"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-800 dark:text-emerald-200">
                                        <div className="flex items-center gap-1.5">
                                            <Building2 className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            <span>{staff.assigned_window || staff.department || "Registrar's Office"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditModal(staff)}
                                                className="h-7 px-2 text-xs text-slate-600 dark:text-emerald-400 hover:text-slate-900 dark:hover:text-emerald-200"
                                            >
                                                <Edit3 className="size-3 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteStaff(staff.id)}
                                                disabled={deletingId === staff.id}
                                                className="h-7 px-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                                            >
                                                {deletingId === staff.id ? (
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

            {/* Modal: Add Staff Member */}
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
                                <UserCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                                <h3 className="text-base font-bold text-slate-800 dark:text-emerald-100">
                                    Add Registration Staff Member
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsAddOpen(false)}
                                className="rounded-md p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-emerald-950 dark:hover:text-emerald-200 transition-colors cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateStaff} className="p-6 space-y-4 text-xs">
                            <div>
                                <label className="font-semibold text-slate-700 dark:text-emerald-300 block mb-1">
                                    Staff ID * <span className="text-[11px] font-normal text-slate-400">(Format: YY + DDD + Random e.g. 260082001)</span>
                                </label>
                                <Input
                                    required
                                    value={formData.staff_id}
                                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                                    placeholder="e.g. 260082001"
                                    className="text-xs font-mono bg-white dark:bg-[#070d0a] border-slate-200 dark:border-emerald-950"
                                />
                            </div>

                            <div>
                                <label className="font-semibold text-slate-700 dark:text-emerald-300 block mb-1">
                                    Full Name *
                                </label>
                                <Input
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Maria Santos"
                                    className="text-xs bg-white dark:bg-[#070d0a] border-slate-200 dark:border-emerald-950"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-700 dark:text-emerald-300 block mb-1">
                                        Email Address *
                                    </label>
                                    <Input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="m.santos@registrar.sms.edu"
                                        className="text-xs bg-white dark:bg-[#070d0a] border-slate-200 dark:border-emerald-950"
                                    />
                                </div>
                                <div>
                                    <label className="font-semibold text-slate-700 dark:text-emerald-300 block mb-1">
                                        Contact Phone
                                    </label>
                                    <Input
                                        value={formData.phone || ""}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+63 917 123 4567"
                                        className="text-xs bg-white dark:bg-[#070d0a] border-slate-200 dark:border-emerald-950"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-700 dark:text-emerald-300 block mb-1">
                                        Role / Designation *
                                    </label>
                                    <select
                                        required
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as StaffRole })}
                                        className="w-full h-9 rounded-md border border-slate-200 dark:border-emerald-950 bg-white dark:bg-[#070d0a] px-3 text-xs text-slate-900 dark:text-emerald-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="Staff">Staff</option>
                                        <option value="Faculty">Faculty</option>
                                    </select>
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

            {/* Modal: Edit Staff Member */}
            {editingStaff && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
                    onClick={() => setEditingStaff(null)}
                >
                    <div
                        className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-emerald-900 bg-white dark:bg-[#09120e] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-emerald-50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-950 bg-slate-50 dark:bg-[#070d0a] px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Edit3 className="size-5 text-emerald-600 dark:text-emerald-400" />
                                <h3 className="text-base font-bold text-slate-800 dark:text-emerald-100">
                                    Edit Staff Member Details
                                </h3>
                            </div>
                            <button
                                onClick={() => setEditingStaff(null)}
                                className="rounded-md p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-emerald-950 dark:hover:text-emerald-200 transition-colors cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateStaff} className="p-6 space-y-4 text-xs">
                            <div>
                                <label className="font-semibold text-slate-700 dark:text-emerald-300 block mb-1">
                                    Staff ID
                                </label>
                                <Input
                                    required
                                    value={formData.staff_id}
                                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                                    className="text-xs font-mono bg-white dark:bg-[#070d0a] border-slate-200 dark:border-emerald-950"
                                />
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

                            <div className="grid grid-cols-2 gap-3">
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
                                        Contact Phone
                                    </label>
                                    <Input
                                        value={formData.phone || ""}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="text-xs bg-white dark:bg-[#070d0a] border-slate-200 dark:border-emerald-950"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-700 dark:text-emerald-300 block mb-1">
                                        Role / Designation *
                                    </label>
                                    <select
                                        required
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as StaffRole })}
                                        className="w-full h-9 rounded-md border border-slate-200 dark:border-emerald-950 bg-white dark:bg-[#070d0a] px-3 text-xs text-slate-900 dark:text-emerald-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="Staff">Staff</option>
                                        <option value="Faculty">Faculty</option>
                                    </select>
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
                            </div>

                            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-emerald-950">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingStaff(null)}
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
