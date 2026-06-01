import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, accessCookieValue, isPublicAuthPath } from "@/lib/access";

const PUBLIC_FILE = /\.(.*)$/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/icon.svg" ||
    PUBLIC_FILE.test(pathname) ||
    isPublicAuthPath(pathname)
  ) {
    return NextResponse.next();
  }

  const expectedPassword = process.env.PEOPLE_HQ_PASSWORD;
  const expectedToken = accessCookieValue(expectedPassword, process.env.PEOPLE_HQ_SESSION_TOKEN);
  const actualToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (expectedToken && actualToken === expectedToken) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
