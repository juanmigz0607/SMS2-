"use server";

import { createAdminClient } from "@/utils/supabase/server";

export async function enrollStudentAction(formData: FormData) {
    const supabaseAdmin = createAdminClient();

    const firstName = formData.get("firstName") as string;
    const middleName = formData.get("middleName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const contactNumber = formData.get("contactNumber") as string;
    const address = formData.get("address") as string;

    const programId = formData.get("programId") as string;
    const yearLevelId = formData.get("yearLevelId") as string;
    const academicYearId = formData.get("academicYearId") as string;
    const semesterId = formData.get("semesterId") as string;

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

    const generatedApplicantId = `APP-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
        // 1. Insert into applicants using admin client
        const { data: applicant, error: applicantError } = await supabaseAdmin
            .from("applicants")
            .insert({
                applicant_id: generatedApplicantId,
                first_name: firstName,
                middle_name: middleName || null,
                last_name: lastName,
                email: email,
                contact_number: contactNumber || null,
                address: address || null,
            })
            .select("id")
            .single();

        if (applicantError) {
            if (applicantError.code === "23505") {
                return {
                    success: false,
                    error: "An application with this email address already exists.",
                };
            }
            return { success: false, error: applicantError.message };
        }

        // 2. Insert into enrollments
        const { error: enrollmentError } = await supabaseAdmin
            .from("enrollments")
            .insert({
                applicant_id: applicant.id,
                student_id: null,
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