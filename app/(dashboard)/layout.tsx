import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell, UserRole } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("user_session")?.value;

    if (!sessionCookie) {
        redirect("/login");
    }

    let userEmail = "admin@sms2.com";
    let userRole: UserRole = "admin";

    try {
        const session = JSON.parse(sessionCookie);
        if (session.email) userEmail = session.email;
        if (session.role) {
            const roleLower = String(session.role).toLowerCase();
            if (roleLower === "admin" || roleLower === "staff" || roleLower === "registrar") {
                userRole = roleLower as UserRole;
            }
        }
    } catch {
        redirect("/login");
    }

    return (
        <DashboardShell userEmail={userEmail} userRole={userRole}>
            {children}
        </DashboardShell>
    );
}
