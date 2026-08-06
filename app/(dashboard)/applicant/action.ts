"use server";

import { createAdminClient } from "@/utils/supabase/server";

export type UpdateApplicantInput = {
    enrollmentId: string;
    studentId?: string | null;
    applicantId?: string | null;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    email: string;
    contactNumber?: string | null;
    address?: string | null;
    programId?: string;
    yearLevelId?: string;
    academicYearId?: string;
    semesterId?: string;
    status?: string;
};

export async function updateApplicantAction(input: UpdateApplicantInput) {
    const supabase = createAdminClient();

    try {
        // 1. Update personal details in students table if studentId exists
        if (input.studentId) {
            const { error: studentErr } = await supabase
                .from("students")
                .update({
                    first_name: input.firstName,
                    middle_name: input.middleName || null,
                    last_name: input.lastName,
                    email: input.email,
                    contact_number: input.contactNumber || null,
                    address: input.address || null,
                })
                .eq("id", input.studentId);

            if (studentErr) return { success: false, error: studentErr.message };
        }

        // 2. Update personal details in applicants table if applicantId exists
        if (input.applicantId) {
            const { error: applicantErr } = await supabase
                .from("applicants")
                .update({
                    first_name: input.firstName,
                    middle_name: input.middleName || null,
                    last_name: input.lastName,
                    email: input.email,
                    contact_number: input.contactNumber || null,
                    address: input.address || null,
                })
                .eq("id", input.applicantId);

            if (applicantErr) return { success: false, error: applicantErr.message };
        }

        // 3. Update academic details & status in enrollments table
        const enrollmentPayload: Record<string, any> = {};
        if (input.programId) enrollmentPayload.program_id = input.programId;
        if (input.yearLevelId) enrollmentPayload.year_level_id = input.yearLevelId;
        if (input.academicYearId) enrollmentPayload.academic_year_id = input.academicYearId;
        if (input.semesterId) enrollmentPayload.semester_id = input.semesterId;
        if (input.status) enrollmentPayload.status = input.status;

        if (Object.keys(enrollmentPayload).length > 0) {
            const { error: enrollErr } = await supabase
                .from("enrollments")
                .update(enrollmentPayload)
                .eq("id", input.enrollmentId);

            if (enrollErr) return { success: false, error: enrollErr.message };
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: "Failed to update applicant record." };
    }
}
