"use client";

import { useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { ExpenseForm } from "@/components/plan/expense-form";
import { deleteExpense } from "@/app/actions/gastos";
import { cn } from "@/lib/cn";
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

function ExpenseRow({ expense, planId, isAdmin }: { expense: ExpenseWithPayer; planId: string; isAdmin: boolean }) {
  const category = CATEGORY[expense.category];
  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-white/70 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${category.tone}`}>
          {category.emoji}
        </span>
        <div>
          <p className="text-sm font-bold">{expense.description}</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            Pagó <span className="font-semibold">{expense.paid_by_name}</span> · {formatDate(expense.expense_date)} ·{" "}
            {category.label}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pl-[48px] sm:justify-end sm:pl-0">
        <span className="text-sm font-extrabold text-ink">{formatCOP(expense.amount_cop)}</span>
        {isAdmin && (
          <form action={deleteExpense}>
            <input type="hidden" name="expenseId" value={expense.id} />
            <input type="hidden" name="planId" value={planId} />
            <ConfirmSubmit
              message="¿Eliminar este gasto?"
              className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-coral-500 transition-colors hover:bg-coral-100 hover:text-coral-700"
            >
              <Trash2 size={14} />
            </ConfirmSubmit>
          </form>
        )}
      </div>
    </li>
  );
}

function ExpenseGroup({
  title,
  expenses,
  planId,
  isAdmin,
  defaultOpen,
}: {
  title: string;
  expenses: ExpenseWithPayer[];
  planId: string;
  isAdmin: boolean;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (expenses.length === 0) return null;
  const subtotal = expenses.reduce((sum, e) => sum + Number(e.amount_cop), 0);

  return (
    <div className="rounded-2xl bg-surface-muted/70">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{title}</p>
          <p className="text-xs text-ink-soft">
            {expenses.length} {expenses.length === 1 ? "gasto" : "gastos"} · {formatCOP(subtotal)}
          </p>
        </div>
        <ChevronDown size={18} className={cn("shrink-0 text-ink-soft transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="space-y-2 px-3 pb-3">
          {expenses.map((expense) => (
            <ExpenseRow key={expense.id} expense={expense} planId={planId} isAdmin={isAdmin} />
          ))}
        </ul>
      )}
    </div>
  );
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
  const activityExpenses = expenses.filter((e) => e.activity_id);
  const otherExpenses = expenses.filter((e) => !e.activity_id);

  return (
    <Card>
      <CardHeader>
        <h2 className="font-bold">Gastos</h2>
        <p className="text-sm text-ink-soft">Todo lo pagado durante este plan, en pesos colombianos.</p>
      </CardHeader>
      <CardBody className="space-y-3">
        {expenses.length === 0 ? (
          <p className="rounded-2xl bg-surface-muted/70 px-4 py-6 text-center text-sm text-ink-soft">
            Todavía no hay gastos registrados.
          </p>
        ) : (
          <div className="space-y-2">
            <ExpenseGroup
              title="Gastos de actividades"
              expenses={activityExpenses}
              planId={planId}
              isAdmin={isAdmin}
              defaultOpen={false}
            />
            <ExpenseGroup
              title="Otros gastos"
              expenses={otherExpenses}
              planId={planId}
              isAdmin={isAdmin}
              defaultOpen={otherExpenses.length <= 3}
            />
          </div>
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
