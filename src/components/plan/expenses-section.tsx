import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { ExpenseForm } from "@/components/plan/expense-form";
import { deleteExpense } from "@/app/actions/gastos";
import { formatCOP, formatDate } from "@/lib/format";
import type { Expense, ExpenseCategory } from "@/lib/types";

const CATEGORY: Record<ExpenseCategory, { emoji: string; label: string; tone: string }> = {
  alojamiento: { emoji: "🏨", label: "Alojamiento", tone: "bg-primary-50 text-primary-700" },
  transporte: { emoji: "🚐", label: "Transporte", tone: "bg-coral-50 text-coral-700" },
  comida: { emoji: "🍽️", label: "Comida", tone: "bg-sun-50 text-sun-800" },
  actividades: { emoji: "🎟️", label: "Actividades", tone: "bg-primary-50 text-primary-700" },
  entradas: { emoji: "🎫", label: "Entradas", tone: "bg-coral-50 text-coral-700" },
  compras: { emoji: "🛍️", label: "Compras", tone: "bg-sun-50 text-sun-800" },
  otros: { emoji: "📦", label: "Otros", tone: "bg-ink/5 text-ink-soft" },
};

interface ExpenseWithPayer extends Expense {
  paid_by_name: string;
}

export function ExpensesSection({
  planId,
  expenses,
  participants,
  currentPersonId,
  isAdmin,
  isOpen,
}: {
  planId: string;
  expenses: ExpenseWithPayer[];
  participants: { id: string; full_name: string }[];
  currentPersonId: string;
  isAdmin: boolean;
  isOpen: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-bold">Gastos</h2>
        <p className="text-sm text-ink-soft">Todo lo pagado durante este plan, en pesos colombianos.</p>
      </CardHeader>
      <CardBody className="space-y-4">
        {expenses.length === 0 ? (
          <p className="rounded-2xl bg-surface-muted/70 px-4 py-6 text-center text-sm text-ink-soft">
            Todavía no hay gastos registrados.
          </p>
        ) : (
          <ul className="space-y-2">
            {expenses.map((expense) => {
              const category = CATEGORY[expense.category];
              return (
                <li
                  key={expense.id}
                  className="flex flex-col gap-3 rounded-2xl bg-surface-muted/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${category.tone}`}
                    >
                      {category.emoji}
                    </span>
                    <div>
                      <p className="text-sm font-bold">{expense.description}</p>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        Pagó <span className="font-semibold">{expense.paid_by_name}</span> ·{" "}
                        {formatDate(expense.expense_date)} · {category.label}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pl-[52px] sm:justify-end sm:pl-0">
                    <span className="text-base font-extrabold text-ink">
                      {formatCOP(expense.amount_cop)}
                    </span>
                    {isAdmin && (
                      <form action={deleteExpense}>
                        <input type="hidden" name="expenseId" value={expense.id} />
                        <input type="hidden" name="planId" value={planId} />
                        <ConfirmSubmit
                          message="¿Eliminar este gasto?"
                          className="text-xs font-semibold text-coral-500 hover:text-coral-700"
                        >
                          Eliminar
                        </ConfirmSubmit>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {isOpen ? (
          <ExpenseForm planId={planId} participants={participants} currentPersonId={currentPersonId} />
        ) : (
          <p className="rounded-2xl bg-sun-50 px-4 py-3 text-center text-sm font-medium text-sun-800">
            Este plan está cerrado. Reábrelo para registrar más gastos.
          </p>
        )}
      </CardBody>
    </Card>
  );
}
