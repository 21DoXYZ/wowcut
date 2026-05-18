import { type NextRequest, NextResponse } from "next/server";

const PUBLIC = ["/sign-in", "/api/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const secret = process.env.OPERATOR_SECRET;
  if (!secret) return NextResponse.next(); // dev: no secret = open access

  const session = request.cookies.get("ops_session")?.value;
  if (session !== secret) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
