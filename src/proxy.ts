import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PREFIXES = ["/panel", "/planes", "/admin"];
const AUTH_ROUTES = ["/iniciar-sesion", "/registro"];

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((p) => path.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    if (path.startsWith("/planes/unirse")) {
      // Quien llega a un link de "unirme a un plan" sin sesión casi
      // siempre es alguien nuevo que todavía no activa su cuenta, no
      // alguien que ya tiene contraseña — mándalo a activar en vez de
      // a iniciar sesión, y arrastra el código del plan para que lo
      // use apenas termine de registrarse.
      const planCode = url.searchParams.get("code");
      url.pathname = "/registro";
      url.search = planCode ? `?planCode=${encodeURIComponent(planCode)}` : "";
    } else {
      url.pathname = "/iniciar-sesion";
    }
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    const planCode = url.searchParams.get("planCode");
    if (planCode) {
      url.pathname = "/planes/unirse";
      url.search = `?code=${encodeURIComponent(planCode)}`;
    } else {
      url.pathname = "/panel";
      url.search = "";
    }
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
