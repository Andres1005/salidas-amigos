import { Reveal } from "@/components/motion/reveal";

const FEATURES = [
  {
    emoji: "🗺️",
    title: "Planes y actividades",
    description:
      "Arma el itinerario con fechas y un responsable por actividad. Cualquiera puede proponer una, y el admin la aprueba antes de que quede oficial.",
    tone: "primary",
  },
  {
    emoji: "🧾",
    title: "Gastos en tiempo real",
    description:
      "Cada quien registra lo que pagó. Ves el total gastado y por categoría al instante, sin hojas de cálculo.",
    tone: "coral",
  },
  {
    emoji: "🧮",
    title: "Liquidación automática",
    description:
      "Al cerrar el plan calculamos, en pesos colombianos, exactamente quién le debe a quién y cuánto — con el menor número de transferencias.",
    tone: "sun",
  },
  {
    emoji: "🎯",
    title: "Reparto configurable",
    description:
      "División equitativa por defecto, pero puedes ajustar el peso de cada participante para invitados u homenajeados que no pagan.",
    tone: "primary",
  },
  {
    emoji: "🔒",
    title: "Solo por invitación",
    description:
      "Nadie se registra por su cuenta. Tú administras el roster de personas y compartes un código único para cada una.",
    tone: "coral",
  },
  {
    emoji: "🔗",
    title: "Únete con un código",
    description:
      "Cada plan tiene su propio código. Compártelo con quienes van, y se suman ellos mismos como participantes — sin que el admin tenga que agregar a nadie a mano.",
    tone: "sun",
  },
] as const;

const toneClasses: Record<string, string> = {
  primary: "bg-primary-50 text-primary-700",
  coral: "bg-coral-50 text-coral-700",
  sun: "bg-sun-50 text-sun-800",
};

export function Features() {
  return (
    <section id="funciones" className="mx-auto max-w-6xl px-6 py-20">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            Todo lo que necesita tu parche para no pelear por plata
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            Diseñada para grupos cerrados de amigos que organizan viajes,
            asados y salidas recurrentes.
          </p>
        </div>
      </Reveal>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, i) => (
          <Reveal key={feature.title} delay={(i % 3) * 0.08}>
            <div className="h-full rounded-3xl border border-ink/5 bg-white p-6 shadow-sm shadow-ink/5 transition-transform hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-900/10">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${toneClasses[feature.tone]}`}
              >
                {feature.emoji}
              </div>
              <h3 className="mt-4 text-lg font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {feature.description}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
