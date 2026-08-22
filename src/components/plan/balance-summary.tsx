import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatCOP } from "@/lib/format";
import { computeSettlement, type ParticipantTally, type Transfer } from "@/lib/settlement";

export function BalanceSummary({
  tallies,
  isClosed,
  storedTransfers,
  currentPersonId,
}: {
  tallies: ParticipantTally[];
  isClosed: boolean;
  storedTransfers: Transfer[];
  currentPersonId: string;
}) {
  const { totalCOP, balances, transfers: liveTransfers } = computeSettlement(tallies);
  const transfers = isClosed ? storedTransfers : liveTransfers;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h2 className="font-bold">{isClosed ? "Liquidación final" : "Balance en vivo"}</h2>
          <p className="text-sm text-ink-soft">Total gastado: {formatCOP(totalCOP)}</p>
        </div>
        {!isClosed && <Badge tone="sun">Vista previa · se confirma al cerrar</Badge>}
      </CardHeader>
      <CardBody className="space-y-6">
        <div className="grid gap-2 sm:grid-cols-2">
          {balances.map((b) => {
            const settled = Math.abs(b.balance) < 1;
            return (
              <div
                key={b.personId}
                className="flex items-center justify-between rounded-2xl bg-surface-muted/70 px-4 py-3"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={b.name} size="sm" />
                  <div>
                    <p className="text-sm font-bold">
                      {b.name}
                      {b.personId === currentPersonId && (
                        <span className="ml-1 font-normal text-ink-soft">(tú)</span>
                      )}
                    </p>
                    <p className="text-xs text-ink-soft">Pagó {formatCOP(b.paid)}</p>
                  </div>
                </div>
                <span
                  className={`text-sm font-extrabold ${
                    settled ? "text-ink-soft" : b.balance > 0 ? "text-primary-600" : "text-coral-600"
                  }`}
                >
                  {settled
                    ? "Al día"
                    : b.balance > 0
                      ? `+${formatCOP(b.balance)}`
                      : `-${formatCOP(Math.abs(b.balance))}`}
                </span>
              </div>
            );
          })}
        </div>

        {transfers.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft/70">
              {isClosed ? "Transferencias para saldar" : "Así quedaría si cerraras ahora"}
            </p>
            <div className="space-y-2">
              {transfers.map((t, i) => (
                <div
                  key={`${t.fromPersonId}-${t.toPersonId}-${i}`}
                  className="flex items-center gap-3 rounded-2xl border border-coral-100 bg-coral-50/50 px-4 py-3 text-sm"
                >
                  <span className="font-bold text-coral-700">{t.fromName}</span>
                  <span className="text-ink-soft">le debe a</span>
                  <span className="font-bold text-primary-700">{t.toName}</span>
                  <span className="ml-auto font-extrabold text-ink">{formatCOP(t.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {transfers.length === 0 && totalCOP > 0 && (
          <p className="rounded-2xl bg-primary-50 px-4 py-3 text-center text-sm font-semibold text-primary-700">
            🎉 Todos están al día, nadie le debe a nadie.
          </p>
        )}
      </CardBody>
    </Card>
  );
}
