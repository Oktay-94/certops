import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "certops_session_id";
const TEN_YEARS_SECONDS = 60 * 60 * 24 * 365 * 10;

export function middleware(req: NextRequest) {
  const existing = req.cookies.get(COOKIE_NAME)?.value;

  if (existing) {
    return NextResponse.next();
  }

  const sessionId = crypto.randomUUID();
  req.cookies.set(COOKIE_NAME, sessionId);

  const res = NextResponse.next({ request: { headers: req.headers } });
  res.cookies.set({
    name: COOKIE_NAME,
    value: sessionId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TEN_YEARS_SECONDS,
  });

  return res;
}

export const config = {
  matcher: ["/quiz/:path*"],
};
