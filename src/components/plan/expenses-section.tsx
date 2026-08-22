import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { ExpenseForm } from "@/components/plan/expense-form";
import { deleteExpense } from "@/app/actions/gastos";
import { formatCOP, formatDate } from "@/lib/format";
import type { Expense } from "@/lib/types";

const CATEGORY_LABEL: Record<string, string> = {
  alojamiento: "🏨 Alojamiento",
  transporte: "🚐 Transporte",
  comida: "🍽️ Comida",
  actividades: "🎟️ Actividades",
  entradas: "🎫 Entradas",
  compras: "🛍️ Compras",
  otros: "📦 Otros",
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
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-surface-muted/70 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={expense.paid_by_name} size="sm" />
                  <div>
                    <p className="text-sm font-bold">{expense.description}</p>
                    <p className="text-xs text-ink-soft">
                      {expense.paid_by_name} · {formatDate(expense.expense_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone="neutral">{CATEGORY_LABEL[expense.category]}</Badge>
                  <span className="text-sm font-extrabold">{formatCOP(expense.amount_cop)}</span>
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
            ))}
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
