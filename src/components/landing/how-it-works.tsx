import { Reveal } from "@/components/motion/reveal";

const STEPS = [
  {
    number: "1",
    title: "Pides acceso",
    description:
      "Entras con el link de un plan (o directo a la app), pones tu nombre, correo y contraseña. Sin códigos.",
  },
  {
    number: "2",
    title: "El admin aprueba",
    description:
      "Tu cuenta queda pendiente hasta que el admin del grupo la aprueba — así se mantiene cerrado a solo tu parche.",
  },
  {
    number: "3",
    title: "Entras al plan",
    description:
      "Apenas te aprueban, ya estás dentro del plan al que te invitaron (o el admin te agrega a otros cuando quiera).",
  },
  {
    number: "4",
    title: "Proponen y registran",
    description:
      "Cualquiera crea actividades y anota lo que pagó; se le puede asignar una tarea a alguien o dejarla libre para que cualquiera se apunte.",
  },
  {
    number: "5",
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
              De la invitación a la liquidación final, en cinco pasos.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
