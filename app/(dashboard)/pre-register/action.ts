"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function updateEnrollmentStatusAction(
    enrollmentId: string,
    newStatus: "Enrolled" | "Pending" | "Rejected"
) {
    if (!enrollmentId || !newStatus) {
        return { success: false, error: "Invalid parameters." };
    }

    try {
        const { error } = await supabase
            .from("enrollments")
            .update({ status: newStatus })
            .eq("id", enrollmentId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: "Failed to update enrollment status." };
    }
}
