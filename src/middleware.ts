import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "certops_session_id";
const ROUND_COOKIE = "certops_round_id";
const TEN_YEARS_SECONDS = 60 * 60 * 24 * 365 * 10;

export function middleware(req: NextRequest) {
  const existingSession = req.cookies.get(SESSION_COOKIE)?.value;
  const existingRound = req.cookies.get(ROUND_COOKIE)?.value;

  // /:exam/quiz is the "start a round" entry point — always rotate the round
  // id here. Any other matched path (e.g. /:exam/quiz/[id], …/done) keeps the
  // existing round id so reloads and back/forward stay on the same order.
  const isRoundEntry = /^\/(clf|saa)\/quiz$/.test(req.nextUrl.pathname);

  const needsSession = !existingSession;
  const needsRound = !existingRound || isRoundEntry;

  if (!needsSession && !needsRound) {
    return NextResponse.next();
  }

  const sessionId = existingSession ?? crypto.randomUUID();
  const roundId =
    needsRound ? Date.now().toString(36) : (existingRound as string);

  if (needsSession) req.cookies.set(SESSION_COOKIE, sessionId);
  if (needsRound) req.cookies.set(ROUND_COOKIE, roundId);

  const res = NextResponse.next({ request: { headers: req.headers } });

  if (needsSession) {
    res.cookies.set({
      name: SESSION_COOKIE,
      value: sessionId,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: TEN_YEARS_SECONDS,
    });
  }
  if (needsRound) {
    res.cookies.set({
      name: ROUND_COOKIE,
      value: roundId,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: TEN_YEARS_SECONDS,
    });
  }

  return res;
}

export const config = {
  matcher: ["/clf/quiz/:path*", "/saa/quiz/:path*", "/clf/quiz", "/saa/quiz"],
};
