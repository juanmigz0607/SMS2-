"use server";

import { createAdminClient } from "@/utils/supabase/server";

export async function updateEnrollmentStatusAction(
    enrollmentId: string,
    newStatus: "Enrolled" | "Pending" | "Rejected"
) {
    if (!enrollmentId || !newStatus) {
        return { success: false, error: "Invalid parameters." };
    }

    const supabase = createAdminClient();

    try {
        // Fetch current enrollment details
        const { data: enrollment, error: fetchError } = await supabase
            .from("enrollments")
            .select("id, student_id, applicant_id")
            .eq("id", enrollmentId)
            .single();

        if (fetchError) {
            return { success: false, error: fetchError.message };
        }

        let studentId = enrollment.student_id;

        // If approving to "Enrolled", handle student record creation & student_number assignment
        if (newStatus === "Enrolled") {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const day = now.getDate();
            const datePrefix = `${year}${month}${day}`;

            // Determine next student_number order number
            const { data: assignedStudents } = await supabase
                .from("students")
                .select("student_number")
                .not("student_number", "is", null);

            const existingNumbers = new Set(
                (assignedStudents || []).map((s) => s.student_number)
            );

            const todayAssigned = (assignedStudents || []).filter(
                (s) => s.student_number && s.student_number.startsWith(datePrefix)
            );

            let nextOrderNum = 101 + todayAssigned.length;
            let generatedStudentNumber = `${datePrefix}${nextOrderNum}`;

            while (existingNumbers.has(generatedStudentNumber)) {
                nextOrderNum++;
                generatedStudentNumber = `${datePrefix}${nextOrderNum}`;
            }

            // Case A: Student record does not exist yet (comes from applicants table)
            if (!studentId && enrollment.applicant_id) {
                const { data: applicant } = await supabase
                    .from("applicants")
                    .select("*")
                    .eq("id", enrollment.applicant_id)
                    .single();

                if (applicant) {
                    const { data: newStudent, error: createStudentError } = await supabase
                        .from("students")
                        .insert({
                            student_number: generatedStudentNumber,
                            first_name: applicant.first_name,
                            middle_name: applicant.middle_name,
                            last_name: applicant.last_name,
                            email: applicant.email,
                            contact_number: applicant.contact_number,
                            address: applicant.address,
                        })
                        .select("id")
                        .single();

                    if (createStudentError) {
                        return { success: false, error: createStudentError.message };
                    }

                    studentId = newStudent.id;
                }
            } else if (studentId) {
                // Case B: Student record already exists, update student_number if missing or PENDING
                const { data: existingStudent } = await supabase
                    .from("students")
                    .select("student_number")
                    .eq("id", studentId)
                    .single();

                if (
                    !existingStudent?.student_number ||
                    existingStudent.student_number.startsWith("PENDING")
                ) {
                    await supabase
                        .from("students")
                        .update({ student_number: generatedStudentNumber })
                        .eq("id", studentId);
                }
            }
        }

        // Update enrollment status and link student_id if newly created
        const updatePayload: Record<string, any> = { status: newStatus };
        if (studentId) {
            updatePayload.student_id = studentId;
        }

        const { error: updateError } = await supabase
            .from("enrollments")
            .update(updatePayload)
            .eq("id", enrollmentId);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: "Failed to update enrollment status." };
    }
}
