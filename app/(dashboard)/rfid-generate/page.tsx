"use client";

import * as React from "react";
import {
    CreditCard,
    Radio,
    Search,
    RefreshCw,
    ScanLine,
    Plus,
    Printer,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Copy,
    Check,
    RotateCw,
    Sparkles,
    Shield,
    QrCode,
    SlidersHorizontal,
    X,
    Loader2,
    Users,
    KeyRound,
    FileCode,
    Info,
    ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    getStudentRfidDataAction,
    issueStudentRfidAction,
    updateRfidCardStatusAction,
    revokeRfidCardAction,
    type StudentRfidRecord,
} from "./action";

// Helper to generate a realistic MIFARE / NFC 8-byte Hex UID
function generateRandomRfidUid(): { hex: string; decimal: string } {
    const bytes = Array.from({ length: 4 }, () =>
        Math.floor(Math.random() * 256)
            .toString(16)
            .padStart(2, "0")
            .toUpperCase()
    );
    const hex = bytes.join(":");
    // 10-digit decimal equivalent often printed on physical RFID tags
    const num = Math.floor(1000000000 + Math.random() * 9000000000);
    return { hex, decimal: num.toString() };
}

// Generate formatted card number
function generateCardNumber(studentNumber: string): string {
    const cleanNum = studentNumber.replace(/[^0-9]/g, "").slice(-4) || "0001";
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `BCP-RFID-${year}-${cleanNum}${randomSuffix}`;
}

