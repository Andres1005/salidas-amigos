"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import type { Person } from "@/lib/types";

export function Navbar({ person }: { person: Person }) {
  const pathname = usePathname();

  const links = [
    { href: "/panel", label: "Mis planes" },
    ...(person.role === "admin"
      ? [
          { href: "/admin/personas", label: "Personas" },
          { href: "/admin/planes/nuevo", label: "Nuevo plan" },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/panel" className="flex items-center gap-2 text-lg font-extrabold">
          <span className="text-xl">🌴</span> Salidas Amigos
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary-500 text-white shadow-sm shadow-primary-500/30"
                    : "text-ink-soft hover:bg-ink/5 hover:text-ink"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold leading-none">{person.full_name}</p>
            <p className="text-xs text-ink-soft">
              {person.role === "admin" ? "Admin" : "Miembro"}
            </p>
          </div>
          <Avatar name={person.full_name} size="sm" />
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full px-3 py-2 text-xs font-semibold text-ink-soft transition-colors hover:bg-ink/5 hover:text-coral-600"
            >
              Salir
            </button>
          </form>
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-3 sm:hidden">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold",
                active ? "bg-primary-500 text-white" : "bg-ink/5 text-ink-soft"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
