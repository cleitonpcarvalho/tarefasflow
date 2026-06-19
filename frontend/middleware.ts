import { NextRequest, NextResponse } from "next/server";

const publicRoutes = [
  "/login",
  "/signup",
  "/verify-email",
  "/forgot-password",
  "/terms",
  "/privacy"
];
const tokenCookieName = "taskflow_token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(tokenCookieName)?.value;

  if (!token) {
    return redirectToLogin(request);
  }

  try {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("invalid");
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    
    if (pathname.startsWith("/admin") && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/calendar", request.url));
    }

    return NextResponse.next();
  } catch {
    return redirectToLogin(request);
  }
}

function redirectToLogin(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(tokenCookieName);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|favicon-light.png|favicon-dark.png|logo-light.png|logo-dark.png).*)"
  ]
};
