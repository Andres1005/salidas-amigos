import { Reveal } from "@/components/motion/reveal";
import { LinkButton } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="px-6 py-20">
      <Reveal>
        <div className="mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary-500 via-primary-600 to-coral-500 px-8 py-16 text-center shadow-2xl shadow-primary-900/20">
          <h2 className="text-balance text-3xl font-extrabold text-white sm:text-4xl">
            ¿Te invitaron a un plan?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-white/90">
            Crea tu cuenta y arma el próximo plan con tu parche en minutos.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <LinkButton
              href="/registro"
              size="lg"
              className="bg-white text-primary-700 hover:bg-white/90"
            >
              Crear mi cuenta
            </LinkButton>
            <LinkButton
              href="/iniciar-sesion"
              size="lg"
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              Ya tengo cuenta
            </LinkButton>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-ink/5 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-ink-soft sm:flex-row">
        <p className="flex items-center gap-2 font-bold text-ink">
          <span className="text-lg">🌴</span> Salidas Amigos
        </p>
        <p>Hecho para grupos de amigos que organizan salidas juntos.</p>
      </div>
    </footer>
  );
}
