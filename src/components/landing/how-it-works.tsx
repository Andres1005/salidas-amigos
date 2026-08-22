import { Reveal } from "@/components/motion/reveal";

const STEPS = [
  {
    number: "1",
    title: "Te invitan al parche",
    description:
      "El admin te agrega con tu nombre y correo, y te comparte un código de invitación único.",
  },
  {
    number: "2",
    title: "Registras tu cuenta",
    description:
      "Canjeas el código, creas tu contraseña y quedas listo para ver los planes en los que participas.",
  },
  {
    number: "3",
    title: "Registran los gastos",
    description:
      "Cada quien anota lo que pagó durante el plan: hospedaje, transporte, comida, actividades.",
  },
  {
    number: "4",
    title: "Cierran el plan",
    description:
      "Al terminar, el admin cierra el plan y la app calcula automáticamente quién le debe a quién, en pesos colombianos.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-deep-800 px-6 py-20 text-white">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
              Cómo funciona
            </h2>
            <p className="mt-4 text-lg text-white/70">
              De la invitación a la liquidación final, en cuatro pasos.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <Reveal key={step.number} delay={i * 0.1}>
              <div className="relative">
                <span className="text-5xl font-black text-white/10">{step.number}</span>
                <h3 className="-mt-6 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {step.description}
                </p>
                {i < STEPS.length - 1 && (
                  <div className="absolute right-[-1rem] top-3 hidden h-px w-8 bg-gradient-to-r from-sun-400 to-transparent lg:block" />
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
