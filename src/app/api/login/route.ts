import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, accessTokenForPassword, isValidAccessPassword } from "@/lib/access";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const expectedPassword = process.env.PEOPLE_HQ_PASSWORD;

  if (!expectedPassword) {
    return NextResponse.redirect(new URL("/login?error=not-configured", request.url), 303);
  }

  if (!isValidAccessPassword(password, expectedPassword)) {
    return NextResponse.redirect(new URL("/login?error=invalid", request.url), 303);
  }

  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: accessTokenForPassword(expectedPassword),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
