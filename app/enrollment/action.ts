"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function enrollStudentAction(formData: FormData) {
    // Extract Form Values
    const studentNumber = formData.get("studentNumber") as string;
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

    if (
        !studentNumber ||
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

    try {
        // 1. Insert Profile into `students`
        const { data: student, error: studentError } = await supabase
            .from("students")
            .insert({
                student_number: studentNumber,
                first_name: firstName,
                middle_name: middleName || null,
                last_name: lastName,
                email: email,
                contact_number: contactNumber,
                address: address,
            })
            .select("id")
            .single();

        if (studentError) {
            if (studentError.code === "23505") {
                return {
                    success: false,
                    error: "Student Number or Email address already exists.",
                };
            }
            return { success: false, error: studentError.message };
        }

        // 2. Insert Enrollment Record with Foreign Keys
        const { error: enrollmentError } = await supabase
            .from("enrollments")
            .insert({
                student_id: student.id,
                program_id: programId,
                year_level_id: yearLevelId,
                academic_year_id: academicYearId,
                semester_id: semesterId,
                status: "Enrolled",
            });

        if (enrollmentError) {
            return { success: false, error: enrollmentError.message };
        }

        return { success: true };
    } catch (err) {
        return {
            success: false,
            error: "An unexpected error occurred during enrollment.",
        };
    }
}