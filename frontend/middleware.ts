import { jwtVerify } from "jose/jwt/verify";
import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/login"];
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

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return redirectToLogin(request);
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

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
