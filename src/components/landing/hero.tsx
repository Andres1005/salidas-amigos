"use client";

import { motion } from "framer-motion";
import { LinkButton } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { formatCOP } from "@/lib/format";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-wave px-6 pb-20 pt-16 sm:pt-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-sun-100 px-4 py-1.5 text-sm font-bold text-sun-800"
          >
            ✨ Acceso solo por invitación
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl"
          >
            Planea la salida.{" "}
            <span className="bg-gradient-to-r from-primary-500 via-primary-600 to-coral-500 bg-clip-text text-transparent">
              Nosotros cuadramos la plata.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft"
          >
            Organiza planes, actividades y gastos con tu parche. Al cerrar el
            plan, calculamos en pesos colombianos quién le debe a quién, con
            las transferencias mínimas necesarias.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <LinkButton href="/iniciar-sesion" size="lg">
              Iniciar sesión
            </LinkButton>
            <LinkButton href="#como-funciona" variant="outline" size="lg">
              Ver cómo funciona
            </LinkButton>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 text-sm font-medium text-ink-soft"
          >
            ¿Tu grupo aún no tiene cuentas? El admin del grupo administra quién
            entra y reparte los códigos de invitación.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary-300/40 via-sun-300/30 to-coral-300/40 blur-2xl" />

          <div className="rounded-[2rem] border border-ink/5 bg-white p-6 shadow-2xl shadow-primary-900/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary-600">
                  Plan cerrado
                </p>
                <h3 className="text-xl font-extrabold">🏖️ Playa en Tayrona</h3>
              </div>
              <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
                {formatCOP(1_260_000)}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {[
                { name: "Camila R.", detail: "le deben", amount: 420000, tone: "primary" },
                { name: "Julián P.", detail: "debe", amount: 180000, tone: "coral" },
                { name: "Vale G.", detail: "debe", amount: 240000, tone: "coral" },
              ].map((row, i) => (
                <motion.div
                  key={row.name}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                  className="flex items-center justify-between rounded-2xl bg-surface-muted/60 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={row.name} size="sm" />
                    <div>
                      <p className="text-sm font-bold">{row.name}</p>
                      <p className="text-xs text-ink-soft">{row.detail}</p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-extrabold ${
                      row.tone === "primary" ? "text-primary-600" : "text-coral-600"
                    }`}
                  >
                    {formatCOP(row.amount)}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
