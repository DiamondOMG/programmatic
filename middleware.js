import { NextResponse } from "next/server";

// Simple middleware that calls the internal API route /api/get_user_by_id
// and checks `permission_user`. If the user is not authenticated or
// doesn't have enough permission, redirect to '/'.

// Permission arrays — fill these with path prefixes you want to protect.
// Example: permission_for_admin = ['/format', '/admin']
export const permission_for_viewer = [
  "/campaigns",
  "/campaigns2",
  "/campaigns3",
  "/dashboard",
]; // permission >= 1
export const permission_for_editor = []; // permission >= 2
export const permission_for_manager = ["/logs"]; // permission >= 3
export const permission_for_admin = ["/format", "/sequence", "/list-user"]; // permission >= 4

export async function middleware(req) {
  const { nextUrl } = req;
  const origin = nextUrl.origin;
  const apiUrl = `${origin}/api/get_user_by_id`;

  try {
    // Forward cookies to the internal API so your server-side route can read them
    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        // copy cookies from incoming request so the server route sees the session
        cookie: req.headers.get("cookie") || "",
      },
    });

    // If API responded non-200, treat as unauthenticated/forbidden
    if (!res.ok) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const body = await res.json();

    // Expect the API to return { success: true, data: [...] }
    const user = body?.data?.[0];
    const permission = user?.permission_user ?? 0;

    // Determine required permission from the permission arrays.
    // The arrays are prefix lists (e.g. ['/format', '/admin']).
    let requiredPermission = 1;
    const pathname = nextUrl.pathname || new URL(req.url).pathname;

    // admin (4)
    if (permission_for_admin.some((p) => p && pathname.startsWith(p))) {
      requiredPermission = 4;
    }
    // manager (3)
    else if (permission_for_manager.some((p) => p && pathname.startsWith(p))) {
      requiredPermission = 3;
    }
    // editor (2)
    else if (permission_for_editor.some((p) => p && pathname.startsWith(p))) {
      requiredPermission = 2;
    }
    // viewer (1) — default stays 1 if viewer list contains it or none matched
    else if (permission_for_viewer.some((p) => p && pathname.startsWith(p))) {
      requiredPermission = 1;
    }

    if (permission < requiredPermission) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // allowed
    return NextResponse.next();
  } catch (err) {
    // On errors, redirect to home (fail-closed)
    console.error("Middleware auth error:", err);
    return NextResponse.redirect(new URL("/", req.url));
  }
}

// Adjust the matcher to protect the routes you want. This example protects
// campaign pages, dashboard, user list and logs. Update or add patterns
// to match your app structure.
export const config = {
  matcher: [
    "/format/:path*",
    "/sequence/:path*",
    "/dashboard/:path*",
    "/list-user/:path*",
    "/logs/:path*",
    "/campaigns/:path*",
    "/campaigns2/:path*",
    "/campaigns3/:path*",
  ],
};
