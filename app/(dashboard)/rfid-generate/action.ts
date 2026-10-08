"use server";

import { createAdminClient } from "@/utils/supabase/server";

export type StudentRfidRecord = {
    id: string; // card id or student id
    student_id: string;
    student_number: string;
    full_name: string;
    first_name: string;
    last_name: string;
    email: string;
    contact_number: string;
    program: string;
    year_level: string;
    enrollment_status: string;
    card_id: string | null;
    rfid_uid: string | null;
    rfid_decimal: string | null;
    card_number: string | null;
    card_status: "Active" | "Inactive" | "Lost" | "Unassigned";
    issue_date: string | null;
    expiry_date: string | null;
};

export type IssueRfidInput = {
    studentId: string;
    rfidUid: string;
    rfidDecimal?: string;
    cardNumber: string;
    notes?: string;
    expiryDate?: string;
};

/**
 * Fetch all students combined with their current RFID card status
 */
export async function getStudentRfidDataAction(): Promise<{
    success: boolean;
    data: StudentRfidRecord[];
    tableReady: boolean;
    error?: string;
}> {
    const supabase = createAdminClient();

    try {
        // 1. Fetch all students with latest enrollment
        const { data: studentsData, error: studentsError } = await supabase
            .from("students")
            .select(`
                id,
                student_number,
                first_name,
                middle_name,
                last_name,
                email,
                contact_number,
                created_at,
                enrollments (
                    id,
                    status,
                    programs ( id, code, name ),
                    year_levels ( id, name )
                )
            `)
            .order("created_at", { ascending: false });

        if (studentsError) {
            return {
                success: false,
                data: [],
                tableReady: false,
                error: studentsError.message,
            };
        }

        // 2. Fetch RFID cards (gracefully handle if table does not exist yet)
        let rfidCardsMap = new Map<string, any>();
        let tableReady = true;

        const { data: rfidCards, error: rfidError } = await supabase
            .from("student_rfid_cards")
            .select("*");

        if (rfidError) {
            // Table might not exist yet
            tableReady = false;
        } else if (rfidCards) {
            rfidCards.forEach((c) => {
                rfidCardsMap.set(c.student_id, c);
            });
        }

        // 3. Merge data
        const records: StudentRfidRecord[] = (studentsData || []).map((s: any) => {
            const middleInitial = s.middle_name ? ` ${s.middle_name.charAt(0)}.` : "";
            const fullName = `${s.first_name}${middleInitial} ${s.last_name}`;

            const latestEnrollment =
                Array.isArray(s.enrollments) && s.enrollments.length > 0
                    ? s.enrollments[0]
                    : null;

            const existingCard = rfidCardsMap.get(s.id);

            const displayStudentNumber =
                !s.student_number || s.student_number.startsWith("PENDING")
                    ? "Unassigned"
                    : s.student_number;

            return {
                id: s.id,
                student_id: s.id,
                student_number: displayStudentNumber,
                full_name: fullName,
                first_name: s.first_name || "",
                last_name: s.last_name || "",
                email: s.email || "N/A",
                contact_number: s.contact_number || "N/A",
                program: latestEnrollment?.programs?.code || "Unassigned",
                year_level: latestEnrollment?.year_levels?.name || "N/A",
                enrollment_status: latestEnrollment?.status || "Enrolled",
                card_id: existingCard?.id || null,
                rfid_uid: existingCard?.rfid_uid || null,
                rfid_decimal: existingCard?.rfid_decimal || null,
                card_number: existingCard?.card_number || null,
                card_status: existingCard?.status || "Unassigned",
                issue_date: existingCard?.issue_date || null,
                expiry_date: existingCard?.expiry_date || null,
            };
        });

        return {
            success: true,
            data: records,
            tableReady,
        };
    } catch (err: any) {
        return {
            success: false,
            data: [],
            tableReady: false,
            error: err.message || "Failed to load RFID records.",
        };
    }
}

/**
 * Issue or re-assign an RFID card to a student
 */
export async function issueStudentRfidAction(input: IssueRfidInput): Promise<{
    success: boolean;
    error?: string;
    card?: any;
}> {
    const supabase = createAdminClient();

    try {
        // Upsert into student_rfid_cards
        const payload: Record<string, any> = {
            student_id: input.studentId,
            rfid_uid: input.rfidUid.trim().toUpperCase(),
            rfid_decimal: input.rfidDecimal || null,
            card_number: input.cardNumber.trim().toUpperCase(),
            status: "Active",
            issue_date: new Date().toISOString().split("T")[0],
            expiry_date: input.expiryDate || new Date(Date.now() + 4 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            notes: input.notes || null,
            updated_at: new Date().toISOString(),
        };

        // Check if student already has a card
        const { data: existing } = await supabase
            .from("student_rfid_cards")
            .select("id")
            .eq("student_id", input.studentId)
            .maybeSingle();

        let resError;
        let cardData;

        if (existing?.id) {
            const { data, error } = await supabase
                .from("student_rfid_cards")
                .update(payload)
                .eq("id", existing.id)
                .select()
                .single();
            resError = error;
            cardData = data;
        } else {
            const { data, error } = await supabase
                .from("student_rfid_cards")
                .insert([payload])
                .select()
                .single();
            resError = error;
            cardData = data;
        }

        if (resError) {
            return { success: false, error: resError.message };
        }

        // Try updating students table rfid_uid if column exists
        try {
            await supabase
                .from("students")
                .update({ rfid_uid: input.rfidUid.trim().toUpperCase() })
                .eq("id", input.studentId);
        } catch (_) {
            // Ignore if column doesn't exist yet
        }

        return { success: true, card: cardData };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to issue RFID card." };
    }
}

/**
 * Update the status of an RFID card (e.g. Active, Inactive, Lost)
 */
export async function updateRfidCardStatusAction(
    cardId: string,
    status: "Active" | "Inactive" | "Lost"
): Promise<{ success: boolean; error?: string }> {
    const supabase = createAdminClient();

    try {
        const { error } = await supabase
            .from("student_rfid_cards")
            .update({
                status,
                updated_at: new Date().toISOString(),
            })
            .eq("id", cardId);

        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to update card status." };
    }
}

/**
 * Unassign/revoke an RFID card
 */
export async function revokeRfidCardAction(
    cardId: string,
    studentId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createAdminClient();

    try {
        const { error } = await supabase
            .from("student_rfid_cards")
            .delete()
            .eq("id", cardId);

        if (error) return { success: false, error: error.message };

        try {
            await supabase
                .from("students")
                .update({ rfid_uid: null })
                .eq("id", studentId);
        } catch (_) {}

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to revoke card." };
    }
}
