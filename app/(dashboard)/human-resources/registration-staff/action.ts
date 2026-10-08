"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/server";

export type StaffRole = "Staff" | "Faculty";

export type StaffRecord = {
    id: string;
    staff_id: string;
    name: string;
    email: string;
    phone: string | null;
    role: StaffRole | string;
    assigned_window: string;
    department?: string;
    department_id?: string | null;
    shift?: string;
    status?: "Active" | "On Duty" | "Break" | "Off Duty";
    created_at?: string;
};

export type UpsertStaffInput = {
    id?: string;
    staff_id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: StaffRole | string;
    department?: string;
    department_id?: string | null;
    assigned_window?: string;
    shift?: string;
    status?: "Active" | "On Duty" | "Break" | "Off Duty";
};

export async function createStaffAction(input: UpsertStaffInput) {
    const supabase = createAdminClient();

    try {
        const dept = (input.department || input.assigned_window || "Registrar's Office").trim();

        // Resolve department_id from departments table if not provided
        let deptId: string | null = input.department_id || null;
        if (!deptId && dept) {
            const { data: deptRecord } = await supabase
                .from("departments")
                .select("id")
                .or(`name.eq."${dept}",code.eq."${dept}"`)
                .limit(1)
                .maybeSingle();

            if (deptRecord?.id) {
                deptId = deptRecord.id;
            }
        }

        // 1. Try inserting with `department` and `department_id` columns
        let { data, error } = await supabase
            .from("registration_staff")
            .insert({
                staff_id: input.staff_id.trim(),
                name: input.name.trim(),
                email: input.email.trim(),
                phone: input.phone ? input.phone.trim() : null,
                role: input.role.trim(),
                department: dept,
                department_id: deptId,
                assigned_window: dept,
                shift: input.shift ? input.shift.trim() : "08:00 AM - 05:00 PM",
                status: input.status || "Active",
            })
            .select()
            .single();

        // If 'department' column does not exist yet in Postgres schema cache, fallback without it
        if (error && error.message.includes("'department' column")) {
            const fallback = await supabase
                .from("registration_staff")
                .insert({
                    staff_id: input.staff_id.trim(),
                    name: input.name.trim(),
                    email: input.email.trim(),
                    phone: input.phone ? input.phone.trim() : null,
                    role: input.role.trim(),
                    department_id: deptId,
                    assigned_window: dept,
                    shift: input.shift ? input.shift.trim() : "08:00 AM - 05:00 PM",
                    status: input.status || "Active",
                })
                .select()
                .single();

            data = fallback.data;
            error = fallback.error;
        }

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath("/human-resources/registration-staff");
        revalidatePath("/human-resources");
        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err?.message || "Failed to create registration staff record." };
    }
}

export async function updateStaffAction(id: string, input: Partial<UpsertStaffInput>) {
    const supabase = createAdminClient();

    try {
        const dept = (input.department || input.assigned_window || "").trim();
        const payload: Record<string, any> = {};
        if (input.staff_id !== undefined) payload.staff_id = input.staff_id.trim();
        if (input.name !== undefined) payload.name = input.name.trim();
        if (input.email !== undefined) payload.email = input.email.trim();
        if (input.phone !== undefined) payload.phone = input.phone ? input.phone.trim() : null;
        if (input.role !== undefined) payload.role = input.role.trim();

        if (dept) {
            payload.department = dept;
            payload.assigned_window = dept;

            let deptId = input.department_id || null;
            if (!deptId) {
                const { data: deptRecord } = await supabase
                    .from("departments")
                    .select("id")
                    .or(`name.eq."${dept}",code.eq."${dept}"`)
                    .limit(1)
                    .maybeSingle();

                if (deptRecord?.id) {
                    deptId = deptRecord.id;
                }
            }
            if (deptId) {
                payload.department_id = deptId;
            }
        } else if (input.department_id !== undefined) {
            payload.department_id = input.department_id;
        }

        if (input.shift !== undefined) payload.shift = input.shift.trim();
        if (input.status !== undefined) payload.status = input.status;

        let { data, error } = await supabase
            .from("registration_staff")
            .update(payload)
            .eq("id", id)
            .select()
            .single();

        // If 'department' column is not yet present, remove it from payload and update with assigned_window
        if (error && error.message.includes("'department' column")) {
            delete payload.department;
            const fallback = await supabase
                .from("registration_staff")
                .update(payload)
                .eq("id", id)
                .select()
                .single();

            data = fallback.data;
            error = fallback.error;
        }

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath("/human-resources/registration-staff");
        revalidatePath("/human-resources");
        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err?.message || "Failed to update registration staff record." };
    }
}

export async function deleteStaffAction(id: string) {
    const supabase = createAdminClient();

    try {
        const { error } = await supabase
            .from("registration_staff")
            .delete()
            .eq("id", id);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath("/human-resources/registration-staff");
        revalidatePath("/human-resources");
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err?.message || "Failed to delete registration staff record." };
    }
}
