import Link from "next/link";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-coral-500 p-10 text-white lg:flex">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-sun-300/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-coral-300/30 blur-3xl" />

        <Link href="/" className="relative z-10 flex items-center gap-2 text-xl font-extrabold">
          <span className="text-2xl">🌴</span> Salidas Amigos
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-extrabold leading-tight text-balance">
            Planes, gastos y liquidaciones de tu parche, en un solo lugar.
          </h2>
          <p className="mt-4 text-white/85">
            Divide los gastos como quieras, en pesos colombianos, y descubre
            en segundos quién le debe a quién cuando cierras el plan.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-surface px-6 py-16">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-6 flex items-center gap-2 text-lg font-extrabold text-ink lg:hidden"
          >
            <span className="text-xl">🌴</span> Salidas Amigos
          </Link>

          <p className="text-sm font-bold uppercase tracking-wide text-primary-600">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
