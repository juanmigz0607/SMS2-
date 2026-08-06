"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function loginAction(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { success: false, error: "Email and password are required." };
    }

    try {
        const { data: user, error } = await supabase
            .from("users")
            .select("id, UserName, UserEmail, Role")
            .eq("UserEmail", email)
            .eq("Password", password)
            .single();

        if (error || !user) {
            return { success: false, error: "Invalid email or password." };
        }

        const sessionData = {
            id: user.id,
            name: user.UserName,
            email: user.UserEmail,
            role: user.Role,
        };

        const cookieStore = await cookies();
        cookieStore.set("user_session", JSON.stringify(sessionData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return { success: true, user: sessionData };
    } catch (err) {
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete("user_session");
    return { success: true };
}