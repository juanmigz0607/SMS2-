"use server";

import { createClient } from "@/utils/supabase/server";

export async function enrollStudentAction(formData: FormData) {
    const supabase = await createClient();

    // Extract Form Values
    const firstName = formData.get("firstName") as string;
    const middleName = formData.get("middleName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const contactNumber = formData.get("contactNumber") as string;
    const address = formData.get("address") as string;

    // Foreign Key IDs from dropdown selections
    const programId = formData.get("programId") as string;
    const yearLevelId = formData.get("yearLevelId") as string;
    const academicYearId = formData.get("academicYearId") as string;
    const semesterId = formData.get("semesterId") as string;

    // Validation (without studentNumber since it's auto-generated)
    if (
        !firstName ||
        !lastName ||
        !email ||
        !programId ||
        !yearLevelId ||
        !academicYearId ||
        !semesterId
    ) {
        return { success: false, error: "Please fill in all required fields." };
    }

    // Auto-generate student number (e.g., 2026-84920)
    const generatedStudentNumber = `2026-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
        // 1. Insert Profile into `students`
        const { data: student, error: studentError } = await supabase
            .from("students")
            .insert({
                student_number: generatedStudentNumber,
                first_name: firstName,
                middle_name: middleName || null,
                last_name: lastName,
                email: email,
                contact_number: contactNumber || null,
                address: address || null,
            })
            .select("id")
            .single();

        if (studentError) {
            if (studentError.code === "23505") {
                return {
                    success: false,
                    error: "Email address is already registered.",
                };
            }
            return { success: false, error: studentError.message };
        }

        // 2. Insert Enrollment Record with Foreign Keys (Default status: Pending)
        const { error: enrollmentError } = await supabase
            .from("enrollments")
            .insert({
                student_id: student.id,
                program_id: programId,
                year_level_id: yearLevelId,
                academic_year_id: academicYearId,
                semester_id: semesterId,
                status: "Pending",
            });

        if (enrollmentError) {
            return { success: false, error: enrollmentError.message };
        }

        return { success: true };
    } catch (err) {
        return {
            success: false,
            error: "An unexpected error occurred during submission.",
        };
    }
}