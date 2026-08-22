import Link from "next/link";
import { LinkButton } from "@/components/ui/button";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/5 bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="text-2xl">🌴</span>
          Salidas Amigos
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-ink-soft sm:flex">
          <a href="#como-funciona" className="transition-colors hover:text-ink">
            Cómo funciona
          </a>
          <a href="#funciones" className="transition-colors hover:text-ink">
            Funciones
          </a>
        </nav>
        <LinkButton href="/iniciar-sesion" size="sm">
          Iniciar sesión
        </LinkButton>
      </div>
    </header>
  );
}
