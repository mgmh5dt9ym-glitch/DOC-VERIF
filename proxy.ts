import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/admin-session-token";

/**
 * Première barrière pour /admin : vérifie le cookie de session signé.
 * Les pages et Server Actions revérifient ensuite côté serveur
 * (lib/admin-auth.ts → requireAdmin), le proxy n'est pas la seule protection.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/admin/login";

  const secret = process.env.ADMIN_SESSION_SECRET;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  let authenticated = false;
  if (secret && token) {
    try {
      authenticated = await verifySessionToken(token, secret);
    } catch {
      authenticated = false;
    }
  }

  if (!authenticated && !isLoginPage) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (authenticated && isLoginPage) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
