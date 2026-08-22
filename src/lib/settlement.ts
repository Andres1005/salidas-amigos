export interface ParticipantTally {
  personId: string;
  name: string;
  weight: number;
  paid: number;
}

export interface ParticipantBalance {
  personId: string;
  name: string;
  weight: number;
  paid: number;
  owedShare: number;
  balance: number; // positive = le deben, negative = debe
}

export interface Transfer {
  fromPersonId: string;
  fromName: string;
  toPersonId: string;
  toName: string;
  amount: number;
}

export interface SettlementResult {
  totalCOP: number;
  balances: ParticipantBalance[];
  transfers: Transfer[];
}

/**
 * Splits a total by weight (share_weight) across participants and returns
 * the minimum set of transfers needed to settle every balance, using a
 * greedy largest-creditor/largest-debtor match.
 */
export function computeSettlement(
  participants: ParticipantTally[]
): SettlementResult {
  const totalCOP = participants.reduce((sum, p) => sum + p.paid, 0);
  const totalWeight = participants.reduce((sum, p) => sum + p.weight, 0);
  const perWeight = totalWeight > 0 ? totalCOP / totalWeight : 0;

  const balances: ParticipantBalance[] = participants.map((p) => {
    const owedShare = p.weight * perWeight;
    return {
      ...p,
      owedShare,
      balance: Math.round((p.paid - owedShare) * 100) / 100,
    };
  });

  const debtors = balances
    .filter((b) => b.balance < -0.5)
    .map((b) => ({ ...b, remaining: -b.balance }))
    .sort((a, b) => b.remaining - a.remaining);

  const creditors = balances
    .filter((b) => b.balance > 0.5)
    .map((b) => ({ ...b, remaining: b.balance }))
    .sort((a, b) => b.remaining - a.remaining);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.remaining, creditor.remaining);

    if (amount > 0.5) {
      transfers.push({
        fromPersonId: debtor.personId,
        fromName: debtor.name,
        toPersonId: creditor.personId,
        toName: creditor.name,
        amount: Math.round(amount),
      });
    }

    debtor.remaining -= amount;
    creditor.remaining -= amount;

    if (debtor.remaining <= 0.5) i++;
    if (creditor.remaining <= 0.5) j++;
  }

  return { totalCOP, balances, transfers };
}
