export const ACCESS_COOKIE_NAME = "people_hq_access";
export const publicAuthPaths = ["/login", "/api/login"];

export function isValidAssistantToken(header: string | null | undefined, expected: string | undefined): boolean {
  if (!expected || !header) return false;
  return header === `Bearer ${expected}`;
}

export function isValidAccessPassword(input: string, expected: string | undefined): boolean {
  if (!expected) return false;
  if (!input) return false;
  return input === expected;
}

export function accessTokenForPassword(password: string | undefined): string {
  if (!password) return "";
  return btoa(`people-hq:${password}:v1`);
}

export function accessCookieValue(password: string | undefined, sessionToken: string | undefined): string {
  if (sessionToken) return sessionToken;
  return accessTokenForPassword(password);
}

export function isPublicAuthPath(pathname: string): boolean {
  return publicAuthPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
