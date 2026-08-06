"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, UserPlus, ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { enrollStudentAction } from "./action";

type OptionItem = {
    id: string;
    name?: string;
    code?: string;
    year_code?: string;
};

export default function PublicEnrollmentPage() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [isFetchingOptions, setIsFetchingOptions] = React.useState(true);
    const [isSuccess, setIsSuccess] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const formRef = React.useRef<HTMLFormElement>(null);

    // Dynamic lookup options state
    const [programs, setPrograms] = React.useState<OptionItem[]>([]);
    const [yearLevels, setYearLevels] = React.useState<OptionItem[]>([]);
    const [academicYears, setAcademicYears] = React.useState<OptionItem[]>([]);
    const [semesters, setSemesters] = React.useState<OptionItem[]>([]);

    const supabase = createClient();

    // Load lookup options on component mount
    React.useEffect(() => {
        async function loadLookupData() {
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
                ]);

                if (progData) setPrograms(progData);
                if (yearData) setYearLevels(yearData);
                if (ayData) setAcademicYears(ayData);
                if (semData) setSemesters(semData);
            } catch (err) {
                console.error("Failed to load lookup options:", err);
            } finally {
                setIsFetchingOptions(false);
            }
        }

        loadLookupData();
    }, [supabase]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setErrorMessage(null);
        setIsSuccess(false);

        const formData = new FormData(event.currentTarget);
        const result = await enrollStudentAction(formData);

        setIsLoading(false);

        if (result.success) {
            setIsSuccess(true);
            formRef.current?.reset();
        } else {
            setErrorMessage(result.error || "Failed to submit application.");
        }
    }

    const inputStyles =
        "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Navigation Header for Public Form */}
            <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <Image
                        src="/sms2.png"
                        alt="SMS 2"
                        width={120}
                        height={32}
                        className="h-8 w-auto object-contain"
                        priority
                    />
                </div>
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                    <ArrowLeft className="size-4" />
                    Back to Sign In
                </Link>
            </header>

            {/* Main Content Area */}
            <main className="flex justify-center p-6 md:p-10">
                <div className="w-full max-w-3xl space-y-6">
                    <Card className="rounded-xl border-slate-200 bg-white shadow-md">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                                <UserPlus className="size-5 text-slate-600" />
                                Student Online Application Form
                            </CardTitle>
                        </CardHeader>

                        <form ref={formRef} onSubmit={handleSubmit}>
                            <CardContent className="grid gap-6 pt-6">
                                {errorMessage && (
                                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                                        {errorMessage}
                                    </div>
                                )}

                                {isSuccess && (
                                    <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                                        <CheckCircle2 className="size-4" />
                                        Your application has been submitted successfully!
                                    </div>
                                )}

                                {/* Section 1: Personal Information */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-700">
                                        Personal Details
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div className="grid gap-2">
                                            <Label htmlFor="firstName" className="text-xs font-semibold">
                                                First Name *
                                            </Label>
                                            <Input
                                                id="firstName"
                                                name="firstName"
                                                placeholder="First name"
                                                required
                                                disabled={isLoading}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="middleName" className="text-xs font-semibold">
                                                Middle Name
                                            </Label>
                                            <Input
                                                id="middleName"
                                                name="middleName"
                                                placeholder="Middle name"
                                                disabled={isLoading}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="lastName" className="text-xs font-semibold">
                                                Last Name *
                                            </Label>
                                            <Input
                                                id="lastName"
                                                name="lastName"
                                                placeholder="Last name"
                                                required
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="email" className="text-xs font-semibold">
                                                Email Address *
                                            </Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="student@example.com"
                                                required
                                                disabled={isLoading}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="contactNumber" className="text-xs font-semibold">
                                                Contact Number
                                            </Label>
                                            <Input
                                                id="contactNumber"
                                                name="contactNumber"
                                                placeholder="09123456789"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2 pt-2">
                                        <Label htmlFor="address" className="text-xs font-semibold">
                                            Home Address
                                        </Label>
                                        <Input
                                            id="address"
                                            name="address"
                                            placeholder="Complete address"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Section 2: Academic Details */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-700">
                                        Academic Information
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        {/* Course / Program Dropdown */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="programId" className="text-xs font-semibold">
                                                Preferred Course / Program *
                                            </Label>
                                            <select
                                                id="programId"
                                                name="programId"
                                                required
                                                disabled={isLoading || isFetchingOptions}
                                                className={inputStyles}
                                            >
                                                <option value="">Select Program</option>
                                                {programs.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.code} - {p.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Year Level Dropdown */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="yearLevelId" className="text-xs font-semibold">
                                                Year Level *
                                            </Label>
                                            <select
                                                id="yearLevelId"
                                                name="yearLevelId"
                                                required
                                                disabled={isLoading || isFetchingOptions}
                                                className={inputStyles}
                                            >
                                                <option value="">Select Year Level</option>
                                                {yearLevels.map((y) => (
                                                    <option key={y.id} value={y.id}>
                                                        {y.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Academic Year Dropdown */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="academicYearId" className="text-xs font-semibold">
                                                Academic Year *
                                            </Label>
                                            <select
                                                id="academicYearId"
                                                name="academicYearId"
                                                required
                                                disabled={isLoading || isFetchingOptions}
                                                className={inputStyles}
                                            >
                                                <option value="">Select Academic Year</option>
                                                {academicYears.map((a) => (
                                                    <option key={a.id} value={a.id}>
                                                        {a.year_code}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Semester Dropdown */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="semesterId" className="text-xs font-semibold">
                                                Semester *
                                            </Label>
                                            <select
                                                id="semesterId"
                                                name="semesterId"
                                                required
                                                disabled={isLoading || isFetchingOptions}
                                                className={inputStyles}
                                            >
                                                <option value="">Select Semester</option>
                                                {semesters.map((s) => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        disabled={isLoading || isFetchingOptions}
                                        className="h-10 w-full text-sm font-medium"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 size-4 animate-spin" />
                                                Submitting Application...
                                            </>
                                        ) : (
                                            "Submit Application"
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </form>
                    </Card>
                </div>
            </main>
        </div>
    );
}