export default function RfidGeneratePage() {
    const [records, setRecords] = React.useState<StudentRfidRecord[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [tableReady, setTableReady] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState<string>("all");
    const [copiedUid, setCopiedUid] = React.useState<string | null>(null);

    // Dialog States
    const [issueDialogOpen, setIssueDialogOpen] = React.useState(false);
    const [selectedStudent, setSelectedStudent] = React.useState<StudentRfidRecord | null>(null);
    const [generatedUid, setGeneratedUid] = React.useState("");
    const [generatedDecimal, setGeneratedDecimal] = React.useState("");
    const [generatedCardNumber, setGeneratedCardNumber] = React.useState("");
    const [cardNotes, setCardNotes] = React.useState("");
    const [isIssuing, setIsIssuing] = React.useState(false);

    // Card Preview Dialog
    const [previewDialogOpen, setPreviewDialogOpen] = React.useState(false);
    const [previewStudent, setPreviewStudent] = React.useState<StudentRfidRecord | null>(null);
    const [isCardFlipped, setIsCardFlipped] = React.useState(false);

    // Scan Simulator Dialog
    const [scanDialogOpen, setScanDialogOpen] = React.useState(false);
    const [scannedInput, setScannedInput] = React.useState("");
    const [scannedStudent, setScannedStudent] = React.useState<StudentRfidRecord | null>(null);

    // SQL Migration Dialog
    const [sqlDialogOpen, setSqlDialogOpen] = React.useState(false);

    // Fetch data
    const loadData = React.useCallback(async (showToast = false) => {
        setIsLoading(true);
        try {
            const res = await getStudentRfidDataAction();
            if (res.success) {
                setRecords(res.data);
                setTableReady(res.tableReady);
                if (showToast) {
                    toast.success("RFID database refreshed successfully");
                }
            } else {
                toast.error(res.error || "Failed to load RFID records");
                setTableReady(res.tableReady);
            }
        } catch {
            toast.error("Failed to fetch RFID records");
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    // Computed Stats
    const stats = React.useMemo(() => {
        const total = records.length;
        const active = records.filter((r) => r.card_status === "Active").length;
        const unassigned = records.filter((r) => r.card_status === "Unassigned").length;
        const inactiveOrLost = records.filter(
            (r) => r.card_status === "Inactive" || r.card_status === "Lost"
        ).length;
        return { total, active, unassigned, inactiveOrLost };
    }, [records]);

    // Filtered Records
    const filteredRecords = React.useMemo(() => {
        return records.filter((item) => {
            const query = searchQuery.toLowerCase().trim();
            const matchesQuery =
                !query ||
                item.full_name.toLowerCase().includes(query) ||
                item.student_number.toLowerCase().includes(query) ||
                item.program.toLowerCase().includes(query) ||
                (item.rfid_uid && item.rfid_uid.toLowerCase().includes(query)) ||
                (item.card_number && item.card_number.toLowerCase().includes(query));

            const matchesStatus =
                statusFilter === "all" ||
                item.card_status.toLowerCase() === statusFilter.toLowerCase();

            return matchesQuery && matchesStatus;
        });
    }, [records, searchQuery, statusFilter]);

    // Open Issue Modal
    const handleOpenIssueModal = (student: StudentRfidRecord) => {
        setSelectedStudent(student);
        const { hex, decimal } = generateRandomRfidUid();
        setGeneratedUid(student.rfid_uid || hex);
        setGeneratedDecimal(student.rfid_decimal || decimal);
        setGeneratedCardNumber(
            student.card_number || generateCardNumber(student.student_number)
        );
        setCardNotes("");
        setIssueDialogOpen(true);
    };

    // Regenerate chip UID inside modal
    const handleRegenerateUid = () => {
        const { hex, decimal } = generateRandomRfidUid();
        setGeneratedUid(hex);
        setGeneratedDecimal(decimal);
        if (selectedStudent) {
            setGeneratedCardNumber(generateCardNumber(selectedStudent.student_number));
        }
    };

    // Handle Issue Submit
    const handleConfirmIssue = async () => {
        if (!selectedStudent || !generatedUid.trim() || !generatedCardNumber.trim()) {
            toast.error("Please fill in the required RFID credentials");
            return;
        }

        setIsIssuing(true);
        try {
            const res = await issueStudentRfidAction({
                studentId: selectedStudent.student_id,
                rfidUid: generatedUid,
                rfidDecimal: generatedDecimal,
                cardNumber: generatedCardNumber,
                notes: cardNotes,
            });

            if (res.success) {
                toast.success(
                    `RFID Card successfully issued to ${selectedStudent.full_name}`
                );
                setIssueDialogOpen(false);
                loadData();
            } else {
                toast.error(res.error || "Failed to issue RFID card");
            }
        } catch {
            toast.error("An unexpected error occurred during issuance");
        } finally {
            setIsIssuing(false);
        }
    };

    // Update Card Status
    const handleStatusChange = async (
        student: StudentRfidRecord,
        newStatus: "Active" | "Inactive" | "Lost"
    ) => {
        if (!student.card_id) return;
        try {
            const res = await updateRfidCardStatusAction(student.card_id, newStatus);
            if (res.success) {
                toast.success(`Card status updated to ${newStatus}`);
                loadData();
            } else {
                toast.error(res.error || "Failed to update status");
            }
        } catch {
            toast.error("Error updating card status");
        }
    };

    // Revoke Card
    const handleRevokeCard = async (student: StudentRfidRecord) => {
        if (!student.card_id) return;
        if (!confirm(`Are you sure you want to revoke the RFID card for ${student.full_name}?`)) {
            return;
        }
        try {
            const res = await revokeRfidCardAction(student.card_id, student.student_id);
            if (res.success) {
                toast.success(`RFID card unassigned from ${student.full_name}`);
                loadData();
            } else {
                toast.error(res.error || "Failed to revoke card");
            }
        } catch {
            toast.error("Error revoking card");
        }
    };

    // Copy UID to clipboard
    const handleCopyUid = (uid: string) => {
        navigator.clipboard.writeText(uid);
        setCopiedUid(uid);
        toast.info("RFID UID copied to clipboard");
        setTimeout(() => setCopiedUid(null), 2000);
    };

    // Open Card Preview Modal
    const handleOpenPreview = (student: StudentRfidRecord) => {
        setPreviewStudent(student);
        setIsCardFlipped(false);
        setPreviewDialogOpen(true);
    };

    // Print Card
    const handlePrintCard = () => {
        window.print();
    };

    // Scan Simulator
    const handleSimulateScan = (inputVal: string) => {
        setScannedInput(inputVal);
        const clean = inputVal.trim().toLowerCase();
        if (!clean) {
            setScannedStudent(null);
            return;
        }
        const match = records.find(
            (r) =>
                (r.rfid_uid && r.rfid_uid.toLowerCase() === clean) ||
                (r.rfid_decimal && r.rfid_decimal === clean) ||
                r.student_number.toLowerCase() === clean
        );
        setScannedStudent(match || null);
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Top Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <PageHeader
                    title="Student RFID Generation & Management"
                    description="Issue contactless MIFARE smart cards, link student profiles, and manage active campus credentials."
                />

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        id="btn-scan-simulator"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setScannedInput("");
                            setScannedStudent(null);
                            setScanDialogOpen(true);
                        }}
                        className="border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-950/40 text-xs"
                    >
                        <ScanLine className="mr-1.5 size-3.5" />
                        Test RFID Tap
                    </Button>

                    <Button
                        id="btn-refresh-rfid"
                        variant="outline"
                        size="sm"
                        onClick={() => loadData(true)}
                        disabled={isLoading}
                        className="text-xs"
                    >
                        <RefreshCw className={`mr-1.5 size-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Supabase Schema Notice Banner (shown if table not detected yet) */}
            {!tableReady && (
                <div className="rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-xs dark:border-amber-800/60 dark:from-amber-950/30 dark:to-orange-950/20">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <Info className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                            <div>
                                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                                    Database Migration Recommended: <code className="text-[11px] font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">student_rfid_cards</code>
                                </p>
                                <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5">
                                    The dedicated RFID storage table is ready to be initialized in your Supabase SQL Editor.
                                </p>
                            </div>
                        </div>
                        <Button
                            id="btn-view-sql-migration"
                            size="sm"
                            variant="outline"
                            onClick={() => setSqlDialogOpen(true)}
                            className="shrink-0 border-amber-400 bg-white hover:bg-amber-100 text-amber-900 text-xs dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
                        >
                            <FileCode className="mr-1.5 size-3.5" />
                            View SQL Script
                        </Button>
                    </div>
                </div>
            )}

            {/* KPI Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-slate-200 dark:border-emerald-950/60 bg-white dark:bg-[#070d0a] shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-slate-500 dark:text-emerald-400/80">
                            Total Registered Students
                        </CardTitle>
                        <Users className="size-4 text-slate-400 dark:text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                            {stats.total}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                            Available in database for issuance
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/60 to-white dark:from-emerald-950/30 dark:to-[#070d0a] shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            Active RFID Cards Issued
                        </CardTitle>
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-emerald-800 dark:text-emerald-300">
                            {stats.active}
                        </div>
                        <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                            {stats.total > 0
                                ? `${Math.round((stats.active / stats.total) * 100)}% coverage of student body`
                                : "No students registered"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-amber-200 dark:border-amber-900/60 bg-white dark:bg-[#070d0a] shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400">
                            Unassigned / Pending Cards
                        </CardTitle>
                        <Radio className="size-4 text-amber-600 dark:text-amber-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-amber-800 dark:text-amber-300">
                            {stats.unassigned}
                        </div>
                        <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1">
                            Awaiting physical card encoding
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d0a] shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Lost / Inactive Credentials
                        </CardTitle>
                        <AlertTriangle className="size-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                            {stats.inactiveOrLost}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                            Requires replacement or de-listing
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-[#070d0a] p-3 rounded-xl border border-slate-200 dark:border-emerald-950/60 shadow-xs">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <Input
                        id="input-search-rfid"
                        placeholder="Search student name, student #, program, or RFID UID (e.g. 4A:8C:31:0D)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 text-xs h-9 bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                            <X className="size-4" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="size-3.5 text-slate-400 ml-1" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Filter:</span>
                    <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100/60 dark:bg-slate-900/60 text-xs">
                        {[
                            { key: "all", label: "All" },
                            { key: "active", label: "Active" },
                            { key: "unassigned", label: "Unassigned" },
                            { key: "lost", label: "Lost / Inactive" },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setStatusFilter(tab.key)}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                                    statusFilter === tab.key
                                        ? "bg-white dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 shadow-xs font-semibold"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Students & RFID Database Table */}
            <Card className="border-slate-200 dark:border-emerald-950/60 bg-white dark:bg-[#070d0a] shadow-xs overflow-hidden">
                <CardHeader className="p-4 border-b border-slate-100 dark:border-emerald-950/40 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            Student Smart Credentials List
                        </CardTitle>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Showing {filteredRecords.length} student{filteredRecords.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </CardHeader>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
                            <TableRow className="border-slate-200 dark:border-slate-800">
                                <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    Student Profile
                                </TableHead>
                                <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    Program & Year
                                </TableHead>
                                <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    RFID Chip UID (Hex)
                                </TableHead>
                                <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    Card Number
                                </TableHead>
                                <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    Card Status
                                </TableHead>
                                <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300 text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-36 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="size-6 animate-spin text-emerald-600" />
                                            <span className="text-xs text-slate-500">
                                                Loading RFID records...
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredRecords.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400">
                                            <Radio className="size-6 text-slate-300 dark:text-slate-600" />
                                            <p className="text-xs font-medium">No student records found</p>
                                            <p className="text-[11px] text-slate-400">
                                                Try adjusting your search query or status filter.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRecords.map((item) => (
                                    <TableRow
                                        key={item.student_id}
                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 border-slate-100 dark:border-slate-800/80"
                                    >
                                        {/* Student Info */}
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="size-9 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                                                    {item.first_name ? item.first_name.charAt(0).toUpperCase() : "S"}
                                                    {item.last_name ? item.last_name.charAt(0).toUpperCase() : ""}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                        {item.full_name}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                                            {item.student_number}
                                                        </span>
                                                        <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
                                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                                                            {item.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Program */}
                                        <TableCell className="py-3">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                    {item.program}
                                                </span>
                                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    {item.year_level}
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* RFID UID */}
                                        <TableCell className="py-3">
                                            {item.rfid_uid ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Badge
                                                        variant="secondary"
                                                        className="font-mono text-[11px] bg-slate-100 text-slate-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-slate-200 dark:border-emerald-800/80 px-2 py-0.5"
                                                    >
                                                        <Radio className="mr-1 size-3 text-emerald-600 dark:text-emerald-400" />
                                                        {item.rfid_uid}
                                                    </Badge>
                                                    <button
                                                        onClick={() => handleCopyUid(item.rfid_uid!)}
                                                        title="Copy UID"
                                                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
                                                    >
                                                        {copiedUid === item.rfid_uid ? (
                                                            <Check className="size-3.5 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="size-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-[11px] italic text-slate-400">
                                                    Not assigned
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Card Number */}
                                        <TableCell className="py-3">
                                            {item.card_number ? (
                                                <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
                                                    {item.card_number}
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-slate-400">—</span>
                                            )}
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell className="py-3">
                                            {item.card_status === "Active" ? (
                                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 text-[10px]">
                                                    <CheckCircle2 className="mr-1 size-3" />
                                                    Active
                                                </Badge>
                                            ) : item.card_status === "Unassigned" ? (
                                                <Badge
                                                    variant="outline"
                                                    className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[10px]"
                                                >
                                                    <AlertTriangle className="mr-1 size-3" />
                                                    Unassigned
                                                </Badge>
                                            ) : item.card_status === "Lost" ? (
                                                <Badge
                                                    variant="destructive"
                                                    className="text-[10px]"
                                                >
                                                    <XCircle className="mr-1 size-3" />
                                                    Lost / Blocked
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px]"
                                                >
                                                    Inactive
                                                </Badge>
                                            )}
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {item.card_status === "Unassigned" ? (
                                                    <Button
                                                        id={`btn-issue-${item.student_id}`}
                                                        size="sm"
                                                        onClick={() => handleOpenIssueModal(item)}
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7 px-2.5 shadow-xs"
                                                    >
                                                        <Plus className="mr-1 size-3" />
                                                        Issue RFID
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        id={`btn-preview-${item.student_id}`}
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleOpenPreview(item)}
                                                        className="border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-950/40 text-xs h-7 px-2.5"
                                                    >
                                                        <CreditCard className="mr-1 size-3" />
                                                        View Card
                                                    </Button>
                                                )}

                                                {/* More Options Dropdown */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        className={cn(
                                                            buttonVariants({ variant: "ghost", size: "sm" }),
                                                            "h-7 w-7 p-0 text-slate-500 hover:text-slate-800"
                                                        )}
                                                    >
                                                        <span className="sr-only">Open menu</span>
                                                        <span className="text-base font-bold leading-none">⋮</span>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="text-xs">
                                                        <DropdownMenuItem
                                                            onClick={() => handleOpenIssueModal(item)}
                                                        >
                                                            <RotateCw className="mr-2 size-3.5" />
                                                            {item.card_status === "Unassigned" ? "Assign Card" : "Re-issue / Overwrite"}
                                                        </DropdownMenuItem>

                                                        {item.card_id && (
                                                            <>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleOpenPreview(item)}
                                                                >
                                                                    <Printer className="mr-2 size-3.5" />
                                                                    Print ID Card
                                                                </DropdownMenuItem>

                                                                <DropdownMenuSeparator />

                                                                {item.card_status !== "Active" && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleStatusChange(item, "Active")}
                                                                        className="text-emerald-600"
                                                                    >
                                                                        <CheckCircle2 className="mr-2 size-3.5" />
                                                                        Mark as Active
                                                                    </DropdownMenuItem>
                                                                )}

                                                                {item.card_status !== "Lost" && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleStatusChange(item, "Lost")}
                                                                        className="text-amber-600"
                                                                    >
                                                                        <AlertTriangle className="mr-2 size-3.5" />
                                                                        Mark as Lost
                                                                    </DropdownMenuItem>
                                                                )}

                                                                <DropdownMenuItem
                                                                    onClick={() => handleRevokeCard(item)}
                                                                    className="text-rose-600"
                                                                >
                                                                    <XCircle className="mr-2 size-3.5" />
                                                                    Revoke & Unlink
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* DIALOG 1: Issue / Encode RFID Card */}
            <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
                            <KeyRound className="size-5 text-emerald-600" />
                            Issue RFID Smart Card
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Encode and pair a contactless chip credential with this student record.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedStudent && (
                        <div className="space-y-4 py-2 text-xs">
                            {/* Student Profile Card */}
                            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-3 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                                        {selectedStudent.full_name}
                                    </p>
                                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                        Student ID: {selectedStudent.student_number} • {selectedStudent.program}
                                    </p>
                                </div>
                                <Badge variant="secondary" className="text-[10px]">
                                    {selectedStudent.year_level}
                                </Badge>
                            </div>

                            {/* RFID UID Input */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                                        Chip UID (Hexadecimal):
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleRegenerateUid}
                                        className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1"
                                    >
                                        <Sparkles className="size-3" />
                                        Randomize
                                    </button>
                                </div>
                                <div className="relative">
                                    <Radio className="absolute left-3 top-2.5 size-4 text-emerald-600" />
                                    <Input
                                        id="input-rfid-uid"
                                        value={generatedUid}
                                        onChange={(e) => setGeneratedUid(e.target.value)}
                                        placeholder="e.g. 4A:8C:31:0D"
                                        className="pl-9 font-mono text-xs uppercase"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400">
                                    Standard 4-byte or 7-byte contactless MIFARE / NFC tag UID. You can also tap a USB scanner.
                                </p>
                            </div>

                            {/* Decimal & Card Number */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                                        Decimal Tag:
                                    </label>
                                    <Input
                                        id="input-rfid-decimal"
                                        value={generatedDecimal}
                                        onChange={(e) => setGeneratedDecimal(e.target.value)}
                                        placeholder="10-digit Tag"
                                        className="font-mono text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                                        Card Serial No:
                                    </label>
                                    <Input
                                        id="input-card-number"
                                        value={generatedCardNumber}
                                        onChange={(e) => setGeneratedCardNumber(e.target.value)}
                                        placeholder="BCP-RFID-..."
                                        className="font-mono text-xs"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-1">
                                <label className="font-semibold text-slate-700 dark:text-slate-300">
                                    Issuance Notes (Optional):
                                </label>
                                <Input
                                    id="input-card-notes"
                                    value={cardNotes}
                                    onChange={(e) => setCardNotes(e.target.value)}
                                    placeholder="e.g. 1st Issue, Orientation Batch 2026"
                                    className="text-xs"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIssueDialogOpen(false)}
                            className="text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            id="btn-confirm-issue"
                            size="sm"
                            onClick={handleConfirmIssue}
                            disabled={isIssuing}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                        >
                            {isIssuing ? (
                                <>
                                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                                    Writing Card...
                                </>
                            ) : (
                                <>
                                    <Check className="mr-1.5 size-3.5" />
                                    Confirm & Issue Card
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DIALOG 2: Realistic Student ID Card Preview & Print Modal */}
            <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between text-base font-bold text-slate-800 dark:text-slate-100">
                            <span className="flex items-center gap-2">
                                <CreditCard className="size-5 text-emerald-600" />
                                Student ID Card Preview
                            </span>
                            <Badge
                                variant={previewStudent?.card_status === "Active" ? "default" : "secondary"}
                                className={previewStudent?.card_status === "Active" ? "bg-emerald-600 text-[10px]" : "text-[10px]"}
                            >
                                {previewStudent?.card_status || "Active"}
                            </Badge>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Standard CR-80 PVC ID Card layout ready for campus printing or digital verification.
                        </DialogDescription>
                    </DialogHeader>

                    {previewStudent && (
                        <div className="py-2 flex flex-col items-center">
                            {/* Flip Card Action */}
                            <div className="w-full flex items-center justify-between mb-3 text-xs">
                                <span className="text-slate-500">
                                    Viewing: <strong className="text-slate-800 dark:text-slate-200">{isCardFlipped ? "Back Side" : "Front Side"}</strong>
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsCardFlipped(!isCardFlipped)}
                                    className="h-7 text-xs"
                                >
                                    <RotateCw className="mr-1 size-3" />
                                    Flip Card
                                </Button>
                            </div>

                            {/* PHYSICAL CARD CONTAINER (CR-80 standard card proportions 85.6mm x 53.98mm ~ ratio 1.58) */}
                            <div
                                id="printable-id-card"
                                className="relative w-full max-w-[380px] h-[240px] rounded-2xl shadow-xl overflow-hidden border border-emerald-900/40 text-white select-none transition-all duration-300"
                                style={{
                                    background: isCardFlipped
                                        ? "linear-gradient(135deg, #091a13 0%, #030805 100%)"
                                        : "linear-gradient(140deg, #064e3b 0%, #022c22 45%, #0f172a 100%)",
                                }}
                            >
                                {!isCardFlipped ? (
                                    /* ================= FRONT SIDE ================= */
                                    <div className="relative w-full h-full p-4 flex flex-col justify-between">
                                        {/* Background Security Wave Pattern */}
                                        <div
                                            className="absolute inset-0 pointer-events-none opacity-10"
                                            style={{
                                                backgroundImage:
                                                    "radial-gradient(circle at 20% 30%, #34d399 2px, transparent 0), radial-gradient(circle at 80% 70%, #fbbf24 2px, transparent 0)",
                                                backgroundSize: "24px 24px",
                                            }}
                                        />

                                        {/* Card Header */}
                                        <div className="relative z-10 flex items-center justify-between border-b border-emerald-500/30 pb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="size-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center font-bold text-emerald-300 text-xs shadow-inner">
                                                    BCP
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold tracking-wider text-emerald-300 uppercase leading-none">
                                                        Bestlink College
                                                    </p>
                                                    <p className="text-[8px] tracking-widest text-emerald-200/70 uppercase">
                                                        of the Philippines
                                                    </p>
                                                </div>
                                            </div>

                                            {/* RFID Contactless Logo & Chip */}
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] font-bold text-amber-300 tracking-wider">
                                                    RFID PASS
                                                </span>
                                                <Radio className="size-3.5 text-emerald-300 animate-pulse" />
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="relative z-10 flex items-center gap-4 my-1">
                                            {/* Photo Box */}
                                            <div className="size-20 rounded-xl bg-gradient-to-br from-emerald-950 to-slate-900 border-2 border-emerald-400/60 p-0.5 shadow-md flex items-center justify-center shrink-0">
                                                <div className="w-full h-full rounded-[10px] bg-emerald-900/50 flex flex-col items-center justify-center">
                                                    <span className="text-xl font-bold text-emerald-200">
                                                        {previewStudent.first_name.charAt(0)}
                                                        {previewStudent.last_name.charAt(0)}
                                                    </span>
                                                    <span className="text-[8px] text-emerald-400 font-mono mt-0.5">
                                                        STUDENT
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-bold uppercase tracking-wide truncate text-white leading-tight">
                                                    {previewStudent.full_name}
                                                </p>
                                                <div className="mt-1 space-y-0.5">
                                                    <p className="text-[9px] text-emerald-300 font-mono">
                                                        SN: {previewStudent.student_number}
                                                    </p>
                                                    <p className="text-[9px] text-slate-300 font-semibold truncate">
                                                        {previewStudent.program} • {previewStudent.year_level}
                                                    </p>
                                                    <p className="text-[8px] text-slate-400 truncate">
                                                        Card No: {previewStudent.card_number || "PENDING"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Footer: Chip UID & Contactless Symbol */}
                                        <div className="relative z-10 flex items-center justify-between border-t border-emerald-500/20 pt-1.5">
                                            <div className="flex items-center gap-1 text-[8px] font-mono text-emerald-300">
                                                <Shield className="size-3 text-emerald-400" />
                                                UID: {previewStudent.rfid_uid || "NOT ENCODED"}
                                            </div>
                                            <span className="text-[8px] font-semibold text-emerald-400/80 uppercase">
                                                Official Campus ID
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    /* ================= BACK SIDE ================= */
                                    <div className="relative w-full h-full p-4 flex flex-col justify-between">
                                        {/* Magnetic Stripe Simulator */}
                                        <div className="-mx-4 -mt-4 h-8 bg-black/90 border-b border-slate-800" />

                                        {/* Signature & Validation QR */}
                                        <div className="flex items-center justify-between gap-3 my-1">
                                            <div className="space-y-1.5 text-[8px] text-slate-300">
                                                <p className="leading-tight text-slate-400">
                                                    This card certifies that the person named on the front is an active student of Bestlink College of the Philippines.
                                                </p>
                                                <div className="h-6 border-b border-dashed border-slate-500 flex items-end">
                                                    <span className="text-[7px] text-slate-400">Authorized Signature</span>
                                                </div>
                                                <p className="text-[7px] text-emerald-400 font-mono">
                                                    Emergency: (02) 8123-4567 • info@bcp.edu.ph
                                                </p>
                                            </div>

                                            {/* Digital Validation QR simulation */}
                                            <div className="size-16 bg-white rounded-lg p-1 flex items-center justify-center shrink-0 shadow-md">
                                                <QrCode className="size-14 text-slate-900" />
                                            </div>
                                        </div>

                                        {/* Barcode & Expiry Footer */}
                                        <div className="border-t border-slate-800 pt-1.5 flex items-center justify-between text-[8px]">
                                            <span className="font-mono text-slate-400">
                                                EXP: {previewStudent.expiry_date || "2030-01-01"}
                                            </span>
                                            <span className="font-mono text-slate-400">
                                                CHIP TYPE: MIFARE CLASSIC 1K
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewDialogOpen(false)}
                            className="text-xs"
                        >
                            Close
                        </Button>
                        <Button
                            id="btn-print-card"
                            size="sm"
                            onClick={handlePrintCard}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                        >
                            <Printer className="mr-1.5 size-3.5" />
                            Print ID Card
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DIALOG 3: Interactive RFID Reader / Tap Simulator */}
            <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
                <DialogContent className="sm:max-w-[440px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
                            <Radio className="size-5 text-emerald-600 animate-pulse" />
                            RFID Turnstile & Scanner Simulator
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Simulate physical contactless RFID reader taps for campus gates, library check-in, or clinic integration.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2 text-xs">
                        {/* Scanner input */}
                        <div className="space-y-1.5">
                            <label className="font-semibold text-slate-700 dark:text-slate-300">
                                Tap or Enter RFID UID / Student #:
                            </label>
                            <div className="relative">
                                <ScanLine className="absolute left-3 top-2.5 size-4 text-emerald-600" />
                                <Input
                                    id="input-simulator-uid"
                                    value={scannedInput}
                                    onChange={(e) => handleSimulateScan(e.target.value)}
                                    placeholder="Tap card or paste UID (e.g. 4A:8C:31:0D)..."
                                    className="pl-9 font-mono text-xs uppercase"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Quick Tap Helper Buttons */}
                        <div className="space-y-1">
                            <p className="text-[10px] text-slate-400">Quick Test with Issued Students:</p>
                            <div className="flex flex-wrap gap-1.5">
                                {records
                                    .filter((r) => r.rfid_uid)
                                    .slice(0, 3)
                                    .map((r) => (
                                        <button
                                            key={r.student_id}
                                            onClick={() => handleSimulateScan(r.rfid_uid!)}
                                            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-[10px] font-mono rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                        >
                                            {r.full_name.split(" ")[0]} ({r.rfid_uid})
                                        </button>
                                    ))}
                            </div>
                        </div>

                        {/* Scanner Result Card */}
                        {scannedStudent ? (
                            <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/40 p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                                        <CheckCircle2 className="size-4 text-emerald-600" />
                                        <span>ACCESS GRANTED • VALID RFID</span>
                                    </div>
                                    <Badge className="bg-emerald-600 text-[10px]">
                                        {scannedStudent.card_status}
                                    </Badge>
                                </div>
                                <div className="border-t border-emerald-200 dark:border-emerald-800/60 pt-2 text-xs space-y-1 text-slate-700 dark:text-slate-300">
                                    <p>
                                        <strong>Name:</strong> {scannedStudent.full_name}
                                    </p>
                                    <p>
                                        <strong>Student #:</strong> {scannedStudent.student_number}
                                    </p>
                                    <p>
                                        <strong>Program:</strong> {scannedStudent.program} • {scannedStudent.year_level}
                                    </p>
                                    <p className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                                        <strong>Card #:</strong> {scannedStudent.card_number}
                                    </p>
                                </div>
                            </div>
                        ) : scannedInput ? (
                            <div className="rounded-xl border border-rose-300 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/30 p-3 flex items-center gap-2.5 text-rose-800 dark:text-rose-300">
                                <XCircle className="size-5 shrink-0 text-rose-600" />
                                <div>
                                    <p className="font-semibold text-xs">Unknown or Unlinked RFID Chip</p>
                                    <p className="text-[11px] text-rose-600/90 dark:text-rose-400 mt-0.5">
                                        No student profile associated with this tag in the database.
                                    </p>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setScanDialogOpen(false)}
                            className="text-xs"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DIALOG 4: SQL Migration Helper */}
            <Dialog open={sqlDialogOpen} onOpenChange={setSqlDialogOpen}>
                <DialogContent className="sm:max-w-[560px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
                            <FileCode className="size-5 text-emerald-600" />
                            Supabase SQL Migration
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Run this script once in your Supabase SQL Editor to enable persistent RFID card records.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2 text-xs">
                        <div className="relative rounded-lg bg-slate-900 text-slate-200 p-3 font-mono text-[11px] max-h-[220px] overflow-y-auto border border-slate-800">
                            <pre>{`CREATE TABLE IF NOT EXISTS public.student_rfid_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    rfid_uid TEXT NOT NULL UNIQUE,
    rfid_decimal TEXT,
    card_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'Active',
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '4 years'),
    issued_by TEXT DEFAULT 'Registrar / RFID Admin',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.student_rfid_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access on student_rfid_cards"
    ON public.student_rfid_cards FOR ALL
    TO anon, authenticated USING (true) WITH CHECK (true);`}</pre>
                        </div>
                        <p className="text-[11px] text-slate-500">
                            Also saved in <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">supabase/schema_rfid.sql</code>.
                        </p>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS public.student_rfid_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    rfid_uid TEXT NOT NULL UNIQUE,
    rfid_decimal TEXT,
    card_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'Active',
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '4 years'),
    issued_by TEXT DEFAULT 'Registrar / RFID Admin',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.student_rfid_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access on student_rfid_cards"
    ON public.student_rfid_cards FOR ALL
    TO anon, authenticated USING (true) WITH CHECK (true);`);
                                toast.success("SQL script copied to clipboard!");
                            }}
                            className="text-xs"
                        >
                            <Copy className="mr-1.5 size-3.5" />
                            Copy SQL Script
                        </Button>
                        <a
                            href="https://supabase.com/dashboard/project/bohadtcvnjpwtfqscawk/sql"
                            target="_blank"
                            rel="noreferrer"
                            className={cn(
                                buttonVariants({ size: "sm" }),
                                "bg-emerald-600 hover:bg-emerald-500 text-white text-xs inline-flex items-center"
                            )}
                        >
                            <ExternalLink className="mr-1.5 size-3.5" />
                            Open Supabase SQL
                        </a>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Print Styling for physical ID Cards */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #printable-id-card,
                    #printable-id-card * {
                        visibility: visible !important;
                    }
                    #printable-id-card {
                        position: fixed !important;
                        left: 50% !important;
                        top: 50% !important;
                        transform: translate(-50%, -50%) !important;
                        box-shadow: none !important;
                        border: 1px solid #000 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
}
