"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/server";

export type FacultyRecord = {
    id: string;
    faculty_id: string;
    name: string;
    email: string;
    department: string;
    department_id?: string | null;
    rank?: string;
    employment_type: "Full-Time" | "Part-Time" | "Visiting";
    assigned_units: number;
    status: "Active" | "On Leave" | "Sabbatical";
    created_at?: string;
};

export type UpsertFacultyInput = {
    id?: string;
    faculty_id: string;
    name: string;
    email: string;
    department: string;
    department_id?: string | null;
    rank?: string;
    employment_type: "Full-Time" | "Part-Time" | "Visiting";
    assigned_units: number;
    status: "Active" | "On Leave" | "Sabbatical";
};

export async function createFacultyAction(input: UpsertFacultyInput) {
    const supabase = createAdminClient();

    try {
        const dept = input.department.trim();
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

        const { data, error } = await supabase
            .from("faculty")
            .insert({
                faculty_id: input.faculty_id.trim(),
                name: input.name.trim(),
                email: input.email.trim(),
                department: dept,
                department_id: deptId,
                rank: input.rank ? input.rank.trim() : "Faculty",
                employment_type: input.employment_type,
                assigned_units: Number(input.assigned_units) || 0,
                status: input.status,
            })
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath("/human-resources/faculty");
        revalidatePath("/human-resources");
        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err?.message || "Failed to create faculty record." };
    }
}

export async function updateFacultyAction(id: string, input: Partial<UpsertFacultyInput>) {
    const supabase = createAdminClient();

    try {
        const payload: Record<string, any> = {};
        if (input.faculty_id !== undefined) payload.faculty_id = input.faculty_id.trim();
        if (input.name !== undefined) payload.name = input.name.trim();
        if (input.email !== undefined) payload.email = input.email.trim();
        if (input.department !== undefined) {
            const dept = input.department.trim();
            payload.department = dept;

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

        if (input.rank !== undefined) payload.rank = input.rank.trim();
        if (input.employment_type !== undefined) payload.employment_type = input.employment_type;
        if (input.assigned_units !== undefined) payload.assigned_units = Number(input.assigned_units) || 0;
        if (input.status !== undefined) payload.status = input.status;

        const { data, error } = await supabase
            .from("faculty")
            .update(payload)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath("/human-resources/faculty");
        revalidatePath("/human-resources");
        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err?.message || "Failed to update faculty record." };
    }
}

export async function deleteFacultyAction(id: string) {
    const supabase = createAdminClient();

    try {
        const { error } = await supabase
            .from("faculty")
            .delete()
            .eq("id", id);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath("/human-resources/faculty");
        revalidatePath("/human-resources");
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err?.message || "Failed to delete faculty record." };
    }
}
