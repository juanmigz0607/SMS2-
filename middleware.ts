import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const session = request.cookies.get("user_session")?.value;

    const isLoginPage = pathname === "/login";
    const isEnrollmentPage = pathname.startsWith("/enrollment");
    const isPublicRoute = isLoginPage || isEnrollmentPage;

    const isPublicFile =
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname.includes(".") ||
        pathname === "/favicon.ico";

    if (isPublicFile) {
        return NextResponse.next();
    }

    // Unauthenticated user trying to access protected routes
    if (!session && !isPublicRoute) {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    // Authenticated user trying to access login page
    if (session && isLoginPage) {
        const dashboardUrl = new URL("/", request.url);
        return NextResponse.redirect(dashboardUrl);
    }

    const response = NextResponse.next();

    // Disable caching for protected routes so back button forces a revalidation
    if (!isPublicRoute) {
        response.headers.set(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate"
        );
        response.headers.set("Pragma", "no-cache");
        response.headers.set("Expires", "0");
    }

    return response;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
